export function validateReferences(m){
 if(m.references===undefined)return;
 if(!Array.isArray(m.references)||m.references.length>128)throw Error('Invalid reference bindings.');
 const ids=new Set();
 for(const r of m.references){
  if(!r||Object.keys(r).sort().join(',')!=='id,moduleKind,moduleRef,occupationRef,scope,sourceCitation,targetId'||typeof r.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(r.id)||ids.has(r.id))throw Error('Invalid reference identity.');
  ids.add(r.id);
  if(!['scenario','hotspot','activity'].includes(r.scope)||typeof r.targetId!=='string'||(r.scope==='scenario'?r.targetId!=='':!(m[r.scope==='hotspot'?'hotspots':'activities']||[]).some(t=>t.id===r.targetId)))throw Error('Invalid reference target.');
  if(!['','KM','PM','WM'].includes(r.moduleKind))throw Error('Invalid module kind.');
  for(const k of ['occupationRef','moduleRef','sourceCitation'])if(typeof r[k]!=='string'||r[k].length>2000)throw Error('Invalid reference text.');
  if(![r.occupationRef,r.moduleRef,r.sourceCitation].some(t=>t.trim())||(r.moduleKind&&!r.moduleRef.trim()))throw Error('Empty reference binding.');
 }
}
export function referenceText(m,scope,targetId=''){
 return (m.references||[]).filter(r=>r.scope===scope&&r.targetId===targetId).map(r=>[r.occupationRef,[r.moduleKind,r.moduleRef].filter(Boolean).join(' '),r.sourceCitation].filter(Boolean).join(' · ')).join('\n');
}
export function removeTargetReferences(m,scope,targetId){if(m.references)m.references=m.references.filter(r=>r.scope!==scope||r.targetId!==targetId);}
