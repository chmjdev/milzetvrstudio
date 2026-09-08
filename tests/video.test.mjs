import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageScenario} from '../Shared/authoring.mjs';
import {openPackage} from '../Shared/package.mjs';
test('MP4 requires version 3 and an H.264 track signature',async()=>{
 function box(type,data){const b=new Uint8Array(8+data.length);new DataView(b.buffer).setUint32(0,b.length);b.set(new TextEncoder().encode(type),4);b.set(data,8);return b;}
 const sample=new Uint8Array(78);new DataView(sample.buffer).setUint16(24,640);new DataView(sample.buffer).setUint16(26,320);const entry=box('avc1',sample);const table=new Uint8Array(8+entry.length);table.set(entry,8);const header=box('ftyp',new TextEncoder().encode('isom'));const movie=box('moov',box('stsd',table));const bytes=new Uint8Array(header.length+movie.length);bytes.set(header);bytes.set(movie,header.length);
 const pkg=await createImageScenario('Clip',bytes,'video/mp4');assert.equal(pkg.formatVersion,3);
 await assert.rejects(openPackage(JSON.stringify({...pkg,formatVersion:2})),/version 3/);
 await assert.rejects(createImageScenario('Unsupported',new Uint8Array([0,0,0,12,...new TextEncoder().encode('ftypisom')]),'video/mp4'),/H.264/);
});
