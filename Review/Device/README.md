# Current device status — 9 September 2026

Milzet1.1.1/code6 installed and launched PID25090. Exact signed APK hash matches; all11 package listings, original first-install/data_dir retained. Studio61/Physio1 metadata unchanged. Current launch screenshot shows headset sensor-lock prompt to press physical power button. Physical boot/setup, room, gestures and Exit acceptance remain pending. Receipt: `Artifacts/DeviceAcceptance/interaction-install.json`.

The proposal below is retained as historical context, not current authorization status.

# Proposed coordinated headset acceptance

Pending explicit user approval and release of the Quest from the separate VR Studio wearer test. Do not install, push files, launch an app, change forwarding or change headset state before both conditions are satisfied.

Artifact: `Artifacts/Builds/milzetvrstudio.apk`
Application: `com.binteca.interactive.milzet.viewer`
Bytes: 64786082
SHA-256: `b5b25d81c98d40f1f995dd55aae75eda740030372014684e2f5f6849dde0b004`

Proposed changes: install this development APK as its separate Milzet application; transfer only the procedural test packages into that application's own Packages folder; launch Milzet; record its diagnostics and screenshots. The existing VR Studio application and data are outside this proposal. No client media, paid generation or public hosting is included.

Test native flat, 180 and 360 media; both controller aim/trigger paths; visible prompts and keyboard responses; phase and scene gates; narration and video; GLB visibility; overlays and demonstration pause/seek. The wearer reviews readability, physical audio, comfort and tracking. Capture actual performance evidence and record failures before acceptance.

A separate WebXR session must exercise the same interactions in the Quest browser. Use a coordinated USB loopback connection for the local viewer if supported, with explicit temporary forwarding included in the approved device work. Verify the secure context and real immersive session on the device; the desktop ray test does not satisfy this check.

Install/launch steps and device routing remain unexecuted. Reconfirm the connected device and artifact hash immediately before the approved test. Record outcomes under `Artifacts/DeviceAcceptance`; passing desktop and packaging checks do not imply a headset pass.
