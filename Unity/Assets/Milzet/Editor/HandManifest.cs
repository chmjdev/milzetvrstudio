using System.IO;
using UnityEditor;
using Milzet.Content;
namespace Milzet.Editor {
public static class HandManifest {
 public static void Configure(){var config=OVRProjectConfig.CachedProjectConfig;config.handTrackingSupport=OVRProjectConfig.HandTrackingSupport.ControllersAndHands;config.anchorSupport=OVRProjectConfig.AnchorSupport.Enabled;config.sceneSupport=OVRProjectConfig.FeatureSupport.Supported;OVRProjectConfig.CommitProjectConfig(config);OVRManifestPreprocessor.GenerateOrUpdateAndroidManifest(true);var manifest=File.ReadAllText("Assets/Plugins/Android/AndroidManifest.xml");PackageReader.Require(manifest.Contains("com.oculus.permission.USE_SCENE") && manifest.Contains("com.oculus.permission.HAND_TRACKING"),"Generated manifest lacks scene/hand permissions.");}
}
}
