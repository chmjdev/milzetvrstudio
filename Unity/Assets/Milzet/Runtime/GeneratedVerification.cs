using System;
using System.Collections;
using System.IO;
using System.Linq;
using UnityEngine;
namespace Milzet.Content {
public sealed class GeneratedVerification : MonoBehaviour {
 public void Begin(PackagePlayer player,string output){StartCoroutine(Guard(Check(player,output)));}
 IEnumerator Guard(IEnumerator task){while(true){bool more;try{more=task.MoveNext();}catch(Exception e){Debug.LogException(e);Application.Quit(1);yield break;}if(!more)yield break;yield return task.Current;}}
 IEnumerator Check(PackagePlayer player,string output){
  float end=Time.realtimeSinceStartup+90;while((player.ModelsLoading || player.VideoLoading || player.Loaded==null) && Time.realtimeSinceStartup<end)yield return null;
  PackageReader.Require(!player.ModelsLoading && player.ModelObjects.Count==1,"Generated GLB did not load: "+player.Message);PackageReader.Require(player.Loaded.Manifest.provenance.Any(p=>p.provider=="meshy") && player.Loaded.Manifest.provenance.Any(p=>p.provider=="elevenlabs"),"Generated receipts missing.");
  player.ShowWorldControls(false);var camera=player.ViewCamera;camera.aspect=1200f/800;var target=new RenderTexture(1200,800,24);target.Create();var image=new Texture2D(1200,800,TextureFormat.RGB24,false);var previous=RenderTexture.active;camera.targetTexture=target;camera.Render();RenderTexture.active=target;image.ReadPixels(new Rect(0,0,1200,800),0,0);image.Apply();var orange=image.GetPixels().Count(p=>p.r>.3f && p.r>p.g*1.4f && p.g>p.b*1.3f);PackageReader.Require(orange>1000,"Generated orange cone not visible: "+orange);Directory.CreateDirectory(output);File.WriteAllBytes(Path.Combine(output,"generated-native.png"),image.EncodeToPNG());camera.targetTexture=null;RenderTexture.active=previous;target.Release();DestroyImmediate(target);DestroyImmediate(image);
  player.ToggleDemonstration();float start=player.DemoNarration.time;yield return new WaitForSecondsRealtime(1);PackageReader.Require(player.DemoNarration.isPlaying && player.DemoNarration.time>start+.5f,"Generated narration did not advance.");float time=player.DemoNarration.time;player.PauseDemonstration();player.Select("point-1");player.Advance();PackageReader.Require(player.Session.Complete,"Generated scenario completion failed.");File.WriteAllText(Path.Combine(output,"native-generated-verification.json"),"{\"passed\":true,\"actualStandalone\":true,\"actualGeneratedAssets\":true,\"orangePixels\":"+orange+",\"audioTime\":"+time.ToString(System.Globalization.CultureInfo.InvariantCulture)+",\"revision\":\""+player.Loaded.Revision+"\",\"headset\":\"not accepted\"}");Debug.Log("MILZET_GENERATED_PASS");Application.Quit(0);
 }
}
}
