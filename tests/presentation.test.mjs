import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createImageScenario} from '../Shared/authoring.mjs';
import {openPackage,sealPackage,sha256} from '../Shared/package.mjs';
import {createPlayback,presentationFrame} from '../Shared/presentation.mjs';
import {exportTemplate,applyTemplate} from '../Shared/templates.mjs';
const png=Uint8Array.from([137,80,78,71]);
const presentation={overlays:[{id:'reference',kind:'sop',text:'Client supplied reference',imageAssetId:'plate',position:[0,1.8,-1.6],rotation:[0,0,0],size:[1.2,.5],phase:'induct',startTime:.5,endTime:2,citation:'Client document section 2'}],demonstration:{phase:'induct',duration:4,narrationAssetId:'',path:[{time:0,position:[-1,1.5,-1]},{time:4,position:[1,1.5,-1]}],cues:[{id:'first',time:0,hotspotId:'point-1',text:'Inspect',pause:true},{id:'pause',time:1,hotspotId:'point-1',text:'Review the reference',pause:true}]}};
test('presentation round trips in portable packages and media-rebound templates',async()=>{
 const base=await createImageScenario('Presentation test',png,'image/png'),m=JSON.parse(base.manifest);m.presentation=structuredClone(presentation);const envelope=await sealPackage(m,base.files);assert.equal(envelope.formatVersion,8);assert.deepEqual((await openPackage(JSON.stringify(envelope))).manifest.presentation,presentation);
 const template=await exportTemplate(envelope,'Overlay template'),target=await createImageScenario('Client target',png,'image/png');assert.deepEqual(JSON.parse((await applyTemplate(target,template,{plate:'plate'})).manifest).presentation,presentation);
 await mkdir('Artifacts/presentation',{recursive:true});await writeFile('Artifacts/presentation/valid.json',JSON.stringify(envelope));
 for(const [name,mutate] of Object.entries({script:m=>m.presentation.script='run',image:m=>m.presentation.overlays[0].imageAssetId='missing',phase:m=>m.presentation.overlays[0].phase='prove',order:m=>m.presentation.demonstration.cues[1].time=0,path:m=>m.presentation.demonstration.path[1].time=0,window:m=>m.presentation.overlays[0].endTime=9,hotspot:m=>m.presentation.demonstration.cues[1].hotspotId='missing',vector:m=>m.presentation.overlays[0].position=[0,1],timeline:m=>m.presentation.demonstration=null})){
  const manifest=structuredClone(m);mutate(manifest);const invalid={...envelope,manifest:JSON.stringify(manifest)};invalid.manifestSha256=await sha256(new TextEncoder().encode(invalid.manifest));await assert.rejects(openPackage(JSON.stringify(invalid)));await writeFile('Artifacts/presentation/invalid-'+name+'.json',JSON.stringify(invalid));
 }
 const old={...envelope,formatVersion:7};await assert.rejects(openPackage(JSON.stringify(old)),/version 8/);await writeFile('Artifacts/presentation/invalid-version.json',JSON.stringify(old));
});
test('demonstration pauses exactly at crossed cues, resumes once, interpolates and resets when seeking',()=>{
 const d=presentation.demonstration,p=createPlayback(d);p.play();assert.equal(p.tick(.5).cue.id,'first');assert.equal(p.time,0);assert.equal(p.playing,false);p.play();assert.equal(p.tick(3).cue.id,'pause');assert.equal(p.time,1);p.play();p.tick(.5);assert.equal(p.time,1.5);assert.deepEqual(presentationFrame(presentation,'induct',1).position,[-.5,1.5,-1]);assert.equal(presentationFrame(presentation,'induct',1).overlays.length,1);assert.equal(presentationFrame(presentation,'prove',1).cue,null);assert.equal(presentationFrame(presentation,'induct',3).overlays.length,0);p.seek(.5);p.play();assert.equal(p.tick(2).cue.id,'pause');p.play();p.tick(5);assert.equal(p.time,4);assert.equal(p.playing,false);p.play();assert.equal(p.time,0);assert.equal(p.tick(.1).cue.id,'first');assert.throws(()=>p.seek(5));
});
