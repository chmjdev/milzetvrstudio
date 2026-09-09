using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Playables;
using TMPro;
namespace Milzet.Content {
public sealed partial class PackagePlayer {
 public bool SetupRequired,SetupConfirmed;
 public int PreferredHand {get;private set;}=1;
 public bool Seated {get;private set;}
 public bool SetupVisible {get;private set;}
 int pendingHand;bool pendingSeated;Transform setupCameraParent;
 public float ComfortableReach=>Seated?.85f:1f;
 public static Pose ComfortablePanelPose(Vector3 eye,Vector3 heading,int hand,bool seated,bool menu){var forward=Vector3.ProjectOnPlane(heading,Vector3.up).normalized;if(forward.sqrMagnitude<.1f)forward=Vector3.forward;float reach=seated?.85f:1f;var right=Vector3.Cross(Vector3.up,forward);var position=eye+forward*(menu?1.1f:1.6f)*reach+right*(menu?.85f*(hand==0?-1:1)*reach:0)-Vector3.up*(menu?.08f:.15f);return new Pose(position,Quaternion.LookRotation(menu?Vector3.ProjectOnPlane(position-eye,Vector3.up):forward,Vector3.up));}
 public IEnumerator RunStartup(){
  SetupRequired=true;SetupConfirmed=false;PreferredHand=PlayerPrefs.GetInt("milzet.preferred-hand",1);Seated=PlayerPrefs.GetInt("milzet.seated",0)==1;
  if(Application.platform==RuntimePlatform.Android){EnableTrackedRig();ShowWorldControls(false);float nextLog=0;while(!HeadTracked()){if(Time.realtimeSinceStartup>=nextLog){Debug.Log("MILZET_BOOT_WAIT_HEAD");nextLog=Time.realtimeSinceStartup+3;}yield return null;}Debug.Log("MILZET_BOOT_HEAD_READY");}
  ShowWorldControls(false);var cameraParent=ViewCamera.transform.parent;bool detach=content!=null && ViewCamera.transform.IsChildOf(content.transform);if(detach)ViewCamera.transform.SetParent(transform,true);if(content!=null)content.SetActive(false);
  var prefab=Resources.Load<GameObject>("StudioStartup");PackageReader.Require(prefab!=null,"Original Studio startup asset is missing.");var splash=Instantiate(prefab);var eye=ViewCamera.transform.position;var pose=ComfortablePanelPose(eye,ViewCamera.transform.forward,PreferredHand,Seated,false);splash.transform.SetPositionAndRotation(eye-Vector3.up*1.4f,pose.rotation);
  foreach(var text in splash.GetComponentsInChildren<TMP_Text>(true)){if(text.name=="Title")text.text="BINTECA · MILZET VR STUDIO";text.raycastTarget=false;}
  foreach(var graphic in splash.GetComponentsInChildren<UnityEngine.UI.Graphic>(true))graphic.raycastTarget=false;
  var director=splash.transform.Find("Timeline").GetComponent<PlayableDirector>();director.timeUpdateMode=DirectorUpdateMode.UnscaledGameTime;director.time=0;director.Play();Debug.Log("MILZET_BOOT_TIMELINE duration="+director.duration);double duration=director.duration;for(float t=0;t<(float)duration;t+=Time.unscaledDeltaTime)yield return null;Destroy(splash);
  if(content!=null)content.SetActive(true);if(detach)ViewCamera.transform.SetParent(cameraParent,true);ShowSetup();
 }
 bool HeadTracked(){
#if UNITY_ANDROID && !UNITY_EDITOR
  return OVRPlugin.GetNodePositionTracked(OVRPlugin.Node.EyeCenter) && OVRPlugin.GetNodeOrientationTracked(OVRPlugin.Node.EyeCenter);
#else
  var pose=ViewCamera?.GetComponent<UnityEngine.InputSystem.XR.TrackedPoseDriver>();return pose!=null && (pose.trackingStateInput.action.ReadValue<int>() & 3)==3;
#endif
 }
 public void ShowSetup(){if(content!=null){if(ViewCamera.transform.IsChildOf(content.transform)){setupCameraParent=ViewCamera.transform.parent;ViewCamera.transform.SetParent(transform,true);}content.SetActive(false);}SetupVisible=true;pendingHand=PreferredHand;pendingSeated=Seated;ShowWorldControls(true);WorldTab("setup");var forward=Vector3.ProjectOnPlane(ViewCamera.transform.forward,Vector3.up).normalized;if(forward.sqrMagnitude<.1f)forward=Vector3.forward;WorldControls.transform.SetPositionAndRotation(ViewCamera.transform.position+forward*1.1f,Quaternion.LookRotation(forward));EndMenuGrab();UpdateWorldControls();}
 public void ConfirmSetup(){bool first=!SetupConfirmed;PreferredHand=pendingHand;Seated=pendingSeated;PlayerPrefs.SetInt("milzet.preferred-hand",PreferredHand);PlayerPrefs.SetInt("milzet.seated",Seated?1:0);PlayerPrefs.Save();SetupVisible=false;SetupConfirmed=true;if(content!=null)content.SetActive(true);if(setupCameraParent!=null){ViewCamera.transform.SetParent(setupCameraParent,true);setupCameraParent=null;}RecenterWorldControls();if(first)PlaceInitialDisplay();WorldTab("room");Debug.Log("MILZET_SETUP_CONFIRMED hand="+PreferredHand+" seated="+Seated);ScanRoom();}
 void StartupControls(ref string body,Action<string,string,Action,bool> add){body="BINTECA · MILZET VR STUDIO\nMake yourself comfortable. Choose your preferred hand and playing position. Point and pinch, or press the controller trigger.";add("setup-left",pendingHand==0?"Left hand · ON":"Left hand",()=>pendingHand=0,true);add("setup-right",pendingHand==1?"Right hand · ON":"Right hand",()=>pendingHand=1,true);add("setup-sit",pendingSeated?"Sitting · ON":"Sitting",()=>pendingSeated=true,true);add("setup-stand",!pendingSeated?"Standing · ON":"Standing",()=>pendingSeated=false,true);add("setup-enter","Enter Studio",ConfirmSetup,true);}
 void PlaceInitialDisplay(bool recall=false){if(flatDisplay==null || ViewCamera==null || (TrackedOrigin==null && !SetupConfirmed))return;string key="display-"+Loaded.Manifest.id;if(!recall && panelPoses.ContainsKey(key))return;var pose=ComfortablePanelPose(ViewCamera.transform.position,ViewCamera.transform.forward,PreferredHand,Seated,false);flatDisplay.SetPositionAndRotation(pose.position,pose.rotation);Physics.SyncTransforms();}
 void PlaceInitialReference(RectTransform panel,int index){if(ViewCamera==null)return;var pose=ComfortablePanelPose(ViewCamera.transform.position,ViewCamera.transform.forward,PreferredHand==0?1:0,Seated,true);panel.SetPositionAndRotation(pose.position-Vector3.up*(index*.12f),pose.rotation);}
}
}
