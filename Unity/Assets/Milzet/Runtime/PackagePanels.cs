using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
namespace Milzet.Content {
public sealed partial class PackagePlayer {
 sealed class MovablePanel {public Transform target;public RectTransform handle;public string key;}
 readonly List<MovablePanel> panels=new List<MovablePanel>();
 readonly Dictionary<string,Pose> panelPoses=new Dictionary<string,Pose>();
 MovablePanel grabbedPanel;
 Transform flatDisplay;
 public float DisplayWidth {get;private set;}=2.4f;
 static Sprite roundedSprite;
 static Sprite RoundedSprite(){if(roundedSprite!=null)return roundedSprite;var texture=new Texture2D(64,64,TextureFormat.RGBA32,false);texture.wrapMode=TextureWrapMode.Clamp;for(int y=0;y<64;y++)for(int x=0;x<64;x++){float dx=Mathf.Max(14-x,0,x-49),dy=Mathf.Max(14-y,0,y-49);texture.SetPixel(x,y,new Color(1,1,1,Mathf.Clamp01(14-Mathf.Sqrt(dx*dx+dy*dy))));}texture.Apply();roundedSprite=Sprite.Create(texture,new Rect(0,0,64,64),new Vector2(.5f,.5f),100,0,SpriteMeshType.FullRect,new Vector4(16,16,16,16));return roundedSprite;}
 static Image RoundedImage(GameObject go,Color color){var image=go.AddComponent<Image>();image.sprite=RoundedSprite();image.type=Image.Type.Sliced;image.color=color;image.raycastTarget=false;return image;}
 void RegisterPanel(Transform target,RectTransform handle,string key){var existing=panels.Find(p=>p.target==target);if(existing!=null){existing.handle=handle;return;}panels.RemoveAll(p=>p.target==null);panels.Add(new MovablePanel{target=target,handle=handle,key=key});if(panelPoses.TryGetValue(key,out var pose))target.SetPositionAndRotation(pose.position,pose.rotation);}
 MovablePanel HitPanel(Ray ray,Vector3 near){MovablePanel best=null;float nearest=4;foreach(var panel in panels){if(panel.target==null || !panel.target.gameObject.activeInHierarchy || panel.handle==null)continue;var rt=panel.handle;var local=rt.InverseTransformPoint(near);if(rt.rect.Contains(local) && Mathf.Abs(local.z)*rt.lossyScale.z<.08f)return panel;var plane=new Plane(-rt.forward,rt.position);if(plane.Raycast(ray,out float distance) && distance>=0 && distance<nearest && rt.rect.Contains(rt.InverseTransformPoint(ray.GetPoint(distance)))){nearest=distance;best=panel;}}return best;}
 public float PointerDistance(Ray ray){float nearest=4;if(Physics.Raycast(ray,out var hit,nearest))nearest=hit.distance;
  void RectHit(RectTransform rt){if(rt==null || !rt.gameObject.activeInHierarchy)return;var plane=new Plane(-rt.forward,rt.position);if(plane.Raycast(ray,out float distance) && distance>=0 && distance<nearest && rt.rect.Contains(rt.InverseTransformPoint(ray.GetPoint(distance))))nearest=distance;}
  if(WorldControls!=null)RectHit((RectTransform)WorldControls.transform);foreach(var panel in panels){RectHit(panel.handle);if(panel.target is RectTransform rect)RectHit(rect);}
  if(flatDisplay!=null){var plane=new Plane(-flatDisplay.forward,flatDisplay.position);if(plane.Raycast(ray,out float distance) && distance>=0 && distance<nearest){var point=flatDisplay.InverseTransformPoint(ray.GetPoint(distance));if(Mathf.Abs(point.x)<=2 && Mathf.Abs(point.y)<=1.2f)nearest=distance;}}return nearest;
 }
 public void SetDisplayWidth(float width){DisplayWidth=Mathf.Clamp(width,1.2f,4);if(flatDisplay!=null)flatDisplay.localScale=Vector3.one*(DisplayWidth/4);Physics.SyncTransforms();worldKey="";}
 void BuildDisplayHandle(){if(flatDisplay==null)return;var surface=new GameObject("Display grab surface",typeof(RectTransform));surface.transform.SetParent(flatDisplay,false);var rt=(RectTransform)surface.transform;rt.sizeDelta=new Vector2(4,2.4f);RegisterPanel(flatDisplay,rt,"display-"+Loaded.Manifest.id);SetDisplayWidth(DisplayWidth);}
 void SavePanelPoses(){foreach(var panel in panels)if(panel.target!=null)panelPoses[panel.key]=new Pose(panel.target.position,panel.target.rotation);}
 static Mesh RoundedPlate(){var vertices=new List<Vector3>{Vector3.zero};var uv=new List<Vector2>{new Vector2(.5f,.5f)};const float r=.09f;for(int corner=0;corner<4;corner++){var center=new Vector2(corner==0 || corner==3?2-r:-2+r,corner<2?1.2f-r:-1.2f+r);for(int step=0;step<=8;step++){float angle=(corner*90+step*90f/8)*Mathf.Deg2Rad;var p=center+new Vector2(Mathf.Cos(angle),Mathf.Sin(angle))*r;vertices.Add(p);uv.Add(new Vector2((p.x+2)/4,(p.y+1.2f)/2.4f));}}var triangles=new List<int>();for(int i=1;i<vertices.Count;i++)triangles.AddRange(new[]{0,i==vertices.Count-1?1:i+1,i});var mesh=new Mesh{name="Rounded lesson display"};mesh.SetVertices(vertices);mesh.SetUVs(0,uv);mesh.SetTriangles(triangles,0);mesh.RecalculateNormals();mesh.RecalculateBounds();return mesh;}
}
}
