using System;
using System.IO;
using UnityEngine;
using Milzet.Content;
namespace Milzet.Editor {
public static class ProjectionVerification {
 public static void Run(string directory,string output) {
  foreach(var kind in new[]{"equirect180","equirect360"}) {
   var go=new GameObject("Projection verification");var player=go.AddComponent<PackagePlayer>();
   try {
    player.OpenFile(Path.Combine(directory,kind+"-browser.milzet-package.json"));
    PackageReader.Require(player.Loaded.Manifest.plate.projection==kind,"Projection changed on native import.");
    var p=player.Markers[player.Loaded.Manifest.hotspots[0].id].transform.position;
    PackageReader.Require(player.SelectRay(new Ray(player.ViewCamera.transform.position,(p-player.ViewCamera.transform.position).normalized)),"Panorama hotspot ray missed.");
    Capture(player,Path.Combine(output,kind+"-front.png"),new Color(.2f,.4f,.8f));
    player.SetView(180,0);Capture(player,Path.Combine(output,kind+"-back.png"),kind=="equirect180"?new Color(21/255f,42/255f,39/255f):new Color(.8f,.2f,.2f));
    player.SetView(kind=="equirect180"?45:90,0);Capture(player,Path.Combine(output,kind+"-right.png"),new Color(.2f,.8f,.4f));
    player.Advance();PackageReader.Require(player.Session.Complete,"Panorama session incomplete.");
   } finally {UnityEngine.Object.DestroyImmediate(go);}
  }
  File.WriteAllText(Path.Combine(output,"projection-verification.json"),"{\"passed\":true,\"playMode\":true,\"projections\":[\"equirect180\",\"equirect360\"],\"frontRearRightColors\":true,\"raySelection\":true,\"headset\":\"not tested\"}");
 }
 static void Capture(PackagePlayer player,string path,Color expected) {
  var target=new RenderTexture(800,600,24);target.Create();var image=new Texture2D(800,600,TextureFormat.RGB24,false);var previous=RenderTexture.active;
  try {
   player.ViewCamera.aspect=4f/3;player.ViewCamera.targetTexture=target;player.ViewCamera.Render();RenderTexture.active=target;image.ReadPixels(new Rect(0,0,800,600),0,0);image.Apply();
   var pixel=image.GetPixel(400,300);PackageReader.Require(Mathf.Abs(pixel.r-expected.r)<.06f && Mathf.Abs(pixel.g-expected.g)<.06f && Mathf.Abs(pixel.b-expected.b)<.06f,"Projection orientation mismatch: "+path+" actual "+pixel+" expected "+expected);
   File.WriteAllBytes(path,image.EncodeToPNG());
  }finally{player.ViewCamera.targetTexture=null;RenderTexture.active=previous;target.Release();UnityEngine.Object.DestroyImmediate(target);UnityEngine.Object.DestroyImmediate(image);}
 }
}
}
