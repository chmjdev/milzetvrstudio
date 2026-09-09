using System;
using System.Linq;
using System.Threading.Tasks;
using UnityEngine;
using Meta.XR.MRUtilityKit;
namespace Milzet.Content {
public sealed partial class PackagePlayer {
 public enum RoomState {NotScanned,Scanning,Ready,Denied,Unavailable,Failed}
 public RoomState RoomStatus {get;private set;}
 public string RoomMessage {get;private set;}="Scan your room to place spatial content.";
 public Vector3 RoomCenter {get;private set;}
 public Func<Task<Tuple<RoomState,Vector3>>> RoomScanOverride;
 MRUK roomProvider;int roomGeneration;
 public async void ScanRoom(){await ScanRoomAsync();}
 public async Task ScanRoomAsync(){if(RoomStatus==RoomState.Scanning)return;int generation=++roomGeneration;RoomStatus=RoomState.Scanning;RoomMessage="Complete the headset's Space Setup, then return here.";worldKey="";
  try{var result=RoomScanOverride!=null?await RoomScanOverride():await CaptureDeviceRoom();if(this==null || generation!=roomGeneration)return;RoomStatus=result.Item1;RoomCenter=result.Item2;
   RoomMessage=RoomStatus==RoomState.Ready?"Room data loaded. Headset boundary remains active.":RoomStatus==RoomState.Denied?"Room access declined. Retry room setup or continue without room placement.":"No usable room was loaded. Setup may have been cancelled. Retry or continue without room placement.";
   if(RoomStatus==RoomState.Ready){ApplyRoomPlacement();WorldTab("packages");}Debug.Log("MILZET_ROOM_RESULT "+RoomStatus+" center="+RoomCenter);
  }catch(Exception e){if(this==null)return;RoomStatus=RoomState.Failed;RoomMessage="Room setup unavailable. Retry or continue without room placement.";Debug.LogWarning("MILZET_ROOM_FAILURE "+e.Message);}finally{if(this!=null)worldKey="";}
 }
 async Task<Tuple<RoomState,Vector3>> CaptureDeviceRoom(){
#if UNITY_ANDROID && !UNITY_EDITOR
  const string permission="com.oculus.permission.USE_SCENE";
  if(!UnityEngine.Android.Permission.HasUserAuthorizedPermission(permission)){var response=new TaskCompletionSource<bool>();var callbacks=new UnityEngine.Android.PermissionCallbacks();callbacks.PermissionGranted+=_=>response.TrySetResult(true);callbacks.PermissionDenied+=_=>response.TrySetResult(false);callbacks.PermissionDeniedAndDontAskAgain+=_=>response.TrySetResult(false);UnityEngine.Android.Permission.RequestUserPermission(permission,callbacks);if(!await response.Task)return Tuple.Create(RoomState.Denied,Vector3.zero);}
  bool setup=await OVRScene.RequestSpaceSetup();if(!setup)return Tuple.Create(RoomState.Unavailable,Vector3.zero);
  if(roomProvider==null){var go=new GameObject("Milzet room provider");go.SetActive(false);go.transform.SetParent(transform,false);roomProvider=go.AddComponent<MRUK>();roomProvider.EnableWorldLock=false;roomProvider.SceneSettings=new MRUK.MRUKSettings{DataSource=MRUK.SceneDataSource.Device,LoadSceneOnStartup=false};go.SetActive(true);}
  var loaded=await roomProvider.LoadSceneFromDevice(requestSceneCaptureIfNoDataFound:false);var room=roomProvider.GetCurrentRoom();if(loaded!=MRUK.LoadDeviceResult.Success || room==null)return Tuple.Create(RoomState.Unavailable,Vector3.zero);
  var floor=room.FloorAnchors.Where(f=>f.PlaneBoundary2D!=null && f.PlaneBoundary2D.Count>=3).OrderByDescending(f=>f.PlaneRect.HasValue?f.PlaneRect.Value.width*f.PlaneRect.Value.height:0).FirstOrDefault();if(floor==null)return Tuple.Create(RoomState.Unavailable,Vector3.zero);
  var polygon=floor.PlaneBoundary2D.Select(p=>floor.transform.TransformPoint(new Vector3(p.x,p.y,0))).ToArray();float floorY=polygon.Average(p=>p.y);
  bool Clear(Vector3 point){point.y=floorY+1.2f;return new[]{Vector3.zero,Vector3.up*.35f,Vector3.down*.35f,Vector3.left*.3f,Vector3.right*.3f,Vector3.forward*.3f,Vector3.back*.3f}.All(offset=>!room.IsPositionInSceneVolume(point+offset));}
  if(!RoomPlacementMath.TryFindCenter(polygon,Clear,out var center))return Tuple.Create(RoomState.Unavailable,Vector3.zero);center.y=floorY+1.2f;return Tuple.Create(RoomState.Ready,center);
#else
  await Task.Yield();return Tuple.Create(RoomState.Unavailable,Vector3.zero);
#endif
 }
 void RoomControls(ref string body,Action<string,string,Action,bool> add){body=RoomMessage;add("room-retry","Scan room",ScanRoom,RoomStatus!=RoomState.Scanning);add("room-continue",RoomStatus==RoomState.Ready?"Choose lesson":"Continue without room",()=>WorldTab("packages"),RoomStatus!=RoomState.Scanning);add("setup","Comfort setup",ShowSetup,RoomStatus!=RoomState.Scanning);}
 void ApplyRoomPlacement(){if(RoomStatus!=RoomState.Ready || content==null || ModelObjects.Count==0 || content.transform.Find("Room placed models")!=null)return;var stage=new GameObject("Room placed models").transform;stage.SetParent(content.transform,false);foreach(var model in ModelObjects.Values)model.transform.SetParent(stage,true);stage.position=RoomCenter-new Vector3(0,1.5f,0);Physics.SyncTransforms();}
}
}
