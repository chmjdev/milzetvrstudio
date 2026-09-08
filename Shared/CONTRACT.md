# Milzet content contracts

## Editable empty draft

`project.mjs` preserves the original empty-only `milzet-authoring-draft` v1 contract. It is not a playable package. Asset-inclusive content uses the distinct format below.

## Playable package v1

The envelope is JSON: `formatVersion:1`, `kind:milzet-playable`, `manifest` (a JSON string), `manifestSha256` (SHA-256 of its exact UTF-8 bytes), and `files:[{path,base64}]`.

Manifest: id, title, fixture boolean, entryPhase, assets, plate, hotspots, phases. Asset records contain id, relative path, MIME, byte length and SHA-256. Files must match the manifest exactly; no external paths or requests. Accepted media: PNG/JPEG flat plate, 16-bit PCM mono/stereo WAV at 8–96 kHz, at most 12 MB each, package at most 24 MB of JSON characters (UI also limits file bytes). Base64 increases size. This is a small-scene prototype format, not large-video transport.

Plate: assetId and projection=flat. Hotspots: id, label, text, normalized x/y (top-left origin), narrationAssetId or empty string, evidence boolean. The browser maps [0,1] anchors to a 4m × 2.4m plate. Its default center is (0,1.5,-2), Y-up; Unity reflects the Z axis: camera at (0,1.5,-1), plate at (0,1.5,2), markers at z=1.93, with identical X/Y anchors. The native Play Mode check verifies unmirrored rendered content and marker positions.

Phases are a nonempty ordered subset of induct/shadow/perform/prove with hotspotIds, next phase or empty terminal, and gate=none|host. Every phase must be reachable from entryPhase; cycles are rejected. All phase hotspots must be visited before advance. Host gates cannot be bypassed by content. Session completion is terminal and emitted once.

The local test-host callback receives unique event IDs, package ID, revision hash, phase, type and hotspot ID. It emits hotspot.selected, evidence.requested, phase.completed, phase.started and scenario.completed. This is a test-host contract only; identity, authorization, persistence, assessment decisions and retries at an external service are not implemented. The Unity player attaches unique session/sequence IDs and package revision to the C# engine callbacks, then exposes HostEventEmitted. Both provided hosts remain local test hosts.

Recovery stores the entire envelope and asset bytes in IndexedDB transactionally. Backups export that same envelope. Sessions intentionally restart on recovery. Real progress is external. Files/hashes and phase validation are checked by both JS and the native C# reader; shared negative fixtures test corruption and unsupported content.

No teacher assets, credentials, executable rules or CareerWIL business records belong here. Rubrics/answer keys are not part of v1. The fixture remains conspicuously marked when media is replaced; marking reviewed client content requires a later authoring workflow.

## Immersive image extension (version 2)

Flat packages remain version 1. `equirect180` and `equirect360` projection require envelope version 2, rejected by older readers. All other manifest fields remain unchanged. These are mono equirectangular still images: 1:1 aspect for 180°, 2:1 for 360°, maximum 8192 pixels per side. Ordinary photos, cropped panoramas, fisheye and stereo sources cannot be relabelled as full spherical captures.

UV origin is top-left; x increases right, y increases downward. Image centre faces forward, at eye height 1.5m. Longitude is `(x-.5)*coverage`; latitude is `(.5-y)*pi`. Surface radius is 5m; hotspots use 4.8m. The web forward axis is -Z, Unity +Z. The 180° rear hemisphere is empty. Browser drag and native look sliders support desktop inspection; device acceptance remains separate.
