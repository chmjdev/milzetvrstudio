export function pcmWave(samples,rate=24000){
 if(!(samples instanceof Float32Array) || samples.length===0 || samples.length>rate*180 || !Number.isInteger(rate) || rate<8000 || rate>96000)throw Error('Recording must be 0–180 seconds at 8–96 kHz.');
 const bytes=new Uint8Array(44+samples.length*2),view=new DataView(bytes.buffer),write=(at,text)=>[...text].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
 write(0,'RIFF');view.setUint32(4,bytes.length-8,true);write(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,samples.length*2,true);
 samples.forEach((v,i)=>view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,Number.isFinite(v)?v:0))*32767),true));return bytes;
}
