import React,{useEffect,useRef,useState} from 'react';
import {pcmWave} from '../Shared/recording.mjs';
export function NarrationRecorder({onSave,onBusy}){
 const capture=useRef(null),timer=useRef(null),alive=useRef(true),stream=useRef(null);const [state,setState]=useState('idle'),[message,setMessage]=useState('');
 useEffect(()=>{onBusy(state!=='idle');return()=>onBusy(false);},[state,onBusy]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current);if(capture.current?.state==='recording')capture.current.stop();stream.current?.getTracks().forEach(t=>t.stop());};},[]);
 async function start(){setState('starting');setMessage('');try{
  const input=await navigator.mediaDevices.getUserMedia({audio:true});if(!alive.current){input.getTracks().forEach(t=>t.stop());return;}stream.current=input;
  const recorder=new MediaRecorder(input),chunks=[];capture.current=recorder;recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=async()=>{clearTimeout(timer.current);input.getTracks().forEach(t=>t.stop());if(!alive.current)return;setState('saving');let context;
   try{const blob=new Blob(chunks,{type:recorder.mimeType});context=new AudioContext();const decoded=await context.decodeAudioData(await blob.arrayBuffer());const length=Math.min(Math.ceil(decoded.duration*24000),24000*180);const offline=new OfflineAudioContext(1,length,24000);const source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();const rendered=await offline.startRendering();if(alive.current){await onSave(pcmWave(rendered.getChannelData(0)));setMessage('Narration saved as PCM WAV. Assign it to hotspots and keep a text alternative.');}}
   catch(e){if(alive.current)setMessage(e.message);}finally{await context?.close();if(alive.current)setState('idle');}
  };
  recorder.onerror=e=>{setMessage('Recording failed.');input.getTracks().forEach(t=>t.stop());setState('idle');};recorder.start();setState('recording');timer.current=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},180000);
 }catch(e){if(alive.current){setMessage(e.message);setState('idle');}}}
 return <div><button disabled={state==='starting'||state==='saving'} onClick={()=>state==='recording'?capture.current.stop():start()}>{state==='recording'?'Stop and save narration':state==='saving'?'Saving recording…':'Record local narration'}</button><small> Microphone audio stays local; maximum 3 minutes.</small><p role="status">{message}</p></div>;
}
