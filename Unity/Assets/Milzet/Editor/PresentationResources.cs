using System;
using System.IO;
using UnityEditor;
using UnityEngine;
namespace Milzet.Editor {
public static class PresentationResources {
 const string ResourcesPath="Assets/TextMesh Pro/Resources";
 public static void Prepare(){
  if(Directory.Exists(ResourcesPath)){Verify();return;}
  var info=UnityEditor.PackageManager.PackageInfo.FindForAssetPath("Packages/com.unity.ugui");if(info==null)throw new Exception("Unity UI package has not resolved.");
  var packages=Directory.GetFiles(info.resolvedPath,"TMP Essential Resources.unitypackage",SearchOption.AllDirectories);if(packages.Length!=1)throw new Exception("TMP resource package not found.");
  AssetDatabase.importPackageCompleted+=Completed;AssetDatabase.importPackageFailed+=(name,error)=>{Debug.LogError(error);EditorApplication.Exit(1);};
  AssetDatabase.ImportPackage(packages[0],false);
 }
 static void Completed(string package){EditorApplication.delayCall+=Verify;}
 static void Verify(){
  var font=AssetDatabase.LoadAssetAtPath<TMPro.TMP_FontAsset>(ResourcesPath+"/Fonts & Materials/LiberationSans SDF.asset");
  var settings=AssetDatabase.LoadAssetAtPath<TMPro.TMP_Settings>(ResourcesPath+"/TMP Settings.asset");
  if(font==null || font.material==null || font.material.shader==null || settings==null){Debug.LogError("TMP resources are incomplete.");EditorApplication.Exit(1);return;}
  Debug.Log("MILZET_TMP_RESOURCES_PASS");EditorApplication.Exit(0);
 }
}
}
