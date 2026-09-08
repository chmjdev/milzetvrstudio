using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace Milzet.Content {
[DataContract] public class Asset { [DataMember(IsRequired=true)] public string id; [DataMember(IsRequired=true)] public string path; [DataMember(IsRequired=true)] public string mime; [DataMember(IsRequired=true)] public int bytes; [DataMember(IsRequired=true)] public string sha256; }
[DataContract] public class Plate { [DataMember(IsRequired=true)] public string assetId; [DataMember(IsRequired=true)] public string projection; }
[DataContract] public class Hotspot { [DataMember(IsRequired=true)] public string id; [DataMember(IsRequired=true)] public string label; [DataMember(IsRequired=true)] public string text; [DataMember(IsRequired=true)] public double x; [DataMember(IsRequired=true)] public double y; [DataMember(IsRequired=true)] public string narrationAssetId; [DataMember(IsRequired=true)] public bool evidence; }
[DataContract] public class Phase { [DataMember(IsRequired=true)] public string id; [DataMember(IsRequired=true)] public string[] hotspotIds; [DataMember(IsRequired=true)] public string next; [DataMember(IsRequired=true)] public string gate; }
[DataContract] public class Manifest { [DataMember(IsRequired=true)] public string id; [DataMember(IsRequired=true)] public string title; [DataMember(IsRequired=true)] public bool fixture; [DataMember(IsRequired=true)] public string entryPhase; [DataMember(IsRequired=true)] public Asset[] assets; [DataMember(IsRequired=true)] public Plate plate; [DataMember(IsRequired=true)] public Hotspot[] hotspots; [DataMember(IsRequired=true)] public Phase[] phases; }
[DataContract] public class PackageFile { [DataMember(IsRequired=true)] public string path; [DataMember(IsRequired=true)] public string base64; }
[DataContract] public class Envelope { [DataMember(IsRequired=true)] public int formatVersion; [DataMember(IsRequired=true)] public string kind; [DataMember(IsRequired=true)] public string manifest; [DataMember(IsRequired=true)] public string manifestSha256; [DataMember(IsRequired=true)] public PackageFile[] files; }
public class LoadedPackage { public Manifest Manifest; public string Revision; public Dictionary<string,byte[]> Assets; }
public static class PackageReader {
 public static void Require(bool ok,string message) { if(!ok)throw new InvalidDataException(message); }
 static bool Id(string x) { return x!=null && Regex.IsMatch(x,"^[a-zA-Z0-9-]{1,80}$"); }
 public static string Hash(byte[] bytes) { using(var hash=SHA256.Create())return BitConverter.ToString(hash.ComputeHash(bytes)).Replace("-","").ToLowerInvariant(); }
 static T Read<T>(string text) { using(var stream=new MemoryStream(Encoding.UTF8.GetBytes(text)))return (T)new DataContractJsonSerializer(typeof(T)).ReadObject(stream); }
 static XElement Tree(string text) { using(var reader=JsonReaderWriterFactory.CreateJsonReader(Encoding.UTF8.GetBytes(text),System.Xml.XmlDictionaryReaderQuotas.Max))return XElement.Load(reader); }
 static void Fields(XElement root,string names) { Require(root!=null && (string)root.Attribute("type")=="object" && String.Join(",",root.Elements().Select(x=>x.Name.LocalName).OrderBy(x=>x))==String.Join(",",names.Split(',').OrderBy(x=>x)),"Unexpected object fields."); }
 static void Shape(string envelope,string manifest) {
  var e=Tree(envelope);Fields(e,"formatVersion,kind,manifest,manifestSha256,files");foreach(var f in e.Element("files").Elements())Fields(f,"path,base64");
  var m=Tree(manifest);Fields(m,"id,title,fixture,entryPhase,assets,plate,hotspots,phases");Fields(m.Element("plate"),"assetId,projection");
  foreach(var a in m.Element("assets").Elements())Fields(a,"id,path,mime,bytes,sha256");
  foreach(var h in m.Element("hotspots").Elements())Fields(h,"id,label,text,x,y,narrationAssetId,evidence");
  foreach(var p in m.Element("phases").Elements())Fields(p,"id,hotspotIds,next,gate");
 }
 public static LoadedPackage Open(string text) {
  Require(text!=null && text.Length<=24000000,"Package exceeds 24 MB.");var e=Read<Envelope>(text);
  Require((e.formatVersion==1 || e.formatVersion==2) && e.kind=="milzet-playable" && e.manifest!=null,"Unsupported playable package.");
  Require(Hash(Encoding.UTF8.GetBytes(e.manifest))==e.manifestSha256,"Manifest checksum mismatch.");Shape(text,e.manifest);
  var m=Read<Manifest>(e.manifest);Validate(m);Require(e.formatVersion!=1 || m.plate.projection=="flat","Immersive projection requires package version 2.");
  Require(e.files!=null && e.files.Length==m.assets.Length,"Missing or extra assets.");var data=new Dictionary<string,byte[]>();
  foreach(var f in e.files) {
   var a=m.assets.FirstOrDefault(x=>x.path==f.path);Require(a!=null && !data.ContainsKey(a.id),"Unknown or duplicate file.");
   Require(f.base64!=null && f.base64.Length<=24000000 && Regex.IsMatch(f.base64,"^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$"),"Invalid asset encoding.");
   var bytes=Convert.FromBase64String(f.base64);Require(bytes.Length==a.bytes && Hash(bytes)==a.sha256,"Asset checksum mismatch.");
   Require(a.mime=="image/png" ? bytes.Length>=4 && bytes[0]==137 && bytes[1]==80 && bytes[2]==78 && bytes[3]==71 : a.mime=="image/jpeg" ? bytes.Length>=2 && bytes[0]==255 && bytes[1]==216 : bytes.Length>=12 && Encoding.ASCII.GetString(bytes,0,4)=="RIFF" && Encoding.ASCII.GetString(bytes,8,4)=="WAVE","Media signature mismatch.");if(a.mime=="audio/wav")PcmWave.Decode(bytes);data.Add(a.id,bytes);
  }
  var plate=m.assets.First(a=>a.id==m.plate.assetId);Projection.ValidateImage(data[plate.id],plate.mime,m.plate.projection);
  return new LoadedPackage{Manifest=m,Revision=e.manifestSha256,Assets=data};
 }
 static void Validate(Manifest m) {
  Require(Id(m.id) && !String.IsNullOrWhiteSpace(m.title) && m.title.Length<=120,"Invalid identity.");
  Require(m.assets!=null && m.assets.Length>=1 && m.assets.Length<=8,"Invalid asset count.");var ids=new HashSet<string>();var paths=new HashSet<string>();
  foreach(var a in m.assets) {
   Require(a!=null && Id(a.id) && ids.Add(a.id),"Invalid asset ID.");Require(a.path!=null && Regex.IsMatch(a.path,"^assets/[a-zA-Z0-9-]+\\.(png|jpg|wav)$") && paths.Add(a.path),"Unsafe asset path.");
   Require(new[]{"image/png","image/jpeg","audio/wav"}.Contains(a.mime) && a.bytes>0 && a.bytes<=12000000 && a.sha256!=null && Regex.IsMatch(a.sha256,"^[a-f0-9]{64}$"),"Invalid asset metadata.");
   Require(a.path.EndsWith(a.mime=="image/png"?".png":a.mime=="image/jpeg"?".jpg":".wav"),"Extension mismatch.");
  }
  Require(m.plate!=null && new[]{"flat","equirect180","equirect360"}.Contains(m.plate.projection) && m.assets.Any(a=>a.id==m.plate.assetId && a.mime.StartsWith("image/")),"Unsupported image projection.");
  Require(m.hotspots!=null && m.hotspots.Length>0 && m.hotspots.Length<=32,"Invalid hotspot count.");var hotspots=new HashSet<string>();
  foreach(var h in m.hotspots) {
   Require(h!=null && Id(h.id) && hotspots.Add(h.id),"Invalid hotspot ID.");Require(!String.IsNullOrEmpty(h.label) && h.label.Length<=80 && h.text!=null && h.text.Length<=2000,"Invalid hotspot text.");
   Require(!Double.IsNaN(h.x) && h.x>=0 && h.x<=1 && !Double.IsNaN(h.y) && h.y>=0 && h.y<=1,"Invalid anchor.");Require(h.narrationAssetId=="" || m.assets.Any(a=>a.id==h.narrationAssetId && a.mime=="audio/wav"),"Missing narration.");
  }
  Require(m.phases!=null && m.phases.Length>0 && m.phases.Length<=4,"Invalid phase subset.");var phases=new HashSet<string>(m.phases.Select(p=>p.id));Require(phases.Count==m.phases.Length && phases.Contains(m.entryPhase),"Invalid entry phase.");
  foreach(var p in m.phases) {
   Require(new[]{"induct","shadow","perform","prove"}.Contains(p.id),"Unknown phase.");Require(p.hotspotIds!=null && p.hotspotIds.Length>0 && p.hotspotIds.Distinct().Count()==p.hotspotIds.Length && p.hotspotIds.All(id=>hotspots.Contains(id)),"Invalid hotspot references.");
   Require((p.next=="" || phases.Contains(p.next) && p.next!=p.id) && new[]{"none","host"}.Contains(p.gate),"Invalid transition.");Require(p.next!="" || p.gate=="none","Final gate invalid.");
  }
  var visited=new HashSet<string>();var current=m.entryPhase;while(current!=""){Require(visited.Add(current),"Cyclic phases.");current=m.phases.First(p=>p.id==current).next;}Require(visited.Count==phases.Count,"Unreachable phase.");
 }
}
public class PackageSession {
 public string PhaseId {get;private set;} public bool Complete {get;private set;}
 readonly LoadedPackage package;readonly HashSet<string> seen=new HashSet<string>();readonly Action<string,string,string> emit;
 public PackageSession(LoadedPackage value,Action<string,string,string> callback) {package=value;PhaseId=value.Manifest.entryPhase;emit=callback;}
 public void Select(string id) {PackageReader.Require(!Complete,"Session complete.");var phase=package.Manifest.phases.First(p=>p.id==PhaseId);PackageReader.Require(phase.hotspotIds.Contains(id),"Inactive hotspot.");seen.Add(id);emit("hotspot.selected",PhaseId,id);if(package.Manifest.hotspots.First(h=>h.id==id).evidence)emit("evidence.requested",PhaseId,id);}
 public void Advance(Func<string,string,bool> authorize) {PackageReader.Require(!Complete,"Session complete.");var phase=package.Manifest.phases.First(p=>p.id==PhaseId);PackageReader.Require(phase.hotspotIds.All(id=>seen.Contains(id)),"Visit all hotspots.");if(phase.next!=""){PackageReader.Require(phase.gate!="host" || authorize(PhaseId,phase.next),"Host release required.");emit("phase.completed",PhaseId,"");PhaseId=phase.next;seen.Clear();emit("phase.started",PhaseId,"");}else{Complete=true;emit("scenario.completed",PhaseId,"");}}
}
}
