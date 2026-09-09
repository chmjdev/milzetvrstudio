using System;
using System.IO;
using System.Linq;
using Milzet.Content;
using UnityEngine;
using TMPro;
namespace Milzet.Editor {
public static class ReferenceVerification {
 public static void Run(string input,string output){
  var path=Path.Combine(input,"references-browser.milzet-package.json");var go=new GameObject("Reference verification");
  try{
   var player=go.AddComponent<PackagePlayer>();player.OpenFile(path);PackageReader.Require(player.Loaded.Manifest.references.Length==3,"Browser reference export missing.");player.ShowWorldControls(true);
   foreach(var pair in new[]{new[]{"media","KM Module 1"},new[]{"inspect","PM Module 2"},new[]{"activity","WM Module 3"}}){
    if(pair[0]=="inspect")player.Select(player.Loaded.Manifest.references.First(r=>r.scope=="hotspot").targetId);
    player.ActivateWorldControl("tab-"+pair[0]);var prompt=player.WorldControls.GetComponentsInChildren<TMP_Text>().First(t=>t.name=="Prompt");PackageReader.Require(prompt.text.Contains(pair[1]),"Missing scoped reference in native "+pair[0]);
    prompt.ForceMeshUpdate();if(prompt.textInfo.pageCount>1){player.ActivateWorldControl("text");prompt=player.WorldControls.GetComponentsInChildren<TMP_Text>().First(t=>t.name=="Prompt");PackageReader.Require(prompt.pageToDisplay==2,"Native reference pagination did not advance.");}
   }
   File.WriteAllText(Path.Combine(output,"reference-verification.json"),"{\"passed\":true,\"formatVersion\":9,\"browserExport\":true,\"scopes\":[\"scenario\",\"hotspot\",\"activity\"],\"nativeWorldText\":true,\"headset\":\"not tested\"}");Debug.Log("MILZET_REFERENCE_PASS");
  }finally{UnityEngine.Object.DestroyImmediate(go);}
 }
}

}
