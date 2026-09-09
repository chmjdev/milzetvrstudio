export async function imageDerivative(bytes,mime,maxDimension=2048){
 if(!['image/png','image/jpeg'].includes(mime) || ![1024,2048,4096].includes(maxDimension))throw Error('Choose a supported image and copy size.');
 const bitmap=await createImageBitmap(new Blob([bytes],{type:mime}));
 try{const scale=Math.min(1,maxDimension/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image conversion is unavailable.');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));if(!blob)throw Error('JPEG conversion failed.');return new Uint8Array(await blob.arrayBuffer());}finally{bitmap.close();}
}
