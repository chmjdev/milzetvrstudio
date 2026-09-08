using System;
using System.IO;
using System.Text;
namespace Milzet.Content {
public sealed class PcmWave {
 public int Channels;public int Frequency;public float[] Samples;
 public static PcmWave Decode(byte[] bytes) {
  PackageReader.Require(bytes!=null && bytes.Length>=44,"WAV header is incomplete.");
  using(var stream=new MemoryStream(bytes))using(var reader=new BinaryReader(stream)) {
   PackageReader.Require(Encoding.ASCII.GetString(reader.ReadBytes(4))=="RIFF","Expected RIFF.");
   uint declared=reader.ReadUInt32();PackageReader.Require(declared==bytes.Length-8,"WAV RIFF size mismatch.");
   PackageReader.Require(Encoding.ASCII.GetString(reader.ReadBytes(4))=="WAVE","Expected WAVE.");
   ushort format=0,channels=0,bits=0,alignment=0;uint rate=0,byteRate=0;byte[] samples=null;bool hasFormat=false;
   while(stream.Position+8<=stream.Length) {
    string chunk=Encoding.ASCII.GetString(reader.ReadBytes(4));uint size=reader.ReadUInt32();long end=stream.Position+size;
    PackageReader.Require(end<=stream.Length,"WAV chunk exceeds file.");
    if(chunk=="fmt ") {PackageReader.Require(!hasFormat && size>=16,"Invalid WAV format chunk.");hasFormat=true;format=reader.ReadUInt16();channels=reader.ReadUInt16();rate=reader.ReadUInt32();byteRate=reader.ReadUInt32();alignment=reader.ReadUInt16();bits=reader.ReadUInt16();}
    if(chunk=="data") {PackageReader.Require(samples==null && size<=12000000,"Invalid WAV data chunk.");samples=reader.ReadBytes((int)size);}
    stream.Position=end+(size%2);
   }
   PackageReader.Require(hasFormat && format==1 && (channels==1 || channels==2) && bits==16 && rate>=8000 && rate<=96000,"Native preview supports 16-bit PCM mono/stereo WAV at 8–96 kHz.");
   PackageReader.Require(alignment==channels*2 && byteRate==rate*alignment && samples!=null && samples.Length>0 && samples.Length%alignment==0,"Invalid WAV sample layout.");
   float[] data=new float[samples.Length/2];for(int i=0;i<data.Length;i++)data[i]=(short)(samples[i*2]|samples[i*2+1]<<8)/32768f;
   return new PcmWave{Channels=channels,Frequency=(int)rate,Samples=data};
  }
 }
}
}
