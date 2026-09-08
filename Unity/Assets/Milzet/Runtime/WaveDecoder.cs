using System.IO;
using UnityEngine;
namespace Milzet.Content {
public static class WaveDecoder {
 public static AudioClip Decode(byte[] bytes,string name) {
  var wave=PcmWave.Decode(bytes);var clip=AudioClip.Create(name,wave.Samples.Length/wave.Channels,wave.Channels,wave.Frequency,false);
  if(!clip.SetData(wave.Samples,0)){UnityEngine.Object.DestroyImmediate(clip);throw new InvalidDataException("Unable to load decoded audio.");}return clip;
 }
}
}
