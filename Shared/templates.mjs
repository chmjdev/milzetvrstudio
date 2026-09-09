import {check,openPackage,sealPackage,validateManifest} from './package.mjs';
import {emptyContext,environments} from './context.mjs';
import {newHotspot} from './authoring.mjs';
const fields=['plate','hotspots','phases','entryPhase','objects','activities','context','presentation','references'];
const mimeExt={'image/png':'png','image/jpeg':'jpg','video/mp4':'mp4','audio/wav':'wav','model/gltf-binary':'glb'};
function templateManifest(value){
 return {id:'template-validation',title:value.title,fixture:false,assets:value.slots.map(slot=>({id:slot.id,mime:slot.mime,path:'assets/'+slot.id+'.'+mimeExt[slot.mime],bytes:1,sha256:'0'.repeat(64)})),...value.composition};
}
export function validateTemplate(value){
 check(value && Object.keys(value).sort().join(',')==='composition,formatVersion,kind,slots,title' && value.kind==='milzet-scene-template' && [1,2].includes(value.formatVersion),'Unsupported scene template.');
 check(typeof value.title==='string' && value.title.trim() && value.title.length<=120 && Array.isArray(value.slots) && value.slots.length>0 && value.slots.length<=8,'Invalid template identity or slots.');
 check(value.composition && Object.keys(value.composition).every(k=>fields.includes(k)),'Unsupported template content.');
 for(const slot of value.slots)check(slot && Object.keys(slot).sort().join(',')==='id,mime' && typeof slot.id==='string' && /^[a-zA-Z0-9-]{1,80}$/.test(slot.id) && !!mimeExt[slot.mime],'Invalid template asset slot.');
 check(value.formatVersion>=2 || value.composition.references===undefined,'Template references require version 2.');validateManifest(templateManifest(value));return value;
}
export async function exportTemplate(envelope,title){
 const {manifest}=await openPackage(JSON.stringify(envelope)),composition=Object.fromEntries(fields.filter(k=>manifest[k]!==undefined).map(k=>[k,structuredClone(manifest[k])]));
 const used=new Set([manifest.plate.assetId,...manifest.hotspots.map(h=>h.narrationAssetId),...(manifest.objects||[]).map(o=>o.assetId),...(manifest.presentation?.overlays||[]).map(o=>o.imageAssetId),manifest.presentation?.demonstration?.narrationAssetId]);
 return validateTemplate({formatVersion:manifest.references===undefined?1:2,kind:'milzet-scene-template',title:title.trim(),slots:manifest.assets.filter(a=>used.has(a.id)).map(a=>({id:a.id,mime:a.mime})),composition});
}
export function suggestedBindings(template,manifest){
 return Object.fromEntries(template.slots.map(slot=>{const matches=manifest.assets.filter(a=>a.mime===slot.mime || a.mime.startsWith('image/') && slot.mime.startsWith('image/'));return [slot.id,slot.id===template.composition.plate.assetId?manifest.plate.assetId:matches.find(a=>a.id===slot.id)?.id||(matches.length===1?matches[0].id:'')];}));
}
export async function applyTemplate(envelope,value,bindings){
 const template=validateTemplate(value),{manifest}=await openPackage(JSON.stringify(envelope)),composition=structuredClone(template.composition);
 const map=(id,optional=false)=>{if(id==='')return '';const slot=template.slots.find(s=>s.id===id),asset=manifest.assets.find(a=>a.id===bindings[id]);if(optional && !bindings[id])return '';check(slot && asset && (slot.mime===asset.mime || slot.mime.startsWith('image/') && asset.mime.startsWith('image/')),'Bind a compatible asset to template slot '+id+'.');return asset.id;};
 composition.plate.assetId=map(composition.plate.assetId);composition.hotspots.forEach(h=>{h.narrationAssetId=map(h.narrationAssetId,true);});(composition.objects||[]).forEach(o=>{o.assetId=map(o.assetId);});
 if(composition.presentation){composition.presentation.overlays.forEach(o=>{o.imageAssetId=map(o.imageAssetId);});if(composition.presentation.demonstration)composition.presentation.demonstration.narrationAssetId=map(composition.presentation.demonstration.narrationAssetId,true);}
 const next={...manifest};for(const key of fields)delete next[key];Object.assign(next,composition);
 return sealPackage(next,envelope.files);
}
export function environmentLayout(environment,projection='flat'){
 check(environments.includes(environment),'Unknown environment layout.');
 const labels={Site:['Arrival','Briefing','Work area','Review'],Plant:['Entry','Equipment','Control point','Review'],Workshop:['Entry','Workbench','Tool area','Review'],Field:['Meeting point','Route','Observation','Review'],Studio:['Entry','Demonstration','Activity','Review'],Office:['Welcome','Workspace','Collaboration','Review'],Clinic:['Reception','Consultation','Procedure area','Review'],Community:['Meeting point','Shared space','Activity','Review']}[environment];
 const positions={Site:[[.12,.3],[.35,.25],[.65,.65],[.88,.3]],Plant:[[.12,.5],[.4,.35],[.65,.35],[.88,.5]],Workshop:[[.15,.75],[.4,.45],[.7,.45],[.85,.75]],Field:[[.1,.5],[.35,.6],[.65,.4],[.9,.5]],Studio:[[.15,.65],[.35,.35],[.65,.35],[.85,.65]],Office:[[.15,.4],[.4,.6],[.65,.4],[.85,.6]],Clinic:[[.15,.5],[.38,.4],[.65,.6],[.85,.5]],Community:[[.15,.6],[.4,.35],[.65,.35],[.85,.6]]}[environment];
 const hotspots=labels.map((label,i)=>({...newHotspot('point-'+(i+1),...positions[i]),label}));
 return validateTemplate({formatVersion:1,kind:'milzet-scene-template',title:environment+' authoring layout',slots:[{id:'plate',mime:'image/png'}],composition:{plate:{assetId:'plate',projection},hotspots,phases:['induct','shadow','perform','prove'].map((id,i,all)=>({id,hotspotIds:[hotspots[i].id],next:all[i+1]||'',gate:i===1 || i===2?'host':'none'})),entryPhase:'induct',context:{...emptyContext(),environment}}});
}
