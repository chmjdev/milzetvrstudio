using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.XR.Management;
using UnityEditor.XR.Management.Metadata;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.XR.Management;
using UnityEngine.XR.OpenXR;
using Milzet.Content;
namespace Milzet.Editor {
public static class BuildViewer {
 public static void ConfigureInput(){foreach(var target in new[]{NamedBuildTarget.Android,NamedBuildTarget.Standalone}){var symbols=PlayerSettings.GetScriptingDefineSymbols(target).Split(';').Where(s=>s!="").ToList();if(!symbols.Contains("USE_STICK_CONTROL_THUMBSTICKS")){symbols.Add("USE_STICK_CONTROL_THUMBSTICKS");PlayerSettings.SetScriptingDefineSymbols(target,String.Join(";",symbols));}}AssetDatabase.SaveAssets();}
 public static void ConfigureAndroid(){
  PackageReader.Require(BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.Android,BuildTarget.Android),"Install Unity Android Build Support, SDK/NDK and OpenJDK first.");
  XRGeneralSettingsPerBuildTarget root;if(!EditorBuildSettings.TryGetConfigObject(XRGeneralSettings.k_SettingsKey,out root)){root=ScriptableObject.CreateInstance<XRGeneralSettingsPerBuildTarget>();AssetDatabase.CreateAsset(root,"Assets/XR/Milzet XR Management.asset");EditorBuildSettings.AddConfigObject(XRGeneralSettings.k_SettingsKey,root,true);}
  if(!root.HasSettingsForBuildTarget(BuildTargetGroup.Android))root.CreateDefaultSettingsForBuildTarget(BuildTargetGroup.Android);if(!root.HasManagerSettingsForBuildTarget(BuildTargetGroup.Android))root.CreateDefaultManagerSettingsForBuildTarget(BuildTargetGroup.Android);var general=root.SettingsForBuildTarget(BuildTargetGroup.Android);general.InitManagerOnStart=true;if(!general.Manager.activeLoaders.Any(loader=>loader is OpenXRLoader))PackageReader.Require(XRPackageMetadataStore.AssignLoader(general.Manager,"UnityEngine.XR.OpenXR.OpenXRLoader",BuildTargetGroup.Android),"OpenXR loader could not be assigned.");
  PackageReader.Require(AssetDatabase.FindAssets("t:MetaQuestFeature").Length==1,"Expected one authoritative OpenXR settings asset for Meta Quest.");var settings=OpenXRSettings.GetSettingsForBuildTargetGroup(BuildTargetGroup.Android);PackageReader.Require(settings!=null,"OpenXR Android settings are unavailable.");var features=settings.GetFeatures();foreach(var name in new[]{"OculusTouchControllerProfile","MetaQuestFeature","HandInteractionProfile","MetaXRFeature"}){var feature=features.FirstOrDefault(f=>f!=null && f.GetType().Name==name);PackageReader.Require(feature!=null,"Missing OpenXR feature: "+name);feature.enabled=true;EditorUtility.SetDirty(feature);}settings.renderMode=OpenXRSettings.RenderMode.SinglePassInstanced;EditorUtility.SetDirty(settings);EditorUtility.SetDirty(general);EditorUtility.SetDirty(root);
  var playerSettings=new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset")[0]);playerSettings.FindProperty("activeInputHandler").intValue=1;playerSettings.ApplyModifiedPropertiesWithoutUndo();
  PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android,ScriptingImplementation.IL2CPP);PlayerSettings.Android.targetArchitectures=AndroidArchitecture.ARM64;PlayerSettings.Android.minSdkVersion=AndroidSdkVersions.AndroidApiLevel32;PlayerSettings.Android.targetSdkVersion=AndroidSdkVersions.AndroidApiLevelAuto;PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.Android,false);PlayerSettings.SetGraphicsAPIs(BuildTarget.Android,new[]{GraphicsDeviceType.Vulkan});AssetDatabase.SaveAssets();HandManifest.Configure();
 }
 static void Shaders(){var asset=AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset")[0];var data=new SerializedObject(asset);var list=data.FindProperty("m_AlwaysIncludedShaders");foreach(var name in new[]{"Unlit/Texture","Unlit/Color","glTF/PbrMetallicRoughness","glTF/PbrSpecularGlossiness","glTF/Unlit"}){var shader=Shader.Find(name);PackageReader.Require(shader!=null,"Missing runtime shader: "+name);bool found=false;for(int i=0;i<list.arraySize;i++)if(list.GetArrayElementAtIndex(i).objectReferenceValue==shader)found=true;if(!found){list.InsertArrayElementAtIndex(list.arraySize);list.GetArrayElementAtIndex(list.arraySize-1).objectReferenceValue=shader;}}data.ApplyModifiedPropertiesWithoutUndo();AssetDatabase.SaveAssets();}
 public static void Repair(){ConfigureInput();PlayerSettings.bundleVersion="1.0.2";PlayerSettings.Android.bundleVersionCode=3;Mac();Android();}
 public static void HotspotRepair(){PlayerSettings.bundleVersion="1.0.3";PlayerSettings.Android.bundleVersionCode=4;Android();}
 public static void StartupRepair(){StartupBuild("1.1.0",5);}
 public static void InteractionRepair(){StartupBuild("1.1.1",6);}
 static void StartupBuild(string version,int code){PlayerSettings.colorSpace=ColorSpace.Linear;PlayerSettings.SetArchitecture(NamedBuildTarget.Standalone,1);var settings=new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset")[0]);settings.FindProperty("microphoneUsageDescription").stringValue="Microphone access is reserved for user-initiated voice input.";settings.ApplyModifiedPropertiesWithoutUndo();PlayerSettings.bundleVersion=version;PlayerSettings.Android.bundleVersionCode=code;if(EditorUserBuildSettings.activeBuildTarget==BuildTarget.Android)Android();else Mac();}
 public static void Mac(){EditorUserBuildSettings.SetPlatformSettings(BuildPipeline.GetBuildTargetName(BuildTarget.StandaloneOSX),"Architecture","arm64");Build(BuildTarget.StandaloneOSX,"milzetvrstudio.app");}
 public static void Android(){ConfigureAndroid();Build(BuildTarget.Android,"milzetvrstudio.apk");}
 static void Build(BuildTarget target,string name){
  Shaders();string output=Path.GetFullPath(Path.Combine(Application.dataPath,"../../Artifacts/Builds",name));Directory.CreateDirectory(Path.GetDirectoryName(output));string scenePath="Assets/Milzet/TemporaryViewerBuild.unity";PackageReader.Require(!File.Exists(scenePath),"Temporary viewer scene already exists.");
  try{var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);EditorSceneManager.SaveScene(scene,scenePath);var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{scenePath},locationPathName=output,target=target,options=BuildOptions.Development});PackageReader.Require(report.summary.result==BuildResult.Succeeded,"Viewer build failed: "+report.summary.result);long bytes=File.Exists(output)?new FileInfo(output).Length:Directory.EnumerateFiles(output,"*",SearchOption.AllDirectories).Sum(file=>new FileInfo(file).Length);File.WriteAllText(output+".build.json","{\"passed\":true,\"target\":\""+target+"\",\"bytes\":"+bytes+",\"buildReportBytes\":"+report.summary.totalSize+",\"builtAtUtc\":\""+DateTime.UtcNow.ToString("o")+"\",\"unityVersion\":\""+Application.unityVersion+"\",\"developmentBuild\":true,\"headset\":\"not deployed\"}");}
  finally{AssetDatabase.DeleteAsset(scenePath);}
 }
}
}
