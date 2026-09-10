import {evaluateFreshness} from './freshness.mjs';
import {validateReferences} from './references.mjs';
import {validatePresentation} from './presentation.mjs';
import {validateProvenance} from './provenance.mjs';
import {validateContext} from './context.mjs';
import {validateActivities,activityResponse} from './activities.mjs';
import {validateGlb,validateObjects} from './models.mjs';
import {validateVideo} from './video.mjs';
import { projections,validateProjection } from './projection.mjs';
const idPattern = /^[a-zA-Z0-9-]{1,80}$/;
export const MAX_PACKAGE_BYTES = 24000000;
export function check(ok, message) { if (!ok) throw Error(message); }
function exact(obj, keys) { check(obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).sort().join('|') === keys.slice().sort().join('|'), 'Unexpected object fields.'); }
export async function sha256(bytes) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2,'0')).join(''); }
export function toBase64(bytes) { let text = ''; for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(text); }
export function fromBase64(text) {
 check(typeof text === 'string' && text.length <= MAX_PACKAGE_BYTES && text.length % 4 === 0, 'Invalid asset encoding.');
 const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
 check(!/[^A-Za-z0-9+/]/.test(text.slice(0, text.length - padding)), 'Invalid asset encoding.');
 return Uint8Array.from(atob(text), c => c.charCodeAt(0));
}
export function validateManifest(m) {
  exact(m,['id','title','fixture','entryPhase','assets','plate','hotspots','phases',...(m.references===undefined?[]:['references']),...(m.objects===undefined?[]:['objects']),...(m.activities===undefined?[]:['activities']),...(m.context===undefined?[]:['context']),...(m.provenance===undefined?[]:['provenance']),...(m.presentation===undefined?[]:['presentation'])]);
  check(typeof m.id === 'string' && idPattern.test(m.id) && typeof m.title === 'string' && m.title.trim().length > 0 && m.title.length <= 120 && typeof m.fixture === 'boolean','Invalid package identity.');
  check(Array.isArray(m.assets) && m.assets.length >= 1 && m.assets.length <= 8,'Invalid asset count.');
  const ids = new Set(), paths = new Set();
  for (const a of m.assets) {
    exact(a,['id','path','mime','bytes','sha256']);
    check(typeof a.id === 'string' && idPattern.test(a.id) && !ids.has(a.id),'Duplicate or invalid asset ID.'); ids.add(a.id);
    check(/^assets\/[a-zA-Z0-9-]+\.(png|jpg|wav|mp4|glb)$/.test(a.path) && !paths.has(a.path),'Unsafe or duplicate asset path.'); paths.add(a.path);
    check(['image/png','image/jpeg','audio/wav','video/mp4','model/gltf-binary'].includes(a.mime) && Number.isInteger(a.bytes) && a.bytes > 0 && a.bytes <= 12000000 && /^[a-f0-9]{64}$/.test(a.sha256),'Invalid asset metadata.');
    check(a.path.endsWith({'image/png':'.png','image/jpeg':'.jpg','video/mp4':'.mp4','model/gltf-binary':'.glb','audio/wav':'.wav'}[a.mime]),'Asset extension mismatch.');
  }
  exact(m.plate,['assetId','projection']);
  check(projections.includes(m.plate.projection) && m.assets.some(a=>a.id===m.plate.assetId && (a.mime.startsWith('image/') || a.mime==='video/mp4')),'Unsupported image projection.');
  check(Array.isArray(m.hotspots) && m.hotspots.length > 0 && m.hotspots.length <= 32,'Invalid hotspot count.');
  const hotspots = new Set();
  for(const h of m.hotspots) {
    exact(h,['id','label','text','x','y','narrationAssetId','evidence']);
    check(typeof h.id === 'string' && idPattern.test(h.id) && !hotspots.has(h.id),'Invalid hotspot ID.');hotspots.add(h.id);
    check(typeof h.label === 'string' && h.label.length > 0 && h.label.length <= 80 && typeof h.text === 'string' && h.text.length <= 2000,'Invalid hotspot text.');
    check(Number.isFinite(h.x) && h.x >= 0 && h.x <= 1 && Number.isFinite(h.y) && h.y >= 0 && h.y <= 1 && typeof h.evidence === 'boolean','Invalid hotspot anchor.');
    check(h.narrationAssetId === '' || m.assets.some(a=>a.id===h.narrationAssetId && a.mime==='audio/wav'),'Missing narration asset.');
  }
  check(Array.isArray(m.phases) && m.phases.length > 0 && m.phases.length <= 4,'Invalid phase subset.');
  const phases = new Set(m.phases.map(p=>p.id));
  check(phases.size === m.phases.length && phases.has(m.entryPhase),'Invalid entry phase.');
  for(const p of m.phases) {
    exact(p,['id','hotspotIds','next','gate']);
    check(['induct','shadow','perform','prove'].includes(p.id),'Unknown phase.');
    check(Array.isArray(p.hotspotIds) && p.hotspotIds.length > 0 && new Set(p.hotspotIds).size === p.hotspotIds.length && p.hotspotIds.every(id=>hotspots.has(id)),'Invalid phase hotspot references.');
    check((p.next === '' || (phases.has(p.next) && p.next !== p.id)) && ['none','host'].includes(p.gate),'Invalid transition.');
    check(p.next !== '' || p.gate === 'none','Final phase cannot require a transition gate.');
  }
  const visited = new Set(); let current = m.entryPhase;
  while(current) { check(!visited.has(current),'Cyclic phase transitions.'); visited.add(current); current=m.phases.find(p=>p.id===current).next; }
  check(visited.size===phases.size,'Unreachable phase.');
  validateReferences(m);validateObjects(m);validateActivities(m);validateContext(m);validateProvenance(m);validatePresentation(m);return m;
}
export async function sealPackage(manifest, files) {
  validateManifest(manifest);
  const text = JSON.stringify(manifest);
  const envelope = {formatVersion:manifest.references!==undefined?9:manifest.presentation!==undefined?8:manifest.provenance!==undefined?7:manifest.context!==undefined?6:manifest.activities!==undefined?5:manifest.objects!==undefined?4:manifest.assets.some(a=>a.mime==='video/mp4')?3:manifest.plate.projection==='flat'?1:2,kind:'milzet-playable',manifest:text,manifestSha256:await sha256(new TextEncoder().encode(text)),files};
  await openPackage(JSON.stringify(envelope)); return envelope;
}
export async function openPackage(text) {
  check(typeof text==='string' && text.length <= MAX_PACKAGE_BYTES,'Package exceeds the 24 MB limit.');
  const e=JSON.parse(text); exact(e,['formatVersion','kind','manifest','manifestSha256','files']);
  check([1,2,3,4,5,6,7,8,9].includes(e.formatVersion) && e.kind==='milzet-playable' && typeof e.manifest==='string','Unsupported playable package.');
  check(await sha256(new TextEncoder().encode(e.manifest))===e.manifestSha256,'Manifest checksum mismatch.');
  const manifest=validateManifest(JSON.parse(e.manifest));
  check(e.formatVersion>=9 || manifest.references===undefined,'References require package version 9.');
  check(e.formatVersion>=8 || manifest.presentation===undefined,'Presentation requires package version 8.');
  check(e.formatVersion>=7 || manifest.provenance===undefined,'Provenance requires package version 7.');
  check(e.formatVersion>=6 || manifest.context===undefined,'Context requires package version 6.');
  check(e.formatVersion>=5 || manifest.activities===undefined,'Activities require package version 5.');
  check(e.formatVersion>=4 || manifest.objects===undefined && !manifest.assets.some(a=>a.mime==='model/gltf-binary'),'Models require package version 4.');
  check(e.formatVersion>=3 || !manifest.assets.some(a=>a.mime==='video/mp4'),'Video requires package version 3.');
  check(e.formatVersion!==1 || manifest.plate.projection==='flat','Immersive projection requires package version 2.');
  check(Array.isArray(e.files) && e.files.length===manifest.assets.length,'Missing or extra package assets.');
  const bytes = new Map();
  for(const file of e.files) {
    exact(file,['path','base64']);
    const a=manifest.assets.find(a=>a.path===file.path);check(a && !bytes.has(a.id),'Unknown or duplicate package file.');
    const data=fromBase64(file.base64);
    check(data.length===a.bytes && await sha256(data)===a.sha256,'Asset checksum mismatch.');
    check(a.mime==='image/png' ? data[0]===137 && data[1]===80 && data[2]===78 && data[3]===71 : a.mime==='image/jpeg' ? data[0]===255 && data[1]===216 : a.mime==='model/gltf-binary'?new TextDecoder().decode(data.slice(0,4))==='glTF':a.mime==='video/mp4'?new TextDecoder().decode(data.slice(4,8))==='ftyp':new TextDecoder().decode(data.slice(0,4))==='RIFF' && new TextDecoder().decode(data.slice(8,12))==='WAVE','Media signature mismatch.');
    if(a.mime==='audio/wav')validateWave(data);if(a.mime==='video/mp4')validateVideo(data);if(a.mime==='model/gltf-binary')validateGlb(data);
    bytes.set(a.id,data);
  }
  const plate=manifest.assets.find(a=>a.id===manifest.plate.assetId);if(plate.mime==='video/mp4')validateVideo(bytes.get(plate.id),manifest.plate.projection);else validateProjection(bytes.get(plate.id),plate.mime,manifest.plate.projection);
  return {envelope:e,manifest,bytes};
}
export async function replaceAsset(envelope, assetId, bytes, mime) {
  const m=JSON.parse(envelope.manifest);const a=m.assets.find(a=>a.id===assetId);check(a,'Unknown asset.');
  a.mime=mime;a.path=`assets/${assetId}.${mime==='image/png'?'png':mime==='image/jpeg'?'jpg':mime==='video/mp4'?'mp4':'wav'}`;a.bytes=bytes.length;a.sha256=await sha256(bytes);
  if(m.provenance)m.provenance=m.provenance.filter(p=>p.assetId!==assetId || p.sha256===a.sha256);
  const previous=JSON.parse(envelope.manifest).assets.find(a=>a.id===assetId).path;
  const files=envelope.files.filter(f=>f.path!==previous);files.push({path:a.path,base64:toBase64(bytes)});
  return sealPackage(m,files);
}
export function createSession(manifest, revision, host) {
  const currentDate = () => (host && host.now) ? host.now : new Date().toISOString().slice(0, 10);
  const checkFreshness = () => {
    if (manifest && manifest.context) {
      const res = evaluateFreshness(manifest.context, currentDate());
      if (!res.valid) throw Error(res.reason);
    }
  };
  checkFreshness();
  let phase=manifest.entryPhase;const seen=new Set();let complete=false;let seq=0;let advancing=false;let revoked=false;let revocationReason='';const responses=new Set(),hints=new Map();
  const emit=(type,hotspotId='',details={})=>host.emit({...details,eventId:host.sessionId+':'+(++seq),packageId:manifest.id,revision,phase,type,hotspotId});
  return {
    get phase(){return phase;}, get complete(){return complete;}, get visited(){return [...seen];},get completedActivities(){return [...responses];},
    get revoked(){return revoked;}, get revocationReason(){return revocationReason;},
    revoke(reason='Revoked by host'){if(revoked)return;revoked=true;revocationReason=String(reason);emit('site.invalidated','',{reason:revocationReason});emit('scenario.revoked','',{reason:revocationReason});},
    respond(id,response,time=0){check(!revoked,'Scenario has been revoked by host.');check(!complete,'Session is complete.');checkFreshness();const a=activityResponse(manifest,phase,responses,id,response,time);responses.add(id);emit('activity.responded','',{activityId:id,response});if(a.kind==='observation')emit('evidence.requested','',{activityId:id,response:''});},
    hint(id){check(!revoked,'Scenario has been revoked by host.');check(!complete,'Session is complete.');checkFreshness();const a=(manifest.activities||[]).find(a=>a.id===id && a.phase===phase);const count=hints.get(id)||0;check(a && a.phase!=='prove' && a.hint && count<a.maxHints,'No hint available.');hints.set(id,count+1);emit('hint.used','',{activityId:id,response:String(count+1)});return a.hint;},
    select(id){check(!revoked,'Scenario has been revoked by host.');check(!complete,'Session is complete.');checkFreshness();const p=manifest.phases.find(p=>p.id===phase);check(p.hotspotIds.includes(id),'Hotspot is not in the active phase.');seen.add(id);emit('hotspot.selected',id);if(manifest.hotspots.find(h=>h.id===id).evidence)emit('evidence.requested',id);},
    async advance(){check(!revoked,'Scenario has been revoked by host.');check(!advancing,'Transition already in progress.');advancing=true;try{check(!revoked,'Scenario has been revoked by host.');check(!complete,'Session is complete.');checkFreshness();const p=manifest.phases.find(p=>p.id===phase);check(p.hotspotIds.every(id=>seen.has(id)),'Visit every hotspot before continuing.');check((manifest.activities||[]).filter(a=>a.phase===phase).every(a=>responses.has(a.id)),'Complete every activity before continuing.');if(p.next){check(p.gate!=='host' || await host.authorize({packageId:manifest.id,revision,from:phase,to:p.next}),'Host release is required.');emit('phase.completed');phase=p.next;seen.clear();emit('phase.started');}else{complete=true;emit('scenario.completed');}}finally{advancing=false;}}
  };
}

