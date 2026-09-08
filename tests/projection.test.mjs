import test from 'node:test';
import assert from 'node:assert/strict';
import {anchor,surface,validateProjection} from '../Shared/projection.mjs';
import {createImageScenario,applyComposition} from '../Shared/authoring.mjs';
import {openPackage} from '../Shared/package.mjs';
function image(width,height){const bytes=new Uint8Array(24);bytes.set([137,80,78,71],0);bytes.set(new TextEncoder().encode('IHDR'),12);const view=new DataView(bytes.buffer);view.setUint32(16,width);view.setUint32(20,height);return bytes;}
test('projection anchors agree on centre, compass directions and vertical coverage',()=>{
 const front=anchor(.5,.5,'equirect360');assert.ok(Math.abs(front[0])<1e-10);assert.equal(front[2],-4.8);
 assert.ok(anchor(.75,.5,'equirect360')[0]>4.79);
 assert.ok(anchor(0,.5,'equirect360')[2]>4.79);
 assert.ok(Math.abs(anchor(0,.5,'equirect180')[2])<1e-10);
 assert.ok(anchor(.5,0,'equirect180')[1]>6.29);
 const mesh=surface('equirect180');assert.equal(mesh.positions.length,97*49*3);assert.ok(mesh.positions.every(Number.isFinite));
 for(let i=2;i<mesh.positions.length;i+=3)assert.ok(mesh.positions[i]<=1e-10);
});
test('immersive package is versioned, enforces source aspect and preserves anchors',async()=>{
 for(const projection of ['equirect180','equirect360']){
  const base=await createImageScenario('Panorama',image(projection==='equirect180'?512:1024,512),'image/png');
  const draft=JSON.parse(base.manifest);draft.plate.projection=projection;
  const result=await applyComposition(base,draft);assert.equal(result.formatVersion,2);
  assert.equal((await openPackage(JSON.stringify(result))).manifest.plate.projection,projection);
  await assert.rejects(openPackage(JSON.stringify({...result,formatVersion:1})),/version 2/);
 }
 assert.throws(()=>validateProjection(image(800,400),'image/png','equirect180'));
 assert.throws(()=>validateProjection(image(20000,10000),'image/png','equirect360'));
});
