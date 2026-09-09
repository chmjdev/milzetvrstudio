import {check} from './package.mjs';
const exact=(value,keys)=>check(value && !Array.isArray(value) && Object.keys(value).sort().join(',')===keys.split(',').sort().join(','),'Unexpected presentation fields.');
const finite=(n,min,max)=>typeof n==='number' && Number.isFinite(n) && n>=min && n<=max;
const id=value=>typeof value==='string' && /^[a-zA-Z0-9-]{1,80}$/.test(value);
const text=(value,max)=>typeof value==='string' && value.length<=max;
const vector=(value,size,min,max)=>Array.isArray(value) && value.length===size && value.every(n=>finite(n,min,max));
export const emptyPresentation=()=>({overlays:[],demonstration:null});
export function validatePresentation(manifest){
 if(manifest.presentation===undefined)return;
 const value=manifest.presentation;exact(value,'overlays,demonstration');
 check(Array.isArray(value.overlays) && value.overlays.length<=16,'At most 16 overlays are supported.');
 const ids=new Set();
 for(const o of value.overlays){
  exact(o,'id,kind,text,imageAssetId,position,rotation,size,phase,startTime,endTime,citation');
  check(id(o.id) && !ids.has(o.id),'Invalid or duplicate overlay ID.');ids.add(o.id);
  check(['label','diagram','sop','ppe','limits'].includes(o.kind) && text(o.text,1200) && text(o.citation,1000),'Invalid overlay text or kind.');
  check(o.imageAssetId==='' || manifest.assets.some(a=>a.id===o.imageAssetId && a.mime.startsWith('image/')),'Missing overlay image.');
  check(o.text.trim()!=='' || o.imageAssetId!=='','An overlay needs text or an image.');
  check(vector(o.position,3,-20,20) && vector(o.rotation,3,-360,360) && vector(o.size,2,.1,5),'Invalid overlay transform.');
  check(o.phase==='' || manifest.phases.some(p=>p.id===o.phase),'Unknown overlay phase.');
  check(finite(o.startTime,0,600) && finite(o.endTime,0,600) && (o.endTime===0 || o.endTime>o.startTime),'Invalid overlay time window.');
 }
 const d=value.demonstration;if(d===null){check(value.overlays.every(o=>o.startTime===0 && o.endTime===0),'Timed overlays need a demonstration.');return;}
 exact(d,'phase,duration,narrationAssetId,path,cues');
 check(manifest.phases.some(p=>p.id===d.phase) && finite(d.duration,.1,600),'Invalid demonstration phase or duration.');
 check(d.narrationAssetId==='' || manifest.assets.some(a=>a.id===d.narrationAssetId && a.mime==='audio/wav'),'Missing demonstration narration.');
 check(Array.isArray(d.path) && d.path.length<=64 && (d.path.length===0 || d.path.length>=2),'A guide path needs two to 64 points.');
 let last=-1;for(const p of d.path){exact(p,'time,position');check(finite(p.time,0,d.duration) && p.time>last && vector(p.position,3,-20,20),'Invalid guide path point.');last=p.time;}
 check(d.path.length===0 || d.path[0].time===0,'Start the guide path at zero.');
 check(Array.isArray(d.cues) && d.cues.length<=32,'At most 32 demonstration cues are supported.');
 last=-1;const cues=new Set();for(const c of d.cues){exact(c,'id,time,hotspotId,text,pause');check(id(c.id) && !cues.has(c.id) && finite(c.time,0,d.duration) && c.time>last && text(c.text,1200) && typeof c.pause==='boolean','Invalid demonstration cue.');cues.add(c.id);last=c.time;check(c.hotspotId==='' || manifest.phases.find(p=>p.id===d.phase).hotspotIds.includes(c.hotspotId),'Cue hotspot must belong to the demonstration phase.');}
 check(value.overlays.every(o=>o.startTime<=d.duration && o.endTime<=d.duration && (o.startTime===0 && o.endTime===0 || o.phase===d.phase)),'Timed overlays must use the demonstration phase and duration.');
}
export function presentationFrame(presentation,phase,time){
 const d=presentation?.demonstration,active=d?.phase===phase;
 const overlays=(presentation?.overlays||[]).filter(o=>(o.phase==='' || o.phase===phase) && time>=o.startTime && (o.endTime===0 || time<=o.endTime));
 const cue=active?d.cues.filter(c=>c.time<=time).at(-1)||null:null;
 let position=null;
 if(active && d.path.length){const end=d.path.findIndex(p=>p.time>time);if(end===-1)position=d.path.at(-1).position.slice();else if(end===0)position=d.path[0].position.slice();else{const a=d.path[end-1],b=d.path[end],f=(time-a.time)/(b.time-a.time);position=a.position.map((n,i)=>n+(b.position[i]-n)*f);}}
 return {overlays,cue,position};
}
export function createPlayback(demonstration){
 let time=0,playing=false;const paused=new Set();
 return {
  get time(){return time;},get playing(){return playing;},
  play(){if(time>=demonstration.duration){time=0;paused.clear();}playing=true;},
  pause(){playing=false;},
  seek(value){check(finite(value,0,demonstration.duration),'Invalid demonstration seek.');time=value;playing=false;paused.clear();demonstration.cues.filter(c=>c.time<=time).forEach(c=>paused.add(c.id));},
  tick(delta){check(finite(delta,0,600),'Invalid demonstration delta.');if(!playing)return {time,playing,cue:null};const next=Math.min(demonstration.duration,time+delta);const cue=demonstration.cues.find(c=>c.pause && c.time>=time && c.time<=next && !paused.has(c.id));if(cue){time=cue.time;paused.add(cue.id);playing=false;}else{time=next;if(time>=demonstration.duration)playing=false;}return {time,playing,cue:cue||null};}
 };
}
