import { sha256, toBase64, sealPackage } from './package.mjs';
export function testWave() {
 const bytes=new Uint8Array(44+1600);const v=new DataView(bytes.buffer);const text=(offset,s)=>[...s].forEach((c,i)=>v.setUint8(offset+i,c.charCodeAt(0)));
 text(0,'RIFF');v.setUint32(4,bytes.length-8,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,1600,true);
 for(let i=0;i<800;i++)v.setInt16(44+i*2,Math.sin(i/8000*440*Math.PI*2)*1000,true);return bytes;
}
export async function trenchFixture(png) {
 const wave=testWave();const assets=[{id:'plate',path:'assets/plate.png',mime:'image/png',bytes:png.length,sha256:await sha256(png)},{id:'narration',path:'assets/narration.wav',mime:'audio/wav',bytes:wave.length,sha256:await sha256(wave)}];
 const labels=['PPE station','Excavation edge','Service mark-out','Permit board'];
 const manifest={id:'trench-test-fixture',title:'Trench workflow — TEST FIXTURE',fixture:true,entryPhase:'induct',assets,plate:{assetId:'plate',projection:'flat'},hotspots:labels.map((label,i)=>({id:'point-'+(i+1),label,text:'Test prompt: inspect the '+label.toLowerCase()+'. This schematic is not a site procedure or safety instruction.',x:[.15,.42,.64,.85][i],y:[.25,.55,.4,.22][i],narrationAssetId:'narration',evidence:i===3})),phases:[{id:'induct',hotspotIds:['point-1','point-2','point-3','point-4'],next:'prove',gate:'host'},{id:'prove',hotspotIds:['point-4'],next:'',gate:'none'}]};
 return sealPackage(manifest,[{path:assets[0].path,base64:toBase64(png)},{path:assets[1].path,base64:toBase64(wave)}]);
}
