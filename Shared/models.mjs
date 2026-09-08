export function validateGlb(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length<20 || view.getUint32(0,true)!==0x46546c67 || view.getUint32(4,true)!==2 || view.getUint32(8,true)!==bytes.length || view.getUint32(16,true)!==0x4e4f534a)throw Error('Invalid GLB 2.0 container.');
 const length=view.getUint32(12,true);if(length>bytes.length-20)throw Error('Invalid GLB JSON length.');
 const json=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+length)));
 if([...(json.buffers||[]),...(json.images||[])].some(x=>x.uri && !x.uri.startsWith('data:')))throw Error('GLB resources must be embedded.');
 if((json.extensionsRequired||[]).some(x=>!['KHR_materials_unlit','KHR_texture_transform'].includes(x)))throw Error('Unsupported required GLB extension. Export an uncompressed GLB.');
 const vertices=(json.meshes||[]).flatMap(m=>m.primitives||[]).reduce((n,p)=>n+(json.accessors?.[p.attributes?.POSITION]?.count||0),0);
 if(!vertices || vertices>200000)throw Error('GLB must contain 1–200,000 vertices.');
 return json;
}
export function validateObjects(m){
 if(m.objects===undefined)return;
 if(!Array.isArray(m.objects) || m.objects.length>16)throw Error('Maximum 16 scene objects.');
 const ids=new Set();for(const o of m.objects){
  if(!o || Object.keys(o).sort().join(',')!=='assetId,hotspotId,id,label,parentId,position,rotation,scale,visible' || !/^[a-zA-Z0-9-]{1,80}$/.test(o.id) || ids.has(o.id))throw Error('Invalid scene object.');ids.add(o.id);
  if(typeof o.label!=='string' || !o.label.trim() || o.label.length>80 || !m.assets.some(a=>a.id===o.assetId && a.mime==='model/gltf-binary') || typeof o.visible!=='boolean')throw Error('Invalid model reference.');
  for(const key of ['position','rotation','scale'])if(!Array.isArray(o[key]) || o[key].length!==3 || !o[key].every(v=>Number.isFinite(v) && (key==='scale'?v>=.001 && v<=100:Math.abs(v)<=(key==='rotation'?360:100))))throw Error('Invalid object transform.');
  if(o.hotspotId!=='' && !m.hotspots.some(h=>h.id===o.hotspotId))throw Error('Missing object hotspot.');
 }
 for(const o of m.objects){const visited=new Set([o.id]);let parent=o.parentId;while(parent){if(visited.has(parent))throw Error('Cyclic object hierarchy.');visited.add(parent);const p=m.objects.find(p=>p.id===parent);if(!p)throw Error('Missing parent object.');parent=p.parentId;}}
}
