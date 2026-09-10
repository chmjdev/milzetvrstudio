import React, { useState } from 'react';
import { parseVoiceCommand, executeVoiceCommand } from '../Shared/voice-commands.mjs';

export function VoiceAuthoring({ manifest, onApplyManifest, onNavigatePhase, onInspectHotspot, onTriggerAudio, onApplyTemplate }) {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('');

  const parsed = parseVoiceCommand(transcript);

  function toggleListen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('Speech recognition not supported in this environment; use manual input.');
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => { setListening(true); setStatus('Listening for authoring command…'); };
      recognition.onresult = e => {
        const text = e.results[0]?.[0]?.transcript || '';
        setTranscript(text);
        setStatus('Heard: "' + text + '"');
        setListening(false);
      };
      recognition.onerror = e => {
        setStatus('Speech error: ' + e.error);
        setListening(false);
      };
      recognition.onend = () => { setListening(false); };
      recognition.start();
    } catch (e) {
      setStatus('Could not start recognition: ' + e.message);
      setListening(false);
    }
  }

  function handleExecute() {
    if (parsed.intent === 'unknown') {
      setStatus('Cannot execute: ' + parsed.reason);
      return;
    }
    try {
      const res = executeVoiceCommand(manifest, parsed, {
        onNavigatePhase,
        onInspectHotspot,
        onTriggerAudio,
        onApplyTemplate,
        onAddHotspot: (label, x, y) => {
          const updated = executeVoiceCommand(manifest, parsed);
          onApplyManifest(updated);
        }
      });
      if (res && typeof res === 'object' && res.hotspots) {
        onApplyManifest(res);
      }
      setStatus('Executed voice command: ' + parsed.intent);
      setTranscript('');
    } catch (e) {
      setStatus('Execution failed: ' + e.message);
    }
  }

  return (
    <details className="voice-authoring">
      <summary>Voice-driven authoring</summary>
      <p>Speak or enter authoring commands (e.g. "add hotspot PPE Station at center", "set phase shadow", "apply template Workshop").</p>
      <div className="composition-phases">
        <button type="button" className="button secondary" onClick={toggleListen}>
          {listening ? 'Stop listening' : 'Start voice input'}
        </button>
        <button type="button" disabled={!transcript || parsed.intent === 'unknown'} onClick={handleExecute}>
          Execute voice command
        </button>
      </div>
      <label>
        Command transcript
        <input
          aria-label="Voice command input"
          type="text"
          value={transcript}
          placeholder='e.g. add hotspot Edge at top right'
          onChange={e => setTranscript(e.target.value)}
        />
      </label>
      {transcript && (
        <div className="fixture-banner">
          Parsed intent: <strong>{parsed.intent}</strong>
          {parsed.label && <> · Label: {parsed.label} (x: {parsed.x}, y: {parsed.y})</>}
          {parsed.phase && <> · Phase: {parsed.phase}</>}
          {parsed.template && <> · Template: {parsed.template}</>}
          {parsed.query && <> · Target: {parsed.query}</>}
        </div>
      )}
      {status && <p role="status">{status}</p>}
    </details>
  );
}
