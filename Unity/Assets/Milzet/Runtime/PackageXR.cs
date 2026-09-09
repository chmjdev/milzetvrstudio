using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.XR;
using UnityEngine.XR;
using Unity.XR.CoreUtils;
namespace Milzet.Content {
public sealed partial class PackagePlayer {
 public XROrigin TrackedOrigin {get;private set;}
 public bool TrackedRigRequested;
 readonly List<InputAction> xrActions=new List<InputAction>();
 readonly List<Material> xrMaterials=new List<Material>();
 sealed class Pointer {public Transform space;public InputAction position,rotation,tracked,select,grab,near;public bool hand,armed;public LineRenderer line;}
 readonly List<Pointer> pointers=new List<Pointer>();
 InputAction moveInput,turnInput,menuInput;bool turnReady=true,initialMenuPlacement=true,inputFocused=true;
 Pointer menuOwner;Vector3 menuGrabOffset;Quaternion menuGrabRotation;bool menuGrip,handTapCandidate;Vector3 grabSourceStart;Ray handTapRay;
 public bool MenuGrabbed {get{return menuOwner!=null;}}
 InputAction Action(string name,string path,InputActionType type=InputActionType.Value){var action=new InputAction(name,type,path);action.Enable();xrActions.Add(action);return action;}
 public void EnableTrackedRig(){
  TrackedRigRequested=true;if(ViewCamera==null || TrackedOrigin!=null)return;
  var root=new GameObject("Milzet XR Origin");root.transform.SetParent(transform,false);root.SetActive(false);var offset=new GameObject("TrackingSpace");offset.transform.SetParent(root.transform,false);ViewCamera.name="CenterEyeAnchor";ViewCamera.transform.SetParent(offset.transform,false);ViewCamera.transform.localPosition=Vector3.zero;ViewCamera.transform.localRotation=Quaternion.identity;
  TrackedOrigin=root.AddComponent<XROrigin>();TrackedOrigin.Origin=root;TrackedOrigin.CameraFloorOffsetObject=offset;TrackedOrigin.Camera=ViewCamera;TrackedOrigin.RequestedTrackingOriginMode=XROrigin.TrackingOriginMode.Floor;TrackedOrigin.CameraYOffset=1.5f;
  var pose=ViewCamera.gameObject.AddComponent<TrackedPoseDriver>();pose.positionInput=new InputActionProperty(Action("Head position","<XRHMD>/centerEyePosition"));pose.rotationInput=new InputActionProperty(Action("Head rotation","<XRHMD>/centerEyeRotation"));pose.trackingStateInput=new InputActionProperty(Action("Head tracking","<XRHMD>/trackingState"));root.SetActive(true);
#if UNITY_ANDROID && !UNITY_EDITOR
  pose.enabled=false;foreach(var action in xrActions)action.Enable();var manager=root.AddComponent<OVRManager>();manager.trackingOriginType=OVRManager.TrackingOrigin.FloorLevel;root.AddComponent<OVRCameraRig>();ViewCamera.tag="MainCamera";
#endif
  foreach(var hand in new[]{"LeftHand","RightHand"}){string prefix="<OculusTouchController>{"+hand+"}/";var go=new GameObject(hand+" aim");go.transform.SetParent(offset.transform,false);var line=go.AddComponent<LineRenderer>();line.positionCount=2;line.useWorldSpace=false;line.SetPositions(new[]{Vector3.zero,Vector3.forward*4});line.widthMultiplier=.004f;var material=new Material(Shader.Find("Unlit/Color")){color=new Color(.55f,.82f,1)};xrMaterials.Add(material);line.sharedMaterial=material;pointers.Add(new Pointer{space=go.transform,line=line,position=Action(hand+" aim position",prefix+"pointerPosition"),rotation=Action(hand+" aim rotation",prefix+"pointerRotation"),tracked=Action(hand+" tracked",prefix+"isTracked"),select=Action(hand+" select",prefix+"triggerPressed",InputActionType.Button),grab=Action(hand+" grip",prefix+"gripPressed",InputActionType.Button)});}
  foreach(var hand in new[]{"LeftHand","RightHand"}){string prefix="<HandInteraction>{"+hand+"}/";var go=new GameObject(hand+" pinch aim");go.transform.SetParent(offset.transform,false);var line=go.AddComponent<LineRenderer>();line.positionCount=2;line.useWorldSpace=false;line.SetPositions(new[]{Vector3.zero,Vector3.forward*4});line.widthMultiplier=.004f;line.sharedMaterial=xrMaterials[0];pointers.Add(new Pointer{space=go.transform,line=line,hand=true,position=Action(hand+" hand aim",prefix+"pointerPosition"),rotation=Action(hand+" hand rotation",prefix+"pointerRotation"),tracked=Action(hand+" hand tracked",prefix+"pointer/isTracked"),select=Action(hand+" pinch",prefix+"pinchValue",InputActionType.Button),grab=Action(hand+" grasp",prefix+"graspValue",InputActionType.Button),near=Action(hand+" pinch position",prefix+"pinchPosition")});}
  moveInput=Action("Move","<OculusTouchController>{LeftHand}/thumbstick");turnInput=Action("Turn","<OculusTouchController>{RightHand}/thumbstick");menuInput=Action("Menu here","<OculusTouchController>{RightHand}/secondaryButton",InputActionType.Button);
  ShowWorldControls(!SetupRequired || SetupVisible);initialMenuPlacement=true;Message="Point and press trigger. Left stick moves; right stick turns. B brings the menu here.";Debug.Log("MILZET_XR_READY");
 }
 public void MoveViewer(Vector2 input,float seconds){if(TrackedOrigin==null || input.sqrMagnitude<.04f)return;var forward=Vector3.ProjectOnPlane(ViewCamera.transform.forward,Vector3.up).normalized;var right=Vector3.Cross(Vector3.up,forward);TrackedOrigin.transform.position+=(forward*input.y+right*input.x)*Mathf.Min(seconds,.05f)*1.2f;}
 public void TurnViewer(float degrees){if(TrackedOrigin!=null)TrackedOrigin.transform.RotateAround(ViewCamera.transform.position,Vector3.up,degrees);}
 public void ResetViewerPosition(){if(TrackedOrigin!=null){TrackedOrigin.transform.position=Vector3.zero;TrackedOrigin.transform.rotation=Quaternion.identity;}RecenterWorldControls();}
 void UpdateTrackedRig(){
  if(TrackedOrigin==null && ViewCamera!=null && (TrackedRigRequested || XRSettings.isDeviceActive))EnableTrackedRig();
  if(TrackedOrigin==null)return;
  bool focused=inputFocused;
#if UNITY_ANDROID && !UNITY_EDITOR
  focused=focused && OVRManager.hasInputFocus && OVRManager.hasVrFocus;
#endif
  if(!focused || (SetupRequired && !SetupVisible && !SetupConfirmed)){ResetPointerInput();return;}
  MoveViewer(moveInput.ReadValue<Vector2>(),Time.unscaledDeltaTime);float turn=turnInput.ReadValue<Vector2>().x;if(Mathf.Abs(turn)<.3f)turnReady=true;else if(turnReady && Mathf.Abs(turn)>.7f){TurnViewer(Mathf.Sign(turn)*30);turnReady=false;}
  if(initialMenuPlacement && (!SetupRequired || SetupConfirmed) && HeadTracked()){RecenterWorldControls();PlaceInitialDisplay();initialMenuPlacement=false;}
  if(menuInput.WasPressedThisFrame()){ShowWorldControls(true);RecenterWorldControls();}
  foreach(var p in pointers){bool valid=p.tracked.ReadValue<float>()>.5f;p.line.enabled=valid;if(!valid){p.armed=false;if(menuOwner==p)EndMenuGrab();continue;}p.space.localPosition=p.position.ReadValue<Vector3>();p.space.localRotation=p.rotation.ReadValue<Quaternion>();var ray=new Ray(p.space.position,p.space.forward);p.line.SetPosition(1,Vector3.forward*PointerDistance(ray));
   if(!p.armed){if(!p.select.IsPressed() && (p.hand || !p.grab.IsPressed()))p.armed=true;continue;}
   var dragPosition=p.hand?p.space.parent.TransformPoint(p.near.ReadValue<Vector3>()):p.space.position;
   if(menuOwner==p){if(!(menuGrip?p.grab:p.select).IsPressed()){bool tap=handTapCandidate;var tapRay=handTapRay;EndMenuGrab();if(tap)Try(()=>SelectRay(tapRay));}else{if(handTapCandidate && Vector3.Distance(grabSourceStart,dragPosition)>.05f)handTapCandidate=false;if(!handTapCandidate){if(p.hand)MoveHandGrab(dragPosition);else MoveMenuGrab(p.space);}}continue;}
   bool press=p.select.WasPressedThisFrame(),grip=!p.hand && p.grab.WasPressedThisFrame();if((grip || (p.hand && press)) && menuOwner==null && (grabbedPanel=HitPanel(ray,p.hand?p.space.parent.TransformPoint(p.near.ReadValue<Vector3>()):p.space.position))!=null){menuOwner=p;menuGrip=grip;handTapCandidate=p.hand && !grip;grabSourceStart=dragPosition;handTapRay=ray;menuGrabOffset=p.hand?grabbedPanel.target.position-dragPosition:p.space.InverseTransformPoint(grabbedPanel.target.position);menuGrabRotation=p.hand?grabbedPanel.target.rotation:Quaternion.Inverse(p.space.rotation)*grabbedPanel.target.rotation;Debug.Log("MILZET_MENU_GRAB "+p.space.name+" panel="+grabbedPanel.key+" position="+grabbedPanel.target.position+" select="+p.select.ReadValue<float>()+" grasp="+p.grab.ReadValue<float>()+" gripMode="+menuGrip);continue;}
   if(press && menuOwner==null){Debug.Log("MILZET_TRIGGER "+p.space.name);Try(()=>SelectRay(ray));}}
 }
 public bool MenuHandleHit(Ray ray,Vector3 nearPoint){if(WorldControls==null || !WorldControls.gameObject.activeSelf)return false;var rt=(RectTransform)WorldControls.transform;var local=rt.InverseTransformPoint(nearPoint);if(Mathf.Abs(local.z)<115 && Mathf.Abs(local.x)<530 && local.y>=394 && local.y<=466)return true;var plane=new Plane(-rt.forward,rt.position);if(!plane.Raycast(ray,out float distance) || distance<0 || distance>4)return false;local=rt.InverseTransformPoint(ray.GetPoint(distance));return Mathf.Abs(local.x)<530 && local.y>=394 && local.y<=466;}
 void MoveHandGrab(Vector3 position){if(grabbedPanel?.target==null || !grabbedPanel.target.gameObject.activeInHierarchy){EndMenuGrab();return;}grabbedPanel.target.SetPositionAndRotation(position+menuGrabOffset,menuGrabRotation);}
 void ResetPointerInput(){EndMenuGrab();foreach(var p in pointers){p.armed=false;p.line.enabled=false;}}
 void MoveMenuGrab(Transform source){if(grabbedPanel?.target==null || !grabbedPanel.target.gameObject.activeInHierarchy){EndMenuGrab();return;}grabbedPanel.target.SetPositionAndRotation(source.TransformPoint(menuGrabOffset),source.rotation*menuGrabRotation);}
 void EndMenuGrab(){if(menuOwner!=null)Debug.Log("MILZET_MENU_RELEASE panel="+grabbedPanel?.key+" position="+grabbedPanel?.target.position);if(grabbedPanel?.target!=null)panelPoses[grabbedPanel.key]=new Pose(grabbedPanel.target.position,grabbedPanel.target.rotation);menuOwner=null;grabbedPanel=null;handTapCandidate=false;}
 void OnApplicationFocus(bool focused){inputFocused=focused;if(!focused)ResetPointerInput();}
 void OnApplicationPause(bool paused){if(paused)ResetPointerInput();}
 void ClearTrackedRig(){foreach(var action in xrActions)action.Dispose();xrActions.Clear();pointers.Clear();foreach(var material in xrMaterials)DestroyImmediate(material);xrMaterials.Clear();if(TrackedOrigin!=null)DestroyImmediate(TrackedOrigin.gameObject);TrackedOrigin=null;}
}
}
