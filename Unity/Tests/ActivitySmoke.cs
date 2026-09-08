using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Milzet.Content;
class ActivitySmoke {
 static int Main(string[] args){
  var package=PackageReader.Open(File.ReadAllText(args[0]));var events=new List<string>();var session=new PackageSession(package,(type,phase,id)=>events.Add(type));session.ActivityEvent=(type,id,response)=>events.Add(type+":"+response);
  foreach(var phase in package.Manifest.phases){foreach(var id in phase.hotspotIds)session.Select(id);var activities=package.Manifest.activities.Where(a=>a.phase==phase.id).ToArray();if(activities.Length>0){bool blocked=false;try{session.Advance((a,b)=>true);}catch(InvalidDataException){blocked=true;}if(!blocked)throw new Exception("Activities bypassed.");}
   foreach(var activity in activities){if(activity.hint!=""){session.Hint(activity.id);bool blocked=false;try{session.Hint(activity.id);}catch(InvalidDataException){blocked=true;}if(!blocked)throw new Exception("Hint budget bypassed.");}session.Respond(activity.id,activity.kind=="quiz"?activity.choices.Last():"acknowledged",0);}
   session.Advance((a,b)=>true);
  }
  if(!session.Complete || !events.Contains("activity.responded:Request review"))throw new Exception("Activity event mismatch.");Console.WriteLine("PASS: native activity order, hint budget, responses and host progression.");return 0;
 }
}
