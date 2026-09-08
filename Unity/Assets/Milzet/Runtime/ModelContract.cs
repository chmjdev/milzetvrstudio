using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Xml.Linq;
using System.Collections.Generic;
namespace Milzet.Content {
[DataContract] public class SceneObject {
 [DataMember(IsRequired=true)] public string id;
 [DataMember(IsRequired=true)] public string label;
 [DataMember(IsRequired=true)] public string assetId;
 [DataMember(IsRequired=true)] public string parentId;
 [DataMember(IsRequired=true)] public double[] position;
 [DataMember(IsRequired=true)] public double[] rotation;
 [DataMember(IsRequired=true)] public double[] scale;
 [DataMember(IsRequired=true)] public bool visible;
 [DataMember(IsRequired=true)] public string hotspotId;
}
public static class ModelContract {
 public static void Validate(Manifest m){
  if(m.objects==null)return;PackageReader.Require(m.objects.Length<=16 && m.objects.Select(o=>o.id).Distinct().Count()==m.objects.Length,"Invalid object count/IDs.");
  foreach(var o in m.objects){
   PackageReader.Require(o!=null && !String.IsNullOrWhiteSpace(o.label) && o.label.Length<=80 && m.assets.Any(a=>a.id==o.assetId && a.mime=="model/gltf-binary"),"Invalid model reference.");
   foreach(var values in new[]{o.position,o.rotation,o.scale})PackageReader.Require(values!=null && values.Length==3 && values.All(v=>!Double.IsNaN(v) && !Double.IsInfinity(v)),"Invalid object transform.");
   PackageReader.Require(o.position.All(v=>Math.Abs(v)<=100) && o.rotation.All(v=>Math.Abs(v)<=360) && o.scale.All(v=>v>=.001 && v<=100),"Object transform exceeds bounds.");
   PackageReader.Require(o.hotspotId=="" || m.hotspots.Any(h=>h.id==o.hotspotId),"Missing model hotspot.");
   var visited=new HashSet<string>{o.id};string parent=o.parentId;while(parent!=""){PackageReader.Require(parent!=null && visited.Add(parent),"Invalid object hierarchy.");var p=m.objects.FirstOrDefault(x=>x.id==parent);PackageReader.Require(p!=null,"Missing parent.");parent=p.parentId;}
  }
 }
 public static void Glb(byte[] bytes){
  PackageReader.Require(bytes.Length>=20 && BitConverter.ToUInt32(bytes,0)==0x46546c67 && BitConverter.ToUInt32(bytes,4)==2 && BitConverter.ToUInt32(bytes,8)==bytes.Length && BitConverter.ToUInt32(bytes,16)==0x4e4f534a,"Invalid GLB 2.0 container.");
  int length=(int)BitConverter.ToUInt32(bytes,12);PackageReader.Require(length>0 && length<=bytes.Length-20,"Invalid GLB JSON length.");
  XElement tree;using(var reader=JsonReaderWriterFactory.CreateJsonReader(bytes,20,length,Encoding.UTF8,System.Xml.XmlDictionaryReaderQuotas.Max,null))tree=XElement.Load(reader);
  foreach(var item in new[]{"buffers","images"})foreach(var element in tree.Element(item)?.Elements()??Enumerable.Empty<XElement>()){var uri=element.Element("uri");PackageReader.Require(uri==null || uri.Value.StartsWith("data:"),"GLB resources must be embedded.");}
  foreach(var extension in tree.Element("extensionsRequired")?.Elements()??Enumerable.Empty<XElement>())PackageReader.Require(new[]{"KHR_materials_unlit","KHR_texture_transform"}.Contains(extension.Value),"Unsupported required GLB extension.");
  var accessors=tree.Element("accessors")?.Elements().ToArray()??new XElement[0];long vertices=0;
  foreach(var mesh in tree.Element("meshes")?.Elements()??Enumerable.Empty<XElement>())foreach(var primitive in mesh.Element("primitives")?.Elements()??Enumerable.Empty<XElement>()){int index;PackageReader.Require(Int32.TryParse(primitive.Element("attributes")?.Element("POSITION")?.Value,out index) && index>=0 && index<accessors.Length,"Missing vertex accessor.");vertices+=Int32.Parse(accessors[index].Element("count").Value);}
  PackageReader.Require(vertices>0 && vertices<=200000,"Model vertex budget exceeded.");
 }
}
}
