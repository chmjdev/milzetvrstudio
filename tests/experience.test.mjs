import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createImageScenario} from '../Shared/authoring.mjs';
import {sha256} from '../Shared/package.mjs';
import {createExperience,openExperience,putExperienceScene,sealExperience,orderExperience,createJourney} from '../Shared/experience.mjs';
const png=Uint8Array.from([137,80,78,71]);
test('multi-scene packages validate every child and preserve order and gates across consumers',async()=>{
 const first=await createImageScenario('First scene',png,'image/png'),second=await createImageScenario('Second scene',png,'image/png');
 const initial=await createExperience('Two scene test',first),combined=await putExperienceScene(initial,second);let loaded=await openExperience(JSON.stringify(combined));loaded.manifest.scenes[0].gate='host';const envelope=await sealExperience(loaded.manifest);loaded=await openExperience(JSON.stringify(envelope));
 const original=JSON.stringify(envelope);await mkdir('Artifacts/experience',{recursive:true});await writeFile('Artifacts/experience/valid.json',original);
 const reversed=await openExperience(JSON.stringify(await orderExperience(envelope,loaded.manifest.scenes.map(s=>s.id).reverse())));assert.equal(reversed.manifest.entryScene,JSON.parse(second.manifest).id);
 await assert.rejects(putExperienceScene(initial,first));
 for(const [name,change] of [['cycle',m=>m.scenes[1].next=m.scenes[0].id],['missing',m=>m.scenes[0].next='missing'],['duplicate',m=>m.scenes[1].id=m.scenes[0].id],['child',m=>{const e=JSON.parse(m.scenes[1].package);e.manifestSha256='0'.repeat(64);m.scenes[1].package=JSON.stringify(e);}],['script',m=>m.scenes[0].script='not allowed']]){
  const m=structuredClone(loaded.manifest);change(m);await assert.rejects(sealExperience(m));const manifest=JSON.stringify(m);await writeFile('Artifacts/experience/invalid-'+name+'.json',JSON.stringify({...envelope,manifest,manifestSha256:await sha256(new TextEncoder().encode(manifest))}));
 }
 assert.equal(JSON.stringify(envelope),original);
});
test('experience progression cannot bypass completion, host release, failed loading or concurrent transitions',async()=>{
 const first=await createImageScenario('First',png,'image/png'),second=await createImageScenario('Second',png,'image/png');let loaded=await openExperience(JSON.stringify(await putExperienceScene(await createExperience('Journey',first),second)));loaded.manifest.scenes[0].gate='host';loaded=await openExperience(JSON.stringify(await sealExperience(loaded.manifest)));
 let granted=false,fail=false,resolveLoad;const events=[],journey=createJourney(loaded,{sessionId:'test',emit:e=>events.push(e),authorize:async()=>granted,load:async()=>{if(fail)throw Error('Load failed');await new Promise(r=>{resolveLoad=r;});}});
 await assert.rejects(journey.advance(false),/Complete/);await assert.rejects(journey.advance(true),/release/);assert.equal(journey.sceneId,loaded.manifest.entryScene);
 granted=true;fail=true;await assert.rejects(journey.advance(true),/Load failed/);assert.equal(journey.sceneId,loaded.manifest.entryScene);assert.equal(events.length,0);
 fail=false;const advancing=journey.advance(true);await Promise.resolve();await assert.rejects(journey.advance(true),/progress/);resolveLoad();await advancing;assert.equal(journey.sceneId,loaded.manifest.scenes[1].id);
 await journey.advance(true);assert.ok(journey.complete);await assert.rejects(journey.advance(true));assert.equal(events.filter(e=>e.type==='experience.completed').length,1);assert.ok(events.every(e=>e.experienceRevision===loaded.envelope.manifestSha256));
});
