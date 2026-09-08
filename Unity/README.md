# Native package target

`Assets/Milzet/Runtime/PackageReader.cs` implements the portable package reader and host-gated phase session without engine dependencies. It is ready for a Unity rendering adapter; it is not yet that adapter.

`npm run test:native` compiles it using the installed Unity editor's Mono compiler, opens shared positive/negative fixtures, verifies media hashes and four hotspots, rejects gate bypass and checks evidence/completion. If the browser-exported fixture exists, the same test opens those exact bytes too.

No Unity scene, player build or headset acceptance has been completed. Next: render the imported flat plate/hotspots in a clean Unity project, play narration, attach host events with session/revision IDs, and compare against WebXR. Do not claim visual/native playback from the pure C# test.
