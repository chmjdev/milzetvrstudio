# Onsite capture brief — the five pilot scenarios

Written 2026-09-15 against the runtime at commit `3bbd5c2`. This is the shooting list for the client site visit. Media that comes back in the forms below loads in the existing viewer without engineering work; media that does not will be rejected by the package validator, not quietly degraded.

The governing contract from the original requirements (pp.24–30) is **"honest phone_180, not fake 360"**: every plate records what it actually captured, and a 180° capture is never stretched into a 360° sphere.

## What the runtime accepts today (verified in `Shared/projection.mjs`, `Shared/video.mjs`, `Shared/package.mjs`)

| Plate | Projection value | Required shape | Ceiling |
| --- | --- | --- | --- |
| Flat photo | `flat` | any aspect | 12 MB per asset |
| 180° still | `equirect180` | mono equirectangular, **exactly 1:1** (width = height) | 8192 px per side |
| 360° still | `equirect360` | mono equirectangular, **exactly 2:1** (width = 2 × height) | 8192 px per side |
| Flat clip | `flat` + `video/mp4` | H.264 MP4 | 4096 px per side |
| 180° / 360° clip | `equirect180` / `equirect360` + `video/mp4` | H.264 MP4, same 1:1 / 2:1 rule | 4096 px per side |

Per scene: eight assets, 12 MB each, 24 MB of JSON. Per experience: 16 scenes, 120 MB. Narration is 16-bit PCM WAV, mono or stereo, 8–96 kHz. Stereo (VR180 two-eye) media is **not** supported; capture or export mono.

A front hemisphere cut from a 2:1 equirect is 1:1 by construction, so a 360° camera can supply a valid 180° plate by cropping the centre half — the plate is then labelled `equirect180`, which is the honest label for what the viewer is shown. The reverse (padding a 180° into a 2:1 canvas and calling it 360°) is exactly what the contract forbids.

**Gap to be aware of:** the requirements' plate object carries `captured_at`, `capture_device` and `honest_fov`. The current scenario context has none of these fields (`Shared/context.mjs`: environment, pilotType, occupationRef, moduleRefs, sourceCitation, externalStreamRef, validFrom, validUntil). Record them on the shoot log below so they can be entered once the schema carries them; until then `sourceCitation` is the only place provenance lands in the package.

## Shoot log — fill one row per capture

| Field | Why |
| --- | --- |
| Scenario (A–E) and scene position | Maps to the pilot structure checks |
| Kind: `phone_180`, `photo`, `clip`, `360` | Honest-capture contract |
| Capture device and mode | `capture_device` |
| Date/time, site name | `captured_at`, site freshness window (`validFrom`/`validUntil`) |
| Horizontal field of view actually covered | `honest_fov` — never claim more than the lens saw |
| Camera height and position (tripod height, distance to subject) | Hotspot placement assumes a standing eye height (~1.5 m in the runtime rig) |
| Rights holder, credit, usage permission | `sourceCitation`; client-owned originals stay out of shipped content |

Keep originals untouched. Derivatives (resized, cropped to 1:1, re-encoded) are prepared in the source library, which retains the original bytes and SHA-256.

## Scenario shooting lists

Structural requirements come from `Shared/pilot-checks.mjs` (what the tool checks) and pp.27–29 of the requirements (what the client asked for). The checks are structure only; client review is separate.

### A — Trench & fibre duct induction (Site)
- **Have:** a flat Commons photo demo. **Need:** one genuine 180° plate of the trench and duct run, shot from the walkway position a worker would stand at, at standing eye height.
- Four inspection points must be identifiable in the frame: shoring/trench box, duct entry, spoil edge, access ladder or equivalent — confirm the four with the mentor on site before shooting.
- Optional second 180° from the opposite end for the Prove phase.
- Voice: PPE acknowledgement prompt is an authored activity; no recording needed. If the mentor is willing, a short WAV brief for the Induct phase.
- Check passes when: a 180° or 360° plate (a full sphere contains the front hemisphere, so either satisfies the source check; the plate label must still be what was captured), ≥4 hotspots, Induct/Shadow/Prove phases, an Induct acknowledgement, a Prove observation request.

### B — Toolbox talk → permit board (Site)
- **Need:** the permit board as a flat photo set — the whole board legible, then each section close enough to read (three to six stills).
- **Need:** the mentor's **90-second** narrated demonstration as WAV (the check requires `duration === 90` on a Shadow-phase demonstration bound to a WAV asset). Record clean audio on site, or record the mentor later against the stills; either way it is the mentor's voice, not synthesised.
- Optional 180° of the briefing area for context.
- Check passes when: Induct and Shadow phases, 90-second Shadow demonstration with WAV narration.

### C — Daily site log from virtual walk (Site, 360 option)
- **Need:** a walkthrough **video** plate. The requirements' job spec names a 360° camera on the supervisor; a 360° clip must be mono, 2:1, H.264, ≤4096 px wide — that is 4096×2048 at most, and 12 MB per asset, so expect 20–40 s of clip per scene at moderate bitrate, split into scenes rather than one long walk.
- A flat clip from a phone held at eye height is acceptable and honest if a 360° camera is unavailable; label it `flat`.
- The log fields (what the worker writes) are authored; no capture needed.
- Check passes when: MP4 plate, a text-field activity, an observation request.

### D — Assessment session, virtual presence (Office + live stream)
- No capture required by the tool; the check needs an **external stream/session reference** in the scenario context plus a Prove-phase observation request.
- Optional: one 180° or flat still of the assessment room so the worker has somewhere to stand.

### E — First-aid switch test (Site / first-aid room)
- **Need:** **six distinct stills** (flat photos, six separate scenes): kit location, kit contents, eyewash/burn station, incident book, emergency numbers board, assembly-point sign — adjust to what the site actually has.
- **Need:** **one 180° plate of the assembly point**, standing where the muster line forms.
- Three Prove quiz items are authored from the client's procedure.
- Check passes when: ≥6 flat still scenes, one 180° or 360° scene, Induct and Prove phases, ≥3 Prove quiz items.

## On the day
1. Shoot each 180°/360° from a tripod at ~1.5 m; level the camera — the runtime does not correct horizon tilt.
2. Nobody's face without consent; the client is the POPIA responsible party for its workers.
3. Copy originals to two places before leaving site; record SHA-256 when importing.
4. Import into the source library with owner, rights and credit; export a source backup (browser storage is per-origin and not durable).
5. Build the pack, run the pilot structure check, push to the headset (`files/Packages/`), and check readability and comfort on the device — the checks do not see the rendered result.
