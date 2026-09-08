import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const excluded = new Set(['node_modules','.git','Artifacts','ClientProjects','Library','Temp','Logs','UserSettings']);
const media = /\.(glb|gltf|fbx|blend|unity|prefab|anim|mp3|wav|ogg|mp4|jpg|jpeg|png|pdf|pptx)$/i;
const found=[];
async function walk(dir) { for(const e of await readdir(dir,{withFileTypes:true})) { if(excluded.has(e.name))continue;const p=path.join(dir,e.name); if(e.isSymbolicLink()) throw Error('Unexpected symlink: '+p); if(e.isDirectory())await walk(p);else if(media.test(e.name))found.push(p); } }
await walk('.');
if(found.length) throw Error('Foundation must contain no bundled media: '+found.join(', '));
const index=JSON.parse(await readFile('Shared/content-library.json','utf8'));
if(index.assets.length || index.projects.length) throw Error('Shipped library must be empty.');
console.log('PASS: no bundled model, scene, lesson or media files; shipped library is empty.');
