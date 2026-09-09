export const activityKinds=['acknowledgement','step','quiz','observation','field'];
export function validateActivities(m){
 if(m.activities===undefined)return;
 if(!Array.isArray(m.activities) || m.activities.length>64)throw Error('Maximum 64 activities.');
 const ids=new Set();for(const a of m.activities){
  if(!a || Object.keys(a).sort().join(',')!=='choices,citation,endTime,hint,id,kind,maxHints,phase,prompt,startTime' || !/^[a-zA-Z0-9-]{1,80}$/.test(a.id) || ids.has(a.id))throw Error('Invalid activity ID or fields.');ids.add(a.id);
  if(!m.phases.some(p=>p.id===a.phase) || !activityKinds.includes(a.kind) || typeof a.prompt!=='string' || !a.prompt.trim() || a.prompt.length>2000 || typeof a.citation!=='string' || a.citation.length>500)throw Error('Invalid activity content.');
  if(!Array.isArray(a.choices) || a.choices.length>8 || a.choices.some(c=>typeof c!=='string' || !c.trim() || c.length>200) || new Set(a.choices).size!==a.choices.length || (a.kind==='quiz'?a.choices.length<2:a.choices.length!==0))throw Error('Quizzes need 2–8 distinct choices.');
  if(typeof a.hint!=='string' || a.hint.length>1000 || !Number.isInteger(a.maxHints) || a.maxHints<0 || a.maxHints>3 || (a.phase==='prove' && (a.hint!=='' || a.maxHints!==0)))throw Error('Invalid hint budget; Prove cannot contain hints.');
  if(!Number.isFinite(a.startTime) || a.startTime<0 || a.startTime>3600 || !Number.isFinite(a.endTime) || a.endTime<0 || a.endTime>3600 || a.endTime!==0 && a.endTime<=a.startTime)throw Error('Invalid activity time window.');
  if(a.startTime>0 || a.endTime>0){const d=m.presentation?.demonstration;if(d?.phase===a.phase){if(a.startTime>d.duration || a.endTime>d.duration)throw Error('Activity exceeds demonstration duration.');}else if(!m.assets.some(x=>x.id===m.plate.assetId && x.mime==='video/mp4'))throw Error('Timed activities require a clip or a demonstration in this phase.');}
 }
}
export function activityResponse(manifest,phase,done,id,response,time){
 const pending=(manifest.activities||[]).filter(a=>a.phase===phase && !done.has(a.id));const current=pending[0];
 if(!current || current.id!==id)throw Error('Complete activities in their authored order.');
 if(typeof response!=='string' || !response.trim() || response.length>2000 || current.kind==='quiz' && !current.choices.includes(response))throw Error('A valid response is required.');
 if(!Number.isFinite(time) || time<current.startTime || current.endTime>0 && time>current.endTime)throw Error('This activity is outside its clip time window.');
 return current;
}
