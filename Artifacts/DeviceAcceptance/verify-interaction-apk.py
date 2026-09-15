from pathlib import Path
import subprocess,json,hashlib,os,zipfile
root=Path(__file__).resolve().parents[2]
apk=root/'Artifacts/Builds/milzetvrstudio.apk'
sdk=Path('/Applications/Unity/Hub/Editor/6000.3.22f1/PlaybackEngines/AndroidPlayer');bt=sdk/'SDK/build-tools/36.0.0'
bad=subprocess.check_output([str(bt/'aapt'),'dump','badging',str(apk)],text=True)
manifest=subprocess.check_output([str(bt/'aapt'),'dump','xmltree',str(apk),'AndroidManifest.xml'],text=True)
sig=subprocess.check_output([str(bt/'apksigner'),'verify','--verbose','--print-certs',str(apk)],text=True,env=dict(os.environ,JAVA_HOME=str(sdk/'OpenJDK')))
assert "name='com.binteca.interactive.milzet.viewer' versionCode='6' versionName='1.1.1'" in bad
assert all(v in manifest for v in ['com.oculus.permission.HAND_TRACKING','com.oculus.permission.USE_SCENE'])
assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in sig
assert '8fc66db7ff075a3644acd2a0000c107ff0dd8b372058ac776ff2fa472ede5411' in sig
with zipfile.ZipFile(apk) as z:
 libs=[p for p in z.namelist() if p.startswith('lib/')]
 assert all('lib/arm64-v8a/'+name in libs for name in ['libUnityOpenXR.so','libOVRPlugin.so','libmrutilitykitshared.so'])
 boot=z.read('assets/bin/Data/boot.config').decode()
receipt=dict(passed=True,versionName='1.1.1',versionCode=6,applicationId='com.binteca.interactive.milzet.viewer',bytes=apk.stat().st_size,sha256=hashlib.sha256(apk.read_bytes()).hexdigest(),signatureV2Verified=True,handAndScenePermissions=True,libraries=libs,bootConfig=boot,signature=sig,physicalHeadset=False)
(root/'Artifacts/DeviceAcceptance/interaction-artifact.json').write_text(json.dumps(receipt,indent=2)+'\n')
(root/'Artifacts/DeviceAcceptance/interaction-manifest.txt').write_text(manifest)
print(json.dumps(receipt,indent=2))
