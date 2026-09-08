import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createProject, parseProject, templates } from '../Shared/project.mjs';
import { cn } from './lib/utils';
import './style.css';
import { Playable } from './playable';
const storageKey = 'milzetvrstudio.draft.v1';
function initial() {
  try { const raw = localStorage.getItem(storageKey); return { project: raw ? parseProject(raw) : null, message: raw ? 'Local draft restored.' : '' }; }
  catch { return { project: null, message: 'The saved draft could not be read. Import a valid backup or create a new project.' }; }
}
function App() {
  const [loaded] = useState(initial);
  const [project, setProject] = useState<any>(loaded.project);
  const [message, setMessage] = useState(loaded.message);
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('Site');
  const [phase, setPhase] = useState('induct');
  function save(value: any) {
    try { localStorage.setItem(storageKey, JSON.stringify(value)); setProject(value); setMessage('Draft saved on this browser. Export a backup to keep it.'); }
    catch { setMessage('Unable to save locally. Your current draft is still open; export a backup.'); }
  }
  function exportDraft() {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = project.id + '.milzet.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage('Editable draft exported. Runtime package export comes in a later milestone.');
  }
  return <div className="shell">
    <aside><a className="brand" href="/">m<span>Milzet<br/><small>VR STUDIO</small></span></a><div className="nav-label">WORKSPACE</div><div className="nav-item">◇ Content authoring</div><div className="aside-bottom">Your environment.<br/>Your expertise.<br/><strong>Your content.</strong></div></aside>
    <main><header><div><span className="eyebrow">INTERACTIVE / MILZET</span><h1>Content workspace</h1></div><span className="badge">Drafts + playable package lab</span></header>
      <section className="intro"><div><h2>Build from your world.</h2><p>Start with an empty project. Capture and generate client content onsite.</p></div><label className="button secondary">Open draft<input aria-label="Open draft" type="file" accept=".json" hidden onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { if(f.size > 1000000) throw Error('Draft exceeds the 1 MB limit.'); const v = parseProject(await f.text()); save(v); } catch(error) { setMessage((error as Error).message); } e.target.value = ''; }}/></label></section>
      {!project ? <section className="create-card"><div className="empty-icon">◇</div><h2>Your first scenario starts here</h2><p>No lessons or teaching models are bundled.</p><form onSubmit={e => { e.preventDefault(); try { save(createProject(title, template, crypto.randomUUID())); } catch(error) { setMessage((error as Error).message); } }}><label>Project title<input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Site induction" required/></label><label>Environment template<select value={template} onChange={e => setTemplate(e.target.value)}>{templates.map(t => <option key={t}>{t}</option>)}</select></label><button className="primary">Create empty project ↗</button></form></section> : <>
      <section className="project-head"><div><span className="eyebrow">{project.template} / DRAFT</span><h2>{project.title}</h2></div><button className="secondary" onClick={exportDraft}>Export draft ↓</button></section>
      <div className="editor"><section className="canvas"><div className="grid-plane"/><div className="canvas-empty"><span>＋</span><h3>Scene is empty</h3><p>Asset import and scene composition are the next milestone.</p></div><span className="canvas-label">EMPTY AUTHORING PROJECT · 0 ASSETS</span></section><section className="inspector"><h3>Content phases</h3>{project.phases.map((p: any, i: number) => <button key={p.id} className={cn('phase', phase === p.id && 'selected')} onClick={() => setPhase(p.id)}><span>0{i + 1}</span>{p.id}<small>0 steps</small></button>)}<p className="hint">Phase structure is ready. Step editing is not yet available.</p><h3>Delivery targets</h3><div className="target">WebXR <small>Planned</small></div><div className="target">Native Unity <small>Planned</small></div></section></div>
      </>}
      <Playable/><p role="status" className="status">{message}</p><footer><span>Client content stays separate from the application.</span><span>Milzet VR Studio · 0.1</span></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
