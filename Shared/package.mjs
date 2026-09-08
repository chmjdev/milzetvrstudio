const idPattern = /^[a-zA-Z0-9-]{1,80}$/;
export const MAX_PACKAGE_BYTES = 24000000;
export function check(ok, message) { if (!ok) throw Error(message); }
function exact(obj, keys) { check(obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).sort().join('|') === keys.slice().sort().join('|'), 'Unexpected object fields.'); }
export async function sha256(bytes) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2,'0')).join(''); }
export function toBase64(bytes) { let text = ''; for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(text); }
export function fromBase64(text) { check(typeof text === 'string' && text.length <= MAX_PACKAGE_BYTES && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text), 'Invalid asset encoding.'); return Uint8Array.from(atob(text), c => c.charCodeAt(0)); }
export function validateManifest(m) {
  exact(m,['id','title','fixture','entryPhase','assets','plate','hotspots','phases']);
  check(typeof m.id === 'string' && idPattern.test(m.id) && typeof m.title === 'string' && m.title.trim().length > 0 && m.title.length <= 120 && typeof m.fixture === 'boolean','Invalid package identity.');
  check(Array.isArray(m.assets) && m.assets.length >= 1 && m.assets.length <= 8,'Invalid asset count.');
  const ids = new Set(), paths = new Set();
  for (const a of m.assets) {
    exact(a,['id','path','mime','bytes','sha256']);
    check(typeof a.id === 'string' && idPattern.test(a.id) && !ids.has(a.id),'Duplicate or invalid asset ID.'); ids.add(a.id);
    check(/^assets\/[a-zA-Z0-9-]+\.(png|jpg|wav)$/.test(a.path) && !paths.has(a.path),'Unsafe or duplicate asset path.'); paths.add(a.path);
    check(['image/png','image/jpeg','audio/wav'].includes(a.mime) && Number.isInteger(a.bytes) && a.bytes > 0 && a.bytes <= 12000000 && /^[a-f0-9]{64}$/.test(a.sha256),'Invalid asset metadata.');
    check(a.path.endsWith(a.mime === 'image/png' ? '.png' : a.mime === 'image/jpeg' ? '.jpg' : '.wav'),'Asset extension mismatch.');
  }
  exact(m.plate,['assetId','projection']);
  check(m.plate.projection === 'flat' && m.assets.some(a=>a.id===m.plate.assetId && a.mime.startsWith('image/')),'This player requires a flat image plate.');
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
  return m;
}
export async function sealPackage(manifest, files) {
  validateManifest(manifest);
  const text = JSON.stringify(manifest);
  const envelope = {formatVersion:1,kind:'milzet-playable',manifest:text,manifestSha256:await sha256(new TextEncoder().encode(text)),files};
  await openPackage(JSON.stringify(envelope)); return envelope;
}
export async function openPackage(text) {
  check(typeof text==='string' && text.length <= MAX_PACKAGE_BYTES,'Package exceeds the 24 MB limit.');
  const e=JSON.parse(text); exact(e,['formatVersion','kind','manifest','manifestSha256','files']);
  check(e.formatVersion===1 && e.kind==='milzet-playable' && typeof e.manifest==='string','Unsupported playable package.');
  check(await sha256(new TextEncoder().encode(e.manifest))===e.manifestSha256,'Manifest checksum mismatch.');
  const manifest=validateManifest(JSON.parse(e.manifest));
  check(Array.isArray(e.files) && e.files.length===manifest.assets.length,'Missing or extra package assets.');
  const bytes = new Map();
  for(const file of e.files) {
    exact(file,['path','base64']);
    const a=manifest.assets.find(a=>a.path===file.path);check(a && !bytes.has(a.id),'Unknown or duplicate package file.');
    const data=fromBase64(file.base64);
    check(data.length===a.bytes && await sha256(data)===a.sha256,'Asset checksum mismatch.');
    check(a.mime==='image/png' ? data[0]===137 && data[1]===80 && data[2]===78 && data[3]===71 : a.mime==='image/jpeg' ? data[0]===255 && data[1]===216 : new TextDecoder().decode(data.slice(0,4))==='RIFF' && new TextDecoder().decode(data.slice(8,12))==='WAVE','Media signature mismatch.');
    bytes.set(a.id,data);
  }
  return {envelope:e,manifest,bytes};
}
export async function replaceAsset(envelope, assetId, bytes, mime) {
  const m=JSON.parse(envelope.manifest);const a=m.assets.find(a=>a.id===assetId);check(a,'Unknown asset.');
  a.mime=mime;a.path=`assets/${assetId}.${mime==='image/png'?'png':mime==='image/jpeg'?'jpg':'wav'}`;a.bytes=bytes.length;a.sha256=await sha256(bytes);
  const previous=JSON.parse(envelope.manifest).assets.find(a=>a.id===assetId).path;
  const files=envelope.files.filter(f=>f.path!==previous);files.push({path:a.path,base64:toBase64(bytes)});
  return sealPackage(m,files);
}
export function createSession(manifest, revision, host) {
  let phase=manifest.entryPhase;const seen=new Set();let complete=false;let seq=0;let advancing=false;
  const emit=(type,hotspotId='')=>host.emit({eventId:host.sessionId+':'+(++seq),packageId:manifest.id,revision,phase,type,hotspotId});
  return {
    get phase(){return phase;}, get complete(){return complete;}, get visited(){return [...seen];},
    select(id){check(!complete,'Session is complete.');const p=manifest.phases.find(p=>p.id===phase);check(p.hotspotIds.includes(id),'Hotspot is not in the active phase.');seen.add(id);emit('hotspot.selected',id);if(manifest.hotspots.find(h=>h.id===id).evidence)emit('evidence.requested',id);},
    async advance(){check(!advancing,'Transition already in progress.');advancing=true;try{check(!complete,'Session is complete.');const p=manifest.phases.find(p=>p.id===phase);check(p.hotspotIds.every(id=>seen.has(id)),'Visit every hotspot before continuing.');if(p.next){check(p.gate!=='host' || await host.authorize({packageId:manifest.id,revision,from:phase,to:p.next}),'Host release is required.');emit('phase.completed');phase=p.next;seen.clear();emit('phase.started');}else{complete=true;emit('scenario.completed');}}finally{advancing=false;}}
  };
}