export function validateWave(bytes) {
 check(bytes.length>=44,'WAV header is incomplete.');const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const text=(a,b)=>new TextDecoder().decode(bytes.slice(a,b));
 check(text(0,4)==='RIFF' && text(8,12)==='WAVE' && v.getUint32(4,true)===bytes.length-8,'Invalid WAV container.');
 let offset=12,format=null,dataSize=null;
 while(offset+8<=bytes.length){const type=text(offset,offset+4),size=v.getUint32(offset+4,true);offset+=8;check(offset+size<=bytes.length,'WAV chunk exceeds file.');
 if(type==='fmt '){check(format===null && size>=16,'Invalid WAV format chunk.');format={encoding:v.getUint16(offset,true),channels:v.getUint16(offset+2,true),rate:v.getUint32(offset+4,true),byteRate:v.getUint32(offset+8,true),alignment:v.getUint16(offset+12,true),bits:v.getUint16(offset+14,true)};}
 if(type==='data'){check(dataSize===null,'Duplicate WAV data.');dataSize=size;}offset+=size+(size%2);}
 check(format && format.encoding===1 && [1,2].includes(format.channels) && format.bits===16 && format.rate>=8000 && format.rate<=96000,'Shared preview supports 16-bit PCM mono/stereo WAV at 8–96 kHz.');
 check(format.alignment===format.channels*2 && format.byteRate===format.rate*format.alignment && dataSize>0 && dataSize%format.alignment===0,'Invalid WAV sample layout.');
 return format;
}
