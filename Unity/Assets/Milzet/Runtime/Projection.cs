using System;
using System.Text;
namespace Milzet.Content {
public static class Projection {
 public static double[] Anchor(double x,double y,string projection,double radius=4.8) {
  if(projection=="flat")return new[]{(x-.5)*4,1.5+(.5-y)*2.4,1.93};
  double theta=(x-.5)*(projection=="equirect180"?Math.PI:Math.PI*2),latitude=(.5-y)*Math.PI;
  return new[]{radius*Math.Sin(theta)*Math.Cos(latitude),1.5+radius*Math.Sin(latitude),radius*Math.Cos(theta)*Math.Cos(latitude)};
 }
 static int U16(byte[] b,int i){return b[i]*256+b[i+1];}
 static int U32(byte[] b,int i){return (b[i]<<24)|(b[i+1]<<16)|(b[i+2]<<8)|b[i+3];}
 public static void ValidateImage(byte[] bytes,string mime,string projection) {
  if(projection=="flat")return;
  int width=0,height=0;
  if(mime=="image/png" && bytes.Length>=24 && Encoding.ASCII.GetString(bytes,12,4)=="IHDR"){width=U32(bytes,16);height=U32(bytes,20);}
  if(mime=="image/jpeg"){
   int i=2;
   while(i+4<=bytes.Length){if(bytes[i]!=255)break;int marker=bytes[i+1];i+=2;if(marker==217 || marker==218)break;if(marker==216 || marker==1 || marker>=208 && marker<=215)continue;int length=U16(bytes,i);if(length<2 || i+length>bytes.Length)break;if((marker==192 || marker==193 || marker==194) && length>=8){width=U16(bytes,i+5);height=U16(bytes,i+3);break;}i+=length;}
  }
  PackageReader.Require(width>0 && height>0 && width<=8192 && height<=8192 && width==height*(projection=="equirect360"?2:1),"Invalid mono equirectangular image dimensions.");
 }
}
}
