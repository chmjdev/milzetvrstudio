import {referenceText} from './references.mjs';
import {check} from './package.mjs';
export function createImmersiveControls(read,actions){
 let tab='menu',page=0,textPage=0,input='',notice='',busy=false,lastActivity='',lastBody='';let commands=new Map();
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?!-';
 function switchTo(next){tab=next;page=0;textPage=0;notice='';}
 function snapshot(){
  const state=read(),{manifest,session}=state;const phase=manifest.phases.find(p=>p.id===session.phase),activity=(manifest.activities||[]).find(a=>a.phase===session.phase && !session.completedActivities.includes(a.id));
  if(lastActivity!==activity?.id){lastActivity=activity?.id;input='';if(tab==='keyboard')tab='activity';}
  let body='',buttons=[];const add=(id,label,run,enabled=true)=>buttons.push({id,label,enabled:enabled && !busy,run});
  if(tab==='menu'){
   body=manifest.title+'\n'+referenceText(manifest,'scenario')+'\nPhase: '+session.phase+(session.complete?' · complete':'')+'\n'+(state.message||'');
   add('inspect','Inspect',()=>switchTo('inspect'));add('activity','Activities',()=>switchTo('activity'));add('media','Playback',()=>switchTo('media'));add('continue','Continue phase',actions.advance,!session.complete);
   if(state.previewHost)add('host',state.granted?'Revoke test release':'Grant test release',actions.toggleHost);
   if(state.experience){add('scene','Continue scene',state.experience.advance,!state.experience.done);if(state.previewHost)add('scene-host',state.experience.granted?'Revoke scene release':'Grant scene release',state.experience.toggleHost);}
   add('exit','Exit VR',actions.exit);
  }else if(tab==='inspect'){
   const selected=manifest.hotspots.find(h=>h.id===state.selected);body=selected?selected.label+'\n'+selected.text+'\n'+referenceText(manifest,'hotspot',selected.id):'Select a hotspot to inspect its prompt.';
   const hotspots=phase.hotspotIds.map(id=>manifest.hotspots.find(h=>h.id===id));const count=Math.ceil(hotspots.length/6);page=Math.min(page,Math.max(0,count-1));hotspots.slice(page*6,page*6+6).forEach(h=>add('select-'+h.id,h.label,()=>actions.select(h.id),!session.complete));if(count>1)add('next','More hotspots',()=>{page=(page+1)%count;});if(selected?.narrationAssetId)add('audio','Play narration',actions.audio);
  }else if(tab==='activity'){
   if(!activity)body='All activities in this phase have been recorded by the local test host.';
   else{body=activity.prompt+'\n'+activity.citation+'\n'+referenceText(manifest,'activity',activity.id)+(activity.startTime?'\nAvailable at '+activity.startTime+'–'+(activity.endTime||'end')+' seconds.':'');if(activity.kind==='quiz'){const choices=activity.choices;choices.slice(page*6,page*6+6).forEach((choice,i)=>add('choice-'+(page*6+i),choice,()=>actions.respond(activity.id,choice)));if(choices.length>6)add('choices','More choices',()=>{page=(page+1)%Math.ceil(choices.length/6);});}else if(['acknowledgement','step'].includes(activity.kind))add('ack','Acknowledge',()=>actions.respond(activity.id,'acknowledged'));else{body+='\nResponse: '+input;add('write','Write response',()=>switchTo('keyboard'));add('submit','Submit response',async()=>{await actions.respond(activity.id,input);input='';},!!input.trim());}if(activity.hint && activity.phase!=='prove')add('hint','Show hint',async()=>{notice=await actions.hint(activity.id);});}
  }else if(tab==='keyboard'){
   body='Response: '+input;alphabet.slice(page*10,page*10+10).split('').forEach((char,i)=>add('key-'+i,char,()=>{if(input.length<2000)input+=char;}));add('space','Space',()=>{if(input.length<2000)input+=' ';});add('delete','Delete',()=>{input=input.slice(0,-1);});add('keys','More keys',()=>{page=(page+1)%Math.ceil(alphabet.length/10);});add('done','Done',()=>switchTo('activity'));
  }else if(tab==='media'){
   const media=state.media;body=media?.description||'No timed media in this scene.';if(media){add('play',media.playing?'Pause':'Play',media.toggle,media.enabled);add('back','Back 5 seconds',()=>media.seek(Math.max(0,media.time-5)),media.enabled);add('forward','Forward 5 seconds',()=>media.seek(Math.min(media.duration,media.time+5)),media.enabled);add('restart','Restart',()=>media.seek(0),media.enabled);}
  }
  if(notice)body=notice+'\n'+body;
  if(body!==lastBody){lastBody=body;textPage=0;}
  const pages=body.match(/[\s\S]{1,220}/g)||[''];textPage=Math.min(textPage,pages.length-1);if(pages.length>1)add('text','Read more '+(textPage+1)+'/'+pages.length,()=>{textPage=(textPage+1)%pages.length;});if(tab!=='menu')add('menu','Menu',()=>switchTo('menu'));
  commands=new Map(buttons.map(b=>[b.id,b]));return {title:'MILZET · '+tab.toUpperCase(),body:pages[textPage],buttons:buttons.map(({id,label,enabled})=>({id,label,enabled})),busy};
 }
 return {snapshot,async activate(id){snapshot();const command=commands.get(id);check(command?.enabled,'This immersive control is unavailable.');busy=true;notice='';try{await command.run();}catch(e){notice=e.message;throw e;}finally{busy=false;}}};
}
