using System;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using System.Runtime.Serialization;
using System.Text.RegularExpressions;
namespace Milzet.Content {
[DataContract] public class ExperienceEnvelope { [DataMember(IsRequired=true)] public int formatVersion; [DataMember(IsRequired=true)] public string kind; [DataMember(IsRequired=true)] public string manifest; [DataMember(IsRequired=true)] public string manifestSha256; }
[DataContract] public class ExperienceScene { [DataMember(IsRequired=true)] public string id; [DataMember(IsRequired=true)] public string next; [DataMember(IsRequired=true)] public string gate; [DataMember(Name="package",IsRequired=true)] public string packageText; }
[DataContract] public class ExperienceManifest { [DataMember(IsRequired=true)] public string id; [DataMember(IsRequired=true)] public string title; [DataMember(IsRequired=true)] public string entryScene; [DataMember(IsRequired=true)] public ExperienceScene[] scenes; }
public class LoadedExperience { public ExperienceManifest Manifest;public string Revision;public Dictionary<string,LoadedPackage> Packages; }
public static class ExperienceReader {
 public static bool IsExperience(string text){PackageReader.Require(text!=null && text.Length<=120000000,"Experience exceeds 120 MB.");return PackageReader.Tree(text).Element("kind")?.Value=="milzet-experience";}
 public static LoadedExperience Open(string text){
  PackageReader.Require(text!=null && text.Length<=120000000,"Experience exceeds 120 MB.");var tree=PackageReader.Tree(text);PackageReader.Fields(tree,"formatVersion,kind,manifest,manifestSha256");var envelope=PackageReader.Read<ExperienceEnvelope>(text);
  PackageReader.Require(envelope.kind=="milzet-experience" && envelope.formatVersion==1 && envelope.manifest!=null,"Unsupported experience.");PackageReader.Require(PackageReader.Hash(Encoding.UTF8.GetBytes(envelope.manifest))==envelope.manifestSha256,"Experience checksum mismatch.");
  var manifestTree=PackageReader.Tree(envelope.manifest);PackageReader.Fields(manifestTree,"id,title,entryScene,scenes");foreach(var scene in manifestTree.Element("scenes").Elements())PackageReader.Fields(scene,"id,next,gate,package");
  var manifest=PackageReader.Read<ExperienceManifest>(envelope.manifest);PackageReader.Require(Id(manifest.id) && !String.IsNullOrWhiteSpace(manifest.title) && manifest.title.Length<=120,"Invalid experience identity.");PackageReader.Require(manifest.scenes!=null && manifest.scenes.Length>0 && manifest.scenes.Length<=16,"An experience needs 1-16 scenes.");
  var packages=new Dictionary<string,LoadedPackage>();foreach(var scene in manifest.scenes){PackageReader.Require(scene!=null && Id(scene.id) && !packages.ContainsKey(scene.id) && new[]{"none","host"}.Contains(scene.gate),"Invalid or duplicate scene.");var loaded=PackageReader.Open(scene.packageText);PackageReader.Require(loaded.Manifest.id==scene.id,"Scene identity mismatch.");packages.Add(scene.id,loaded);}
  PackageReader.Require(manifest.entryScene!=null && packages.ContainsKey(manifest.entryScene),"Missing entry scene.");foreach(var scene in manifest.scenes)PackageReader.Require(scene.next==""?scene.gate=="none":scene.next!=null && packages.ContainsKey(scene.next) && scene.next!=scene.id,"Invalid scene transition.");
  var visited=new HashSet<string>();string current=manifest.entryScene;while(current!=""){PackageReader.Require(visited.Add(current),"Cyclic scene transitions.");current=manifest.scenes.First(s=>s.id==current).next;}PackageReader.Require(visited.Count==packages.Count,"Unreachable scene.");
  return new LoadedExperience{Manifest=manifest,Revision=envelope.manifestSha256,Packages=packages};
 }
 static bool Id(string value){return value!=null && Regex.IsMatch(value,"^[a-zA-Z0-9-]{1,80}$");}
}
public sealed class ExperienceProgress {
 public string SceneId {get;private set;}public bool Complete {get;private set;}
 readonly LoadedExperience experience;
 public ExperienceProgress(LoadedExperience loaded){experience=loaded;SceneId=loaded.Manifest.entryScene;}
 public string Next(bool sceneComplete,Func<string,string,bool> authorize){PackageReader.Require(!Complete && sceneComplete,"Complete the current scene first; completed experiences cannot advance.");var scene=experience.Manifest.scenes.First(s=>s.id==SceneId);PackageReader.Require(scene.next=="" || scene.gate!="host" || authorize(SceneId,scene.next),"Scene host release is required.");return scene.next;}
 public void Commit(string next){PackageReader.Require(!Complete && next==experience.Manifest.scenes.First(s=>s.id==SceneId).next,"Invalid scene commit.");if(next=="")Complete=true;else SceneId=next;}
}
}
