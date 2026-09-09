import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createImageScenario} from '../Shared/authoring.mjs';
import {emptyLibrary,importSource} from '../Shared/library.mjs';
import {attachLibraryProvenance} from '../Shared/provenance.mjs';
import {openPackage,replaceAsset,sealPackage,sha256} from '../Shared/package.mjs';
const png=Uint8Array.from([137,80,78,71]);
test('runtime export binds public credits to bytes and excludes private authoring material',async()=>{
 const initial=await createImageScenario('Client source',png,'image/png');
 const library=await importSource(emptyLibrary(),'source.png','image/png',png,{owner:'Test owner',license:'Client-owned',credit:'Test photographer',source:'Onsite reference',capturedAt:'2026-09-08',provider:'',jobId:'',derivedFrom:''});
 library.rubrics.push({revision:initial.manifestSha256,title:'Private',text:'PRIVATE ANSWER KEY'});
 const envelope=await attachLibraryProvenance(initial,library),loaded=await openPackage(JSON.stringify(envelope));
 assert.equal(envelope.formatVersion,7);assert.equal(loaded.manifest.provenance[0].sha256,loaded.manifest.assets[0].sha256);assert.equal(loaded.manifest.provenance[0].owner,'Test owner');assert.ok(!JSON.stringify(envelope).includes('PRIVATE ANSWER KEY'));
 await mkdir('Artifacts/provenance',{recursive:true});await writeFile('Artifacts/provenance/valid.json',JSON.stringify(envelope));
 const old={...envelope,formatVersion:6};await assert.rejects(openPackage(JSON.stringify(old)),/version 7/);await writeFile('Artifacts/provenance/invalid-version.json',JSON.stringify(old));
 for(const [name,mutate] of [['hash',m=>m.provenance[0].sha256='0'.repeat(64)],['date',m=>m.provenance[0].capturedAt='2026-02-30'],['script',m=>m.provenance[0].script='unexpected']]){
  const m=structuredClone(loaded.manifest);mutate(m);await assert.rejects(sealPackage(m,envelope.files));
  const manifest=JSON.stringify(m);await writeFile('Artifacts/provenance/invalid-'+name+'.json',JSON.stringify({...envelope,manifest,manifestSha256:await sha256(new TextEncoder().encode(manifest))}));
 }
 const replaced=await replaceAsset(envelope,'plate',Uint8Array.from([137,80,78,71,1]),'image/png');assert.deepEqual(JSON.parse(replaced.manifest).provenance,[]);
 assert.equal(JSON.parse(envelope.manifest).provenance.length,1);
});
