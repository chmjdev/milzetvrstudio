using System;
using System.Collections;
using System.IO;
using System.Linq;
using UnityEngine;
namespace Milzet.Content {
public sealed class CommonsVerification : MonoBehaviour {
 public void Begin(PackagePlayer player,string directory){StartCoroutine(Guard(Check(player,directory)));}
 IEnumerator Guard(IEnumerator task){while(true){bool more;try{more=task.MoveNext();}catch(Exception e){Debug.LogException(e);Application.Quit(1);yield break;}if(!more)yield break;yield return task.Current;}}
 IEnumerator Check(PackagePlayer player,string directory){
  int count=0,activities=0;bool videoAdvanced=false;
  foreach(var filename in new[]{"07-Trench-observation.json","08-Toolbox-talk.json","09-Daily-site-log.json","10-Assessment-observation.json","11-First-aid-familiarisation.json"}){
   player.OpenFile(Path.Combine(directory,filename));float end=Time.realtimeSinceStartup+40;while((player.ModelsLoading || player.VideoLoading) && Time.realtimeSinceStartup<end)yield return null;PackageReader.Require(player.Loaded.Manifest.id.StartsWith("commons-"),"Example import failed.");player.ShowWorldControls(true);PackageReader.Require(player.Loaded.Manifest.provenance.Length==1,"Example attribution missing.");
   if(player.Video!=null){player.ActivateWorldControl("play");float videoEnd=Time.realtimeSinceStartup+15;while(player.Video.time<=.5 && Time.realtimeSinceStartup<videoEnd)yield return null;PackageReader.Require(player.Video.time>.5,"Commons video did not advance: time="+player.Video.time+" playing="+player.Video.isPlaying+" prepared="+player.Video.isPrepared);videoAdvanced=true;player.Video.Pause();}
   var camera=player.ViewCamera;var target=new RenderTexture(1200,800,24);target.Create();var image=new Texture2D(1200,800,TextureFormat.RGB24,false);var previous=RenderTexture.active;camera.targetTexture=target;camera.Render();RenderTexture.active=target;image.ReadPixels(new Rect(0,0,1200,800),0,0);image.Apply();PackageReader.Require(image.GetPixels().Count(p=>p.r>.2f)>5000,"Example media not visibly rendered.");File.WriteAllBytes(Path.Combine(directory,filename+"-native.png"),image.EncodeToPNG());camera.targetTexture=null;RenderTexture.active=previous;target.Release();DestroyImmediate(target);DestroyImmediate(image);
   while(!player.Session.Complete){player.ActivateWorldControl("tab-inspect");foreach(var id in player.Loaded.Manifest.phases.First(p=>p.id==player.Session.PhaseId).hotspotIds)player.ActivateWorldControl("select-"+id);player.ActivateWorldControl("tab-activity");foreach(var a in player.Loaded.Manifest.activities.Where(a=>a.phase==player.Session.PhaseId)){if(a.kind=="quiz")player.ActivateWorldControl("choice-0");else if(a.kind=="acknowledgement" || a.kind=="step")player.ActivateWorldControl("ack");else{player.ActivateWorldControl("write");player.ActivateWorldControl("key-A");player.ActivateWorldControl("done");player.ActivateWorldControl("submit");}activities++;}player.ActivateWorldControl("tab-media");player.ActivateWorldControl("view-next");yield return null;}PackageReader.Require(player.Events.Any(e=>e.type=="scenario.completed"),"Example completion missing.");count++;
  }
  File.WriteAllText(Path.Combine(directory,"native-verification.json"),"{\"passed\":true,\"actualStandalone\":true,\"packages\":"+count+",\"activities\":"+activities+",\"videoAdvanced\":"+videoAdvanced.ToString().ToLowerInvariant()+",\"physicalHeadset\":false}");Debug.Log("MILZET_COMMONS_PASS");Application.Quit(0);
 }
}
}
