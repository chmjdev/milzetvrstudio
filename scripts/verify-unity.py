from pathlib import Path
import os,shutil,subprocess,time
root=Path(__file__).resolve().parent.parent
unity=Path('/Applications/Unity/Hub/Editor/6000.3.22f1/Unity.app/Contents/MacOS/Unity')
fixture=root/'Artifacts/trench-browser.milzet-package.json'
if not fixture.is_file():raise SystemExit('Run browser tests to export the exact package first.')
if shutil.disk_usage(root).free<8*1024**3:raise SystemExit('At least 8 GiB free is required for this isolated editor check. No caches are deleted.')
output=root/'Artifacts/UnityVisual';output.mkdir(parents=True,exist_ok=True)
env=os.environ.copy();env['MILZETVRSTUDIO_TEST_PACKAGE']=str(fixture);env['MILZETVRSTUDIO_TEST_OUTPUT']=str(output)
started=time.time()
result=subprocess.run([str(unity),'-batchmode','-buildTarget','StandaloneOSX','-projectPath',str(root/'Unity'),'-executeMethod','Milzet.Editor.NativePreview.Verify','-logFile',str(output/'editor.log')],env=env,timeout=360)
if result.returncode:raise SystemExit(result.returncode)
for receipt in ['native','reference','projection','video','model','activity','experience','presentation','xr-controls','startup']:
    path=output/(receipt+'-verification.json')
    if not path.is_file() or path.stat().st_mtime<started:raise SystemExit('Unity exited without fresh '+receipt+' verification receipt.')
print((output/'native-verification.json').read_text())
