import { spawnSync } from 'node:child_process';
import { existsSync,mkdirSync,copyFileSync } from 'node:fs';
import path from 'node:path';
const monoRoot=process.env.MILZETVRSTUDIO_MONO_ROOT || '/Applications/Unity/Hub/Editor/6000.3.22f1/Unity.app/Contents/Resources/Scripting/MonoBleedingEdge';
const mono=path.join(monoRoot,'bin/mono'), compiler=path.join(monoRoot,'lib/mono/4.5/csc.exe');
if(!existsSync(mono) || !existsSync(compiler))throw Error('Set MILZETVRSTUDIO_MONO_ROOT to the verified Unity Mono runtime.');
if(!existsSync('Artifacts/contracts/valid-trench.json'))throw Error('Run npm test to generate shared fixtures first.');
function run(args){const r=spawnSync(mono,args,{stdio:'inherit'});if(r.status!==0)throw Error('Native check failed: '+r.status);}
run([compiler,'-nologo','-out:Artifacts/reader-smoke.exe','-r:System.Runtime.Serialization.dll','-r:System.Xml.Linq.dll','Unity/Assets/Milzet/Runtime/PackageReader.cs','Unity/Assets/Milzet/Runtime/PresentationContract.cs','Unity/Assets/Milzet/Runtime/PcmWave.cs','Unity/Assets/Milzet/Runtime/Projection.cs','Unity/Assets/Milzet/Runtime/Mp4Video.cs','Unity/Assets/Milzet/Runtime/ModelContract.cs','Unity/Assets/Milzet/Runtime/ActivityContract.cs','Unity/Assets/Milzet/Runtime/ScenarioContext.cs','Unity/Tests/ReaderSmoke.cs']);
run(['Artifacts/reader-smoke.exe','Artifacts/contracts']);
if(existsSync('Artifacts/trench-browser.milzet-package.json')){mkdirSync('Artifacts/browser-native',{recursive:true});copyFileSync('Artifacts/trench-browser.milzet-package.json','Artifacts/browser-native/valid-trench.json');run(['Artifacts/reader-smoke.exe','Artifacts/browser-native']);}
if(existsSync('Artifacts/authored-browser.milzet-package.json')) {
 run([compiler,'-nologo','-out:Artifacts/authored-smoke.exe','-r:System.Runtime.Serialization.dll','-r:System.Xml.Linq.dll','Unity/Assets/Milzet/Runtime/PackageReader.cs','Unity/Assets/Milzet/Runtime/PresentationContract.cs','Unity/Assets/Milzet/Runtime/PcmWave.cs','Unity/Assets/Milzet/Runtime/Projection.cs','Unity/Assets/Milzet/Runtime/Mp4Video.cs','Unity/Assets/Milzet/Runtime/ModelContract.cs','Unity/Assets/Milzet/Runtime/ActivityContract.cs','Unity/Assets/Milzet/Runtime/ScenarioContext.cs','Unity/Tests/AuthoredSmoke.cs']);
 run(['Artifacts/authored-smoke.exe','Artifacts/authored-browser.milzet-package.json']);
}
if(existsSync('Artifacts/activities-browser.milzet-package.json')) {
 run([compiler,'-nologo','-out:Artifacts/activity-smoke.exe','-r:System.Runtime.Serialization.dll','-r:System.Xml.Linq.dll','Unity/Assets/Milzet/Runtime/PackageReader.cs','Unity/Assets/Milzet/Runtime/PresentationContract.cs','Unity/Assets/Milzet/Runtime/PcmWave.cs','Unity/Assets/Milzet/Runtime/Projection.cs','Unity/Assets/Milzet/Runtime/Mp4Video.cs','Unity/Assets/Milzet/Runtime/ModelContract.cs','Unity/Assets/Milzet/Runtime/ActivityContract.cs','Unity/Assets/Milzet/Runtime/ScenarioContext.cs','Unity/Tests/ActivitySmoke.cs']);
 run(['Artifacts/activity-smoke.exe','Artifacts/activities-browser.milzet-package.json']);
}

run([compiler,'-nologo','-out:Artifacts/provenance-smoke.exe','-r:System.Runtime.Serialization.dll','-r:System.Xml.Linq.dll','Unity/Assets/Milzet/Runtime/PackageReader.cs','Unity/Assets/Milzet/Runtime/PresentationContract.cs','Unity/Assets/Milzet/Runtime/PcmWave.cs','Unity/Assets/Milzet/Runtime/Projection.cs','Unity/Assets/Milzet/Runtime/Mp4Video.cs','Unity/Assets/Milzet/Runtime/ModelContract.cs','Unity/Assets/Milzet/Runtime/ActivityContract.cs','Unity/Assets/Milzet/Runtime/ScenarioContext.cs','Unity/Tests/ProvenanceSmoke.cs']);
run(['Artifacts/provenance-smoke.exe','Artifacts/provenance']);

run([compiler,'-nologo','-out:Artifacts/experience-smoke.exe','-r:System.Runtime.Serialization.dll','-r:System.Xml.Linq.dll','Unity/Assets/Milzet/Runtime/PackageReader.cs','Unity/Assets/Milzet/Runtime/PresentationContract.cs','Unity/Assets/Milzet/Runtime/ExperienceReader.cs','Unity/Assets/Milzet/Runtime/PcmWave.cs','Unity/Assets/Milzet/Runtime/Projection.cs','Unity/Assets/Milzet/Runtime/Mp4Video.cs','Unity/Assets/Milzet/Runtime/ModelContract.cs','Unity/Assets/Milzet/Runtime/ActivityContract.cs','Unity/Assets/Milzet/Runtime/ScenarioContext.cs','Unity/Tests/ExperienceSmoke.cs']);
run(['Artifacts/experience-smoke.exe','Artifacts/experience']);

run([compiler,'-nologo','-out:Artifacts/presentation-smoke.exe','-r:System.Runtime.Serialization.dll','-r:System.Xml.Linq.dll','Unity/Assets/Milzet/Runtime/PackageReader.cs','Unity/Assets/Milzet/Runtime/PresentationContract.cs','Unity/Assets/Milzet/Runtime/PcmWave.cs','Unity/Assets/Milzet/Runtime/Projection.cs','Unity/Assets/Milzet/Runtime/Mp4Video.cs','Unity/Assets/Milzet/Runtime/ModelContract.cs','Unity/Assets/Milzet/Runtime/ActivityContract.cs','Unity/Assets/Milzet/Runtime/ScenarioContext.cs','Unity/Tests/PresentationSmoke.cs']);
run(['Artifacts/presentation-smoke.exe','Artifacts/presentation']);

run([compiler,'-nologo','-out:Artifacts/reference-smoke.exe','-r:System.Runtime.Serialization.dll','-r:System.Xml.Linq.dll','Unity/Assets/Milzet/Runtime/PackageReader.cs','Unity/Assets/Milzet/Runtime/PresentationContract.cs','Unity/Assets/Milzet/Runtime/PcmWave.cs','Unity/Assets/Milzet/Runtime/Projection.cs','Unity/Assets/Milzet/Runtime/Mp4Video.cs','Unity/Assets/Milzet/Runtime/ModelContract.cs','Unity/Assets/Milzet/Runtime/ActivityContract.cs','Unity/Assets/Milzet/Runtime/ScenarioContext.cs','Unity/Tests/ReferenceSmoke.cs']);
run(['Artifacts/reference-smoke.exe','Artifacts/references']);
