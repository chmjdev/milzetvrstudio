import {check,sha256,openPackage} from './package.mjs';
import {validateLibrary} from './library.mjs';
import {openExperience} from './experience.mjs';
import {validateProject} from './project.mjs';
export const MAX_WORKSPACE_BYTES=300000000;
export async function validateWorkspace(value){
 check(value && Object.keys(value).sort().join(',')==='experience,library,project,scene','Unexpected authoring workspace fields.');
 if(value.project!==null)validateProject(value.project);if(value.library!==null)await validateLibrary(value.library);if(value.scene!==null)await openPackage(JSON.stringify(value.scene));if(value.experience!==null)await openExperience(JSON.stringify(value.experience));return value;
}
export async function sealWorkspace(value){await validateWorkspace(value);const data=JSON.stringify(value),envelope={formatVersion:1,kind:'milzet-authoring-project',data,sha256:await sha256(new TextEncoder().encode(data))};check(JSON.stringify(envelope).length<=MAX_WORKSPACE_BYTES,'Authoring backup exceeds 300 MB.');return envelope;}
export async function openWorkspace(text){check(typeof text==='string' && text.length<=MAX_WORKSPACE_BYTES,'Authoring backup exceeds 300 MB.');const e=JSON.parse(text);check(e && Object.keys(e).sort().join(',')==='data,formatVersion,kind,sha256' && e.formatVersion===1 && e.kind==='milzet-authoring-project' && typeof e.data==='string','Unsupported authoring backup.');check(await sha256(new TextEncoder().encode(e.data))===e.sha256,'Authoring backup checksum mismatch.');return validateWorkspace(JSON.parse(e.data));}
