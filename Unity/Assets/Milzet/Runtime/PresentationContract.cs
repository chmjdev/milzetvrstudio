using System;
using System.Linq;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Text.RegularExpressions;
using System.Xml.Linq;
namespace Milzet.Content {
[DataContract] public class Overlay { [DataMember(IsRequired=true)] public string id; [DataMember(IsRequired=true)] public string kind; [DataMember(IsRequired=true)] public string text; [DataMember(IsRequired=true)] public string imageAssetId; [DataMember(IsRequired=true)] public double[] position; [DataMember(IsRequired=true)] public double[] rotation; [DataMember(IsRequired=true)] public double[] size; [DataMember(IsRequired=true)] public string phase; [DataMember(IsRequired=true)] public double startTime; [DataMember(IsRequired=true)] public double endTime; [DataMember(IsRequired=true)] public string citation; }
[DataContract] public class GuidePoint { [DataMember(IsRequired=true)] public double time; [DataMember(IsRequired=true)] public double[] position; }
[DataContract] public class DemonstrationCue { [DataMember(IsRequired=true)] public string id; [DataMember(IsRequired=true)] public double time; [DataMember(IsRequired=true)] public string hotspotId; [DataMember(IsRequired=true)] public string text; [DataMember(IsRequired=true)] public bool pause; }
[DataContract] public class Demonstration { [DataMember(IsRequired=true)] public string phase; [DataMember(IsRequired=true)] public double duration; [DataMember(IsRequired=true)] public string narrationAssetId; [DataMember(IsRequired=true)] public GuidePoint[] path; [DataMember(IsRequired=true)] public DemonstrationCue[] cues; }
[DataContract] public class Presentation { [DataMember(IsRequired=true)] public Overlay[] overlays; [DataMember(IsRequired=true)] public Demonstration demonstration; }
public static class PresentationContract {
 static void Need(bool ok,string message){PackageReader.Require(ok,message);}
 static bool Number(double n,double min,double max){return !Double.IsNaN(n) && !Double.IsInfinity(n) && n>=min && n<=max;}
 static bool Vector(double[] value,int length,double min,double max){return value!=null && value.Length==length && value.All(n=>Number(n,min,max));}
 static bool Id(string value){return value!=null && Regex.IsMatch(value,"^[a-zA-Z0-9-]{1,80}$");}
 static bool Text(string value,int max){return value!=null && value.Length<=max;}
 public static void Shape(XElement value){
  if(value==null)return;PackageReader.Fields(value,"overlays,demonstration");foreach(var o in value.Element("overlays").Elements())PackageReader.Fields(o,"id,kind,text,imageAssetId,position,rotation,size,phase,startTime,endTime,citation");
  var d=value.Element("demonstration");if((string)d.Attribute("type")=="null")return;PackageReader.Fields(d,"phase,duration,narrationAssetId,path,cues");foreach(var p in d.Element("path").Elements())PackageReader.Fields(p,"time,position");foreach(var c in d.Element("cues").Elements())PackageReader.Fields(c,"id,time,hotspotId,text,pause");
 }
 public static void Validate(Manifest m){
  var value=m.presentation;if(value==null)return;Need(value.overlays!=null && value.overlays.Length<=16,"Invalid overlay count.");var ids=new HashSet<string>();
  foreach(var o in value.overlays){Need(o!=null && Id(o.id) && ids.Add(o.id),"Invalid overlay ID.");Need(new[]{"label","diagram","sop","ppe","limits"}.Contains(o.kind) && Text(o.text,1200) && Text(o.citation,1000),"Invalid overlay text.");Need(o.imageAssetId=="" || m.assets.Any(a=>a.id==o.imageAssetId && a.mime.StartsWith("image/")),"Missing overlay image.");Need(!String.IsNullOrWhiteSpace(o.text) || o.imageAssetId!="","Empty overlay.");Need(Vector(o.position,3,-20,20) && Vector(o.rotation,3,-360,360) && Vector(o.size,2,.1,5),"Invalid overlay transform.");Need(o.phase=="" || m.phases.Any(p=>p.id==o.phase),"Invalid overlay phase.");Need(Number(o.startTime,0,600) && Number(o.endTime,0,600) && (o.endTime==0 || o.endTime>o.startTime),"Invalid overlay time window.");}
  var d=value.demonstration;if(d==null){Need(value.overlays.All(o=>o.startTime==0 && o.endTime==0),"Timed overlays need a demonstration.");return;}
  Need(m.phases.Any(p=>p.id==d.phase) && Number(d.duration,.1,600),"Invalid demonstration phase or duration.");Need(d.narrationAssetId=="" || m.assets.Any(a=>a.id==d.narrationAssetId && a.mime=="audio/wav"),"Missing demonstration narration.");Need(d.path!=null && d.path.Length<=64 && (d.path.Length==0 || d.path.Length>=2),"Invalid guide path count.");double last=-1;foreach(var p in d.path){Need(p!=null && Number(p.time,0,d.duration) && p.time>last && Vector(p.position,3,-20,20),"Invalid guide point.");last=p.time;}Need(d.path.Length==0 || d.path[0].time==0,"Guide path must start at zero.");
  Need(d.cues!=null && d.cues.Length<=32,"Invalid cue count.");last=-1;ids.Clear();foreach(var c in d.cues){Need(c!=null && Id(c.id) && ids.Add(c.id) && Number(c.time,0,d.duration) && c.time>last && Text(c.text,1200),"Invalid demonstration cue.");last=c.time;Need(c.hotspotId=="" || m.phases.First(p=>p.id==d.phase).hotspotIds.Contains(c.hotspotId),"Cue hotspot is outside demonstration phase.");}
  Need(value.overlays.All(o=>o.startTime<=d.duration && o.endTime<=d.duration && (o.startTime==0 && o.endTime==0 || o.phase==d.phase)),"Invalid timed overlay phase or duration.");
 }
 public static double[] Position(Demonstration d,double time){
  if(d==null || d.path.Length==0)return null;int end=Array.FindIndex(d.path,p=>p.time>time);if(end<0)return d.path.Last().position.ToArray();if(end==0)return d.path[0].position.ToArray();var a=d.path[end-1];var b=d.path[end];double f=(time-a.time)/(b.time-a.time);return a.position.Select((n,i)=>n+(b.position[i]-n)*f).ToArray();
 }
}
public sealed class DemonstrationPlayback {
 readonly Demonstration demo;readonly HashSet<string> paused=new HashSet<string>();public double Time {get;private set;}public bool Playing {get;private set;}
 public DemonstrationPlayback(Demonstration d){demo=d;}
 public void Play(){if(Time>=demo.duration){Time=0;paused.Clear();}Playing=true;}
 public void Pause(){Playing=false;}
 public void Seek(double time){PackageReader.Require(!Double.IsNaN(time) && time>=0 && time<=demo.duration,"Invalid demonstration seek.");Time=time;Playing=false;paused.Clear();foreach(var c in demo.cues.Where(c=>c.time<=time))paused.Add(c.id);}
 public DemonstrationCue Tick(double delta){PackageReader.Require(!Double.IsNaN(delta) && delta>=0 && delta<=600,"Invalid demonstration delta.");if(!Playing)return null;double next=Math.Min(demo.duration,Time+delta);var cue=demo.cues.FirstOrDefault(c=>c.pause && c.time>=Time && c.time<=next && !paused.Contains(c.id));if(cue!=null){Time=cue.time;paused.Add(cue.id);Playing=false;}else{Time=next;if(Time>=demo.duration)Playing=false;}return cue;}
}
}
