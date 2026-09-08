import importlib.util, json, os, tempfile, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('worker',Path(__file__).resolve().parents[1]/'Tools/generation_worker.py')
worker=importlib.util.module_from_spec(spec);spec.loader.exec_module(worker)
class WorkerTest(unittest.TestCase):
 def test_refine_retains_preview_and_never_retries_uncertain_request(self):
  with tempfile.TemporaryDirectory() as directory:
   preview={'id':'preview-job','provider':'meshy','prompt':'Orange traffic cone','status':'succeeded','remoteId':'preview-remote'}
   child=worker.prepare_refine(preview);path=Path(directory)/'refine.json';worker.save(path,child);os.environ['MESHY_API_KEY']='test-only';calls=[]
   def fail(url,key,provider,payload):
    calls.append(payload)
    self.assertEqual(json.loads(path.read_text())['status'],'uncertain')
    self.assertEqual(payload['preview_task_id'],'preview-remote');self.assertTrue(payload['enable_pbr']);self.assertEqual(payload['texture_resolution'],'2k')
    raise TimeoutError('Simulated disconnect')
   with self.assertRaises(TimeoutError):worker.submit(path,child,Path(directory),fail)
   with self.assertRaises(ValueError):worker.submit(path,json.loads(path.read_text()),Path(directory),fail)
   self.assertEqual(len(calls),1);self.assertEqual(preview['status'],'succeeded');self.assertNotEqual(child['id'],preview['id'])
 def test_refine_rejects_incomplete_or_already_refined_parent(self):
  for status,stage in [('submitted','preview'),('uncertain','preview'),('succeeded','refine')]:
   with self.assertRaises(ValueError):worker.prepare_refine({'id':'test','provider':'meshy','prompt':'Test','status':status,'remoteId':'remote','stage':stage})
 def test_refine_poll_persists_separate_credits_and_receipt(self):
  with tempfile.TemporaryDirectory() as directory:
   job=worker.prepare_refine({'id':'preview','provider':'meshy','prompt':'Cone','status':'succeeded','remoteId':'preview-remote'})
   path=Path(directory)/'job.json';os.environ['MESHY_API_KEY']='test-only'
   worker.submit(path,job,Path(directory),lambda *args:(b'{"result":"refine-remote"}',{}))
   worker.poll(path,job,Path(directory),lambda *args:(json.dumps({'status':'SUCCEEDED','progress':100,'consumed_credits':10,'model_urls':{'glb':'https://assets.meshy.ai/test.glb'}}).encode(),{}))
   saved=json.loads(path.read_text());self.assertEqual(saved['credits'],10);self.assertEqual(saved['previewRemoteId'],'preview-remote');self.assertEqual(saved['remoteId'],'refine-remote');self.assertTrue(Path(saved['receiptFile']).is_file())
 def test_preview_requests_remesh_for_actual_polycount_budget(self):
  payload=worker.payload_for({'provider':'meshy','prompt':'Test'})
  self.assertTrue(payload['should_remesh']);self.assertEqual(payload['target_polycount'],30000);self.assertEqual(payload['target_formats'],['glb'])
 def test_uncertain_submit_is_not_repeated(self):
  with tempfile.TemporaryDirectory() as directory:
   path=Path(directory)/'job.json';job={'id':'test-job','provider':'meshy','prompt':'A test object','voiceId':'','status':'prepared','remoteId':''};worker.save(path,job)
   os.environ['MESHY_API_KEY']='test-only';calls=[]
   def fail(*args):calls.append(args);raise TimeoutError('Simulated disconnect')
   with self.assertRaises(TimeoutError):worker.submit(path,job,Path(directory),fail)
   recovered=json.loads(path.read_text());self.assertEqual(recovered['status'],'uncertain')
   with self.assertRaises(ValueError):worker.submit(path,recovered,Path(directory),fail)
   self.assertEqual(len(calls),1)
 def test_narration_is_wav_with_receipt(self):
  with tempfile.TemporaryDirectory() as directory:
   path=Path(directory)/'job.json';job={'id':'test-audio','provider':'elevenlabs','prompt':'Test','voiceId':'testVoice','status':'prepared','remoteId':''};worker.save(path,job)
   os.environ['ELEVENLABS_API_KEY']='test-only'
   result=worker.submit(path,job,Path(directory),lambda *args:(b'\x00\x01'*240,{'request-id':'test-request','x-character-count':'4'}))
   self.assertEqual(result['status'],'succeeded');self.assertEqual(Path(result['output']).read_bytes()[:4],b'RIFF');self.assertEqual(result['receipt']['characterCount'],'4')
if __name__=='__main__':unittest.main()
