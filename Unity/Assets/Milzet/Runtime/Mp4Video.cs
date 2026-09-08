using System;
using System.Text;
namespace Milzet.Content {
public static class Mp4Video {
 static long U32(byte[] b,int i){return ((long)b[i]<<24)|((long)b[i+1]<<16)|((long)b[i+2]<<8)|b[i+3];}
 static void Boxes(byte[] b,int start,int end,int depth,ref int width,ref int height){
  PackageReader.Require(depth<=8,"MP4 nesting exceeds supported layout.");
  for(int offset=start;offset+8<=end;){
   long size=U32(b,offset);int header=8;string type=Encoding.ASCII.GetString(b,offset+4,4);
   if(size==1){PackageReader.Require(offset+16<=end && U32(b,offset+8)==0,"MP4 large box unsupported.");size=U32(b,offset+12);header=16;}if(size==0)size=end-offset;
   PackageReader.Require(size>=header && size<=end-offset,"Invalid MP4 box length.");int limit=offset+(int)size;
   if(type=="moov" || type=="trak" || type=="mdia" || type=="minf" || type=="stbl")Boxes(b,offset+header,limit,depth+1,ref width,ref height);
   if(type=="stsd")Boxes(b,offset+header+8,limit,depth+1,ref width,ref height);
   if(type=="avc1" || type=="avc3"){PackageReader.Require(size>=86 && width==0,"Invalid or multiple video tracks.");width=b[offset+32]*256+b[offset+33];height=b[offset+34]*256+b[offset+35];}
   offset=limit;
  }
 }
 public static void Validate(byte[] bytes,string projection){
  PackageReader.Require(bytes.Length>=12 && Encoding.ASCII.GetString(bytes,4,4)=="ftyp","MP4 container required.");int width=0,height=0;Boxes(bytes,0,bytes.Length,0,ref width,ref height);
  PackageReader.Require(width>0 && height>0 && width<=4096 && height<=4096 && (projection=="flat" || width==height*(projection=="equirect360"?2:1)),"Invalid H.264 track or mono projection dimensions.");
 }
}
}
