import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyLibrary,importSource,validateLibrary,archiveRevision,prepareJob} from '../Shared/library.mjs';
import {createImageScenario} from '../Shared/authoring.mjs';
const png=new Uint8Array([137,80,78,71]);
const provenance={owner:'Test client',credit:'Test author',license:'Client-owned',source:'Local test',capturedAt:'',provider:'',jobId:'',derivedFrom:''};
test('source backup retains originals/provenance and rejects corrupted restore',async()=>{
 const library=await importSource(emptyLibrary(),'test.png','image/png',png,provenance);
 assert.deepEqual(library.assets[0].provenance,provenance);
 assert.deepEqual(await validateLibrary(JSON.parse(JSON.stringify(library))),library);
 await assert.rejects(importSource(library,'duplicate.png','image/png',png,provenance));
 const corrupt=structuredClone(library);corrupt.assets[0].sha256='invalid';await assert.rejects(validateLibrary(corrupt));
 await assert.rejects(importSource(emptyLibrary(),'test.png','image/png',png,{...provenance,owner:''}));
});
test('immutable scenario revisions and generation requests survive backup',async()=>{
 const pkg=await createImageScenario('Saved scene',png,'image/png');
 const library=await archiveRevision(emptyLibrary(),pkg);library.jobs.push(prepareJob('meshy','A test object'));
 assert.equal((await validateLibrary(library)).jobs[0].status,'prepared');
 assert.equal(library.revisions[0].revision,pkg.manifestSha256);
 await assert.rejects(archiveRevision(library,pkg));
 assert.throws(()=>prepareJob('elevenlabs','Test',''));
});
