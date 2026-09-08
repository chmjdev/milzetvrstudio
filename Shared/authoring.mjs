import { check, openPackage, sealPackage, sha256, toBase64 } from './package.mjs';

export function newHotspot(id, x = .5, y = .5) {
  return { id, label: 'New hotspot', text: '', x, y, narrationAssetId: '', evidence: false };
}

export async function createImageScenario(title, bytes, mime) {
  check(['image/png', 'image/jpeg','video/mp4'].includes(mime), 'Choose a PNG, JPEG or MP4 source.');
  const asset = { id: 'plate', path: mime === 'image/png' ? 'assets/plate.png' : mime==='video/mp4'?'assets/plate.mp4':'assets/plate.jpg', mime, bytes: bytes.length, sha256: await sha256(bytes) };
  return sealPackage({ id: crypto.randomUUID(), title: title.trim(), fixture: false, entryPhase: 'induct', assets: [asset], plate: { assetId: 'plate', projection: 'flat' }, hotspots: [newHotspot('point-1')], phases: [{ id: 'induct', hotspotIds: ['point-1'], next: '', gate: 'none' }] }, [{ path: asset.path, base64: toBase64(bytes) }]);
}

export async function applyComposition(envelope, draft) {
  const { manifest } = await openPackage(JSON.stringify(envelope));
  return sealPackage({ ...manifest, ...(draft.objects===undefined?{}:{objects:structuredClone(draft.objects)}), title: draft.title, plate: structuredClone(draft.plate), hotspots: structuredClone(draft.hotspots), phases: structuredClone(draft.phases), entryPhase: draft.phases[0]?.id }, envelope.files);
}

export async function addNarration(envelope, bytes) {
  const { manifest } = await openPackage(JSON.stringify(envelope));
  check(manifest.assets.length < 8, 'This package already has eight assets.');
  const id = 'audio-' + crypto.randomUUID();
  const asset = { id, path: `assets/${id}.wav`, mime: 'audio/wav', bytes: bytes.length, sha256: await sha256(bytes) };
  manifest.assets.push(asset);
  return sealPackage(manifest, [...envelope.files, { path: asset.path, base64: toBase64(bytes) }]);
}

export async function addModel(envelope,name,bytes){
 const {manifest}=await openPackage(JSON.stringify(envelope));
 const id='model-'+crypto.randomUUID();const asset={id,path:`assets/${id}.glb`,mime:'model/gltf-binary',bytes:bytes.length,sha256:await sha256(bytes)};
 manifest.assets.push(asset);manifest.objects=manifest.objects||[];
 manifest.objects.push({id:'object-'+crypto.randomUUID(),label:name.slice(0,80),assetId:id,parentId:'',position:[0,1.5,-1],rotation:[0,0,0],scale:[1,1,1],visible:true,hotspotId:''});
 return sealPackage(manifest,[...envelope.files,{path:asset.path,base64:toBase64(bytes)}]);
}
