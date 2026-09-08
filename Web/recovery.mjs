function database() { return new Promise((resolve,reject)=>{const request=indexedDB.open('milzetvrstudio.packages',1);request.onupgradeneeded=()=>request.result.createObjectStore('packages');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}); }
export async function saveRecovery(envelope) {
 const db=await database();try { await new Promise((resolve,reject)=>{const tx=db.transaction('packages','readwrite');tx.objectStore('packages').put(envelope,'current');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error || Error('Recovery save aborted.'));}); } finally {db.close();}
}
export async function loadRecovery() {
 const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('packages','readonly');const r=tx.objectStore('packages').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}
}
