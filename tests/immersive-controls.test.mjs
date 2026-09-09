import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageScenario} from '../Shared/authoring.mjs';
import {createSession} from '../Shared/package.mjs';
import {createImmersiveControls} from '../Shared/immersive-controls.mjs';
test('immersive controls preserve authored inspection, activity order, typed responses and host release',async()=>{
 const envelope=await createImageScenario('Immersive test',new Uint8Array([137,80,78,71]),'image/png'),manifest=JSON.parse(envelope.manifest),events=[];manifest.phases=[{id:'induct',hotspotIds:['point-1'],next:'prove',gate:'host'},{id:'prove',hotspotIds:['point-1'],next:'',gate:'none'}];
 const base={phase:'induct',prompt:'Client prompt',choices:[],hint:'Client hint',maxHints:1,startTime:0,endTime:0,citation:'Client source'};manifest.activities=[{...base,id:'ack',kind:'acknowledgement'},{...base,id:'quiz',kind:'quiz',choices:['Accept','Review']},{...base,id:'note',kind:'observation'}];let granted=false,selected='';const session=createSession(manifest,envelope.manifestSha256,{sessionId:'xr-test',emit:e=>events.push(e),authorize:async()=>granted});
 const model=createImmersiveControls(()=>({manifest,session,selected,previewHost:true,granted}),{select:id=>{session.select(id);selected=id;},advance:()=>session.advance(),respond:(id,response)=>session.respond(id,response),hint:id=>session.hint(id),toggleHost:()=>{granted=!granted;},exit:()=>{},audio:()=>{}});
 await model.activate('inspect');await model.activate('select-point-1');await model.activate('menu');await assert.rejects(model.activate('continue'),/activity/);await model.activate('activity');await model.activate('ack');await model.activate('choice-1');await model.activate('write');await model.activate('key-0');await model.activate('key-1');await model.activate('delete');await model.activate('space');await model.activate('key-2');await model.activate('done');await model.activate('submit');assert.equal(events.find(e=>e.type==='activity.responded' && e.activityId==='note').response,'A C');assert.ok(events.some(e=>e.type==='evidence.requested'));await model.activate('menu');await assert.rejects(model.activate('continue'),/Host release/);await model.activate('host');await model.activate('continue');assert.equal(session.phase,'prove');assert.ok(!model.snapshot().buttons.some(b=>b.id==='hint'));
});
test('immersive controls block duplicate async action dispatch',async()=>{
 let release;const pending=new Promise(resolve=>{release=resolve;}),manifest={title:'Test',phases:[{id:'induct',hotspotIds:[]}],hotspots:[]},session={phase:'induct',complete:false,completedActivities:[]};let count=0;const model=createImmersiveControls(()=>({manifest,session}),{advance:async()=>{count++;await pending;},exit:()=>{}});const run=model.activate('continue');await assert.rejects(model.activate('continue'),/unavailable/);release();await run;assert.equal(count,1);
});

test('immersive reference text stays scoped and remains accessible through pagination',async()=>{
 const envelope=await createImageScenario('References',new Uint8Array([137,80,78,71]),'image/png'),manifest=JSON.parse(envelope.manifest);
 manifest.activities=[{id:'task',phase:'induct',prompt:'Inspect task',kind:'acknowledgement',choices:[],hint:'',maxHints:0,startTime:0,endTime:0,citation:''}];
 manifest.references=['scenario','hotspot','activity'].map((scope,i)=>({id:'r-'+i,scope,targetId:scope==='scenario'?'':scope==='hotspot'?'point-1':'task',occupationRef:'',moduleKind:'KM',moduleRef:'Module '+scope,sourceCitation:'Citation '+scope+' '+('source '.repeat(45))+'END-'+scope}));
 const session=createSession(manifest,envelope.manifestSha256,{sessionId:'references',emit:()=>{},authorize:async()=>true}),model=createImmersiveControls(()=>({manifest,session,selected:'point-1'}),{exit:()=>{}});
 async function text(){let value=model.snapshot().body;for(let i=0;i<5 && !value.includes('END-');i++){await model.activate('text');value+=model.snapshot().body;}return value;}
 assert.match(await text(),/END-scenario/);await model.activate('inspect');const hotspot=await text();assert.match(hotspot,/END-hotspot/);assert.ok(!hotspot.includes('Module activity'));await model.activate('menu');await model.activate('activity');assert.match(await text(),/END-activity/);
});
