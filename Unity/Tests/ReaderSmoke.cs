using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Milzet.Content;
class ReaderSmoke {
 static int Main(string[] args) {
  var accepted=0;foreach(var file in Directory.GetFiles(args[0],"*.json")) {bool invalid=Path.GetFileName(file).StartsWith("invalid-");try{var p=PackageReader.Open(File.ReadAllText(file));if(invalid){Console.Error.WriteLine("Accepted invalid package: "+file);return 3;}if(p.Manifest.hotspots.Length!=4 || p.Assets.Count!=2)throw new Exception("Fixture mismatch.");var events=new List<string>();var session=new PackageSession(p,(type,phase,id)=>events.Add(type));foreach(var h in p.Manifest.hotspots)session.Select(h.id);bool blocked=false;try{session.Advance((from,to)=>false);}catch(InvalidDataException){blocked=true;}if(!blocked)throw new Exception("Host gate bypass.");session.Advance((from,to)=>true);session.Select("point-4");session.Advance((from,to)=>false);if(!session.Complete || !events.Contains("evidence.requested") || events.Count(x=>x=="scenario.completed")!=1)throw new Exception("Handoff mismatch.");accepted++;}catch(Exception e){if(!invalid){Console.Error.WriteLine(e);return 1;}}}
  if(accepted!=1)return 2;
  var pTest=PackageReader.Open(File.ReadAllText(Path.Combine(args[0],"valid-trench.json")));
  var revEvents=new List<string>();
  var revSession=new PackageSession(pTest,(type,phase,id)=>revEvents.Add(type));
  revSession.Revoke("Emergency withdrawal");
  if(!revSession.Revoked || revSession.RevocationReason!="Emergency withdrawal" || !revEvents.Contains("site.invalidated"))throw new Exception("Native revocation failed.");
  bool revBlocked=false;try{revSession.Select("point-1");}catch(InvalidDataException){revBlocked=true;}
  if(!revBlocked)throw new Exception("Native revocation bypass.");
  Console.WriteLine("PASS: native C# reader loaded fixture media and four hotspots; authored subset, host gate, site invalidation and completion/evidence events verified.");return 0;
 }
}
