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

## MP4 extension (version 3)

Packages containing `video/mp4` assets use version 3. MP4 paths end in `.mp4`; the plate can reference that asset with flat, equirect180 or equirect360 projection. Both readers inspect MP4 boxes for one H.264 video sample entry and verify encoded dimensions, including mono projection aspect. Clip limit: 12 MB and 4096 pixels per side. Codec decoding is verified separately from structural validation. The browser and native player expose play/pause/seek. Unity prepares a clip and decodes a frame before replacing the current scene; media is cached in its temporary application folder. No scripts are loaded from media.

## GLB scene extension (version 4)

A version-4 manifest adds `objects` with id, label, assetId, parentId, position, rotation, scale, visible and hotspotId. GLB assets use model/gltf-binary and .glb paths. Transforms are local to the parent, in metres and Euler XYZ degrees, with web forward −Z. Cycles, missing references and nonfinite/out-of-budget transforms are rejected. Unity reflects Z for authored transforms and compensates for glTFast’s X-reflected import coordinate convention. Both show static GLB scenes and link mesh selection to hotspot events. Animations are not controlled in this increment.

Models must embed resources, use uncompressed GLB 2.0 and contain 1–200,000 vertices. Required extensions are limited to KHR_materials_unlit and KHR_texture_transform. Maximum 16 scene objects and eight total package assets. glTFast 6.20.0 is installed from Unity’s official registry. Models are prepared before replacing the native scene.

## Activities (version 5) and context (version 6)

Activities define phase, kind, prompt, choices, hint/maxHints, clip start/end times and citation. Kinds: acknowledgement, ordered step, quiz response, observation/evidence request and free-text field. Activities must complete in authored order within each phase before transition. Prove rejects hint content and budgets. There are no grading keys or scores in the runtime contract. Responses emit activity.responded with activityId and response; observation also emits evidence.requested. The host owns identity, durable records, evidence storage, assessment decisions and phase authorization.

Context supplies environment, pilot workflow, occupation/module/source references, external stream/session reference and validity dates. These are author-supplied metadata, not verified registry records. The host determines access and validity. Version 6 is used when context is present; previous versions remain supported. Source-library private rubrics are separate from manifest fields and excluded from playable export. Local microphone recording produces 24 kHz mono 16-bit PCM WAV, up to 180 seconds, without a provider upload.

## Public source provenance (version 7)

`provenance` holds only public fields: assetId, sha256, owner, license, credit, source, capturedAt, provider, jobId and originalSha256. Each entry must match an asset's exact checksum. Owner and usage rights are required. Generated assets reference a provider job; derivatives can identify their original bytes. Private rubrics and complete job receipts are excluded from runtime packages. Replacing bytes removes stale credits.

## Presentation (version 8)

`presentation` contains up to 16 `overlays` and an optional `demonstration`. Overlays specify id, kind (label/diagram/sop/ppe/limits), text, imageAssetId, metric position/rotation/size, phase, startTime/endTime and citation. Text is inert; labels do not make a procedure authoritative. Time windows must use the demonstration phase and duration. A zero end time leaves an overlay visible.

Demonstration fields: phase, duration (0.1–600 seconds), narrationAssetId, path and cues. Paths contain zero or 2–64 strictly ordered time/position points, starting at zero. Cues contain id, time, hotspotId, text and pause; times are strictly ordered, with at most 32 cues. The guide interpolates between points without moving the viewer's head. Highlighted hotspots belong to the demonstration phase. A crossed pause cue stops narration/video once; resume continues, seeking rearms future cues, and replay restarts the timeline. Recording duration is checked by the consumer before playback.

## Experiences, templates and complete authoring backups

A `milzet-experience` v1 envelope has formatVersion, kind, manifest and manifestSha256. The hashed manifest specifies id, title, entryScene and up to 16 scenes. Each scene has id, next, gate and package (a JSON string containing a complete playable envelope). Every child is validated; duplicate IDs, missing references, cycles and unreachable scenes are rejected. Total JSON limit is 120 MB. Scene transitions require completion and any host release before the next package is committed. Events carry experience ID/revision and scene ID. Scene snapshots are explicitly updated by the author.

A `milzet-scene-template` v1 holds title, typed asset slots and composition. It contains no asset bytes or package identity/ownership. Import binds compatible client media to each slot. Optional narration may be omitted. Templates may contain client text and should be handled as authoring material.

A `milzet-authoring-project` v1 envelope has formatVersion, kind, data and sha256. Data is a hashed JSON string containing exactly project, library, scene and experience (each nullable). All nonempty children are validated before restore. Limit: 300 MB. This **private** authoring backup includes originals, receipts and rubric notes. It is never accepted as a viewer package. Browser storage now uses one transaction across these four records, preserving older storage through non-destructive migration. Runtime session progress is intentionally excluded.

Local client workspace selection is an authoring concern. Each workspace retains its own four-field authoring snapshot; switching saves the current snapshot and activates the selected one atomically. An older browser tab cannot write after another workspace becomes active. A complete authoring backup contains the active workspace only; local project archives and selection identifiers are not added to runtime packages. Restoring a backup opens a separate local workspace while retaining the previous saved one.

## Structured reference bindings (playable v9)

Optional `references` is an array of at most 128 author-supplied records. Each record has exactly seven string fields: `id`, `scope`, `targetId`, `occupationRef`, `moduleKind`, `moduleRef`, `sourceCitation`. IDs use the existing package ID syntax and must be unique within the array. `scope` is `scenario`, `hotspot` or `activity`. Scenario targets use an empty `targetId`; other targets must identify an existing hotspot or activity in the same manifest. Module kind is empty, `KM`, `PM` or `WM`; a nonempty kind requires a nonblank module reference. Occupation, module and citation text are each bounded to 2,000 characters, and at least one must be nonblank. Extra fields, nonstring values, dangling targets and duplicates are rejected by both readers.

These records do not verify an occupation, qualification, source document or module. They carry plain author text; readers do not fetch URLs or execute instructions. Existing context and activity citation fields remain supported. Reference-bearing packages require envelope version 9; versions 1–8 remain readable without this field. Authoring target deletion removes its bindings; an explicit empty array clears all bindings. References are included in the manifest checksum, recovery and export.

The browser and native consumer display scenario references in their scenario/menu or playback context, hotspot references under Inspect, and activity references with the pending task. Immersive text pagination preserves access to long references. Scene templates containing references use template version 2; existing template version 1 remains supported. Applying a template replaces the target composition and its bindings together, so old references cannot point into the replacement scene.
