export const environments=['Site','Plant','Workshop','Field','Studio','Office','Clinic','Community'];
export const pilotTypes=['','Trench and fibre duct','Toolbox talk / permit board','Daily site log','Virtual assessment','First-aid switch test'];
export function emptyContext(){return {environment:'Site',pilotType:'',occupationRef:'',moduleRefs:'',sourceCitation:'',externalStreamRef:'',validFrom:'',validUntil:''};}
export function validateContext(m){
 if(m.context===undefined)return;const c=m.context;
 if(!c || Object.keys(c).sort().join(',')!=='environment,externalStreamRef,moduleRefs,occupationRef,pilotType,sourceCitation,validFrom,validUntil' || !environments.includes(c.environment) || !pilotTypes.includes(c.pilotType))throw Error('Invalid scenario context.');
 for(const key of ['occupationRef','moduleRefs','sourceCitation','externalStreamRef'])if(typeof c[key]!=='string' || c[key].length>2000)throw Error('Invalid external reference.');
 for(const key of ['validFrom','validUntil'])if(c[key]!=='' && (typeof c[key]!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(c[key]) || !Number.isFinite(Date.parse(c[key])) || new Date(c[key]).toISOString().slice(0,10)!==c[key]))throw Error('Invalid validity date.');
 if(c.validFrom && c.validUntil && c.validFrom>c.validUntil)throw Error('Validity end precedes start.');
}
