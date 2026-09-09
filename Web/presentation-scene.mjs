import * as T from 'three';
import {createPlayback,presentationFrame} from '../Shared/presentation.mjs';
export function mountPresentation(scene,loaded,markers,onError){
 const value=loaded.manifest.presentation,group=new T.Group(),resources=[],urls=[],overlays=new Map(),demo=value?.demonstration,playback=demo?createPlayback(demo):null;
 let disposed=false,phase=loaded.manifest.entryPhase,voice=null,path=null,cursor=null,lastTick=performance.now(),lastState='';scene.add(group);
 const own=x=>(resources.push(x),x),url=id=>{const a=loaded.manifest.assets.find(a=>a.id===id),u=URL.createObjectURL(new Blob([loaded.bytes.get(id)],{type:a.mime}));urls.push(u);return u;};
 for(const o of value?.overlays||[]){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(256,Math.min(4096,Math.round(1024*o.size[1]/o.size[0])));const ctx=canvas.getContext('2d');
  const texture=own(new T.CanvasTexture(canvas));texture.colorSpace=T.SRGBColorSpace;const material=own(new T.MeshBasicMaterial({map:texture,side:T.DoubleSide})),mesh=new T.Mesh(own(new T.PlaneGeometry(...o.size)),material);mesh.position.fromArray(o.position);mesh.rotation.set(...o.rotation.map(n=>n*Math.PI/180));group.add(mesh);overlays.set(o.id,mesh);
  function draw(image){if(disposed)return;ctx.fillStyle='#182d29';ctx.fillRect(0,0,canvas.width,canvas.height);let top=24;
   if(image){const height=o.text||o.citation?canvas.height*.55:canvas.height;const scale=Math.min(canvas.width/image.width,height/image.height);ctx.drawImage(image,(canvas.width-image.width*scale)/2,0,image.width*scale,image.height*scale);top=height+12;}
   const content=[o.text,o.citation].filter(Boolean).join('\n');let font=48,lines=[];
   while(font>=16){ctx.font=font+'px sans-serif';lines=[];for(const paragraph of content.split('\n')){let line='';for(const char of paragraph){if(ctx.measureText(line+char).width>960){lines.push(line);line=char;}else line+=char;}lines.push(line);}if(lines.length*font*1.25<=canvas.height-top-16)break;font-=2;}
   ctx.fillStyle='#eef4df';lines.forEach((line,i)=>ctx.fillText(line,32,top+(i+1)*font*1.25));texture.needsUpdate=true;
  }
  draw(null);if(o.imageAssetId){const img=new Image();img.onload=()=>draw(img);img.onerror=()=>onError('Overlay image could not be decoded.');img.src=url(o.imageAssetId);}
 }
 if(demo?.path.length){const geometry=own(new T.BufferGeometry().setFromPoints(demo.path.map(p=>new T.Vector3(...p.position))));path=new T.Line(geometry,own(new T.LineBasicMaterial({color:0x77dcef})));group.add(path);cursor=new T.Mesh(own(new T.SphereGeometry(.04,12,8)),own(new T.MeshBasicMaterial({color:0x77dcef})));group.add(cursor);}
 if(demo?.narrationAssetId){voice=new Audio(url(demo.narrationAssetId));voice.preload='auto';voice.onerror=()=>onError('Demonstration narration could not be decoded.');}
 function sync(media,playing,time){if(!media)return;if(!playing)media.pause();if(Number.isFinite(media.duration)){const target=Math.min(time,Math.max(0,media.duration-.001));if(Math.abs(media.currentTime-target)>(playing?.15:.001))media.currentTime=target;}}
 return {
  playback,
  async toggle(video){if(!playback || demo.phase!==phase)return;if(playback.playing){playback.pause();voice?.pause();video?.pause();return;}
   for(const media of [voice,video].filter(Boolean)){if(!Number.isFinite(media.duration))throw Error('Wait for demonstration media to load.');if(demo.duration>media.duration+.1)throw Error('Demonstration duration exceeds the imported recording.');}
   playback.play();lastTick=performance.now();try{for(const media of [voice,video].filter(Boolean)){media.currentTime=playback.time;await media.play();}}catch(e){playback.pause();voice?.pause();video?.pause();throw e;}
  },
  pause(video){playback?.pause();voice?.pause();video?.pause();},
  seek(time,video){playback?.seek(time);sync(voice,false,time);sync(video,false,time);},
  update(nextPhase,video,notify){
   const now=performance.now(),delta=Math.min(1,(now-lastTick)/1000);lastTick=now;
   if(phase!==nextPhase){phase=nextPhase;if(playback){playback.seek(0);sync(voice,false,0);sync(video,false,0);}}
   if(playback?.playing){const step=video?Math.max(0,video.currentTime-playback.time):delta;playback.tick(step);sync(video,playback.playing,playback.time);sync(voice,playback.playing,playback.time);}
   const time=playback?.time||0,frame=presentationFrame(value,phase,time),visible=new Set(frame.overlays.map(o=>o.id));for(const [id,mesh]of overlays)mesh.visible=visible.has(id);
   if(path)path.visible=demo.phase===phase;if(cursor){cursor.visible=!!frame.position;if(frame.position)cursor.position.fromArray(frame.position);}
   for(const mesh of markers){mesh.material.color.set(mesh.userData.id===frame.cue?.hotspotId?0xffc766:0xd6f895);mesh.scale.setScalar(mesh.userData.id===frame.cue?.hotspotId?1.35:1);}
   const state={narrationTime:voice?Math.round(voice.currentTime*10)/10:null,narrationPlaying:voice?!voice.paused:false,time,playing:playback?.playing||false,cue:frame.cue?.text||'',overlayCount:frame.overlays.length,highlight:frame.cue?.hotspotId||'',guide:frame.position};const key=JSON.stringify({...state,time:Math.round(time*10)/10});if(key!==lastState){lastState=key;notify(state);}
  },
  dispose(){disposed=true;voice?.pause();voice?.removeAttribute('src');scene.remove(group);resources.forEach(x=>x.dispose());urls.forEach(u=>URL.revokeObjectURL(u));}
 };
}
