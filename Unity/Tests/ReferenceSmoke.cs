using System;
using System.IO;
using Milzet.Content;
class ReferenceSmoke {
 static int Main(string[] args){int good=0,bad=0;foreach(var file in Directory.GetFiles(args[0],"*.json")){bool invalid=Path.GetFileName(file).StartsWith("invalid-");try{var loaded=PackageReader.Open(File.ReadAllText(file));if(invalid)throw new Exception("Invalid reference accepted: "+file);PackageReader.Require(loaded.Manifest.references.Length==3 && ReferenceBinding.Text(loaded.Manifest,"activity","task-1").Contains("WM Module 2"),"References mismatch.");good++;}catch(InvalidDataException){if(!invalid)throw;bad++;}}if(good!=1 || bad!=12)return 1;Console.WriteLine("PASS: native reference bindings, three scopes and 12 negative fixtures.");return 0;}
}
