using System;
using System.IO;
using System.Collections;
using UnityEditor;
using UnityEngine;
using Milzet.Content;
namespace Milzet.Editor {
public static class VideoVerification {
 public static void StartCheck(string directory,string output){var player=new GameObject("Video verification").AddComponent<PackagePlayer>();player.StartCoroutine(Guard(Check(player,directory,output)));}
 static IEnumerator Guard(IEnumerator routine){while(true){bool more;try{more=routine.MoveNext();}catch(Exception e){Debug.LogException(e);EditorApplication.Exit(1);yield break;}if(!more)yield break;yield return routine.Current;}}
 static IEnumerator Check(PackagePlayer player,string directory,string output){
  player.OpenFile(Path.Combine(directory,"video-browser.milzet-package.json"));
  float limit=Time.realtimeSinceStartup+50;while(player.VideoLoading && Time.realtimeSinceStartup<limit)yield return null;
  PackageReader.Require(player.Video!=null && player.Video.isPrepared,"Video did not prepare: "+player.Message);
  player.Video.Play();limit=Time.realtimeSinceStartup+10;while(player.Video.time<.5 && Time.realtimeSinceStartup<limit)yield return null;
  PackageReader.Require(player.Video.time>=.5 && player.Video.frame>0,"Video did not advance.");player.Video.Pause();
  var image=new Texture2D(640,320,TextureFormat.RGB24,false);var previous=RenderTexture.active;RenderTexture.active=player.Video.targetTexture;image.ReadPixels(new Rect(0,0,640,320),0,0);image.Apply();RenderTexture.active=previous;
  var pixel=image.GetPixel(320,160);PackageReader.Require(pixel.b>.7f && pixel.r<.15f && pixel.g<.15f,"Decoded video frame mismatch.");File.WriteAllBytes(Path.Combine(output,"video-native-frame.png"),image.EncodeToPNG());UnityEngine.Object.DestroyImmediate(image);
  player.Video.time=1.5;limit=Time.realtimeSinceStartup+10;while(Math.Abs(player.Video.time-1.5)>.15 && Time.realtimeSinceStartup<limit)yield return null;
  PackageReader.Require(Math.Abs(player.Video.time-1.5)<.15,"Video seek failed.");
  File.WriteAllText(Path.Combine(output,"video-verification.json"),"{\"passed\":true,\"playMode\":true,\"decodedFrame\":true,\"playbackAdvanced\":true,\"seek\":true,\"projection\":\"equirect360\",\"headset\":\"not tested\"}");
  Debug.Log("MILZET_VIDEO_PASS");UnityEngine.Object.DestroyImmediate(player.gameObject);ModelVerification.StartCheck(directory,output);
 }
}
}
