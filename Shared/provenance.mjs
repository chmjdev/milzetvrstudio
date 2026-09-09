import {check,openPackage,sealPackage} from './package.mjs';
const fields=['assetId','sha256','owner','license','credit','source','capturedAt','provider','jobId','originalSha256'];
export function validateProvenance(manifest){
 if(manifest.provenance===undefined)return;
 check(Array.isArray(manifest.provenance) && manifest.provenance.length<=manifest.assets.length,'Invalid provenance count.');
 const seen=new Set();
 for(const p of manifest.provenance){
  check(p && Object.keys(p).sort().join(',')===fields.slice().sort().join(',') && fields.every(k=>typeof p[k]==='string' && p[k].length<=2000),'Invalid provenance fields.');
  check(!seen.has(p.assetId) && manifest.assets.some(a=>a.id===p.assetId && a.sha256===p.sha256),'Provenance does not match asset bytes.');seen.add(p.assetId);
  check(p.owner.trim() && p.license.trim(),'Provenance requires owner and usage rights.');
  check(p.originalSha256==='' || /^[a-f0-9]{64}$/.test(p.originalSha256) && p.originalSha256!==p.sha256,'Invalid original checksum.');
  check(p.capturedAt==='' || /^\d{4}-\d{2}-\d{2}$/.test(p.capturedAt) && Number.isFinite(Date.parse(p.capturedAt)) && new Date(p.capturedAt).toISOString().slice(0,10)===p.capturedAt,'Invalid provenance capture date.');
  check(p.provider==='' && p.jobId==='' || ['meshy','elevenlabs'].includes(p.provider) && /^[a-zA-Z0-9-]{1,100}$/.test(p.jobId),'Invalid generation provenance.');
 }
}
export async function attachLibraryProvenance(envelope,library){
 const {manifest}=await openPackage(JSON.stringify(envelope));let matched=0;
 manifest.provenance=manifest.assets.flatMap(asset=>{
  const original=library.assets.find(a=>a.sha256===asset.sha256);
  if(!original)return (manifest.provenance||[]).filter(p=>p.assetId===asset.id && p.sha256===asset.sha256);
  matched++;const p=original.provenance;
  return [{assetId:asset.id,sha256:asset.sha256,owner:p.owner,license:p.license,credit:p.credit,source:p.source,capturedAt:p.capturedAt,provider:p.provider,jobId:p.jobId,originalSha256:library.assets.find(a=>a.id===p.derivedFrom)?.sha256||''}];
 });
 check(matched>0,'No source-library bytes match this package. Import the original media with ownership and rights first.');
 return sealPackage(manifest,envelope.files);
}
