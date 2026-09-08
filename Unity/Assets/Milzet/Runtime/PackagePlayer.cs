using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using UnityEngine;
namespace Milzet.Content {
[Serializable] public class HostEvent {
 public string eventId;public string packageId;public string revision;public string phase;public string type;public string hotspotId;
}
public sealed class PackagePlayer : MonoBehaviour {
 public LoadedPackage Loaded {get;private set;}
 public PackageSession Session {get;private set;}
 public Camera ViewCamera {get;private set;}
 public AudioSource Narration {get;private set;}
 public Texture2D PlateTexture {get;private set;}
 public readonly List<HostEvent> Events=new List<HostEvent>();
 public readonly Dictionary<string,GameObject> Markers=new Dictionary<string,GameObject>();
 public readonly Dictionary<string,AudioClip> Clips=new Dictionary<string,AudioClip>();
 public bool SimulatedHostRelease;
 public Func<string,string,bool> Authorize;
 public event Action<HostEvent> HostEventEmitted;
 public string SelectedId {get;private set;}="";
 public string Message {get;private set;}="Open a portable Milzet package to begin.";
 readonly List<UnityEngine.Object> owned=new List<UnityEngine.Object>();
 GameObject content;string sessionId;int sequence;string packagePath="";Vector2 scroll;float yaw,pitch;
 public void OpenFile(string path) {var info=new FileInfo(path);PackageReader.Require(info.Length<=24000000,"Package exceeds 24 MB.");Open(File.ReadAllText(path));packagePath=path;}
 public void Open(string text) {
  var next=PackageReader.Open(text);var texture=new Texture2D(2,2,TextureFormat.RGBA32,false);var clips=new Dictionary<string,AudioClip>();
  try {PackageReader.Require(ImageConversion.LoadImage(texture,next.Assets[next.Manifest.plate.assetId]),"Unable to decode image plate.");foreach(var asset in next.Manifest.assets.Where(a=>a.mime=="audio/wav"))clips.Add(asset.id,WaveDecoder.Decode(next.Assets[asset.id],asset.id));}
  catch{DestroyImmediate(texture);foreach(var clip in clips.Values)DestroyImmediate(clip);throw;}
  Clear();Loaded=next;PlateTexture=texture;owned.Add(texture);foreach(var clip in clips){Clips.Add(clip.Key,clip.Value);owned.Add(clip.Value);}Events.Clear();sequence=0;sessionId=Guid.NewGuid().ToString("N");SimulatedHostRelease=false;SelectedId="";yaw=0;pitch=0;
  Session=new PackageSession(next,(type,phase,id)=>{var e=new HostEvent{eventId=sessionId+":"+(++sequence),packageId=next.Manifest.id,revision=next.Revision,phase=phase,type=type,hotspotId=id};Events.Add(e);HostEventEmitted?.Invoke(e);});
  content=new GameObject("Milzet generated preview");content.transform.SetParent(transform,false);
  ViewCamera=new GameObject("Package camera").AddComponent<Camera>();ViewCamera.transform.SetParent(content.transform,false);ViewCamera.transform.position=new Vector3(0,1.5f,next.Manifest.plate.projection=="flat"?-1:0);ViewCamera.transform.rotation=Quaternion.identity;ViewCamera.fieldOfView=60;ViewCamera.nearClipPlane=.1f;ViewCamera.farClipPlane=100;ViewCamera.clearFlags=CameraClearFlags.SolidColor;ViewCamera.backgroundColor=new Color(21/255f,42/255f,39/255f);ViewCamera.gameObject.AddComponent<AudioListener>();
  Narration=content.AddComponent<AudioSource>();Narration.playOnAwake=false;Narration.spatialBlend=0;Narration.volume=.25f;
  Mesh mesh=new Mesh{name="Package plate quad"};mesh.vertices=new[]{new Vector3(-2,-1.2f,0),new Vector3(2,-1.2f,0),new Vector3(2,1.2f,0),new Vector3(-2,1.2f,0)};mesh.uv=new[]{new Vector2(0,0),new Vector2(1,0),new Vector2(1,1),new Vector2(0,1)};mesh.triangles=new[]{0,2,1,0,3,2};mesh.RecalculateNormals();mesh.RecalculateBounds();if(next.Manifest.plate.projection!="flat"){DestroyImmediate(mesh);mesh=ProjectionMesh.Create(next.Manifest.plate.projection);}owned.Add(mesh);
  var plate=new GameObject("Image plate");plate.transform.SetParent(content.transform,false);plate.transform.position=next.Manifest.plate.projection=="flat"?new Vector3(0,1.5f,2):Vector3.zero;plate.AddComponent<MeshFilter>().sharedMesh=mesh;var shader=Shader.Find("Unlit/Texture");PackageReader.Require(shader!=null,"Unlit/Texture shader missing.");var material=new Material(shader){mainTexture=texture};owned.Add(material);plate.AddComponent<MeshRenderer>().sharedMaterial=material;
  foreach(var h in next.Manifest.hotspots) {var marker=GameObject.CreatePrimitive(PrimitiveType.Sphere);marker.name=h.id;marker.transform.SetParent(content.transform,false);marker.transform.position=Anchor(h,next.Manifest.plate.projection);marker.transform.localScale=Vector3.one*.13f;var colorShader=Shader.Find("Unlit/Color");PackageReader.Require(colorShader!=null,"Unlit/Color shader missing.");var mat=new Material(colorShader){color=new Color(214/255f,248/255f,149/255f)};owned.Add(mat);marker.GetComponent<Renderer>().sharedMaterial=mat;Markers.Add(h.id,marker);}
  Physics.SyncTransforms();Message="Package loaded. Desktop visual preview; no headset acceptance.";
 }
 public static Vector3 Anchor(Hotspot h,string projection="flat") {var p=Projection.Anchor(h.x,h.y,projection);return new Vector3((float)p[0],(float)p[1],(float)p[2]);}
 public bool SelectRay(Ray ray) {if(Physics.Raycast(ray,out var hit,100)){var marker=Markers.FirstOrDefault(p=>p.Value==hit.collider.gameObject);if(marker.Value!=null){Select(marker.Key);return true;}}return false;}
 public void SetView(float heading,float elevation){yaw=heading;pitch=Mathf.Clamp(elevation,-89,89);ViewCamera.transform.rotation=Quaternion.Euler(-pitch,yaw,0);}
 public void Select(string id) {Session.Select(id);SelectedId=id;Message=Loaded.Manifest.hotspots.First(h=>h.id==id).text;}
 public void Advance() {Session.Advance((from,to)=>Authorize!=null?Authorize(from,to):SimulatedHostRelease);SelectedId="";Message=Session.Complete?"Test scenario completed; local host event recorded.":"Phase advanced.";}
 public void PlaySelectedAudio() {PackageReader.Require(Loaded!=null && SelectedId!="","Select a hotspot first.");string id=Loaded.Manifest.hotspots.First(h=>h.id==SelectedId).narrationAssetId;PackageReader.Require(Clips.ContainsKey(id),"No supported narration clip.");Narration.clip=Clips[id];Narration.Play();}
 void Try(Action action){try{action();}catch(Exception e){Message=e.Message;}}
 void OnGUI() {
  float width=Mathf.Min(350,Screen.width-24);if(Loaded!=null && Event.current.type==EventType.MouseDown && Event.current.mousePosition.x>width+24){Vector2 p=Event.current.mousePosition;Try(()=>SelectRay(ViewCamera.ScreenPointToRay(new Vector3(p.x,Screen.height-p.y,0))));}
 GUILayout.BeginArea(new Rect(12,12,width,Screen.height-24),GUI.skin.box);scroll=GUILayout.BeginScrollView(scroll);GUILayout.Label("MILZET / NATIVE PACKAGE PREVIEW");packagePath=GUILayout.TextField(packagePath);if(GUILayout.Button("Open local package"))Try(()=>OpenFile(packagePath));
  if(Loaded!=null){GUILayout.Label(Loaded.Manifest.title);if(Loaded.Manifest.plate.projection!="flat"){GUILayout.Label("Look direction");float heading=GUILayout.HorizontalSlider(yaw,-180,180);float elevation=GUILayout.HorizontalSlider(pitch,-89,89);SetView(heading,elevation);}if(Loaded.Manifest.fixture)GUILayout.Label("TEST FIXTURE — NOT CLIENT INSTRUCTION");GUILayout.Label("Phase: "+Session.PhaseId);foreach(var id in Loaded.Manifest.phases.First(p=>p.id==Session.PhaseId).hotspotIds){if(GUILayout.Button(Loaded.Manifest.hotspots.First(h=>h.id==id).label))Try(()=>Select(id));}SimulatedHostRelease=GUILayout.Toggle(SimulatedHostRelease,"Simulate host release (test host)");GUI.enabled=!Session.Complete;if(GUILayout.Button("Continue phase"))Try(Advance);GUI.enabled=true;if(GUILayout.Button("Play package audio"))Try(PlaySelectedAudio);GUILayout.Label("Host events: "+Events.Count);}
  GUILayout.Label(Message);GUILayout.EndScrollView();GUILayout.EndArea();
 }
 public void Clear() {if(Narration!=null)Narration.Stop();if(content!=null)DestroyImmediate(content);foreach(var item in owned)if(item!=null)DestroyImmediate(item);owned.Clear();Markers.Clear();Clips.Clear();Loaded=null;Session=null;}
 void OnDestroy(){Clear();}
}
}
