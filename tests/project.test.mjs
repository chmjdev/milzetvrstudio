import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProject, parseProject } from '../Shared/project.mjs';
const fresh = () => createProject('Site induction', 'Site', 'test-project');
test('empty draft round trip preserves both targets and four phases', () => { const p = fresh(); assert.deepEqual(parseProject(JSON.stringify(p)),p); assert.deepEqual(p.assets,[]); assert.equal(p.phases.length,4); });
test('reject unsupported version, script fields, populated drafts and malformed phases', () => {
 for(const mutate of [p=>p.schemaVersion=99,p=>p.script='alert(1)',p=>p.assets.push({path:'../secret'}),p=>p.phases[0].steps.push('unsupported'),p=>p.targets=['webxr'],p=>p.scenes=null,p=>p.phases[0]=null]) { const p=fresh();mutate(p);assert.throws(()=>parseProject(JSON.stringify(p))); }
});
test('reject missing title, invalid template, malformed JSON and oversized imports', () => { assert.throws(()=>createProject(' ','Site','x'));assert.throws(()=>createProject('Title','Invalid','x')); assert.throws(()=>parseProject('{'));assert.throws(()=>parseProject(' '.repeat(1000001))); });
