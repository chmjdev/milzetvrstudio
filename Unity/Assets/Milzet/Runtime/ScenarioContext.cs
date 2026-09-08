using System;
using System.Globalization;
using System.Linq;
using System.Runtime.Serialization;
namespace Milzet.Content {
[DataContract] public class ScenarioContext {
 [DataMember(IsRequired=true)] public string environment;
 [DataMember(IsRequired=true)] public string pilotType;
 [DataMember(IsRequired=true)] public string occupationRef;
 [DataMember(IsRequired=true)] public string moduleRefs;
 [DataMember(IsRequired=true)] public string sourceCitation;
 [DataMember(IsRequired=true)] public string externalStreamRef;
 [DataMember(IsRequired=true)] public string validFrom;
 [DataMember(IsRequired=true)] public string validUntil;
 public void Validate(){
  PackageReader.Require(new[]{"Site","Plant","Workshop","Field","Studio","Office","Clinic","Community"}.Contains(environment) && new[]{"","Trench and fibre duct","Toolbox talk / permit board","Daily site log","Virtual assessment","First-aid switch test"}.Contains(pilotType),"Invalid scenario context.");
  foreach(var s in new[]{occupationRef,moduleRefs,sourceCitation,externalStreamRef})PackageReader.Require(s!=null && s.Length<=2000,"Invalid external reference.");
  foreach(var s in new[]{validFrom,validUntil}){DateTime date;PackageReader.Require(s=="" || DateTime.TryParseExact(s,"yyyy-MM-dd",CultureInfo.InvariantCulture,DateTimeStyles.None,out date),"Invalid validity date.");}
  PackageReader.Require(validFrom=="" || validUntil=="" || String.CompareOrdinal(validFrom,validUntil)<=0,"Validity end precedes start.");
 }
}
}
