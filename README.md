# Milzet VR Studio

A content-free source fork of VR Studio for authoring client-owned VR scenarios. CareerWIL remains external.

## Implemented and checked

- Empty drafts remain separate from playable packages.
- Create an explicitly labelled procedural trench test package on demand: flat image plate, four hotspots, text prompts and a WAV test cue.
- Import PNG/JPEG plates and WAV narration; export all asset bytes with the manifest in one portable JSON package.
- Check SHA-256 hashes, version, paths, references and phase transitions before opening.
- Recover package media from IndexedDB after reload. Export backups for independent archival; browser storage is not permanent.
- Author phase subsets and explicit transitions. Preview with a local test-host release gate and evidence/completion events.
- Render the package in a browser with Three.js; WebXR feature detection and session entry are implemented but headset playback has not been accepted.
- Native C# package reader and phase engine compile and pass shared fixture/corruption/gate tests using Unity's bundled Mono. They also load the exact package exported by the browser.

- Unity Play Mode preview loads the exact browser-exported package, renders the plate and four markers, handles camera-ray selection and host-gated phase events, and starts decoded PCM audio. See Unity/README.md and the separate visual-verification receipt.

## Still outstanding

Headset input/acceptance, 180/360 projection, general asset library/composer, voice recording, provider generation/resume, and client onsite content acceptance. Unity Play Mode visual verification is now available separately; the pure C# reader test still does not prove rendering. No headset/device acceptance is claimed. The fixture's short WAV is an audio loading cue, not spoken instruction; prompt read-aloud uses the browser speech facility.

## Local checks

Node >=24. `npm ci`, `npm test`, `npm run audit:content`, `npm run build`, `npm run test:browser`, `npm run test:native`, `npm run test:unity`.

`npm run dev` serves an ephemeral loopback preview. It is not a registered estate service or deployment. No fixed port or remote domain is assigned.

Use “Create trench test fixture” in the package lab, inspect hotspots, simulate the host gate, then export. Import rejects corrupt packages without replacing the current recovery copy. Empty-draft storage and package recovery use separate stores. A recovered package starts a new preview attempt; real worker progress belongs to the host.

## Provenance and scope

`UPSTREAM.json` records the source baseline and copied hashes. No old teaching assets or their Git history are included. Test media is generated only on demand; client data is separate. No paid generation, remote publication, external media uploads or headset deployment occurred.

## Author a flat-image scenario

Choose **Create scenario from image** to import a local PNG/JPEG into a new package. In **Compose scenario**, name the scenario, select numbered hotspots, and click the image to position them. Edit labels, prompts, evidence requests and numeric coordinates. Add or delete hotspots, enable the required phases and choose each phase's hotspots and host release rules.

Choose **Apply composition** to validate and save the changes to package recovery. Each enabled phase must have a hotspot. A rejected edit leaves the saved package intact. Apply before exporting, importing media or opening another package; editor changes are not autosaved. **Export package + media** produces the self-contained package consumed by both players.

**Import WAV narration** adds narration to image-only packages or replaces the existing narration. Select it for each hotspot in the composer and apply. PNG/JPEG and 16-bit PCM WAV limits remain unchanged. Text prompts display when a hotspot is inspected; this increment does not add timed overlays, 3D objects, video or immersive projection.
