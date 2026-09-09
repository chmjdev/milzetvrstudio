using System;
using System.Linq;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
namespace Milzet.Content {
public sealed partial class PackagePlayer {
 readonly Dictionary<string,Texture2D> OverlayTextures=new Dictionary<string,Texture2D>();
 public readonly Dictionary<string,GameObject> OverlayObjects=new Dictionary<string,GameObject>();
 public DemonstrationPlayback DemoPlayback {get;private set;}
 public AudioSource DemoNarration {get;private set;}
 public GameObject GuideCursor {get;private set;}
 public LineRenderer GuideLine {get;private set;}
 public string DemoCueText {get;private set;}="";
 public string DemoHighlight {get;private set;}="";
 string demoPhase="";
 static Vector3 ScenePosition(double[] v){return new Vector3((float)v[0],(float)v[1],-(float)v[2]);}
 static RectTransform RectChild(string name,Transform parent,Vector2 size,Vector2 position){var go=new GameObject(name,typeof(RectTransform));var rt=go.GetComponent<RectTransform>();rt.SetParent(parent,false);rt.localScale=Vector3.one;rt.sizeDelta=size;rt.anchoredPosition=position;return rt;}
 public static TMP_Text WorldText(string name,Transform parent,string text,Vector2 size,Vector2 position){var rt=RectChild(name,parent,size,position);var tmp=rt.gameObject.AddComponent<TextMeshProUGUI>();tmp.text=text;tmp.font=TMP_Settings.defaultFontAsset;tmp.fontSize=48;tmp.enableAutoSizing=false;tmp.richText=false;tmp.textWrappingMode=TextWrappingModes.Normal;tmp.color=new Color(.93f,.96f,.88f);tmp.alignment=TextAlignmentOptions.TopLeft;tmp.raycastTarget=false;return tmp;}
 Vector3 GuidePosition(double[] value){var point=ScenePosition(value);if(flatDisplay==null)return point;point-=new Vector3(0,1.5f,2);var scale=flatDisplay.Find("Image plate").localScale;return new Vector3(point.x*scale.x,point.y*scale.y,-.04f);}
 void BuildPresentation(){
  var p=Loaded.Manifest.presentation;if(p==null)return;
  foreach(var o in p.overlays){
   var go=new GameObject("Overlay "+o.id,typeof(RectTransform),typeof(Canvas));go.transform.SetParent(content.transform,false);go.GetComponent<Canvas>().renderMode=RenderMode.WorldSpace;var rt=go.GetComponent<RectTransform>();rt.position=ScenePosition(o.position);rt.rotation=Quaternion.AngleAxis(-(float)o.rotation[0],Vector3.right)*Quaternion.AngleAxis(-(float)o.rotation[1],Vector3.up)*Quaternion.AngleAxis((float)o.rotation[2],Vector3.forward);rt.localScale=Vector3.one*.001f;rt.sizeDelta=new Vector2(Mathf.Max(480,(float)o.size[0]*1000),Mathf.Max(360,(float)o.size[1]*1000));
   if(TrackedOrigin!=null)PlaceInitialReference(rt,OverlayObjects.Count);
   RoundedImage(RectChild("Background",rt,rt.sizeDelta,Vector2.zero).gameObject,new Color(.035f,.045f,.055f));RegisterPanel(rt,rt,"overlay-"+Loaded.Manifest.id+"-"+o.id);
   BuildReferenceCard(rt,o);
   OverlayObjects.Add(o.id,go);
  }
  var d=p.demonstration;if(d==null){UpdatePresentation();return;}DemoPlayback=new DemonstrationPlayback(d);demoPhase=Session.PhaseId;
  DemoNarration=content.AddComponent<AudioSource>();DemoNarration.playOnAwake=false;DemoNarration.spatialBlend=0;DemoNarration.volume=.25f;if(d.narrationAssetId!="")DemoNarration.clip=Clips[d.narrationAssetId];
  if(d.path.Length>0){var path=new GameObject("Client guide path");path.transform.SetParent(flatDisplay??content.transform,false);GuideLine=path.AddComponent<LineRenderer>();GuideLine.useWorldSpace=flatDisplay==null;GuideLine.positionCount=d.path.Length;GuideLine.SetPositions(d.path.Select(p=>GuidePosition(p.position)).ToArray());GuideLine.widthMultiplier=.008f;var material=new Material(Shader.Find("Unlit/Color")){color=new Color(.47f,.86f,.94f)};owned.Add(material);GuideLine.sharedMaterial=material;GuideCursor=GameObject.CreatePrimitive(PrimitiveType.Sphere);GuideCursor.name="Guide cursor";GuideCursor.transform.SetParent(flatDisplay??content.transform,false);GuideCursor.transform.localScale=Vector3.one*.08f;DestroyImmediate(GuideCursor.GetComponent<Collider>());GuideCursor.GetComponent<Renderer>().sharedMaterial=material;}
  UpdatePresentation();
 }
 readonly Dictionary<RectTransform,Action> referenceActions=new Dictionary<RectTransform,Action>();
 void BuildReferenceCard(RectTransform rt,Overlay o){
  float width=rt.sizeDelta.x,height=rt.sizeDelta.y,padding=Mathf.Min(24,width*.05f),inner=width-padding*2,top=height/2-padding;
  bool hasImage=o.imageAssetId!="",hasText=o.text!="" || o.citation!="";bool duplicate=hasImage && Loaded.Manifest.assets.First(a=>a.id==o.imageAssetId).sha256==Loaded.Manifest.assets.First(a=>a.id==Loaded.Manifest.plate.assetId).sha256;
  var header=WorldText("Reference heading",rt,duplicate?"REFERENCE · SAME SOURCE IMAGE":"REFERENCE",new Vector2(inner,44),new Vector2(0,top-22));header.fontSize=28;header.color=new Color(.6f,.82f,.87f);top-=60;
  float available=Mathf.Max(80,height-padding*2-60),imageHeight=hasImage?(hasText?available*.46f:available):0;
  if(hasImage){var texture=OverlayTextures[o.imageAssetId];RoundedImage(RectChild("Diagram inset",rt,new Vector2(inner,imageHeight),new Vector2(0,top-imageHeight/2)).gameObject,new Color(.075f,.12f,.13f));float scale=Mathf.Min((inner-24)/texture.width,Mathf.Max(1,imageHeight-24)/texture.height);var image=RectChild("Client diagram",rt,new Vector2(texture.width*scale,texture.height*scale),new Vector2(0,top-imageHeight/2)).gameObject.AddComponent<RawImage>();image.texture=texture;image.raycastTarget=false;top-=imageHeight+16;}
  if(hasText){float bodyHeight=Mathf.Max(50,top+height/2-padding-54);var body=WorldText("Client reference",rt,o.text+(o.citation==""?"":"\n"+o.citation),new Vector2(inner,bodyHeight),new Vector2(0,top-bodyHeight/2));body.fontSize=30;body.overflowMode=TextOverflowModes.Page;body.ForceMeshUpdate();body.pageToDisplay=1;
   if(body.textInfo.pageCount>1){var button=RectChild("Reference read more",rt,new Vector2(Mathf.Min(inner,320),48),new Vector2(0,-height/2+padding+24));RoundedImage(button.gameObject,new Color(.075f,.22f,.27f));var label=WorldText("Page",button,"Read more · 1 / "+body.textInfo.pageCount,new Vector2(button.sizeDelta.x-20,42),Vector2.zero);label.fontSize=26;label.alignment=TextAlignmentOptions.Center;referenceActions[button]=()=>{body.pageToDisplay=body.pageToDisplay%body.textInfo.pageCount+1;label.text="Read more · "+body.pageToDisplay+" / "+body.textInfo.pageCount;};}
  }
 }
 bool SelectReferenceControls(Ray ray){foreach(var pair in referenceActions){var rt=pair.Key;if(rt==null || !rt.gameObject.activeInHierarchy)continue;var plane=new Plane(-rt.forward,rt.position);if(plane.Raycast(ray,out float distance) && distance>=0 && distance<=PointerDistance(ray)+.002f && rt.rect.Contains(rt.InverseTransformPoint(ray.GetPoint(distance)))){pair.Value();return true;}}return false;}
 public void ToggleDemonstration(){
  var d=Loaded?.Manifest.presentation?.demonstration;PackageReader.Require(d!=null && Session.PhaseId==d.phase,"Demonstration is outside the active phase.");
  if(DemoPlayback.Playing){PauseDemonstration();return;}
  PackageReader.Require(Video==null || d.duration<=Video.length+.1,"Demonstration exceeds video duration.");PackageReader.Require(DemoNarration.clip==null || d.duration<=DemoNarration.clip.length+.1,"Demonstration exceeds narration duration.");DemoPlayback.Play();if(Video!=null){Video.time=DemoPlayback.Time;Video.Play();}if(DemoNarration.clip!=null){DemoNarration.time=(float)DemoPlayback.Time;DemoNarration.Play();}
 }
 public void PauseDemonstration(){DemoPlayback?.Pause();Video?.Pause();DemoNarration?.Pause();}
 public void SeekDemonstration(double time){PackageReader.Require(DemoPlayback!=null,"No demonstration loaded.");DemoPlayback.Seek(time);if(Video!=null){Video.Pause();Video.time=time;}if(DemoNarration!=null && DemoNarration.clip!=null){DemoNarration.Pause();DemoNarration.time=(float)Math.Min(time,Math.Max(0,DemoNarration.clip.length-.001f));}UpdatePresentation();}
 void UpdatePresentation(){
  var p=Loaded?.Manifest.presentation;if(p==null)return;var d=p.demonstration;
  if(DemoPlayback!=null){if(demoPhase!=Session.PhaseId){demoPhase=Session.PhaseId;SeekDemonstration(0);}
   if(DemoPlayback.Playing){DemoPlayback.Tick(Video==null?Math.Min(1,Time.unscaledDeltaTime):Math.Max(0,Video.time-DemoPlayback.Time));if(!DemoPlayback.Playing){Video?.Pause();DemoNarration?.Pause();if(Video!=null)Video.time=DemoPlayback.Time;}
    if(DemoNarration.clip!=null && Math.Abs(DemoNarration.time-DemoPlayback.Time)>(DemoPlayback.Playing?.15:.001))DemoNarration.time=(float)Math.Min(DemoPlayback.Time,Math.Max(0,DemoNarration.clip.length-.001f));}
  }
  double time=DemoPlayback?.Time??0;
  foreach(var o in p.overlays)OverlayObjects[o.id].SetActive((o.phase=="" || o.phase==Session.PhaseId) && time>=o.startTime && (o.endTime==0 || time<=o.endTime));
  bool active=d!=null && d.phase==Session.PhaseId;var cue=active?d.cues.LastOrDefault(c=>c.time<=time):null;DemoCueText=cue?.text??"";DemoHighlight=cue?.hotspotId??"";
  foreach(var marker in Markers){bool selected=marker.Key==DemoHighlight;marker.Value.transform.localScale=Vector3.one*(selected?.1755f:.13f);marker.Value.GetComponent<Renderer>().sharedMaterial.color=selected?new Color(1,.78f,.4f):new Color(214/255f,248/255f,149/255f);}
  if(GuideLine!=null)GuideLine.gameObject.SetActive(active);if(GuideCursor!=null){GuideCursor.SetActive(active);if(active)GuideCursor.transform.localPosition=GuidePosition(PresentationContract.Position(d,time));}
 }
 void ClearPresentation(){referenceActions.Clear();DemoNarration?.Stop();OverlayObjects.Clear();OverlayTextures.Clear();DemoPlayback=null;DemoNarration=null;GuideLine=null;GuideCursor=null;DemoCueText="";DemoHighlight="";demoPhase="";}
 void PresentationGUI(){if(!DemonstrationActive)return;GUILayout.Label("Demonstration");if(GUILayout.Button(DemoPlayback.Playing?"Pause demonstration":"Play demonstration"))Try(ToggleDemonstration);float seek=GUILayout.HorizontalSlider((float)DemoPlayback.Time,0,(float)Loaded.Manifest.presentation.demonstration.duration);if(Math.Abs(seek-DemoPlayback.Time)>.1)Try(()=>SeekDemonstration(seek));GUILayout.Label(DemoCueText);}
}
}
