using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
namespace Milzet.Content {
[Serializable] public class ExperienceEvent { public string type;public string eventId;public string experienceId;public string experienceRevision;public string sceneId; }
public sealed partial class PackagePlayer {
 public LoadedExperience Experience {get;private set;}public ExperienceProgress Journey {get;private set;}public bool ExperienceLoading {get;private set;}
 public bool SimulatedSceneRelease;public Func<string,string,bool> AuthorizeScene;
 public readonly List<ExperienceEvent> ExperienceEvents=new List<ExperienceEvent>();public event Action<ExperienceEvent> ExperienceEventEmitted;
 string experienceSession;int experienceSequence;
 public void Open(string text){
  PackageReader.Require(!ExperienceLoading,"An experience scene is loading.");
  if(ExperienceReader.IsExperience(text)){var next=ExperienceReader.Open(text);PackageReader.Require(!ModelsLoading && !VideoLoading,"A package is loading.");StartCoroutine(LoadExperienceScene(next,new ExperienceProgress(next),next.Manifest.entryScene,true));}
  else{OpenScene(text);Experience=null;Journey=null;ExperienceEvents.Clear();}
 }
 public void AdvanceExperience(){
  PackageReader.Require(Experience!=null && Journey!=null && !ExperienceLoading && !ModelsLoading && !VideoLoading,"No ready experience.");
  string next=Journey.Next(Session!=null && Session.Complete,(from,to)=>AuthorizeScene!=null?AuthorizeScene(from,to):SimulatedSceneRelease);
  if(next==""){Journey.Commit(next);ExperienceRecord("experience.completed");Message="Experience preview complete.";}
  else StartCoroutine(LoadExperienceScene(Experience,Journey,next,false));
 }
 IEnumerator LoadExperienceScene(LoadedExperience experience,ExperienceProgress progress,string sceneId,bool first){
  ExperienceLoading=true;string failure=null;try{OpenScene(experience.Manifest.scenes.First(s=>s.id==sceneId).packageText);}catch(Exception e){failure=e.Message;}
  while(failure==null && (ModelsLoading || VideoLoading))yield return null;
  if(failure==null && (Loaded==null || Loaded.Revision!=experience.Packages[sceneId].Revision))failure=Message;
  if(failure==null){
   if(first){Experience=experience;Journey=progress;experienceSession=Guid.NewGuid().ToString("N");experienceSequence=0;ExperienceEvents.Clear();}
   else{ExperienceRecord("experience.scene.completed");progress.Commit(sceneId);}
   SimulatedSceneRelease=false;ExperienceRecord("experience.scene.started");Message="Experience scene loaded.";
  }else Message="Experience scene was not changed: "+failure;
  ExperienceLoading=false;
 }
 void ExperienceRecord(string type){var e=new ExperienceEvent{type=type,eventId=experienceSession+":"+(++experienceSequence),experienceId=Experience.Manifest.id,experienceRevision=Experience.Revision,sceneId=Journey.SceneId};ExperienceEvents.Add(e);ExperienceEventEmitted?.Invoke(e);}
}
}
