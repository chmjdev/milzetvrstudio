import test from 'node:test';
import assert from 'node:assert/strict';
import {pcmWave} from '../Shared/recording.mjs';
import {validateWave} from '../Shared/package.mjs';
import {emptyContext,validateContext} from '../Shared/context.mjs';
test('recorded audio is compatible PCM and invalid context dates are rejected',()=>{
 const bytes=pcmWave(new Float32Array([0,.5,-.5,2,-2]));const meta=validateWave(bytes);assert.equal(meta.rate,24000);assert.equal(meta.channels,1);
 const context=emptyContext();context.validFrom='2026-02-30';assert.throws(()=>validateContext({context}),/date/);
});
