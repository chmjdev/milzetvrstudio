import {check,sha256,toBase64,fromBase64,openPackage} from './package.mjs';
export function emptyLibrary(){return {version:1,kind:'milzet-source-library',assets:[],revisions:[],jobs:[],rubrics:[]};}
function text(value,max=2000){return typeof value==='string' && value.length<=max;}
export function validateSource(bytes,mime){
 check(bytes.length>0 && bytes.length<=12000000,'Source asset limit is 12 MB.');
 const signature=new TextDecoder().decode(bytes.slice(0,12));
 check(mime==='image/png'?bytes[0]===137 && bytes[1]===80:mime==='image/jpeg'?bytes[0]===255 && bytes[1]===216:mime==='audio/wav'?signature.startsWith('RIFF') && signature.endsWith('WAVE'):mime==='video/mp4'?signature.slice(4,8)==='ftyp':mime==='model/gltf-binary'?signature.startsWith('glTF'):false,'Unsupported or mismatched source media.');
 if(mime==='model/gltf-binary'){
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);check(bytes.length>=20 && v.getUint32(4,true)===2 && v.getUint32(8,true)===bytes.length && v.getUint32(16,true)===0x4e4f534a,'Invalid GLB container.');
  const length=v.getUint32(12,true);check(length<=bytes.length-20,'Invalid GLB JSON chunk.');const json=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+length)));
  check([...(json.buffers||[]),...(json.images||[])].every(x=>!x.uri || x.uri.startsWith('data:')),'External model resources must be embedded before import.');
 }
}
export async function importSource(library,name,mime,bytes,provenance){
 validateSource(bytes,mime);check(text(name,240) && name.length>0,'Source name required.');
 check(provenance && ['owner','credit','license','source','capturedAt','provider','jobId','derivedFrom'].every(k=>text(provenance[k])) && provenance.owner.trim() && provenance.license.trim(),'Owner and usage rights are required.');
 const hash=await sha256(bytes);check(!library.assets.some(a=>a.sha256===hash),'This source is already in the library.');
 const asset={id:crypto.randomUUID(),name,mime,bytes:bytes.length,sha256:hash,base64:toBase64(bytes),provenance:structuredClone(provenance)};
 const next=structuredClone(library);next.assets.push(asset);await validateLibrary(next);return next;
}
export async function validateLibrary(value){
 check(value && value.version===1 && value.kind==='milzet-source-library' && Object.keys(value).sort().join(',')===(value.rubrics===undefined?'assets,jobs,kind,revisions,version':'assets,jobs,kind,revisions,rubrics,version'),'Unsupported source library.');
 check(Array.isArray(value.assets) && value.assets.length<=32 && Array.isArray(value.revisions) && value.revisions.length<=20 && Array.isArray(value.jobs) && value.jobs.length<=100,'Source library limit exceeded.');
 check(JSON.stringify(value).length<=120000000,'Source backup exceeds 120 MB.');
 const ids=new Set();
 for(const a of value.assets){check(a && text(a.id,80) && !ids.has(a.id),'Duplicate source ID.');ids.add(a.id);const bytes=fromBase64(a.base64);validateSource(bytes,a.mime);check(bytes.length===a.bytes && await sha256(bytes)===a.sha256 && text(a.name,240),'Source checksum mismatch.');const p=a.provenance;check(p && ['owner','credit','license','source','capturedAt','provider','jobId','derivedFrom'].every(k=>text(p[k])) && p.owner.trim() && p.license.trim(),'Source provenance incomplete.');}
 for(const a of value.assets){check(!a.provenance.derivedFrom || value.assets.some(p=>p.id===a.provenance.derivedFrom && p.id!==a.id),'Missing original source reference.');check(!a.provenance.jobId || value.jobs.some(j=>j.id===a.provenance.jobId && j.provider===a.provenance.provider && j.status==='succeeded'),'Missing generation receipt.');}
 check(new Set(value.jobs.map(j=>j.id)).size===value.jobs.length,'Duplicate generation request.');
 for(const r of value.revisions){const p=await openPackage(JSON.stringify(r.envelope));check(r.revision===p.envelope.manifestSha256 && text(r.savedAt,40),'Invalid scenario revision.');}
 for(const j of value.jobs)check(j && text(j.id,80) && ['meshy','elevenlabs'].includes(j.provider) && ['prepared','submitted','succeeded','failed','uncertain'].includes(j.status) && text(j.prompt,5000) && text(j.remoteId,200),'Invalid generation job.');
 for(const r of value.rubrics||[])check(r && /^[a-f0-9]{64}$/.test(r.revision) && text(r.title,120) && text(r.text,10000),'Invalid private rubric.');
 return value;
}
export async function archiveRevision(library,envelope){
 await openPackage(JSON.stringify(envelope));const next=structuredClone(library);
 check(!next.revisions.some(r=>r.revision===envelope.manifestSha256),'This revision is already archived.');
 next.revisions.push({revision:envelope.manifestSha256,savedAt:new Date().toISOString(),envelope});return validateLibrary(next);
}
export function prepareJob(provider,prompt,voiceId=''){
 check(['meshy','elevenlabs'].includes(provider) && text(prompt,5000) && prompt.trim(),'A generation prompt is required.');
 check(provider!=='elevenlabs' || /^[a-zA-Z0-9_-]{1,80}$/.test(voiceId),'Choose a verified ElevenLabs voice ID.');
 return {id:crypto.randomUUID(),provider,prompt,voiceId,status:'prepared',remoteId:'',createdAt:new Date().toISOString()};
}
