import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVoiceCommand, executeVoiceCommand } from '../Shared/voice-commands.mjs';
import { trenchFixture } from '../Shared/fixture.mjs';

const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lZkAAAAASUVORK5CYII=','base64'));

test('parseVoiceCommand recognizes navigation and phase intents', () => {
  assert.deepEqual(parseVoiceCommand('next phase'), { intent: 'next_phase', raw: 'next phase' });
  assert.deepEqual(parseVoiceCommand('advance phase'), { intent: 'next_phase', raw: 'advance phase' });
  assert.deepEqual(parseVoiceCommand('set phase shadow'), { intent: 'navigate_phase', phase: 'shadow', raw: 'set phase shadow' });
  assert.deepEqual(parseVoiceCommand('switch to perform'), { intent: 'navigate_phase', phase: 'perform', raw: 'switch to perform' });
  assert.deepEqual(parseVoiceCommand('go to prove'), { intent: 'navigate_phase', phase: 'prove', raw: 'go to prove' });
});

test('parseVoiceCommand recognizes template application', () => {
  assert.deepEqual(parseVoiceCommand('apply template Workshop'), { intent: 'apply_template', template: 'Workshop', raw: 'apply template Workshop' });
  assert.deepEqual(parseVoiceCommand('use template Plant'), { intent: 'apply_template', template: 'Plant', raw: 'use template Plant' });
  assert.deepEqual(parseVoiceCommand('set template site'), { intent: 'apply_template', template: 'Site', raw: 'set template site' });
});

test('parseVoiceCommand parses hotspot addition with spatial coordinates', () => {
  assert.deepEqual(parseVoiceCommand('add hotspot First Aid Kit at center'), {
    intent: 'add_hotspot',
    label: 'First Aid Kit',
    x: 0.5,
    y: 0.5,
    raw: 'add hotspot First Aid Kit at center'
  });
  assert.deepEqual(parseVoiceCommand('create hotspot Emergency Exit at top right'), {
    intent: 'add_hotspot',
    label: 'Emergency Exit',
    x: 0.8,
    y: 0.2,
    raw: 'create hotspot Emergency Exit at top right'
  });
  assert.deepEqual(parseVoiceCommand('new marker Trench Hazard at bottom left'), {
    intent: 'add_hotspot',
    label: 'Trench Hazard',
    x: 0.2,
    y: 0.8,
    raw: 'new marker Trench Hazard at bottom left'
  });
});

test('parseVoiceCommand handles inspect and audio controls', () => {
  assert.deepEqual(parseVoiceCommand('inspect PPE Station'), { intent: 'inspect_hotspot', query: 'PPE Station', raw: 'inspect PPE Station' });
  assert.deepEqual(parseVoiceCommand('select Permit Board'), { intent: 'inspect_hotspot', query: 'Permit Board', raw: 'select Permit Board' });
  assert.deepEqual(parseVoiceCommand('play audio'), { intent: 'trigger_audio', action: 'play', raw: 'play audio' });
  assert.deepEqual(parseVoiceCommand('read prompt aloud'), { intent: 'trigger_audio', action: 'read', raw: 'read prompt aloud' });
  assert.deepEqual(parseVoiceCommand('stop audio'), { intent: 'trigger_audio', action: 'stop', raw: 'stop audio' });
});

test('parseVoiceCommand rejects invalid or unrecognized commands', () => {
  assert.equal(parseVoiceCommand('').intent, 'unknown');
  assert.equal(parseVoiceCommand('random babble 123').intent, 'unknown');
  assert.equal(parseVoiceCommand('set phase invalid_phase').intent, 'unknown');
});

test('executeVoiceCommand dispatches callbacks and updates manifest', async () => {
  const e = await trenchFixture(png);
  const m = JSON.parse(e.manifest);

  let navigated = '';
  executeVoiceCommand(m, { intent: 'navigate_phase', phase: 'prove' }, {
    onNavigatePhase: p => { navigated = p; }
  });
  assert.equal(navigated, 'prove');

  let inspected = '';
  executeVoiceCommand(m, { intent: 'inspect_hotspot', query: 'PPE station' }, {
    onInspectHotspot: id => { inspected = id; }
  });
  assert.equal(inspected, 'point-1');

  const updated = executeVoiceCommand(m, { intent: 'add_hotspot', label: 'Gas detector', x: 0.3, y: 0.4 });
  assert.equal(updated.hotspots.length, 5);
  assert.equal(updated.hotspots[4].label, 'Gas detector');
  assert.ok(updated.phases[0].hotspotIds.includes(updated.hotspots[4].id));
});
