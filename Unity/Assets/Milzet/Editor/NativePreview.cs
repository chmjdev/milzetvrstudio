using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using Milzet.Content;
namespace Milzet.Editor {
public static class NativePreview {
 [InitializeOnLoadMethod]
 static void Register(){EditorApplication.playModeStateChanged-=StateChanged;EditorApplication.playModeStateChanged+=StateChanged;EditorApplication.update-=Poll;EditorApplication.update+=Poll;}
 static void Poll(){if(SessionState.GetBool("milzet.verify",false) && EditorApplication.isPlaying && !EditorApplication.isCompiling){SessionState.SetBool("milzet.verify",false);VerifyRunning();}}
 static void StateChanged(PlayModeStateChange state){if(state==PlayModeStateChange.EnteredPlayMode){if(!SessionState.GetBool("milzet.verify",false))LoadPending();}}
 static void LoadPending(){string path=SessionState.GetString("milzet.preview.path","");if(path=="")return;SessionState.EraseString("milzet.preview.path");var existing=UnityEngine.Object.FindFirstObjectByType<PackagePlayer>();var player=existing!=null?existing:new GameObject("Milzet package player").AddComponent<PackagePlayer>();player.OpenFile(path);Selection.activeGameObject=player.gameObject;}
 [MenuItem("Milzet/Open package preview")]
 public static void Open(){string path=EditorUtility.OpenFilePanel("Open Milzet package","","json");if(path=="")return;SessionState.SetString("milzet.preview.path",path);if(EditorApplication.isPlaying)LoadPending();else EditorApplication.isPlaying=true;}
 public static void Verify(){EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);SessionState.SetBool("milzet.verify",true);EditorApplication.isPlaying=true;}
 static void VerifyRunning() {
  try {
   string path=Environment.GetEnvironmentVariable("MILZETVRSTUDIO_TEST_PACKAGE");string output=Environment.GetEnvironmentVariable("MILZETVRSTUDIO_TEST_OUTPUT");PackageReader.Require(!String.IsNullOrEmpty(path) && !String.IsNullOrEmpty(output),"Test paths required.");Directory.CreateDirectory(output);
   PackageReader.Require(EditorApplication.isPlaying,"Play Mode was not entered.");
   var go=new GameObject("Milzet verification");var player=go.AddComponent<PackagePlayer>();player.OpenFile(path);
   PackageReader.Require(player.Markers.Count==4 && player.PlateTexture.width==1000 && player.PlateTexture.height==600,"Unexpected browser fixture dimensions/content.");
   string loadedRevision=player.Loaded.Revision;bool rejected=false;try{player.Open(File.ReadAllText(path).Replace("milzet-playable","unsupported"));}catch(Exception){rejected=true;}PackageReader.Require(rejected && player.Loaded.Revision==loadedRevision && player.Markers.Count==4,"Invalid import replaced active content.");
   var camera=player.ViewCamera;camera.aspect=1200f/720;
   foreach(var h in player.Loaded.Manifest.hotspots){var point=player.Markers[h.id].transform.position;var ray=new Ray(camera.transform.position,(point-camera.transform.position).normalized);PackageReader.Require(player.SelectRay(ray) && player.SelectedId==h.id,"Native ray missed "+h.id);}
   bool blocked=false;try{player.Advance();}catch(InvalidDataException){blocked=true;}PackageReader.Require(blocked,"Host release bypass.");
   string revision=player.Loaded.Revision;Render(player,Path.Combine(output,"native-trench.png"));
   player.SimulatedHostRelease=true;player.Advance();player.Select("point-4");player.Advance();PackageReader.Require(player.Session.Complete && player.Events.Count(e=>e.type=="scenario.completed")==1 && player.Events.Any(e=>e.type=="evidence.requested") && player.Events.All(e=>e.revision==revision) && player.Events.Select(e=>e.eventId).Distinct().Count()==player.Events.Count,"Native event handoff failed.");
   var clip=player.Clips["narration"];float[] data=new float[clip.samples*clip.channels];PackageReader.Require(clip.GetData(data,0) && data.Any(v=>Math.Abs(v)>.001f) && clip.frequency==8000,"Decoded audio is silent/incorrect.");
   int frequency=clip.frequency;string completedEvents="["+String.Join(",",player.Events.Select(e=>JsonUtility.ToJson(e)))+"]";File.WriteAllText(Path.Combine(output,"native-host-events.json"),completedEvents);
   player.OpenFile(path);player.Select("point-1");player.PlaySelectedAudio();PackageReader.Require(player.Narration.clip!=null && player.Narration.isPlaying,"Audio engine did not start playback.");
   File.WriteAllText(Path.Combine(output,"native-audio-samples.json"),"{\"samples\":"+data.Length+",\"frequency\":"+frequency+",\"peak\":"+data.Max(v=>Math.Abs(v)).ToString(System.Globalization.CultureInfo.InvariantCulture)+"}");
   File.WriteAllText(Path.Combine(output,"native-verification.json"),"{\"passed\":true,\"packageSha256\":\""+PackageReader.Hash(File.ReadAllBytes(path))+"\",\"revision\":\""+revision+"\",\"hotspots\":4,\"render\":\"native-trench.png\",\"raySelection\":true,\"hostGate\":true,\"completionEvent\":true,\"decodedAudio\":true,\"playMode\":true,\"audioEnginePlaying\":true,\"audibleOutput\":\"not verified\",\"headset\":\"not tested\"}");
   UnityEngine.Object.DestroyImmediate(go);ProjectionVerification.Run(Path.GetDirectoryName(path),output);Debug.Log("MILZET_NATIVE_VISUAL_PASS");VideoVerification.StartCheck(Path.GetDirectoryName(path),output);
  }catch(Exception e){Debug.LogException(e);EditorApplication.Exit(1);}
 }
 static void Render(PackagePlayer player,string path) {
  var rt=new RenderTexture(1200,720,24,RenderTextureFormat.ARGB32);rt.Create();var camera=player.ViewCamera;var previous=RenderTexture.active;var image=new Texture2D(1200,720,TextureFormat.RGB24,false);
  try{camera.targetTexture=rt;camera.Render();RenderTexture.active=rt;image.ReadPixels(new Rect(0,0,1200,720),0,0);image.Apply();var pixels=image.GetPixels();PackageReader.Require(pixels.Count(c=>c.r>.5f && c.g>.5f)>100000,"Image plate is not visibly rendered.");foreach(var marker in player.Markers.Values){var point=camera.WorldToScreenPoint(marker.transform.position);var c=image.GetPixel((int)point.x,(int)point.y);PackageReader.Require(c.r>.5f && c.g>.6f && c.b<.8f,"Hotspot is not visible in rendered image.");}File.WriteAllBytes(path,image.EncodeToPNG());}finally{camera.targetTexture=null;RenderTexture.active=previous;rt.Release();UnityEngine.Object.DestroyImmediate(rt);UnityEngine.Object.DestroyImmediate(image);}
 }
}
}
