using System;
using System.Linq;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
namespace Milzet.Content {
public sealed partial class PackagePlayer {
 public Canvas WorldControls {get;private set;}
 public bool PreviewHostControls=true;
 public Func<string[]> PackageInbox;
 public Action ExitOverride;
 public void ExitApp(){PauseDemonstration();Narration?.Stop();ResetPointerInput();PlayerPrefs.Save();Debug.Log("MILZET_EXIT_APP");if(ExitOverride!=null)ExitOverride();else Application.Quit();}
 readonly Dictionary<string,Action> worldActions=new Dictionary<string,Action>();
 readonly Dictionary<string,RectTransform> worldButtons=new Dictionary<string,RectTransform>();
 string worldTab="menu",worldInput="",worldActivity="",worldBody="",worldKey="";int worldPage,textPage;GameObject uiContent;
 public IReadOnlyDictionary<string,RectTransform> WorldButtons {get{return worldButtons;}}
 static string PhaseTitle(string phase){switch(phase){case "induct":return "Induct · Orientation";case "shadow":return "Shadow · Follow the expert";case "perform":return "Perform · Guided work";case "prove":return "Prove · Independent work";default:return phase;}}
 void WorldTab(string tab){worldTab=tab;worldPage=0;textPage=0;worldKey="";}
 public void ShowWorldControls(bool visible){if(Loaded==null)return;if(WorldControls==null){var go=new GameObject("Milzet world controls",typeof(RectTransform),typeof(Canvas));go.transform.SetParent(transform,false);WorldControls=go.GetComponent<Canvas>();WorldControls.renderMode=RenderMode.WorldSpace;WorldControls.worldCamera=ViewCamera;var rt=(RectTransform)go.transform;rt.localScale=Vector3.one*.0009f;rt.sizeDelta=new Vector2(1100,940);RecenterWorldControls();}WorldControls.worldCamera=ViewCamera;WorldControls.gameObject.SetActive(visible);worldKey="";UpdateWorldControls();}
 public void RecenterWorldControls(){if(WorldControls==null || ViewCamera==null)return;var pose=ComfortablePanelPose(ViewCamera.transform.position,ViewCamera.transform.forward,PreferredHand,Seated,true);WorldControls.transform.SetPositionAndRotation(pose.position,pose.rotation);EndMenuGrab();}
 public bool SelectWorldControls(Ray ray){if(WorldControls==null || !WorldControls.gameObject.activeSelf)return false;var rt=(RectTransform)WorldControls.transform;var plane=new Plane(-rt.forward,rt.position);if(!plane.Raycast(ray,out float distance) || distance<0 || distance>8)return false;var point=rt.InverseTransformPoint(ray.GetPoint(distance));if(!rt.rect.Contains(point))return false;foreach(var pair in worldButtons){var local=pair.Value.InverseTransformPoint(ray.GetPoint(distance));if(pair.Value.rect.Contains(local)){ActivateWorldControl(pair.Key);break;}}return true;}
 public void ActivateWorldControl(string id){Debug.Log("MILZET_CONTROL "+id);PackageReader.Require(worldActions.TryGetValue(id,out var action),"World control unavailable.");Try(action);worldKey="";UpdateWorldControls();}
 void UpdateWorldControls(){
  if(WorldControls==null || !WorldControls.gameObject.activeSelf || Loaded==null)return;
  var phase=Loaded.Manifest.phases.First(p=>p.id==Session.PhaseId);var activity=(Loaded.Manifest.activities??new Activity[0]).FirstOrDefault(a=>a.phase==Session.PhaseId && !Session.CompletedActivities.Contains(a.id));if(worldActivity!=activity?.id){worldActivity=activity?.id;worldInput="";if(worldTab=="keyboard")worldTab="activity";}
  string body="";var buttons=new List<Tuple<string,string,Action>>();Action<string,string,Action,bool> add=(id,label,run,enabled)=>{if(enabled)buttons.Add(Tuple.Create(id,label,run));};
  if(worldTab=="setup"){StartupControls(ref body,add);}
  else if(worldTab=="room"){RoomControls(ref body,add);}
  else if(worldTab=="menu"){
   body=Loaded.Manifest.title+"\nPhase: "+Session.PhaseId+(Session.Complete?" · complete":"")+"\n"+Message;
   if(PackageInbox!=null)add("packages","Open package",()=>WorldTab("packages"),true);add("inspect","Inspect",()=>WorldTab("inspect"),true);add("activity","Activities",()=>WorldTab("activity"),true);add("media","Playback",()=>WorldTab("media"),true);add("continue","Continue phase",Advance,!Session.Complete);
   if(PreviewHostControls)add("host",SimulatedHostRelease?"Revoke test release":"Grant test release",()=>{SimulatedHostRelease=!SimulatedHostRelease;},true);
   if(Experience!=null){add("scene","Continue scene",AdvanceExperience,!ExperienceLoading && !Journey.Complete);if(PreviewHostControls)add("scene-host",SimulatedSceneRelease?"Revoke scene release":"Grant scene release",()=>{SimulatedSceneRelease=!SimulatedSceneRelease;},true);}
  }else if(worldTab=="packages"){
   var files=PackageInbox?.Invoke()??new string[0];body=files.Length==0?"No client packages have been transferred to this viewer.":"Choose a lesson to begin.";int pages=Math.Max(1,(files.Length+5)/6);worldPage=Math.Min(worldPage,pages-1);foreach(var path in files.Skip(worldPage*6).Take(6)){string file=path;add("file-"+Array.IndexOf(files,path),System.IO.Path.GetFileNameWithoutExtension(path).Replace("-"," "),()=>OpenFile(file),true);}if(pages>1)add("files","More lessons",()=>{worldPage=(worldPage+1)%pages;},true);
  }else if(worldTab=="inspect"){
   var selected=Loaded.Manifest.hotspots.FirstOrDefault(h=>h.id==SelectedId);body=selected==null?"Select a hotspot to inspect its prompt.":selected.label+"\n"+selected.text+"\n"+ReferenceBinding.Text(Loaded.Manifest,"hotspot",selected.id);int count=(phase.hotspotIds.Length+5)/6;worldPage=Math.Min(worldPage,Math.Max(0,count-1));foreach(var id in phase.hotspotIds.Skip(worldPage*6).Take(6)){string selectedId=id;add("select-"+id,Loaded.Manifest.hotspots.First(h=>h.id==id).label,()=>Select(selectedId),!Session.Complete);}if(count>1)add("next","More hotspots",()=>{worldPage=(worldPage+1)%count;},true);if(selected!=null && selected.narrationAssetId!="")add("audio","Play narration",PlaySelectedAudio,true);
  }else if(worldTab=="activity"){
   if(activity==null)body=(Loaded.Manifest.activities==null || Loaded.Manifest.activities.Length==0)?"This package has no activities. Open Inspect to explore its markers.":"No pending tasks in this phase. Open Inspect before continuing the phase.";
   else{body=activity.prompt+"\n"+activity.citation+"\n"+ReferenceBinding.Text(Loaded.Manifest,"activity",activity.id)+(activity.startTime>0?"\nAvailable from "+activity.startTime+" seconds.":"");if(activity.kind=="quiz"){foreach(var choice in activity.choices.Skip(worldPage*6).Take(6)){string response=choice;add("choice-"+Array.IndexOf(activity.choices,choice),choice,()=>Session.Respond(activity.id,response,PlaybackTime),true);}if(activity.choices.Length>6)add("choices","More choices",()=>{worldPage=(worldPage+1)%((activity.choices.Length+5)/6);},true);}else if(activity.kind=="acknowledgement" || activity.kind=="step")add("ack","Acknowledge",()=>Session.Respond(activity.id,"acknowledged",PlaybackTime),true);else{body+="\nResponse: "+worldInput;add("write","Write response",()=>WorldTab("keyboard"),true);add("submit","Submit response",()=>{Session.Respond(activity.id,worldInput,PlaybackTime);worldInput="";},!String.IsNullOrWhiteSpace(worldInput));}if(activity.hint!="" && activity.phase!="prove")add("hint","Show hint",()=>Message=Session.Hint(activity.id),true);}
  }else if(worldTab=="keyboard"){
   body="Response: "+worldInput;const string alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?!-";foreach(char c in alphabet.Skip(worldPage*10).Take(10)){char keyboardKey=c;add("key-"+keyboardKey,keyboardKey.ToString(),()=>{if(worldInput.Length<2000)worldInput+=keyboardKey;},true);}add("space","Space",()=>{if(worldInput.Length<2000)worldInput+=" ";},true);add("delete","Delete",()=>{if(worldInput.Length>0)worldInput=worldInput.Substring(0,worldInput.Length-1);},true);add("keys","More keys",()=>{worldPage=(worldPage+1)%((alphabet.Length+9)/10);},true);add("done","Done",()=>WorldTab("activity"),true);
  }else if(worldTab=="credits"){body=Loaded.Manifest.provenance==null || Loaded.Manifest.provenance.Length==0?"Demonstration fixture. No external asset credits supplied.":String.Join("\n\n",Loaded.Manifest.provenance.Select(p=>p.credit+"\n"+p.license+"\n"+p.source));
  }else if(worldTab=="navigate"){
   body="Point anywhere on a panel and hold grip to move it. Pinch and move to drag; a stationary pinch selects. Left stick: move. Right stick: turn 30 degrees. Trigger: select. B: menu here. Room boundary remains active.";add("here","Menu here",RecenterWorldControls,true);add("reset-view","Return to start",ResetViewerPosition,true);add("setup","Comfort setup",ShowSetup,true);add("room","Room setup",()=>WorldTab("room"),true);
  }else if(worldTab=="media"){
   body=Loaded.Manifest.title+"\n"+PhaseTitle(Session.PhaseId)+(Loaded.Manifest.fixture?" · DEMO":"")+"\n"+(DemonstrationActive?"Demonstration · "+DemoPlayback.Time.ToString("F1")+" s\n"+DemoCueText:Video!=null?"Video · "+Video.time.ToString("F1")+" s":"View the scene and select Inspect to explore its markers.");
   if(DemonstrationActive){bool enabled=Session.PhaseId==Loaded.Manifest.presentation.demonstration.phase;add("play",DemoPlayback.Playing?"Pause":"Play",ToggleDemonstration,enabled);add("back","Back 5 seconds",()=>SeekDemonstration(Math.Max(0,DemoPlayback.Time-5)),enabled);add("forward","Forward 5 seconds",()=>SeekDemonstration(Math.Min(Loaded.Manifest.presentation.demonstration.duration,DemoPlayback.Time+5)),enabled);add("restart","Restart",()=>SeekDemonstration(0),enabled);}else if(Video!=null){add("play",Video.isPlaying?"Pause":"Play",()=>{if(Video.isPlaying)Video.Pause();else Video.Play();},true);add("back","Back 5 seconds",()=>Video.time=Math.Max(0,Video.time-5),true);add("forward","Forward 5 seconds",()=>Video.time=Math.Min(Video.length,Video.time+5),true);}
   body+="\n"+ReferenceBinding.Text(Loaded.Manifest,"scenario");
   if(Loaded.Manifest.context!=null)body+="\n"+Loaded.Manifest.context.occupationRef+"\n"+Loaded.Manifest.context.moduleRefs;
   if(!DemonstrationActive && Video==null)add("view-inspect","Inspect scene",()=>WorldTab("inspect"),true);
   if((Loaded.Manifest.activities??new Activity[0]).Any(a=>a.phase==Session.PhaseId && !Session.CompletedActivities.Contains(a.id)))add("view-tasks","Open tasks",()=>WorldTab("activity"),true);
   add("view-next",phase.next!=""?"Continue to "+phase.next:"Finish phase",Advance,!Session.Complete);
   if(Experience!=null)add("view-scene","Next scene",AdvanceExperience,!ExperienceLoading && !Journey.Complete);
   if(Loaded.Manifest.plate.projection=="flat"){add("smaller","Smaller display",()=>SetDisplayWidth(DisplayWidth-.3f),DisplayWidth>1.21f);add("larger","Larger display",()=>SetDisplayWidth(DisplayWidth+.3f),DisplayWidth<3.99f);}
  }
  if(worldTab!="menu" && Message!="" && !Message.StartsWith("Choose Inspect"))body+="\n"+Message;
  worldBody=body;string pageBody=body;if(!SetupVisible)add("text","Read more",()=>{textPage++;worldKey="";},true);
  string key=worldTab+textPage+pageBody+String.Join("|",buttons.Select(b=>b.Item1+":"+b.Item2));worldActions.Clear();worldActions["exit"]=ExitApp;foreach(var b in buttons)worldActions.Add(b.Item1,b.Item3);foreach(string name in new[]{"menu","packages","inspect","activity","media","navigate","credits","setup","room"}){string tab=name;worldActions["tab-"+tab]=()=>WorldTab(tab);}if(key==worldKey)return;worldKey=key;
  if(uiContent!=null)DestroyImmediate(uiContent);worldButtons.Clear();uiContent=new GameObject("Control content",typeof(RectTransform));uiContent.transform.SetParent(WorldControls.transform,false);RoundedImage(RectChild("Background",uiContent.transform,new Vector2(1100,940),Vector2.zero).gameObject,new Color(.035f,.045f,.055f));
  RegisterPanel(WorldControls.transform,(RectTransform)WorldControls.transform,"menu");
  var brand=WorldText("Brand",uiContent.transform,"BINTECA",new Vector2(420,55),new Vector2(-285,405));brand.fontSize=38;
  var title=WorldText("Title",uiContent.transform,"MILZET VR STUDIO",new Vector2(540,42),new Vector2(-225,360));title.fontSize=26;title.color=new Color(.6f,.76f,.8f);
  WorldButton("exit","Exit App",new Vector2(360,395),new Vector2(300,72),false);
  var prompt=WorldText("Prompt",uiContent.transform,pageBody,new Vector2(SetupVisible?960:740,200),new Vector2(SetupVisible?0:130,215));prompt.fontSize=30;prompt.textWrappingMode=TextWrappingModes.Normal;prompt.overflowMode=TextOverflowModes.Page;prompt.ForceMeshUpdate();textPage%=Math.Max(1,prompt.textInfo.pageCount);prompt.pageToDisplay=textPage+1;if(prompt.textInfo.pageCount<=1){buttons.RemoveAll(b=>b.Item1=="text");worldActions.Remove("text");}
  var tabs=new[]{"packages","inspect","activity","media","navigate","credits"};var labels=new[]{"Lessons","Inspect","Tasks","View / Play","Layout","Sources"};
  for(int i=0;i<(SetupVisible?0:tabs.Length);i++){string tab=tabs[i];string id="tab-"+tab;worldActions[id]=()=>WorldTab(tab);WorldButton(id,labels[i],new Vector2(-420,235-i*76),new Vector2(210,72),worldTab==tab);}
  int columns=worldTab=="keyboard"?4:2;float width=worldTab=="keyboard"?170:350;float height=worldTab=="keyboard"?70:80;float gap=worldTab=="keyboard"?86:99;
  for(int i=0;i<buttons.Count;i++){var button=buttons[i];WorldButton(button.Item1,button.Item2,SetupVisible?new Vector2(button.Item1=="setup-enter"?0:(i%2==0?-225:225),55-(i/2)*120):new Vector2(-235+width*.5f+(i%columns)*(width+20),55-(i/columns)*gap),SetupVisible?new Vector2(400,95):new Vector2(width,height),false);}
  var footer=WorldText("Footer",uiContent.transform,"Trigger · select   Grip · move panel   B · recall",new Vector2(1010,45),new Vector2(0,-415));footer.fontSize=25;footer.color=new Color(.6f,.76f,.8f);
 }
 void WorldButton(string id,string label,Vector2 position,Vector2 size,bool active){var rt=RectChild(id,uiContent.transform,size,position);RoundedImage(rt.gameObject,active?new Color(.07f,.29f,.36f):new Color(.075f,.16f,.21f));var text=WorldText("Label",rt,label,new Vector2(size.x-24,size.y-12),Vector2.zero);text.fontSize=28;text.alignment=TextAlignmentOptions.Center;text.overflowMode=TextOverflowModes.Ellipsis;worldButtons.Add(id,rt);}

 void ClearWorldControls(){SavePanelPoses();EndMenuGrab();if(WorldControls!=null)WorldControls.gameObject.SetActive(false);worldButtons.Clear();worldActions.Clear();worldTab="menu";worldKey="";worldInput="";worldBody="";worldPage=0;textPage=0;}
}
}
