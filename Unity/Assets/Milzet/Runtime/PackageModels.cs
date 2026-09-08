using System;
using System.Collections.Generic;
using UnityEngine;
using GLTFast;
namespace Milzet.Content {
public sealed partial class PackagePlayer {
 public bool ModelsLoading {get;private set;}
 public readonly Dictionary<string,GameObject> ModelObjects=new Dictionary<string,GameObject>();
 readonly Dictionary<GameObject,string> modelTargets=new Dictionary<GameObject,string>();
 List<GltfImport> modelImports=new List<GltfImport>(),preparedImports;
 Dictionary<string,GameObject> preparedObjects;
 GameObject preparedModels;
 async void BeginModels(string text,LoadedPackage next){
  PackageReader.Require(!ModelsLoading,"Model import already in progress.");ModelsLoading=true;var temporary=new GameObject("Preparing models");temporary.transform.SetParent(transform,false);temporary.SetActive(false);var imports=new List<GltfImport>();var objects=new Dictionary<string,GameObject>();
  try {
   foreach(var o in next.Manifest.objects){var group=new GameObject(o.label);group.transform.SetParent(temporary.transform,false);group.transform.localPosition=new Vector3((float)o.position[0],(float)o.position[1],-(float)o.position[2]);group.transform.localRotation=Quaternion.AngleAxis(-(float)o.rotation[0],Vector3.right)*Quaternion.AngleAxis(-(float)o.rotation[1],Vector3.up)*Quaternion.AngleAxis((float)o.rotation[2],Vector3.forward);group.transform.localScale=new Vector3((float)o.scale[0],(float)o.scale[1],(float)o.scale[2]);group.SetActive(o.visible);objects.Add(o.id,group);}
   foreach(var o in next.Manifest.objects){var group=objects[o.id];if(o.parentId!="")group.transform.SetParent(objects[o.parentId].transform,false);var imported=new GltfImport();imports.Add(imported);PackageReader.Require(await imported.Load(next.Assets[o.assetId]),"GLB decode failed.");var meshRoot=new GameObject("glTF orientation");meshRoot.transform.SetParent(group.transform,false);meshRoot.transform.localRotation=Quaternion.Euler(0,180,0);PackageReader.Require(await imported.InstantiateMainSceneAsync(meshRoot.transform),"GLB instantiation failed.");}
   if(this==null){foreach(var imported in imports)imported.Dispose();return;}
   preparedImports=imports;preparedObjects=objects;preparedModels=temporary;ModelsLoading=false;Open(text);
  }catch(Exception e){Message="Model import failed: "+e.Message;foreach(var imported in imports)imported.Dispose();if(temporary!=null)DestroyImmediate(temporary);preparedModels=null;preparedImports=null;preparedObjects=null;ModelsLoading=false;}
 }
 void AdoptModels(){
  if(preparedModels==null)return;preparedModels.transform.SetParent(content.transform,false);preparedModels.SetActive(true);modelImports=preparedImports;
  foreach(var o in Loaded.Manifest.objects){var group=preparedObjects[o.id];ModelObjects.Add(o.id,group);if(o.hotspotId!="")foreach(var filter in group.transform.Find("glTF orientation").GetComponentsInChildren<MeshFilter>(true)){var collider=filter.gameObject.AddComponent<MeshCollider>();collider.sharedMesh=filter.sharedMesh;modelTargets[filter.gameObject]=o.hotspotId;}}
  preparedModels=null;preparedImports=null;preparedObjects=null;
  var light=new GameObject("Model preview light").AddComponent<Light>();light.transform.SetParent(content.transform,false);light.type=LightType.Directional;light.intensity=2;light.transform.rotation=Quaternion.Euler(35,-30,0);RenderSettings.ambientLight=new Color(.5f,.5f,.5f);
 }
 void DiscardPreparedModels(){if(preparedImports!=null)foreach(var imported in preparedImports)imported.Dispose();if(preparedModels!=null)DestroyImmediate(preparedModels);preparedModels=null;preparedImports=null;preparedObjects=null;}
 void ClearModels(){foreach(var imported in modelImports)imported.Dispose();modelImports.Clear();ModelObjects.Clear();modelTargets.Clear();}
}
}
