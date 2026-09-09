using System;
using System.Linq;
using System.Collections.Generic;
using System.Runtime.Serialization;
namespace Milzet.Content {
[DataContract] public class Activity {
 [DataMember(IsRequired=true)] public string id;
 [DataMember(IsRequired=true)] public string phase;
 [DataMember(IsRequired=true)] public string kind;
 [DataMember(IsRequired=true)] public string prompt;
 [DataMember(IsRequired=true)] public string[] choices;
 [DataMember(IsRequired=true)] public string hint;
 [DataMember(IsRequired=true)] public int maxHints;
 [DataMember(IsRequired=true)] public double startTime;
 [DataMember(IsRequired=true)] public double endTime;
 [DataMember(IsRequired=true)] public string citation;
}
public static class ActivityContract {
 public static void Validate(Manifest m){
  if(m.activities==null)return;PackageReader.Require(m.activities.Length<=64,"Too many activities.");var ids=new HashSet<string>();
  foreach(var a in m.activities){
   PackageReader.Require(a!=null && a.id!=null && System.Text.RegularExpressions.Regex.IsMatch(a.id,"^[a-zA-Z0-9-]{1,80}$") && ids.Add(a.id),"Invalid activity ID.");
   PackageReader.Require(m.phases.Any(p=>p.id==a.phase) && new[]{"acknowledgement","step","quiz","observation","field"}.Contains(a.kind) && !String.IsNullOrWhiteSpace(a.prompt) && a.prompt.Length<=2000 && a.citation!=null && a.citation.Length<=500,"Invalid activity content.");
   PackageReader.Require(a.choices!=null && a.choices.Length<=8 && a.choices.All(c=>!String.IsNullOrWhiteSpace(c) && c.Length<=200) && a.choices.Distinct().Count()==a.choices.Length && (a.kind=="quiz"?a.choices.Length>=2:a.choices.Length==0),"Invalid choices.");
   PackageReader.Require(a.hint!=null && a.hint.Length<=1000 && a.maxHints>=0 && a.maxHints<=3 && (a.phase!="prove" || a.hint=="" && a.maxHints==0),"Invalid hint budget; Prove cannot contain hints.");
   PackageReader.Require(!Double.IsNaN(a.startTime) && !Double.IsNaN(a.endTime) && a.startTime>=0 && a.startTime<=3600 && a.endTime>=0 && a.endTime<=3600 && (a.endTime==0 || a.endTime>a.startTime),"Invalid activity time.");
   if(a.startTime>0 || a.endTime>0){var d=m.presentation?.demonstration;if(d!=null && d.phase==a.phase)PackageReader.Require(a.startTime<=d.duration && a.endTime<=d.duration,"Activity exceeds demonstration duration.");else PackageReader.Require(m.assets.Any(x=>x.id==m.plate.assetId && x.mime=="video/mp4"),"Timed activity requires a clip or a demonstration in this phase.");}
  }
 }
}
}
