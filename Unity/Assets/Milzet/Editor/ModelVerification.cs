using System;
using System.Collections;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;
using Milzet.Content;
namespace Milzet.Editor {
public static class ModelVerification {
 public static void StartCheck(string directory,string output){var player=new GameObject("Model verification").AddComponent<PackagePlayer>();player.StartCoroutine(Guard(Check(player,directory,output)));}
 static IEnumerator Guard(IEnumerator task){while(true){bool more;try{more=task.MoveNext();}catch(Exception e){Debug.LogException(e);EditorApplication.Exit(1);yield break;}if(!more)yield break;yield return task.Current;}}
 static IEnumerator Check(PackagePlayer player,string directory,string output){
  player.OpenFile(Path.Combine(directory,"model-browser.milzet-package.json"));float limit=Time.realtimeSinceStartup+45;while(player.ModelsLoading && Time.realtimeSinceStartup<limit)yield return null;
  PackageReader.Require(player.Loaded!=null && player.ModelObjects.Count==1,"Model import failed: "+player.Message);var model=player.ModelObjects.Values.First();
  PackageReader.Require(Mathf.Abs(model.transform.position.x-.25f)<.001f && Mathf.Abs(model.transform.position.z-1)<.001f && model.GetComponentsInChildren<MeshRenderer>().Length>0,"Model transform or mesh mismatch.");
  var ray=new Ray(player.ViewCamera.transform.position,(model.transform.position-player.ViewCamera.transform.position).normalized);PackageReader.Require(player.SelectRay(ray) && player.SelectedId=="point-1","Model hotspot selection failed.");
  var target=new RenderTexture(800,600,24);target.Create();var image=new Texture2D(800,600,TextureFormat.RGB24,false);var previous=RenderTexture.active;player.ViewCamera.aspect=4f/3;player.ViewCamera.targetTexture=target;player.ViewCamera.Render();RenderTexture.active=target;image.ReadPixels(new Rect(0,0,800,600),0,0);image.Apply();
  var screen=player.ViewCamera.WorldToScreenPoint(model.transform.position);var pixel=image.GetPixel((int)screen.x,(int)screen.y);PackageReader.Require(pixel.r>.7f && pixel.b>.7f && pixel.g<.2f,"Model material did not render at its authored position: "+pixel);File.WriteAllBytes(Path.Combine(output,"model-native.png"),image.EncodeToPNG());player.ViewCamera.targetTexture=null;RenderTexture.active=previous;target.Release();UnityEngine.Object.DestroyImmediate(target);UnityEngine.Object.DestroyImmediate(image);
  string android=PlayerSettings.GetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.Android);string standalone=PlayerSettings.GetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.Standalone);PackageReader.Require(android=="com.binteca.interactive.milzet.viewer" && standalone==android,"Viewer identifier mismatch.");
  File.WriteAllText(Path.Combine(output,"model-verification.json"),"{\"passed\":true,\"playMode\":true,\"glbDecoded\":true,\"transform\":true,\"materialRender\":true,\"linkedHotspotRay\":true,\"viewerId\":\""+android+"\",\"headset\":\"not tested\"}");player.OpenFile(Path.Combine(directory,"context-browser.milzet-package.json"));limit=Time.realtimeSinceStartup+45;while(player.ModelsLoading && Time.realtimeSinceStartup<limit)yield return null;
  PackageReader.Require(player.Loaded.Manifest.context.occupationRef=="Client supplied reference","Context reference mismatch.");
  foreach(var phase in player.Loaded.Manifest.phases){foreach(var id in phase.hotspotIds)player.Select(id);foreach(var activity in player.Loaded.Manifest.activities.Where(a=>a.phase==phase.id))player.Session.Respond(activity.id,activity.kind=="quiz"?activity.choices.Last():"acknowledged");player.SimulatedHostRelease=true;player.Advance();}
  PackageReader.Require(player.Session.Complete && player.Events.Any(e=>e.type=="activity.responded" && e.response=="Request review"),"Native activity event payload missing.");File.WriteAllText(Path.Combine(output,"activity-verification.json"),"{\"passed\":true,\"playMode\":true,\"context\":true,\"responsePayload\":true,\"hostProgression\":true}");
  player.OpenFile(Path.Combine(directory,"experience-browser.milzet-experience.json"));while(player.ExperienceLoading)yield return null;
  PackageReader.Require(player.Experience!=null && player.Experience.Packages.Count==2 && player.Loaded.Manifest.provenance[0].owner=="Test client","Experience/provenance import failed.");
  bool sceneBlocked=false;try{player.AdvanceExperience();}catch(InvalidDataException){sceneBlocked=true;}PackageReader.Require(sceneBlocked,"Incomplete scene bypass.");
  player.Select(player.Loaded.Manifest.hotspots[0].id);player.Advance();sceneBlocked=false;try{player.AdvanceExperience();}catch(InvalidDataException){sceneBlocked=true;}PackageReader.Require(sceneBlocked,"Experience host gate bypass.");
  player.SimulatedSceneRelease=true;player.AdvanceExperience();while(player.ExperienceLoading)yield return null;PackageReader.Require(player.Loaded.Manifest.title=="Experience second","Second scene not loaded.");player.Select(player.Loaded.Manifest.hotspots[0].id);player.Advance();player.AdvanceExperience();
  PackageReader.Require(player.Journey.Complete && player.ExperienceEvents.Count(e=>e.type=="experience.completed")==1,"Experience completion event failed.");
  File.WriteAllText(Path.Combine(output,"experience-verification.json"),"{\"passed\":true,\"playMode\":true,\"sceneCount\":2,\"hostGate\":true,\"completion\":true,\"publicProvenance\":true}");
  Debug.Log("MILZET_MODEL_PASS");UnityEngine.Object.DestroyImmediate(player.gameObject);PresentationVerification.StartCheck(directory,output);
 }
}
}
