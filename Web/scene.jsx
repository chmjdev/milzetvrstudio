import React,{useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {anchor,surface} from '../Shared/projection.mjs';
export function Scene({loaded,onSelect}) {
 const mount=useRef(null), runtime=useRef(null), select=useRef(onSelect);select.current=onSelect;
 const [available,setAvailable]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  let renderer;let stopped=false;let texture;let url;
  const resources=[];
  try {
   renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.xr.enabled=true;
   const immersive=loaded.manifest.plate.projection!=='flat';const scene=new T.Scene();scene.background=new T.Color('#152a27');const camera=new T.PerspectiveCamera(60,1,.1,100);camera.position.set(0,1.5,immersive?0:1);
   mount.current.appendChild(renderer.domElement);
   const asset=loaded.manifest.assets.find(a=>a.id===loaded.manifest.plate.assetId);
   url=URL.createObjectURL(new Blob([loaded.bytes.get(asset.id)],{type:asset.mime}));
   texture=new T.TextureLoader().load(url);texture.colorSpace=T.SRGBColorSpace;
   const geometry=immersive?new T.BufferGeometry():new T.PlaneGeometry(4,2.4);if(immersive){const data=surface(loaded.manifest.plate.projection);geometry.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(data.uvs,2));geometry.setIndex(data.indices);geometry.computeVertexNormals();}const material=new T.MeshBasicMaterial({map:texture});resources.push(geometry,material);
   const plate=new T.Mesh(geometry,material);if(!immersive)plate.position.set(0,1.5,-2);scene.add(plate);
   const targets=loaded.manifest.hotspots.map(h=>{const g=new T.SphereGeometry(.065,16,12),m=new T.MeshBasicMaterial({color:'#d6f895'});resources.push(g,m);const mesh=new T.Mesh(g,m);mesh.position.set(...anchor(h.x,h.y,loaded.manifest.plate.projection));mesh.userData.id=h.id;scene.add(mesh);return mesh;});
   const ray=new T.Raycaster();
   let start=null,moved=false,yaw=0,pitch=0;
   const down=e=>{start={x:e.clientX,y:e.clientY,yaw,pitch};moved=false;};
   const move=e=>{if(!start || !immersive || renderer.xr.isPresenting)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;yaw=start.yaw-dx*.005;pitch=Math.max(-Math.PI*.49,Math.min(Math.PI*.49,start.pitch-dy*.005));camera.rotation.set(pitch,yaw,0,'YXZ');};
   const click=e=>{start=null;if(moved)return;const b=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1),camera);const hit=ray.intersectObjects(targets)[0];if(hit)select.current(hit.object.userData.id);};
   renderer.domElement.addEventListener('pointerup',click);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.style.touchAction='none';
   for(let i=0;i<2;i++){const controller=renderer.xr.getController(i);controller.addEventListener('select',()=>{ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);ray.ray.direction.set(0,0,-1).transformDirection(controller.matrixWorld);const hit=ray.intersectObjects(targets)[0];if(hit)select.current(hit.object.userData.id);});scene.add(controller);}
   const observer=new ResizeObserver(()=>{if(!mount.current)return;const {width,height}=mount.current.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();});observer.observe(mount.current);
   renderer.setAnimationLoop(()=>renderer.render(scene,camera));runtime.current=renderer;
   navigator.xr?.isSessionSupported('immersive-vr').then(value=>{if(!stopped)setAvailable(value);}).catch(()=>{});
   return ()=>{stopped=true;observer.disconnect();renderer.domElement.removeEventListener('pointerup',click);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);const session=renderer.xr.getSession();if(session)void session.end();renderer.setAnimationLoop(null);renderer.dispose();renderer.domElement.remove();texture?.dispose();resources.forEach(r=>r.dispose());URL.revokeObjectURL(url);runtime.current=null;};
  } catch(e){setError(e.message);renderer?.dispose();return ()=>{stopped=true;};}
 },[loaded]);
 return <div><div className="scene-view" ref={mount} aria-label="Package scene preview"/>{error && <p role="alert">{error}</p>}<button disabled={!available} onClick={async()=>{try{const session=await navigator.xr.requestSession('immersive-vr');await runtime.current.xr.setSession(session);}catch(e){setError(e.message);}}}>Enter VR</button>{loaded.manifest.plate.projection!=='flat' && <p>Drag the preview to look around. The uncovered half of a 180° capture stays empty.</p>}<small className="xr-note">{available?'Immersive entry available; device acceptance pending.':'Desktop preview · immersive VR requires a compatible browser.'}</small></div>;
}
