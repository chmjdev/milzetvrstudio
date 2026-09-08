import argparse, fcntl, hashlib, io, json, os, re, tempfile, urllib.request, urllib.error, wave
from pathlib import Path

def save(path, value):
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix='.milzet-job-')
    with os.fdopen(fd, 'w') as stream:
        json.dump(value, stream, indent=2)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, path)

def request(url, key, provider, data=None):
    headers = {'Authorization': 'Bearer '+key} if provider == 'meshy' else {'xi-api-key': key}
    if data is not None: headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=None if data is None else json.dumps(data).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=90) as response:
        result = response.read(24000001)
        if len(result)>24000000: raise ValueError('Provider response exceeds 24 MB.')
        return result, dict(response.headers)

def validate(job):
    if not re.fullmatch(r'[a-zA-Z0-9-]{1,80}',job.get('id','')): raise ValueError('Invalid job ID.')
    if job.get('provider') not in ('meshy','elevenlabs'): raise ValueError('Unsupported provider.')
    if not isinstance(job.get('prompt'),str) or not job['prompt'].strip() or len(job['prompt'])>5000: raise ValueError('Invalid prompt.')
    if job['provider']=='elevenlabs' and not re.fullmatch(r'[a-zA-Z0-9_-]{1,80}',job.get('voiceId','')): raise ValueError('Verified voice ID required.')
    if job['provider']=='meshy' and len(job['prompt'])>600: raise ValueError('Meshy preview prompt limit is 600 characters.')

def submit(path, job, output, transport=request):
    validate(job)
    if job.get('status')!='prepared': raise ValueError('Only prepared requests can be submitted. Reconcile uncertain requests with the provider; do not resubmit them.')
    key = os.environ.get('MESHY_API_KEY' if job['provider']=='meshy' else 'ELEVENLABS_API_KEY')
    if not key: raise ValueError('Run through the approved provider key loader.')
    job['status']='uncertain'
    job['requestSha256']=hashlib.sha256(json.dumps({k:job[k] for k in ('id','provider','prompt','voiceId')},sort_keys=True).encode()).hexdigest()
    save(path,job)
    if job['provider']=='meshy':
        payload={'mode':'preview','prompt':job['prompt'],'ai_model':'meshy-6','topology':'triangle','target_polycount':30000}
        data, headers=transport('https://api.meshy.ai/openapi/v2/text-to-3d',key,'meshy',payload)
        remote=json.loads(data).get('result')
        if not isinstance(remote,str) or not re.fullmatch(r'[a-zA-Z0-9-]{1,100}',remote): raise ValueError('No valid task ID returned; reconcile with Meshy.')
        job.update(status='submitted',remoteId=remote)
    else:
        data, headers=transport('https://api.elevenlabs.io/v1/text-to-speech/'+job['voiceId']+'?output_format=pcm_24000',key,'elevenlabs',{'text':job['prompt'],'model_id':'eleven_multilingual_v2'})
        if not data or len(data)%2: raise ValueError('Invalid PCM response; request remains uncertain.')
        output.mkdir(parents=True,exist_ok=True)
        destination=output/(job['id']+'.wav')
        if destination.exists(): raise ValueError('Output exists; refusing to overwrite.')
        buffer=io.BytesIO()
        with wave.open(buffer,'wb') as audio:
            audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(24000);audio.writeframes(data)
        result=buffer.getvalue()
        with destination.open('xb') as stream: stream.write(result)
        normalized={k.lower():v for k,v in headers.items()}
        job.update(status='succeeded',remoteId=normalized.get('request-id',''),output=str(destination.resolve()),outputSha256=hashlib.sha256(result).hexdigest(),receipt={'characterCount':normalized.get('x-character-count'),'requestId':normalized.get('request-id')})
    save(path,job)
    return job

def poll(path,job,output):
    validate(job)
    if job['provider']!='meshy' or job.get('status')!='submitted' or not re.fullmatch(r'[a-zA-Z0-9-]{1,100}',job.get('remoteId','')): raise ValueError('A submitted Meshy task ID is required.')
    key=os.environ.get('MESHY_API_KEY')
    if not key: raise ValueError('Run through the approved Meshy key loader.')
    data,_=request('https://api.meshy.ai/openapi/v2/text-to-3d/'+job['remoteId'],key,'meshy')
    result=json.loads(data)
    job['providerStatus']=result.get('status');job['progress']=result.get('progress')
    if result.get('status')=='SUCCEEDED':
        output.mkdir(parents=True,exist_ok=True)
        receipt=output/(job['id']+'.provider-receipt.json');save(receipt,result)
        job.update(status='succeeded',receiptFile=str(receipt.resolve()),modelUrls=result.get('model_urls',{}),credits=result.get('consumed_credits'))
    elif result.get('status') in ('FAILED','CANCELED'): job.update(status='failed',error=result.get('task_error'))
    save(path,job)
    return job

def fetch(path,job,output):
    from urllib.parse import urlparse
    if job.get('provider')!='meshy' or job.get('status')!='succeeded': raise ValueError('A completed Meshy task is required.')
    url=job.get('modelUrls',{}).get('glb','')
    parsed=urlparse(url)
    if parsed.scheme!='https' or not (parsed.hostname or '').endswith('.meshy.ai'): raise ValueError('Expected an HTTPS Meshy asset URL. Inspect the provider receipt for other download locations.')
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args,**kwargs): raise ValueError('Review redirected asset download before continuing.')
    with urllib.request.build_opener(NoRedirect).open(url,timeout=90) as response: data=response.read(12000001)
    if len(data)>12000000 or data[:4]!=b'glTF': raise ValueError('Output must be a GLB no larger than 12 MB.')
    output.mkdir(parents=True,exist_ok=True);destination=output/(job['id']+'.glb')
    with destination.open('xb') as stream: stream.write(data)
    job.update(output=str(destination.resolve()),outputSha256=hashlib.sha256(data).hexdigest());save(path,job);return job

def main():
    parser=argparse.ArgumentParser(description='Milzet local generation worker. No automatic retries of paid submissions.')
    parser.add_argument('action',choices=['inspect','submit','poll','fetch'])
    parser.add_argument('job',type=Path)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--authorize-paid-submission',action='store_true')
    args=parser.parse_args()
    path=args.job.resolve()
    with path.with_suffix(path.suffix+'.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        job=json.loads(path.read_text());validate(job)
        if args.action=='inspect': print(json.dumps(job,indent=2));return
        if args.output is None: raise ValueError('An output folder is required.')
        if args.action=='submit':
            if not args.authorize_paid_submission: raise ValueError('Explicit paid-submission authorization is required.')
            job=submit(path,job,args.output.resolve())
        elif args.action=='poll': job=poll(path,job,args.output.resolve())
        else: job=fetch(path,job,args.output.resolve())
        print(json.dumps({'id':job['id'],'provider':job['provider'],'status':job['status'],'remoteId':job.get('remoteId',''),'output':job.get('output','')},indent=2))

if __name__=='__main__':
    try: main()
    except urllib.error.HTTPError as error: raise SystemExit('Provider HTTP '+str(error.code)+'. A submitted request may have incurred cost; inspect the job record before further action.')
    except Exception as error: raise SystemExit(str(error))
