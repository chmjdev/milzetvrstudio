import test from 'node:test';
import assert from 'node:assert/strict';
import {sealWorkspace,openWorkspace} from '../Shared/workspace.mjs';
import {createProject} from '../Shared/project.mjs';
import {emptyLibrary,importSource,archiveRevision} from '../Shared/library.mjs';
import {createImageScenario} from '../Shared/authoring.mjs';
import {createExperience} from '../Shared/experience.mjs';
import {sha256} from '../Shared/package.mjs';
test('complete authoring backup preserves originals, private notes, scene and experience without changing runtime exports',async()=>{
 const png=new Uint8Array([137,80,78,71]),scene=await createImageScenario('Client scene',png,'image/png'),experience=await createExperience('Client experience',scene),project=createProject('Client project','Site','client-project');let library=await importSource(emptyLibrary(),'Original.png','image/png',png,{owner:'Client',license:'Client owned',credit:'',source:'Onsite',capturedAt:'2026-09-08',provider:'',jobId:'',derivedFrom:''});library=await archiveRevision(library,scene);library.rubrics=[{revision:scene.manifestSha256,title:'Client notes',text:'Private assessment notes'}];const workspace={project,library,scene,experience},envelope=await sealWorkspace(workspace),restored=await openWorkspace(JSON.stringify(envelope));assert.deepEqual(restored,workspace);assert.ok(envelope.data.includes('Private assessment notes'));assert.ok(!JSON.stringify(restored.scene).includes('Private assessment notes'));assert.ok(!JSON.stringify(restored.experience).includes('Private assessment notes'));
 await assert.rejects(openWorkspace(JSON.stringify({...envelope,data:envelope.data+' '})),/checksum/);const invalid=structuredClone(workspace);invalid.experience.manifestSha256='invalid';const data=JSON.stringify(invalid);await assert.rejects(openWorkspace(JSON.stringify({...envelope,data,sha256:await sha256(new TextEncoder().encode(data))})),/checksum/);await assert.rejects(sealWorkspace({...workspace,script:'run'}),/fields/);
});
test('empty authoring workspace is valid and restores explicit empty state',async()=>{const workspace={project:null,library:null,scene:null,experience:null};assert.deepEqual(await openWorkspace(JSON.stringify(await sealWorkspace(workspace))),workspace);});
