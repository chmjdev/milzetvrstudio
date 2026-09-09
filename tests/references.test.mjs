import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createImageScenario,applyComposition} from '../Shared/authoring.mjs';
import {openPackage,sealPackage,sha256} from '../Shared/package.mjs';
import {referenceText,removeTargetReferences} from '../Shared/references.mjs';
test('structured references bind all three target scopes and reject malformed cross-runtime packages',async()=>{
 const initial=await createImageScenario('Reference test',Uint8Array.from([137,80,78,71]),'image/png');
 const m=JSON.parse(initial.manifest);m.activities=[{id:'task-1',phase:'induct',kind:'acknowledgement',prompt:'Inspect site',choices:[],hint:'',maxHints:0,startTime:0,endTime:0,citation:''}];
 m.references=['scenario','hotspot','activity'].map((scope,i)=>({id:'ref-'+i,scope,targetId:scope==='scenario'?'':scope==='hotspot'?m.hotspots[0].id:'task-1',occupationRef:'Occupation 123',moduleKind:['KM','PM','WM'][i],moduleRef:'Module '+i,sourceCitation:'Manual p. '+(i+1)}));
 const e=await applyComposition(initial,m),loaded=await openPackage(JSON.stringify(e));assert.equal(e.formatVersion,9);assert.deepEqual(loaded.manifest.references,m.references);assert.match(referenceText(m,'activity','task-1'),/WM Module 2/);assert.equal(referenceText(m,'hotspot','unknown'),'');
 await mkdir('Artifacts/references',{recursive:true});await writeFile('Artifacts/references/valid.json',JSON.stringify(e));
 const old={...e,formatVersion:8};await assert.rejects(openPackage(JSON.stringify(old)),/version 9/);await writeFile('Artifacts/references/invalid-version.json',JSON.stringify(old));
 for(const [name,mutate] of [['target',m=>m.references[1].targetId='missing'],['scope',m=>m.references[0].scope='task'],['duplicate',m=>m.references[1].id=m.references[0].id],['kind',m=>m.references[0].moduleKind='OTHER'],['empty',m=>Object.assign(m.references[0],{occupationRef:'',moduleKind:'',moduleRef:'',sourceCitation:''})],['module',m=>m.references[0].moduleRef=' '],['extra',m=>m.references[0].script='bad'],['null',m=>m.references=null],['limit',m=>m.references=Array(129).fill(m.references[0])],['scenario-target',m=>m.references[0].targetId=m.id],['text',m=>m.references[0].sourceCitation=123]]){
  const invalid=structuredClone(m);mutate(invalid);await assert.rejects(sealPackage(invalid,e.files));const manifest=JSON.stringify(invalid);await writeFile('Artifacts/references/invalid-'+name+'.json',JSON.stringify({...e,manifest,manifestSha256:await sha256(new TextEncoder().encode(manifest))}));
 }
 removeTargetReferences(m,'hotspot',m.hotspots[0].id);m.hotspots=[{...m.hotspots[0],id:"retained-point"}];m.phases[0].hotspotIds=["retained-point"];assert.equal(m.references.length,2);assert.equal(referenceText(m,'scenario').includes('KM Module 0'),true);
 removeTargetReferences(m,'activity','task-1');m.activities=[];await sealPackage(m,e.files);m.references=[];const cleared=await applyComposition(e,m);assert.deepEqual(JSON.parse(cleared.manifest).references,[]);assert.equal((await openPackage(JSON.stringify(initial))).envelope.formatVersion,1);
});

test('reference templates preserve valid bindings and replace old scene bindings atomically',async()=>{
 const {exportTemplate,applyTemplate,environmentLayout,validateTemplate}=await import('../Shared/templates.mjs');
 const initial=await createImageScenario('Template references',Uint8Array.from([137,80,78,71]),'image/png'),m=JSON.parse(initial.manifest);
 m.references=[{id:'ref-template',scope:'hotspot',targetId:m.hotspots[0].id,occupationRef:'Occupation',moduleKind:'KM',moduleRef:'Module',sourceCitation:'Page'}];const source=await sealPackage(m,initial.files),template=await exportTemplate(source,'Reference template');assert.equal(template.formatVersion,2);assert.throws(()=>validateTemplate({...template,formatVersion:1}),/version 2/);
 const applied=await applyTemplate(initial,template,{plate:'plate'});assert.deepEqual(JSON.parse(applied.manifest).references,m.references);
 const reset=await applyTemplate(applied,environmentLayout('Office'),{plate:'plate'});assert.equal(JSON.parse(reset.manifest).references,undefined);
});
