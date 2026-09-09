import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { trenchFixture } from '../Shared/fixture.mjs';
import { openPackage,sealPackage,sha256,createSession,toBase64,fromBase64 } from '../Shared/package.mjs';
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lZkAAAAASUVORK5CYII=','base64'));
async function reseal(e,m){e.manifest=JSON.stringify(m);e.manifestSha256=await sha256(new TextEncoder().encode(e.manifest));return e;}
const mutations={
 'wav-encoding':async e=>{const file=e.files[1],b=fromBase64(file.base64);b[20]=3;file.base64=toBase64(b);const m=JSON.parse(e.manifest);m.assets[1].sha256=await sha256(b);return reseal(e,m);},
 'version':async e=>{e.formatVersion=99;return e;},
 'manifest-hash':async e=>{e.manifest+=' ';return e;},
 'media-hash':async e=>{e.files[0].base64='AAAA';return e;},
 'extra-file':async e=>{e.files.push(e.files[0]);return e;},
 'unsafe-path':async e=>{const m=JSON.parse(e.manifest);m.assets[0].path='../plate.png';return reseal(e,m);},
 'phase-cycle':async e=>{const m=JSON.parse(e.manifest);m.phases[1].next='induct';return reseal(e,m);},
 'unknown-field':async e=>{const m=JSON.parse(e.manifest);m.script='execute';return reseal(e,m);},
 'missing-hotspot':async e=>{const m=JSON.parse(e.manifest);m.phases[0].hotspotIds=['missing'];return reseal(e,m);},
 'projection':async e=>{const m=JSON.parse(e.manifest);m.plate.projection='360';return reseal(e,m);}
};
test('portable package retains media and explicit authored subset',async()=>{const e=await trenchFixture(png);const opened=await openPackage(JSON.stringify(e));assert.equal(opened.bytes.size,2);assert.equal(opened.manifest.hotspots.length,4);assert.deepEqual(opened.manifest.phases.map(p=>p.id),['induct','prove']);await mkdir('Artifacts/contracts',{recursive:true});await writeFile('Artifacts/contracts/valid-trench.json',JSON.stringify(e));});
for(const [name,mutate] of Object.entries(mutations))test('reject '+name,async()=>{const e=await mutate(await trenchFixture(png));await assert.rejects(openPackage(JSON.stringify(e)));await mkdir('Artifacts/contracts',{recursive:true});await writeFile('Artifacts/contracts/invalid-'+name+'.json',JSON.stringify(e));});
test('host gate and terminal completion prevent bypass and duplicates',async()=>{const e=await trenchFixture(png);const m=JSON.parse(e.manifest);const events=[];let grant=false;const s=createSession(m,e.manifestSha256,{sessionId:'test',emit:e=>events.push(e),authorize:async()=>grant});await assert.rejects(s.advance());for(const h of m.hotspots)s.select(h.id);await assert.rejects(s.advance(),/Host release/);assert.equal(s.phase,'induct');grant=true;await s.advance();s.select('point-4');await s.advance();assert.equal(s.complete,true);await assert.rejects(s.advance());assert.equal(events.filter(e=>e.type==='scenario.completed').length,1);assert.ok(events.some(e=>e.type==='evidence.requested'));assert.ok(events.every(e=>e.revision===e.manifestSha256 || e.revision.length===64));assert.equal(new Set(events.map(e=>e.eventId)).size,events.length);});
test('concurrent host release cannot advance twice',async()=>{const e=await trenchFixture(png);const m=JSON.parse(e.manifest);let release;const events=[];const s=createSession(m,e.manifestSha256,{sessionId:'race',emit:e=>events.push(e),authorize:()=>new Promise(resolve=>{release=resolve;})});for(const h of m.hotspots)s.select(h.id);const pending=s.advance();await assert.rejects(s.advance(),/progress/);release(true);await pending;assert.equal(events.filter(e=>e.type==='phase.completed').length,1);});
test('large embedded assets decode without regex stack overflow and reject malformed padding',()=>{
 const bytes=Uint8Array.from({length:6000000},(_,i)=>i%251);
 assert.deepEqual(fromBase64(toBase64(bytes)),bytes);
 for(const invalid of ['A===','AA=A','=AAA','AAA','AAAA\n','!!!!',null])assert.throws(()=>fromBase64(invalid),/Invalid asset encoding/);
 for(const value of ['','AA==','AAA=','AAAA'])assert.equal(fromBase64(value).length,Buffer.from(value,'base64').length);
});
