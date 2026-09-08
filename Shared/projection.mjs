export const projections = ['flat', 'equirect180', 'equirect360'];
export function anchor(x, y, projection, radius = 4.8) {
 if(projection === 'flat') return [(x-.5)*4,1.5+(.5-y)*2.4,-1.93];
 const theta=(x-.5)*(projection==='equirect180'?Math.PI:Math.PI*2), latitude=(.5-y)*Math.PI;
 return [radius*Math.sin(theta)*Math.cos(latitude),1.5+radius*Math.sin(latitude),-radius*Math.cos(theta)*Math.cos(latitude)];
}
export function surface(projection) {
 const positions=[],uvs=[],indices=[],columns=96,rows=48;
 for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
  positions.push(...anchor(column/columns,row/rows,projection,5));uvs.push(column/columns,1-row/rows);
 }
 for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
  const a=row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1;indices.push(a,c,b,b,c,d);
 }
 return {positions,uvs,indices};
}
export function imageSize(bytes,mime) {
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(mime==='image/png' && bytes.length>=24 && String.fromCharCode(...bytes.slice(12,16))==='IHDR') return [v.getUint32(16),v.getUint32(20)];
 if(mime==='image/jpeg') {
  let i=2;
  while(i+4<=bytes.length){if(bytes[i]!==255)break;const marker=bytes[i+1];i+=2;if(marker===217 || marker===218)break;if(marker===216 || marker===1 || marker>=208 && marker<=215)continue;const length=v.getUint16(i);if(length<2 || i+length>bytes.length)break;if([192,193,194].includes(marker) && length>=8)return [v.getUint16(i+5),v.getUint16(i+3)];i+=length;}
 }
 throw Error('Image dimensions could not be read.');
}
export function validateProjection(bytes,mime,projection) {
 if(projection==='flat')return;
 const [width,height]=imageSize(bytes,mime),ratio=projection==='equirect360'?2:1;
 if(width<1 || height<1 || width>8192 || height>8192 || width!==height*ratio)throw Error(`Use a mono equirectangular ${ratio}:1 image, at most 8192 pixels per side. Projection must match the source capture.`);
}
