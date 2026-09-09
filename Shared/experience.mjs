import {check,openPackage,sha256} from './package.mjs';
export const MAX_EXPERIENCE_BYTES=120000000;
const id=x=>typeof x==='string' && /^[a-zA-Z0-9-]{1,80}$/.test(x);
function exact(value,keys){check(value && !Array.isArray(value) && Object.keys(value).sort().join(',')===keys.split(',').sort().join(','),'Unexpected experience fields.');}
export async function openExperience(text){
 check(typeof text==='string' && text.length<=MAX_EXPERIENCE_BYTES,'Experience exceeds 120 MB.');
 const envelope=JSON.parse(text);exact(envelope,'formatVersion,kind,manifest,manifestSha256');
 check(envelope.formatVersion===1 && envelope.kind==='milzet-experience' && typeof envelope.manifest==='string','Unsupported experience.');
 check(await sha256(new TextEncoder().encode(envelope.manifest))===envelope.manifestSha256,'Experience checksum mismatch.');
 const manifest=JSON.parse(envelope.manifest);exact(manifest,'id,title,entryScene,scenes');
 check(id(manifest.id) && typeof manifest.title==='string' && manifest.title.trim() && manifest.title.length<=120,'Invalid experience identity.');
 check(Array.isArray(manifest.scenes) && manifest.scenes.length>0 && manifest.scenes.length<=16,'An experience needs 1-16 scenes.');
 const packages=new Map();
 for(const scene of manifest.scenes){
  exact(scene,'id,next,gate,package');check(id(scene.id) && !packages.has(scene.id) && ['none','host'].includes(scene.gate),'Invalid or duplicate scene.');
  const loaded=await openPackage(scene.package);check(loaded.manifest.id===scene.id,'Scene package identity mismatch.');packages.set(scene.id,loaded);
 }
 check(packages.has(manifest.entryScene),'Missing entry scene.');
 for(const scene of manifest.scenes)check(scene.next===''?scene.gate==='none':packages.has(scene.next) && scene.next!==scene.id,'Invalid scene transition.');
 const visited=new Set();let current=manifest.entryScene;
 while(current){check(!visited.has(current),'Cyclic scene transitions.');visited.add(current);current=manifest.scenes.find(s=>s.id===current).next;}
 check(visited.size===packages.size,'Unreachable experience scene.');
 return {envelope,manifest,packages};
}
export async function sealExperience(manifest){
 const text=JSON.stringify(manifest),envelope={formatVersion:1,kind:'milzet-experience',manifest:text,manifestSha256:await sha256(new TextEncoder().encode(text))};
 await openExperience(JSON.stringify(envelope));return envelope;
}
export async function createExperience(title,scene){
 const loaded=await openPackage(JSON.stringify(scene));return sealExperience({id:crypto.randomUUID(),title:title.trim(),entryScene:loaded.manifest.id,scenes:[{id:loaded.manifest.id,next:'',gate:'none',package:JSON.stringify(scene)}]});
}
export async function putExperienceScene(envelope,scene,replace=false){
 const {manifest}=await openExperience(JSON.stringify(envelope)),loaded=await openPackage(JSON.stringify(scene));const existing=manifest.scenes.find(s=>s.id===loaded.manifest.id);
 check(replace?!!existing:!existing,replace?'This scene is not in the experience.':'This scene is already included; use Update current scene.');
 if(existing)existing.package=JSON.stringify(scene);else{const last=manifest.scenes.find(s=>s.next==='');last.next=loaded.manifest.id;manifest.scenes.push({id:loaded.manifest.id,next:'',gate:'none',package:JSON.stringify(scene)});}
 return sealExperience(manifest);
}
export async function orderExperience(envelope,order){
 const {manifest}=await openExperience(JSON.stringify(envelope));check(order.length>0 && new Set(order).size===order.length && order.every(id=>manifest.scenes.some(s=>s.id===id)),'Invalid scene order.');
 manifest.scenes=order.map((id,i)=>({...manifest.scenes.find(s=>s.id===id),next:order[i+1]||'',...(!order[i+1]?{gate:'none'}:{})}));manifest.entryScene=order[0];return sealExperience(manifest);
}
export function createJourney(loaded,host){
 let sceneId=loaded.manifest.entryScene,complete=false,busy=false,sequence=0;
 const emit=type=>host.emit({type,eventId:host.sessionId+':'+(++sequence),experienceId:loaded.manifest.id,experienceRevision:loaded.envelope.manifestSha256,sceneId});
 return {get sceneId(){return sceneId;},get complete(){return complete;},async advance(sceneComplete){
  check(!busy && !complete,'Experience complete or transition in progress.');busy=true;
  try{check(sceneComplete,'Complete the current scene first.');const scene=loaded.manifest.scenes.find(s=>s.id===sceneId);
   if(scene.next){check(scene.gate!=='host' || await host.authorize({experienceId:loaded.manifest.id,revision:loaded.envelope.manifestSha256,from:sceneId,to:scene.next}),'Scene host release is required.');await host.load(loaded.packages.get(scene.next).envelope);emit('experience.scene.completed');sceneId=scene.next;emit('experience.scene.started');}
   else{complete=true;emit('experience.completed');}
  }finally{busy=false;}
 }};
}
