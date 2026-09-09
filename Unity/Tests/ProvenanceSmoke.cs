using System;
using System.IO;
using Milzet.Content;
class ProvenanceSmoke {
 static int Main(string[] args){int count=0;foreach(var file in Directory.GetFiles(args[0],"*.json")){bool invalid=Path.GetFileName(file).StartsWith("invalid-");try{var loaded=PackageReader.Open(File.ReadAllText(file));if(invalid)throw new Exception("Invalid provenance accepted: "+file);PackageReader.Require(loaded.Manifest.provenance.Length==1 && loaded.Manifest.provenance[0].sha256==loaded.Manifest.assets[0].sha256 && loaded.Manifest.provenance[0].owner=="Test owner","Source credits mismatch.");count++;}catch(InvalidDataException){if(!invalid)throw;}}if(count!=1)return 1;Console.WriteLine("PASS: native public provenance, checksums and negative fixtures.");return 0;}
}
