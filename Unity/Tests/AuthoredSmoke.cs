using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Milzet.Content;
class AuthoredSmoke {
 static int Main(string[] args) {
  var package = PackageReader.Open(File.ReadAllText(args[0]));
  if (package.Manifest.fixture || package.Manifest.phases.Length != 4 || package.Manifest.hotspots.Length != 4 || package.Assets.Count != 2) throw new Exception("Authored package mismatch.");
  var events = new List<string>();
  var session = new PackageSession(package, (type,phase,id) => events.Add(type));
  foreach (var phase in package.Manifest.phases) {
   foreach (var id in phase.hotspotIds) session.Select(id);
   if (phase.gate == "host") {
    bool blocked = false;
    try { session.Advance((from,to) => false); } catch (InvalidDataException) { blocked = true; }
    if (!blocked) throw new Exception("Authored gate bypass.");
   }
   session.Advance((from,to) => true);
  }
  if (!session.Complete || events.Count(x => x == "scenario.completed") != 1 || !events.Contains("evidence.requested")) throw new Exception("Authored handoff mismatch.");
  Console.WriteLine("PASS: browser-authored four-phase package opened in native C#; media, host gate, evidence and completion verified.");
  return 0;
 }
}
