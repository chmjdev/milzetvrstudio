import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageScenario,addNarration,addModel} from '../Shared/authoring.mjs';
import {applyTemplate,exportTemplate,suggestedBindings,environmentLayout,validateTemplate} from '../Shared/templates.mjs';
import {environments} from '../Shared/context.mjs';
import {openPackage,sealPackage} from '../Shared/package.mjs';
import {testWave} from '../Shared/fixture.mjs';
import {triangleGlb} from './model-fixture.mjs';
const png=Uint8Array.from([137,80,78,71]);
test('environment recipes create distinct reusable layouts without bundling assets',async()=>{
 const base=await createImageScenario('Onsite plate',png,'image/png'),positions=new Set();
 for(const environment of environments){const template=environmentLayout(environment),result=await openPackage(JSON.stringify(await applyTemplate(base,template,{plate:'plate'})));assert.equal(result.manifest.context.environment,environment);assert.equal(result.manifest.hotspots.length,4);assert.equal(result.manifest.phases.length,4);assert.deepEqual(result.envelope.files,base.files);positions.add(JSON.stringify(result.manifest.hotspots.map(h=>[h.x,h.y])));assert.ok(!JSON.stringify(template).includes('base64'));}
 assert.equal(positions.size,8);
});
test('custom templates rebind media and preserve composition without copying source identity or credits',async()=>{
 let source=await addModel(await addNarration(await createImageScenario('Source',png,'image/png'),testWave()),'Model',triangleGlb());const sourceManifest=JSON.parse(source.manifest);sourceManifest.hotspots[0].narrationAssetId=sourceManifest.assets.find(a=>a.mime==='audio/wav').id;source=await sealPackage(sourceManifest,source.files);
 const template=await exportTemplate(source,'Reusable composition');
 let target=await addModel(await addNarration(await createImageScenario('New client plate',png,'image/png'),testWave()),'New model',triangleGlb());const manifest=JSON.parse(target.manifest),bindings=suggestedBindings(template,manifest),applied=await openPackage(JSON.stringify(await applyTemplate(target,template,bindings)));
 assert.equal(applied.manifest.title,'New client plate');assert.equal(applied.manifest.id,manifest.id);assert.equal(applied.manifest.objects[0].assetId,manifest.objects[0].assetId);assert.equal(applied.manifest.hotspots[0].narrationAssetId,manifest.assets.find(a=>a.mime==='audio/wav').id);assert.deepEqual(applied.envelope.files,target.files);
 const malicious=structuredClone(template);malicious.composition.script='execute';assert.throws(()=>validateTemplate(malicious));
 await assert.rejects(applyTemplate(target,template,{...bindings,[template.composition.objects[0].assetId]:'plate'}),/compatible asset/);
});
