import { spawnSync } from 'node:child_process';
import { existsSync,mkdirSync,copyFileSync } from 'node:fs';
import path from 'node:path';
const monoRoot=process.env.MILZETVRSTUDIO_MONO_ROOT || '/Applications/Unity/Hub/Editor/6000.3.22f1/Unity.app/Contents/Resources/Scripting/MonoBleedingEdge';
const mono=path.join(monoRoot,'bin/mono'), compiler=path.join(monoRoot,'lib/mono/4.5/csc.exe');
if(!existsSync(mono) || !existsSync(compiler))throw Error('Set MILZETVRSTUDIO_MONO_ROOT to the verified Unity Mono runtime.');
if(!existsSync('Artifacts/contracts/valid-trench.json'))throw Error('Run npm test to generate shared fixtures first.');
function run(args){const r=spawnSync(mono,args,{stdio:'inherit'});if(r.status!==0)throw Error('Native check failed: '+r.status);}
run([compiler,'-nologo','-out:Artifacts/reader-smoke.exe','-r:System.Runtime.Serialization.dll','-r:System.Xml.Linq.dll','Unity/Assets/Milzet/Runtime/PackageReader.cs','Unity/Assets/Milzet/Runtime/PcmWave.cs','Unity/Assets/Milzet/Runtime/Projection.cs','Unity/Assets/Milzet/Runtime/Mp4Video.cs','Unity/Assets/Milzet/Runtime/ModelContract.cs','Unity/Tests/ReaderSmoke.cs']);
run(['Artifacts/reader-smoke.exe','Artifacts/contracts']);
if(existsSync('Artifacts/trench-browser.milzet-package.json')){mkdirSync('Artifacts/browser-native',{recursive:true});copyFileSync('Artifacts/trench-browser.milzet-package.json','Artifacts/browser-native/valid-trench.json');run(['Artifacts/reader-smoke.exe','Artifacts/browser-native']);}
if(existsSync('Artifacts/authored-browser.milzet-package.json')) {
 run([compiler,'-nologo','-out:Artifacts/authored-smoke.exe','-r:System.Runtime.Serialization.dll','-r:System.Xml.Linq.dll','Unity/Assets/Milzet/Runtime/PackageReader.cs','Unity/Assets/Milzet/Runtime/PcmWave.cs','Unity/Assets/Milzet/Runtime/Projection.cs','Unity/Assets/Milzet/Runtime/Mp4Video.cs','Unity/Assets/Milzet/Runtime/ModelContract.cs','Unity/Tests/AuthoredSmoke.cs']);
 run(['Artifacts/authored-smoke.exe','Artifacts/authored-browser.milzet-package.json']);
}
