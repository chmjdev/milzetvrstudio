import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageScenario,applyComposition} from '../Shared/authoring.mjs';
import {createSession,openPackage} from '../Shared/package.mjs';
import {activityResponse} from '../Shared/activities.mjs';
const activity={id:'a',phase:'induct',kind:'acknowledgement',prompt:'Confirm the authored prompt',choices:[],hint:'Read the source reference',maxHints:1,startTime:0,endTime:0,citation:'Client source page 1'};
test('activity order, hint budgets and response events preserve host boundary',async()=>{
 const base=await createImageScenario('Tasks',new Uint8Array([137,80,78,71]),'image/png');const draft=JSON.parse(base.manifest);draft.activities=[activity,{...activity,id:'b',kind:'quiz',choices:['A','B'],hint:'',maxHints:0}];
 const pkg=await applyComposition(base,draft);assert.equal(pkg.formatVersion,5);await assert.rejects(openPackage(JSON.stringify({...pkg,formatVersion:4})),/version 5/);
 const events=[];const session=createSession(JSON.parse(pkg.manifest),pkg.manifestSha256,{sessionId:'task-test',emit:e=>events.push(e),authorize:async()=>true});session.select('point-1');await assert.rejects(session.advance(),/activity/);
 assert.throws(()=>session.respond('b','A'),/order/);assert.equal(session.hint('a'),activity.hint);assert.throws(()=>session.hint('a'),/hint/);session.respond('a','acknowledged');session.respond('b','B');await session.advance();assert.equal(session.complete,true);
 assert.equal(events.find(e=>e.type==='activity.responded' && e.activityId==='b').response,'B');assert.ok(!events.some(e=>'score' in e));
 draft.phases=[{id:'prove',hotspotIds:['point-1'],next:'',gate:'none'}];draft.activities=[{...activity,phase:'prove'}];await assert.rejects(applyComposition(base,draft),/Prove/);
});
test('clip activity windows reject early/late responses',()=>{
 const m={activities:[{...activity,startTime:5,endTime:10}]};assert.throws(()=>activityResponse(m,'induct',new Set(),'a','yes',4),/time window/);assert.throws(()=>activityResponse(m,'induct',new Set(),'a','yes',11),/time window/);assert.equal(activityResponse(m,'induct',new Set(),'a','yes',7).id,'a');
});

test('timed still-image activities require a matching bounded demonstration',async()=>{
 const base=await createImageScenario('Still demonstration',new Uint8Array([137,80,78,71]),'image/png'),draft=JSON.parse(base.manifest);draft.activities=[{...activity,startTime:1,endTime:2}];await assert.rejects(applyComposition(base,draft),/clip or a demonstration/);draft.presentation={overlays:[],demonstration:{phase:'induct',duration:3,narrationAssetId:'',path:[],cues:[]}};const result=await applyComposition(base,draft);assert.equal(result.formatVersion,8);draft.activities[0].endTime=4;await assert.rejects(applyComposition(base,draft),/duration/);
});
