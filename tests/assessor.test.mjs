import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRubric, evaluateAttempt } from '../Shared/assessor.mjs';

const sampleRubric = {
  id: 'trench-safety-rubric',
  title: 'Trench & Excavation Safety Rubric',
  passThreshold: 80,
  criteria: [
    {
      id: 'crit-ppe',
      label: 'Inspect PPE station',
      weight: 30,
      requiredHotspots: ['point-1'],
      minEvidenceCount: 0,
      maxHints: 0
    },
    {
      id: 'crit-edge',
      label: 'Identify excavation edge hazard',
      weight: 30,
      requiredHotspots: ['point-2'],
      minEvidenceCount: 0
    },
    {
      id: 'crit-permit',
      label: 'Verify permit board and submit evidence',
      weight: 40,
      requiredHotspots: ['point-4'],
      minEvidenceCount: 1
    }
  ]
};

test('validateRubric validates schema and rejects malformed fields', () => {
  assert.equal(validateRubric(sampleRubric), sampleRubric);
  assert.throws(() => validateRubric(null), /Invalid rubric/);
  assert.throws(() => validateRubric({ ...sampleRubric, id: 'invalid id!' }), /Invalid rubric ID/);
  assert.throws(() => validateRubric({ ...sampleRubric, passThreshold: 150 }), /Invalid pass threshold/);
  assert.throws(() => validateRubric({ ...sampleRubric, criteria: [] }), /Invalid rubric criteria count/);
  assert.throws(() => validateRubric({
    ...sampleRubric,
    criteria: [{ id: 'dup', label: '1', weight: 10 }, { id: 'dup', label: '2', weight: 10 }]
  }), /Invalid criterion ID/);
});

test('evaluateAttempt accurately computes scores, criteria completion and pass status', () => {
  const passingEvents = [
    { type: 'hotspot.selected', hotspotId: 'point-1' },
    { type: 'hotspot.selected', hotspotId: 'point-2' },
    { type: 'hotspot.selected', hotspotId: 'point-4' },
    { type: 'evidence.requested' },
    { type: 'scenario.completed' }
  ];

  const passingResult = evaluateAttempt(sampleRubric, passingEvents);
  assert.equal(passingResult.score, 100);
  assert.equal(passingResult.maxScore, 100);
  assert.equal(passingResult.percentage, 100);
  assert.equal(passingResult.passed, true);
  assert.equal(passingResult.scenarioCompleted, true);
  assert.equal(passingResult.criteriaResults.every(c => c.met), true);

  const missingEvidenceEvents = [
    { type: 'hotspot.selected', hotspotId: 'point-1' },
    { type: 'hotspot.selected', hotspotId: 'point-2' },
    { type: 'hotspot.selected', hotspotId: 'point-4' },
    { type: 'scenario.completed' }
  ];

  const partialResult = evaluateAttempt(sampleRubric, missingEvidenceEvents);
  assert.equal(partialResult.score, 60);
  assert.equal(partialResult.percentage, 60);
  assert.equal(partialResult.passed, false);
  assert.equal(partialResult.criteriaResults[2].met, false);

  const hintExceededEvents = [
    { type: 'hotspot.selected', hotspotId: 'point-1' },
    { type: 'hint.used', activityId: 'act-1' },
    { type: 'activity.responded', activityId: 'act-1' },
    { type: 'scenario.completed' }
  ];
  const rubricWithHintLimit = {
    id: 'hint-test',
    title: 'Hint Limit Rubric',
    passThreshold: 50,
    criteria: [
      {
        id: 'crit-act',
        label: 'Answer without hints',
        weight: 50,
        requiredActivities: ['act-1'],
        maxHints: 0
      }
    ]
  };
  const hintResult = evaluateAttempt(rubricWithHintLimit, hintExceededEvents);
  assert.equal(hintResult.score, 0);
  assert.equal(hintResult.passed, false);
  assert.equal(hintResult.criteriaResults[0].hintsUsed, 1);
});
