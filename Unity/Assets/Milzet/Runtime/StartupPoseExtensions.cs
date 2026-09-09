using UnityEngine;
namespace Oculus.Interaction.ComprehensiveSample {
public static class StartupPoseExtensions {public static void SetPose(this Transform t,Pose p,Space space=Space.World){if(space==Space.Self){t.localPosition=p.position;t.localRotation=p.rotation;}else t.SetPositionAndRotation(p.position,p.rotation);}
public static Pose GetPose(this Transform t,Space space=Space.World){return space==Space.Self?new Pose(t.localPosition,t.localRotation):new Pose(t.position,t.rotation);}}
}
