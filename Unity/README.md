# Native Unity package preview

Open this folder in Unity 6000.3.22f1. Use **Milzet → Open package preview**, select a browser-exported `.milzet-package.json`, and the editor enters Play Mode with the imported plate, hotspot controls and test-host panel. No client media or scene is bundled. The preview builds its objects in memory.

The flat plate is 4m × 2.4m. Package normalized anchors use top-left origin. Unity reflects browser Z: camera (0,1.5,-1), plate (0,1.5,2), hotspot plane z=1.93; X and Y are unchanged. This preserves orientation and labels.

Click visible markers or the hotspot buttons. Phase advance requires every authored hotspot and any host release. Test-host simulation is explicit; a real host can supply the `Authorize` callback and subscribe to `HostEventEmitted`. Events include session sequence, package ID and revision. The PCM WAV decoder supports mono/stereo 16-bit PCM at 8–96 kHz, matching browser validation.

## Checks

`npm run test:native` checks the engine-independent reader/session. `npm run test:unity` runs an isolated local Unity Play Mode verification with graphics enabled. First run `npm run test:browser` to generate the exact browser fixture in Artifacts. The Unity check has an 8 GiB disk preflight, retains caches and has a four-minute process timeout.

The Play Mode check loads that exact package, verifies the image dimensions, selects four actual sphere colliders with camera rays, rejects a host-gate bypass and invalid replacement package, renders to PNG, verifies visible marker pixels, completes the authored subset, records evidence/completion events and confirms decoded nonzero samples and AudioSource playback state.

Evidence: `Artifacts/UnityVisual/native-trench.png`, `native-verification.json`, `native-host-events.json`, `native-audio-samples.json` and `editor.log`.

This verifies local Unity Play Mode rendering and audio-engine start. It does not establish audible device output, headset input, headset comfort/performance, standalone builds, 180/360 support or client-content acceptance. No headset deployment occurs.
