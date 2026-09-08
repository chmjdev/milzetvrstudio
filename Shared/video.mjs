export function validateVideo(bytes,projection='flat') {
 if(bytes.length<12 || new TextDecoder().decode(bytes.slice(4,8))!=='ftyp')throw Error('Expected an MP4 container.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let dimensions;
 function boxes(start,end,depth=0){
  if(depth>8)throw Error('MP4 nesting exceeds the supported layout.');
  for(let offset=start;offset+8<=end;){
   let size=view.getUint32(offset),header=8;const type=new TextDecoder().decode(bytes.slice(offset+4,offset+8));
   if(size===1){if(offset+16>end)throw Error('Truncated MP4 box.');size=Number(view.getBigUint64(offset+8));header=16;}if(size===0)size=end-offset;
   if(!Number.isSafeInteger(size) || size<header || offset+size>end)throw Error('Invalid MP4 box length.');
   if(['moov','trak','mdia','minf','stbl'].includes(type))boxes(offset+header,offset+size,depth+1);
   if(type==='stsd')boxes(offset+header+8,offset+size,depth+1);
   if(['avc1','avc3'].includes(type)){if(size<86)throw Error('Truncated video sample entry.');if(dimensions)throw Error('Only one video track is supported.');dimensions=[view.getUint16(offset+32),view.getUint16(offset+34)];}
   offset+=size;
  }
 }
 boxes(0,bytes.length);
 if(!dimensions)throw Error('Use H.264 video in an MP4 container.');
 const [width,height]=dimensions;
 if(!width || !height || width>4096 || height>4096 || projection!=='flat' && width!==height*(projection==='equirect360'?2:1))throw Error('Clip dimensions do not match the mono projection or exceed 4096 pixels per side.');
 return dimensions;
}
