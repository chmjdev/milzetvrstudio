import test from 'node:test';
import assert from 'node:assert/strict';
import {triangleGlb} from './model-fixture.mjs';
import {createImageScenario,addModel,applyComposition} from '../Shared/authoring.mjs';
import {openPackage} from '../Shared/package.mjs';
test('GLB scene objects preserve transforms and reject invalid hierarchy/version',async()=>{
 const base=await createImageScenario('Model scene',new Uint8Array([137,80,78,71]),'image/png');
 const model=await addModel(base,'Test triangle',triangleGlb());assert.equal(model.formatVersion,4);
 const draft=JSON.parse(model.manifest);draft.objects[0].position=[.25,1.6,-1];draft.objects[0].hotspotId='point-1';
 const result=await applyComposition(model,draft);assert.deepEqual((await openPackage(JSON.stringify(result))).manifest.objects[0].position,[.25,1.6,-1]);
 await assert.rejects(openPackage(JSON.stringify({...result,formatVersion:3})),/version 4/);
 draft.objects[0].parentId=draft.objects[0].id;await assert.rejects(applyComposition(model,draft),/Cyclic/);
 draft.objects[0].parentId='';draft.objects[0].scale=[0,1,1];await assert.rejects(applyComposition(model,draft),/transform/);
});
