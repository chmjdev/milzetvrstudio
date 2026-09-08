import React, { useEffect, useState } from 'react';
import { ContextEditor } from './context-editor';
import { ActivityEditor } from './activity-editor';
import { applyComposition, newHotspot } from '../Shared/authoring.mjs';

export function Composer({ loaded, busy, apply }) {
  const [draft, setDraft] = useState(() => structuredClone(loaded.manifest));
  const [chosen, setChosen] = useState(loaded.manifest.hotspots[0].id);
  const [url, setUrl] = useState('');
  const [dirty, setDirty] = useState(false);
  const hotspot = draft.hotspots.find(h => h.id === chosen);
  useEffect(() => {
    const asset = loaded.manifest.assets.find(a => a.id === loaded.manifest.plate.assetId);
    const next = URL.createObjectURL(new Blob([loaded.bytes.get(asset.id)], { type: asset.mime }));
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [loaded]);
  useEffect(() => {
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function edit(work) { setDraft(previous => { const next = structuredClone(previous); work(next); return next; }); setDirty(true); }
  function changeHotspot(fields) { edit(m => Object.assign(m.hotspots.find(h => h.id === chosen), fields)); }
  function add() {
    const id = 'point-' + crypto.randomUUID();
    edit(m => { m.hotspots.push(newHotspot(id)); m.phases[0].hotspotIds.push(id); }); setChosen(id);
  }
  function remove() {
    edit(m => { m.hotspots = m.hotspots.filter(h => h.id !== chosen); for (const p of m.phases) p.hotspotIds = p.hotspotIds.filter(id => id !== chosen); });
    setChosen(draft.hotspots.find(h => h.id !== chosen)?.id);
  }
  function phaseEnabled(id, enabled) {
    edit(m => {
      if (enabled) m.phases.push({ id, hotspotIds: m.hotspots.map(h => h.id), next: '', gate: 'none' });
      else m.phases = m.phases.filter(p => p.id !== id);
      m.phases.sort((a, b) => ['induct', 'shadow', 'perform', 'prove'].indexOf(a.id) - ['induct', 'shadow', 'perform', 'prove'].indexOf(b.id));
      m.phases.forEach((p, i) => { p.next = m.phases[i + 1]?.id || ''; if (!p.next) p.gate = 'none'; });
    });
  }
  return <details className="composer" open><summary>Compose scenario</summary><p>{dirty ? 'Unapplied changes: apply to update the preview, recovery copy and export.' : 'Select a hotspot, then click the image to place it. Apply changes before exporting.'}</p>
    <fieldset disabled={busy}>
      <label>Scenario title<input value={draft.title} maxLength={120} onChange={e => edit(m => { m.title = e.target.value; })}/></label>
      <label>Source projection<select aria-label="Source projection" value={draft.plate.projection} onChange={e=>edit(m=>{m.plate.projection=e.target.value;})}><option value="flat">Flat photo</option><option value="equirect180">180° mono equirectangular (1:1)</option><option value="equirect360">360° mono equirectangular (2:1)</option></select></label><p>Choose the actual source projection. An ordinary photo or phone panorama does not contain full spherical coverage. Unsupported stereo/fisheye sources need conversion before import.</p><div className="editor">
        <div><div className="composition-plate" onClick={e => { if (!hotspot) return; const r = e.currentTarget.getBoundingClientRect(); changeHotspot({ x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) }); }}>
          {loaded.manifest.assets.find(a=>a.id===loaded.manifest.plate.assetId).mime==='video/mp4'?<video src={url || undefined} controls muted preload="metadata" aria-label="Scenario placement video"/>:<img src={url || undefined} alt="Scenario placement image"/>}
          {draft.hotspots.map((h, i) => <button type="button" key={h.id} aria-label={'Edit hotspot ' + (i + 1)} aria-pressed={chosen === h.id} style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }} onClick={e => { e.stopPropagation(); setChosen(h.id); }}>{i + 1}</button>)}
        </div><div className="package-actions"><button disabled={draft.hotspots.length >= 32} onClick={add}>Add hotspot</button><button disabled={draft.hotspots.length <= 1} onClick={remove}>Delete selected hotspot</button></div></div>
        {hotspot && <div className="inspector composition-fields">
          <label>Selected hotspot<select aria-label="Selected hotspot" value={chosen} onChange={e => setChosen(e.target.value)}>{draft.hotspots.map((h, i) => <option key={h.id} value={h.id}>{i + 1}. {h.label}</option>)}</select></label>
          <label>Hotspot label<input value={hotspot.label} maxLength={80} onChange={e => changeHotspot({ label: e.target.value })}/></label>
          <label>Prompt or overlay text<textarea value={hotspot.text} maxLength={2000} rows={4} onChange={e => changeHotspot({ text: e.target.value })}/></label>
          <label>Horizontal position<input type="number" min="0" max="1" step="0.01" value={hotspot.x} onChange={e => changeHotspot({ x: e.target.value === '' ? '' : Number(e.target.value) })}/></label>
          <label>Vertical position<input type="number" min="0" max="1" step="0.01" value={hotspot.y} onChange={e => changeHotspot({ y: e.target.value === '' ? '' : Number(e.target.value) })}/></label>
          <label>Narration asset<select aria-label="Narration asset" value={hotspot.narrationAssetId} onChange={e => changeHotspot({ narrationAssetId: e.target.value })}><option value="">No narration</option>{draft.assets.filter(a => a.mime === 'audio/wav').map(a => <option key={a.id} value={a.id}>{a.id}</option>)}</select></label>
          <label className="check-row"><input type="checkbox" checked={hotspot.evidence} onChange={e => changeHotspot({ evidence: e.target.checked })}/>Request evidence from host</label>
        </div>}
      </div>
      <h3>3D objects</h3><p>Transforms use metres and degrees; forward is −Z. Group objects by choosing a parent. Link a model to a hotspot for inspection.</p>{(draft.objects||[]).map(o=><details key={o.id}><summary>{o.label}</summary><label>Object name<input aria-label={'Object name '+o.id} value={o.label} maxLength={80} onChange={e=>edit(m=>{m.objects.find(x=>x.id===o.id).label=e.target.value;})}/></label><div className="composition-phases">{['position','rotation','scale'].map(key=><div key={key}><strong>{key}</strong>{['X','Y','Z'].map((axis,i)=><label key={axis}>{axis}<input aria-label={o.label+' '+key+' '+axis} type="number" step="0.1" value={o[key][i]} onChange={e=>edit(m=>{m.objects.find(x=>x.id===o.id)[key][i]=e.target.value===''?'':Number(e.target.value);})}/></label>)}</div>)}</div><label className="check-row"><input type="checkbox" aria-label={'Visible '+o.label} checked={o.visible} onChange={e=>edit(m=>{m.objects.find(x=>x.id===o.id).visible=e.target.checked;})}/>Visible</label><label>Parent<select aria-label={'Parent '+o.label} value={o.parentId} onChange={e=>edit(m=>{m.objects.find(x=>x.id===o.id).parentId=e.target.value;})}><option value="">Scene root</option>{draft.objects.filter(x=>x.id!==o.id).map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label><label>Linked hotspot<select aria-label={'Linked hotspot '+o.label} value={o.hotspotId} onChange={e=>edit(m=>{m.objects.find(x=>x.id===o.id).hotspotId=e.target.value;})}><option value="">No interaction</option>{draft.hotspots.map(h=><option key={h.id} value={h.id}>{h.label}</option>)}</select></label><button onClick={()=>edit(m=>{m.objects=m.objects.filter(x=>x.id!==o.id);m.objects.forEach(x=>{if(x.parentId===o.id)x.parentId='';});})}>Remove object</button></details>)}<h3>Phases and release rules</h3><p>Every enabled phase needs at least one hotspot. Phases play in the order shown.</p>
      <div className="composition-phases">{['induct', 'shadow', 'perform', 'prove'].map(id => {
        const phase = draft.phases.find(p => p.id === id);
        return <div key={id}><label className="check-row"><input type="checkbox" aria-label={'Enable ' + id} checked={!!phase} disabled={!!phase && draft.phases.length === 1} onChange={e => phaseEnabled(id, e.target.checked)}/>{id}</label>
          {phase && <>{draft.hotspots.map(h => <label className="check-row" key={h.id}><input type="checkbox" aria-label={id + ': ' + h.label} checked={phase.hotspotIds.includes(h.id)} onChange={e => edit(m => { const p = m.phases.find(p => p.id === id); p.hotspotIds = e.target.checked ? [...p.hotspotIds, h.id] : p.hotspotIds.filter(key => key !== h.id); })}/>{h.label}</label>)}{phase.next && <label className="check-row"><input type="checkbox" aria-label={'Host release after ' + id} checked={phase.gate === 'host'} onChange={e => edit(m => { m.phases.find(p => p.id === id).gate = e.target.checked ? 'host' : 'none'; })}/>Host release before {phase.next}</label>}</>}
        </div>;
      })}</div>
      <ContextEditor draft={draft} edit={edit}/><ActivityEditor draft={draft} edit={edit}/><button className="primary" disabled={!dirty} onClick={() => apply(async () => applyComposition(loaded.envelope, draft))}>Apply composition</button>
    </fieldset>
  </details>;
}
