import {referenceText} from '../Shared/references.mjs';
import React,{useState} from 'react';
export function ActivityPreview({manifest,session,time,onError}){
 const [responses,setResponses]=useState({}),[hint,setHint]=useState(''),[tick,setTick]=useState(0);
 if(!session)return null;const activities=(manifest.activities||[]).filter(a=>a.phase===session.phase),pending=activities.find(a=>!session.completedActivities.includes(a.id));
 if(!activities.length)return null;
 return <section><h3>Activities ({activities.filter(a=>session.completedActivities.includes(a.id)).length}/{activities.length})</h3>{pending?<div><p>{pending.prompt}</p><p style={{whiteSpace:'pre-wrap'}}>{referenceText(manifest,'activity',pending.id)}</p>{pending.citation && <small>{pending.citation}</small>}{pending.startTime>0 && <p>Available at {pending.startTime} seconds{pending.endTime?' until '+pending.endTime:''}.</p>}
 {pending.kind==='quiz'?<label>Response<select aria-label="Activity response" value={responses[pending.id]||''} onChange={e=>setResponses({...responses,[pending.id]:e.target.value})}><option value="">Choose a response</option>{pending.choices.map(c=><option key={c}>{c}</option>)}</select></label>:!['acknowledgement','step'].includes(pending.kind)?<label>Response<textarea aria-label="Activity response" value={responses[pending.id]||''} onChange={e=>setResponses({...responses,[pending.id]:e.target.value})}/></label>:null}
 <button onClick={()=>{try{session.respond(pending.id,['acknowledgement','step'].includes(pending.kind)?'acknowledged':responses[pending.id]||'',time());setHint('');setTick(tick+1);}catch(e){onError(e.message);}}}>Submit activity response</button>{pending.hint && pending.phase!=='prove' && <button onClick={()=>{try{setHint(session.hint(pending.id));}catch(e){onError(e.message);}}}>Show activity hint</button>}{hint && <p>{hint}</p>}</div>:<p>Responses recorded by the local test host. Any grading or sign-off belongs to the receiving system.</p>}</section>;
}
