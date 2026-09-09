using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Runtime.Serialization.Json;
using UnityEngine;
namespace Milzet.Content {
public sealed class ViewerBootstrap : MonoBehaviour {
 [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
 static void Launch(){if(!Application.isEditor && FindFirstObjectByType<PackagePlayer>()==null)new GameObject("Milzet local viewer").AddComponent<ViewerBootstrap>();}
 static string Json<T>(T value){using(var stream=new MemoryStream()){new DataContractJsonSerializer(typeof(T)).WriteObject(stream,value);return Encoding.UTF8.GetString(stream.ToArray());}}
 public static string EmptyPackage(){
  var texture=new Texture2D(2,2,TextureFormat.RGB24,false);texture.SetPixels(Enumerable.Repeat(new Color(.08f,.16f,.14f),4).ToArray());texture.Apply();byte[] image=texture.EncodeToPNG();Destroy(texture);
  var manifest=new Manifest{id="milzet-viewer-welcome",title="Open a local client package",fixture=false,entryPhase="induct",assets=new[]{new Asset{id="plate",path="assets/plate.png",mime="image/png",bytes=image.Length,sha256=PackageReader.Hash(image)}},plate=new Plate{assetId="plate",projection="flat"},hotspots=new[]{new Hotspot{id="open",label="Local packages",text="Choose a lesson from Lessons. Client files stay on this device.",x=.5,y=.5,narrationAssetId="",evidence=false}},phases=new[]{new Phase{id="induct",hotspotIds=new[]{"open"},next="",gate="none"}}};string text=Json(manifest);return Json(new Envelope{formatVersion=1,kind="milzet-playable",manifest=text,manifestSha256=PackageReader.Hash(Encoding.UTF8.GetBytes(text)),files=new[]{new PackageFile{path="assets/plate.png",base64=Convert.ToBase64String(image)}}});
 }
 void Start(){
  Application.runInBackground=true;var player=gameObject.AddComponent<PackagePlayer>();player.TrackedRigRequested=Application.platform==RuntimePlatform.Android;string directory=Path.Combine(Application.persistentDataPath,"Packages");Directory.CreateDirectory(directory);player.PackageInbox=()=>Directory.GetFiles(directory,"*.json").OrderBy(p=>p).ToArray();
  var args=Environment.GetCommandLineArgs();int index=Array.IndexOf(args,"--milzet-package");try{player.Open(EmptyPackage());if(index>=0 && index+1<args.Length)player.OpenFile(args[index+1]);else{player.ShowWorldControls(true);player.ActivateWorldControl("tab-packages");if(!args.Contains("--milzet-commons-output") && !args.Contains("--milzet-generated-output") && !args.Contains("--milzet-verify-output"))StartCoroutine(player.RunStartup());}}catch(Exception e){Debug.LogError("Unable to open package: "+e.Message);player.Open(EmptyPackage());player.ShowWorldControls(true);}
  int commons=Array.IndexOf(args,"--milzet-commons-output");if(commons>=0 && commons+1<args.Length)gameObject.AddComponent<CommonsVerification>().Begin(player,args[commons+1]);
  int generated=Array.IndexOf(args,"--milzet-generated-output");if(generated>=0 && generated+1<args.Length)gameObject.AddComponent<GeneratedVerification>().Begin(player,args[generated+1]);
  int check=Array.IndexOf(args,"--milzet-verify-output");if(check>=0 && check+1<args.Length){var verifier=gameObject.AddComponent<StandaloneVerification>();verifier.Begin(player,args[check+1]);}
 }
}
}
