import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const vendor=JSON.parse(await readFile('Docs/vendor-ui-assets.json','utf8')).sha256;
const excluded = new Set(['node_modules','.git','Artifacts','ClientProjects','Library','Temp','Logs','UserSettings']);
const media = /\.(glb|gltf|fbx|blend|unity|prefab|anim|mp3|wav|ogg|mp4|jpg|jpeg|png|pdf|pptx)$/i;
const found=[];
async function walk(dir) { for(const e of await readdir(dir,{withFileTypes:true})) { if(excluded.has(e.name))continue;const p=path.join(dir,e.name); if(e.isSymbolicLink()) throw Error('Unexpected symlink: '+p); if(e.isDirectory())await walk(p);else if(media.test(e.name)){if(vendor[p]){const hash=createHash('sha256').update(await readFile(p)).digest('hex');if(hash!==vendor[p])throw Error('Modified third-party UI asset: '+p);}else found.push(p);} } }
await walk('.');
if(found.length) throw Error('Foundation must contain no bundled media: '+found.join(', '));
const index=JSON.parse(await readFile('Shared/content-library.json','utf8'));
if(index.assets.length || index.projects.length) throw Error('Shipped library must be empty.');
console.log('PASS: no bundled teaching model, scene or client media; vendor UI asset checksums verified; shipped library is empty.');
