const SPATIAL_POSITIONS = {
  'center': { x: 0.5, y: 0.5 },
  'centre': { x: 0.5, y: 0.5 },
  'middle': { x: 0.5, y: 0.5 },
  'top': { x: 0.5, y: 0.2 },
  'bottom': { x: 0.5, y: 0.8 },
  'left': { x: 0.2, y: 0.5 },
  'right': { x: 0.8, y: 0.5 },
  'top left': { x: 0.2, y: 0.2 },
  'top right': { x: 0.8, y: 0.2 },
  'bottom left': { x: 0.2, y: 0.8 },
  'bottom right': { x: 0.8, y: 0.8 }
};

const PHASES = ['induct', 'shadow', 'perform', 'prove'];
const TEMPLATES = ['Site', 'Plant', 'Workshop', 'Field', 'Studio', 'Office', 'Clinic', 'Community'];

export function parseVoiceCommand(transcript) {
  if (typeof transcript !== 'string') return { intent: 'unknown', reason: 'Invalid input.', raw: '' };
  const text = transcript.trim();
  const lower = text.toLowerCase();
  if (!lower) return { intent: 'unknown', reason: 'Empty command.', raw: '' };

  if (/^(next phase|continue phase|advance phase|proceed)$/i.test(lower)) {
    return { intent: 'next_phase', raw: text };
  }

  const phaseMatch = lower.match(/^(?:set phase|switch to|go to|phase)\s+(induct|shadow|perform|prove)$/i);
  if (phaseMatch) {
    return { intent: 'navigate_phase', phase: phaseMatch[1].toLowerCase(), raw: text };
  }

  const templateMatch = lower.match(/^(?:apply template|use template|set template)\s+(site|plant|workshop|field|studio|office|clinic|community)$/i);
  if (templateMatch) {
    const name = TEMPLATES.find(t => t.toLowerCase() === templateMatch[1].toLowerCase()) || 'Site';
    return { intent: 'apply_template', template: name, raw: text };
  }

  const audioMatch = lower.match(/^(play audio|read prompt aloud|read prompt|stop audio)$/i);
  if (audioMatch) {
    const action = lower.startsWith('play') ? 'play' : lower.startsWith('read') ? 'read' : 'stop';
    return { intent: 'trigger_audio', action, raw: text };
  }

  const inspectMatch = text.match(/^(?:inspect|select|open)\s+(.+)$/i);
  if (inspectMatch && !inspectMatch[1].toLowerCase().startsWith('phase') && !inspectMatch[1].toLowerCase().startsWith('template')) {
    return { intent: 'inspect_hotspot', query: inspectMatch[1].trim(), raw: text };
  }

  const addMatch = text.match(/^(?:add hotspot|create hotspot|new marker)\s+(.+?)(?:\s+(?:at|in)\s+(top left|top right|bottom left|bottom right|center|centre|middle|top|bottom|left|right))?$/i);
  if (addMatch) {
    const label = addMatch[1].trim();
    if (!label) return { intent: 'unknown', reason: 'Missing hotspot label.', raw: text };
    const posKey = (addMatch[2] || 'center').toLowerCase();
    const pos = SPATIAL_POSITIONS[posKey] || { x: 0.5, y: 0.5 };
    return { intent: 'add_hotspot', label, x: pos.x, y: pos.y, raw: text };
  }

  return { intent: 'unknown', reason: 'Unrecognized voice command.', raw: text };
}

export function executeVoiceCommand(manifest, command, callbacks = {}) {
  if (!manifest || !command) throw Error('Manifest and command required.');
  switch (command.intent) {
    case 'next_phase':
      if (typeof callbacks.onNextPhase === 'function') return callbacks.onNextPhase();
      return false;
    case 'navigate_phase':
      if (typeof callbacks.onNavigatePhase === 'function') return callbacks.onNavigatePhase(command.phase);
      return false;
    case 'apply_template':
      if (typeof callbacks.onApplyTemplate === 'function') return callbacks.onApplyTemplate(command.template);
      return false;
    case 'inspect_hotspot': {
      const q = command.query.toLowerCase();
      const match = manifest.hotspots.find(h => h.label.toLowerCase().includes(q) || h.id.toLowerCase() === q);
      if (match && typeof callbacks.onInspectHotspot === 'function') return callbacks.onInspectHotspot(match.id);
      return false;
    }
    case 'trigger_audio':
      if (typeof callbacks.onTriggerAudio === 'function') return callbacks.onTriggerAudio(command.action);
      return false;
    case 'add_hotspot': {
      if (typeof callbacks.onAddHotspot === 'function') return callbacks.onAddHotspot(command.label, command.x, command.y);
      const nextId = 'point-' + (manifest.hotspots.length + 1);
      const updated = structuredClone(manifest);
      updated.hotspots.push({
        id: nextId,
        label: command.label,
        text: 'Authored via voice command: ' + command.label,
        x: command.x,
        y: command.y,
        narrationAssetId: '',
        evidence: false
      });
      const activePhase = updated.phases.find(p => p.id === updated.entryPhase);
      if (activePhase && !activePhase.hotspotIds.includes(nextId)) activePhase.hotspotIds.push(nextId);
      return updated;
    }
    default:
      throw Error(command.reason || 'Cannot execute command.');
  }
}
