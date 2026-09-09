using System;
using System.Collections;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using UnityEditor;
using UnityEngine;
using TMPro;
using Milzet.Content;
namespace Milzet.Editor {
public static class StartupVerification {
 public static void StartCheck(PackagePlayer player,string output){player.StartCoroutine(Guard(Check(player,output)));}
 static IEnumerator Guard(IEnumerator task){while(true){bool more;try{more=task.MoveNext();}catch(Exception e){Debug.LogException(e);EditorApplication.Exit(1);yield break;}if(!more)yield break;yield return task.Current;}}
 static void CaptureAnimation(Camera camera,string path){var target=new RenderTexture(1200,720,24);target.Create();var active=RenderTexture.active;var previous=camera.targetTexture;float aspect=camera.aspect;try{camera.targetTexture=target;camera.aspect=1200f/720;camera.Render();RenderTexture.active=target;var image=new Texture2D(1200,720,TextureFormat.RGB24,false);image.ReadPixels(new Rect(0,0,1200,720),0,0);image.Apply();File.WriteAllBytes(path,image.EncodeToPNG());UnityEngine.Object.DestroyImmediate(image);}finally{camera.targetTexture=previous;camera.aspect=aspect;RenderTexture.active=active;target.Release();UnityEngine.Object.DestroyImmediate(target);}}
 static IEnumerator Check(PackagePlayer player,string output){
  int oldHand=PlayerPrefs.GetInt("milzet.preferred-hand",1),oldPosture=PlayerPrefs.GetInt("milzet.seated",0);bool hadHand=PlayerPrefs.HasKey("milzet.preferred-hand"),hadPosture=PlayerPrefs.HasKey("milzet.seated");
  try{
   var headBefore=new Pose(player.ViewCamera.transform.position,player.ViewCamera.transform.rotation);var startup=player.RunStartup();float began=Time.realtimeSinceStartup;bool captured=false;
   while(startup.MoveNext()){if(!captured && Time.realtimeSinceStartup-began>1.2f){CaptureAnimation(player.ViewCamera,Path.Combine(output,"startup-animation.png"));captured=true;}yield return startup.Current;}
   yield return null;
   PackageReader.Require(captured && player.SetupVisible && player.WorldButtons.ContainsKey("setup-enter"),"Original animated boot did not lead to setup.");
   player.ViewCamera.transform.LookAt(player.WorldControls.transform.position);StandaloneVerification.CaptureVisibleControls(player,Path.Combine(output,"startup-preferences.png"));player.ViewCamera.transform.rotation=headBefore.rotation;
   player.ActivateWorldControl("setup-left");player.ActivateWorldControl("setup-sit");PackageReader.Require(PlayerPrefs.GetInt("milzet.preferred-hand",1)==oldHand && PlayerPrefs.GetInt("milzet.seated",0)==oldPosture,"Unconfirmed setup changed saved preferences.");
   player.RoomScanOverride=()=>Task.FromResult(Tuple.Create(PackagePlayer.RoomState.Denied,Vector3.zero));player.ActivateWorldControl("setup-enter");yield return null;
   PackageReader.Require(player.PreferredHand==0 && player.Seated && player.SetupConfirmed && PlayerPrefs.GetInt("milzet.seated")==1,"Setup confirmation did not save choices.");PackageReader.Require(player.RoomStatus==PackagePlayer.RoomState.Denied && player.WorldButtons.ContainsKey("room-retry") && player.WorldButtons.ContainsKey("room-continue"),"Denied room access lacks retry/continue.");
   PackageReader.Require(Vector3.Distance(player.ViewCamera.transform.position,headBefore.position)<.001f,"Setup changed tracked head position.");
   player.RoomScanOverride=()=>Task.FromResult(Tuple.Create(PackagePlayer.RoomState.Unavailable,Vector3.zero));var scan=player.ScanRoomAsync();while(!scan.IsCompleted)yield return null;PackageReader.Require(player.RoomStatus==PackagePlayer.RoomState.Unavailable,"Cancelled/missing scene was accepted.");
   player.RoomScanOverride=()=>Task.FromResult(Tuple.Create(PackagePlayer.RoomState.Ready,new Vector3(1,1.2f,2)));scan=player.ScanRoomAsync();while(!scan.IsCompleted)yield return null;PackageReader.Require(player.RoomStatus==PackagePlayer.RoomState.Ready && player.RoomCenter==new Vector3(1,1.2f,2),"Room retry did not recover.");
   foreach(bool seated in new[]{false,true})foreach(int hand in new[]{0,1}){var eye=new Vector3(3,seated?1.05f:1.75f,-2);var panel=PackagePlayer.ComfortablePanelPose(eye,Vector3.forward,hand,seated,false);var menu=PackagePlayer.ComfortablePanelPose(eye,Vector3.forward,hand,seated,true);PackageReader.Require(Mathf.Abs(panel.position.y-(eye.y-.15f))<.001f && Mathf.Abs(panel.position.x-eye.x)<.001f,"Display is not centered at the actual eye height.");PackageReader.Require(Mathf.Sign(menu.position.x-eye.x)==(hand==0?-1:1),"Hand preference did not mirror placement.");}
   var polygon=new[]{new Vector3(-2,0,-2),new Vector3(2,0,-2),new Vector3(2,0,2),new Vector3(-2,0,2)};PackageReader.Require(RoomPlacementMath.TryFindCenter(polygon,_=>true,out var center) && RoomPlacementMath.Contains(polygon,center),"Valid room placement failed.");PackageReader.Require(!RoomPlacementMath.TryFindCenter(polygon,_=>false,out center),"Obstructed room was accepted.");
   player.ActivateWorldControl("tab-inspect");var hotspot=player.Loaded.Manifest.hotspots[0];string original=hotspot.text;hotspot.text=String.Join("\n",Enumerable.Range(0,30).Select(i=>"Workplace reference line "+i+": inspect the documented context."));player.Select(hotspot.id);player.ActivateWorldControl("tab-inspect");var prompt=player.WorldControls.GetComponentsInChildren<TMP_Text>().First(t=>t.name=="Prompt");prompt.ForceMeshUpdate();PackageReader.Require(prompt.textInfo.pageCount>1 && prompt.pageToDisplay==1,"Long text did not paginate.");player.ActivateWorldControl("text");prompt=player.WorldControls.GetComponentsInChildren<TMP_Text>().First(t=>t.name=="Prompt");PackageReader.Require(prompt.pageToDisplay==2,"Read more did not advance a wrapped page.");hotspot.text=original;
   File.WriteAllText(Path.Combine(output,"startup-verification.json"),"{\"passed\":true,\"originalAnimatedBoot\":true,\"confirmedPreferences\":true,\"seatedStandingPlacement\":true,\"trackedHeadUnchanged\":true,\"roomDeniedUnavailableRetry\":true,\"roomGeometryValidation\":true,\"longTextPages\":true,\"roomBackend\":\"simulated results; physical scan pending\",\"physicalHeadset\":false}");Debug.Log("MILZET_STARTUP_PASS");
  }finally{if(hadHand)PlayerPrefs.SetInt("milzet.preferred-hand",oldHand);else PlayerPrefs.DeleteKey("milzet.preferred-hand");if(hadPosture)PlayerPrefs.SetInt("milzet.seated",oldPosture);else PlayerPrefs.DeleteKey("milzet.seated");PlayerPrefs.Save();}
  EditorApplication.Exit(0);
 }
}
}
