import test from 'node:test';
import assert from 'node:assert/strict';
import { createImageScenario, applyComposition, addNarration, newHotspot } from '../Shared/authoring.mjs';
import { openPackage } from '../Shared/package.mjs';
import { testWave } from '../Shared/fixture.mjs';
const png = Uint8Array.from([137,80,78,71,13,10,26,10]);
test('author image scenario, add narration and compile four authored phases', async () => {
 const initial = await createImageScenario('  Local scene  ',png,'image/png');
 assert.equal(JSON.parse(initial.manifest).fixture,false);
 const voiced = await addNarration(initial,testWave());
 const {manifest} = await openPackage(JSON.stringify(voiced));
 const narration = manifest.assets.find(a=>a.mime==='audio/wav');
 manifest.hotspots = Array.from({length:4},(_,i)=>({...newHotspot('point-'+(i+1),i/4,.2),label:'Authored '+i,narrationAssetId:narration.id,evidence:i===3}));
 manifest.phases = ['induct','shadow','perform','prove'].map((id,i,list)=>({id,hotspotIds:[manifest.hotspots[i].id],next:list[i+1]||'',gate:i<3?'host':'none'}));
 const result=await applyComposition(voiced,manifest);
 const reopened=await openPackage(JSON.stringify(result));
 assert.deepEqual(reopened.manifest.hotspots,manifest.hotspots);
 assert.deepEqual(reopened.manifest.phases,manifest.phases);
 assert.deepEqual(result.files,voiced.files);
 assert.equal(JSON.parse(initial.manifest).hotspots.length,1);
 assert.notEqual(result.manifestSha256,initial.manifestSha256);
});
test('invalid composition and audio leave the prior envelope intact',async()=>{
 const original=await createImageScenario('Local scene',png,'image/png');
 const backup=JSON.stringify(original);
 for(const mutate of [m=>m.hotspots[0].x=2,m=>m.phases[0].hotspotIds=[],m=>m.hotspots=[],m=>m.title='']){
  const draft=JSON.parse(original.manifest);mutate(draft);
  await assert.rejects(applyComposition(original,draft));
  assert.equal(JSON.stringify(original),backup);
 }
 await assert.rejects(addNarration(original,new Uint8Array([1,2,3])));
 assert.equal(JSON.stringify(original),backup);
 await assert.rejects(createImageScenario('Video',png,'video/mp4'));
});
