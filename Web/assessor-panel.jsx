import React, { useState } from 'react';
import { evaluateAttempt, validateRubric } from '../Shared/assessor.mjs';

export function AssessorPanel({ events = [] }) {
  const [rubricText, setRubricText] = useState(JSON.stringify({
    id: 'trench-safety-rubric',
    title: 'Trench & Excavation Safety Rubric',
    passThreshold: 80,
    criteria: [
      { id: 'crit-ppe', label: 'Inspect PPE station', weight: 30, requiredHotspots: ['point-1'], minEvidenceCount: 0, maxHints: 0 },
      { id: 'crit-edge', label: 'Identify excavation edge', weight: 30, requiredHotspots: ['point-2'], minEvidenceCount: 0 },
      { id: 'crit-permit', label: 'Verify permit board and evidence', weight: 40, requiredHotspots: ['point-4'], minEvidenceCount: 1 }
    ]
  }, null, 2));
  const [evaluation, setEvaluation] = useState(null);
  const [status, setStatus] = useState('');

  function handleEvaluate() {
    try {
      const parsed = JSON.parse(rubricText);
      validateRubric(parsed);
      const res = evaluateAttempt(parsed, events);
      setEvaluation(res);
      setStatus('Evaluation completed: ' + (res.passed ? 'PASSED' : 'FAILED') + ' (' + res.percentage + '%)');
    } catch (e) {
      setStatus('Evaluation error: ' + e.message);
    }
  }

  function downloadReport() {
    if (!evaluation) return;
    const blob = new Blob([JSON.stringify(evaluation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = evaluation.rubricId + '-evaluation-report.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <details className="assessor-panel">
      <summary>Assessor mode & private rubrics</summary>
      <p>Evaluate worker attempt events against private rubrics offline. Private rubrics are never included in public packages.</p>
      <label>
        Private authoring rubric (JSON)
        <textarea
          aria-label="Private authoring rubric"
          rows={10}
          value={rubricText}
          onChange={e => setRubricText(e.target.value)}
        />
      </label>
      <div className="composition-phases">
        <button type="button" onClick={handleEvaluate}>
          Evaluate current attempt ({events.length} events)
        </button>
        {evaluation && (
          <button type="button" className="button secondary" onClick={downloadReport}>
            Export evaluation report
          </button>
        )}
      </div>
      {evaluation && (
        <div className="fixture-banner">
          <h4>{evaluation.rubricTitle} — {evaluation.passed ? 'PASS' : 'FAIL'}</h4>
          <p>Score: {evaluation.score} / {evaluation.maxScore} ({evaluation.percentage}%) · Scenario completed: {evaluation.scenarioCompleted ? 'Yes' : 'No'}</p>
          <ul>
            {evaluation.criteriaResults.map(c => (
              <li key={c.criterionId}>
                <strong>{c.label}</strong>: {c.met ? 'MET' : 'UNMET'} ({c.score}/{c.maxScore} pts)
                {c.missingHotspots.length > 0 && <> · Missing hotspots: {c.missingHotspots.join(', ')}</>}
                {c.missingActivities.length > 0 && <> · Missing activities: {c.missingActivities.join(', ')}</>}
                {c.hintsUsed > 0 && <> · Hints: {c.hintsUsed}</>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {status && <p role="status">{status}</p>}
    </details>
  );
}
