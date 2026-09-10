# Native Unity package preview

Open this folder in Unity 6000.3.22f1. Use **Milzet > Open package preview**, select a browser-exported `.milzet-package.json`, and the editor enters Play Mode. No client media or scene is bundled; the preview builds objects in memory.

The player supports flat PNG/JPEG, mono equirectangular 180/360 imagery, validated H.264 MP4, static embedded GLBs, PCM WAV, hotspots, activities, source credits, multi-scene experiences, placed overlays and timed demonstrations. Versions 1-9 share the contract described in `../Shared/CONTRACT.md`, including structured references, site validity bounds, and host kill-switch revocation.

The flat plate is 4m by 2.4m, with normalized top-left anchors. Unity reflects browser Z: camera (0,1.5,-1), plate (0,1.5,2), hotspot plane z=1.93. Panoramic orientation and model transforms have separate Play Mode checks.

Click markers or hotspot buttons, respond to activities, play/seek clips and advance phases. The test host exposes a simulated release. A receiving host can provide `Authorize` and subscribe to `HostEventEmitted`; events include sequence, package ID and revision. The receiver owns actual authorization and durable records.

## Verification

First run `npm test` and `npm run test:browser` from the repository root. `npm run test:native` runs nine C# test suites (including `ReaderSmoke` revocation checks and `AssessorSmoke` rubric grading) against shared negative fixtures and fresh browser exports. `npm run test:unity` runs the local Unity Play Mode checks with graphics, an 8 GiB disk preflight and a four-minute timeout.

The 8 September 2026 rerun passed image/marker rendering, ray selection, invalid replacement rejection, host gates/events, PCM decode and audio-engine start, 180/360 orientation, video frame decoding/playback/seek, GLB transform/material/selection, and activity/context/event parity. Fresh JSON receipts and rendered images are under `Artifacts/UnityVisual` at the repository root.

## Local builds

Use the installed editor in batch mode with `-projectPath` set to this Unity folder. First execute `Milzet.Editor.BuildViewer.ConfigureInput` to enable the package’s existing `USE_STICK_CONTROL_THUMBSTICKS` option for Standalone and Android. The installed OpenXR profile expects `StickControl` in its setup method; its default alias otherwise creates a `Vector2Control`. The vendor package is unchanged.

Execute `Milzet.Editor.BuildViewer.Mac` with `-buildTarget StandaloneOSX`, or `Milzet.Editor.BuildViewer.Android` with `-buildTarget Android`. Both outputs and build receipts go to `../Artifacts/Builds`. The temporary empty build scene is removed after building. Android uses OpenXR, the Meta Quest and Oculus Touch features, ARM64 IL2CPP and Vulkan.

The built viewer opens a package via `--milzet-package /absolute/path/to/package.json`. Otherwise it opens an empty welcome view and lists JSON packages in its own persistent-data `Packages` folder. Client packages are transferred separately. Local development builds are not deployment or wearer acceptance.

## Remaining target work

Tracked XR Origin/camera bindings, controller aim rays and world-space TMP controls are implemented alongside the desktop preview. World controls include activity responses and a virtual keyboard; both phase and scene gates remain enforced. Eight native verification stages pass, including visible world controls, simulated head pose and simulated Touch-controller aim/trigger selection. Both local standalone builds pass. The built Mac app also passes overlays, rendered controls, narration, timed still/video activities, video and GLB rendering, linked rays and multi-scene completion. The Android APK signature, ARM64 libraries and Meta Quest boot flags are verified; it has not been installed on a headset. The matching installed Android support, SDK/NDK and OpenJDK in the editor’s sibling `PlaybackEngines/AndroidPlayer` directory will be used for the Android build. A dependency or simulated-input test does not establish physical headset acceptance.

Physical audible output, headset controls, comfort, performance, real generated assets and onsite client content are unaccepted. No headset deployment occurred. See `../Docs/ACCEPTANCE.md` for the complete matrix and remaining requirements.
