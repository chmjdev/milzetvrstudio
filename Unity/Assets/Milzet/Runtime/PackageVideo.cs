using System;
using System.IO;
using System.Collections;
using UnityEngine;
using UnityEngine.Video;
namespace Milzet.Content {
public sealed partial class PackagePlayer {
 public VideoPlayer Video {get;private set;}
 public bool VideoLoading {get;private set;}
 VideoPlayer preparedVideo;
 void BeginVideo(string text,LoadedPackage next) {
  PackageReader.Require(!VideoLoading,"Video import already in progress.");VideoLoading=true;StartCoroutine(PrepareVideo(text,next));
 }
 IEnumerator PrepareVideo(string text,LoadedPackage next) {
  var temporary=new GameObject("Preparing package clip");temporary.transform.SetParent(transform,false);var player=temporary.AddComponent<VideoPlayer>();player.playOnAwake=false;player.renderMode=VideoRenderMode.RenderTexture;player.audioOutputMode=VideoAudioOutputMode.Direct;string failed=null;player.errorReceived+=(sender,message)=>failed=message;
  string path=Path.Combine(Application.temporaryCachePath,"milzet-"+next.Revision+".mp4");
  try {File.WriteAllBytes(path,next.Assets[next.Manifest.plate.assetId]);player.url=path;player.Prepare();}catch(Exception e){failed=e.Message;}
  float deadline=Time.realtimeSinceStartup+30;
  while(!player.isPrepared && failed==null && Time.realtimeSinceStartup<deadline)yield return null;
  if(!player.isPrepared || failed!=null){Message="Video import failed: "+(failed??"preparation timed out");DestroyImmediate(temporary);VideoLoading=false;yield break;}
  bool immersive=next.Manifest.plate.projection!="flat";int ratio=next.Manifest.plate.projection=="equirect360"?2:1;
  if(player.width==0 || player.height==0 || player.width>4096 || player.height>4096 || immersive && player.width!=player.height*ratio){Message="Unsupported clip dimensions or mono projection; maximum 4096 pixels per side.";DestroyImmediate(temporary);VideoLoading=false;yield break;}
  var target=new RenderTexture((int)player.width,(int)player.height,0);target.Create();player.targetTexture=target;player.Play();deadline=Time.realtimeSinceStartup+15;
  while(player.frame<0 && failed==null && Time.realtimeSinceStartup<deadline)yield return null;
  player.Pause();
  if(player.frame<0 || failed!=null){Message="Video failed to produce a frame.";target.Release();DestroyImmediate(target);DestroyImmediate(temporary);VideoLoading=false;yield break;}
  preparedVideo=player;
  try {Open(text);}catch(Exception e){Message=e.Message;target.Release();DestroyImmediate(target);DestroyImmediate(temporary);preparedVideo=null;}
  VideoLoading=false;
 }
}
}
