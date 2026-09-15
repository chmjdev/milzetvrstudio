# Walkable 3D environments — design for review

Status: **design only, no build authorised.** Written 2026-09-15 at commit `3bbd5c2`. Decision recorded the same day: 360° capture ships first; this is the later phase.

## The ask

Training should feel like being in the workplace — walking into the factory, the trench, the site office — with the Induct → Shadow → Perform → Prove flow and its pop-ups living inside that space rather than on a panel in front of a picture.

## Where the runtime is today (verified)

- **Plates are spheres or screens.** A scene has one plate (`flat`, `equirect180`, `equirect360`, still or MP4) and up to 32 hotspots placed by 2-D (x, y) on that plate. The viewer stands at the centre; there is nowhere to go.
- **Embedded GLB objects exist** (`Shared/models.mjs`): static, ≤200,000 vertices, resources embedded, position/rotation/scale with parenting, visibility and hotspot links. The Meshy-generated object in package 06 is one of these. They are props in front of a plate, not a space around the viewer.
- **The eight "environment templates" are hotspot layouts, not environments.** `environmentLayout()` in `Shared/templates.mjs` returns four labelled hotspot positions per environment name (Site, Plant, Workshop, Field, Studio, Office, Clinic, Community) on a blank plate. No geometry.
- **Native locomotion exists in a minimal form.** `PackagePlayer.MoveViewer` (thumbstick translate) and `TurnViewer` (snap turn) are verified in `XRVerification.cs` under simulated input. No colliders on the environment, no ground, no teleport arc, no boundary. Wearer acceptance of movement in the real headset: not yet.
- **WebXR has no locomotion** (grep of `Web/` for teleport/locomotion/navmesh: nothing).
- **The rig** is Unity 6000.3.22f1, OpenXR 1.15.1, Meta XR Core SDK 85 with MRUK, `XROrigin` floor-level tracking.
- **Performance baseline** (`performance-summary.json`): 72 fps at 72 Hz, 0.8–1.5 ms app time, over a light procedural presentation — a menu, not a scene. A walkable environment has no measurement yet.
- **Requirements framing** (pp.26, 30): "Timed on 180 plates; spatial when 3D template exists" — 3D templates were anticipated. Also: "Do not simulate full crane/weld physics in v1. Overlays + hotspots + tasks beat a half-real simulator", and "Do not block prototype on a headset. Phone AR is the product."

That last line is the tension to decide on: walkable 3D environments are a headset (and desktop) experience. The phone/WebXR consumer would fall back to a fixed viewpoint or be excluded for these scenes. The design below keeps 180/360 packages as the universal form and makes 3D environments an additional scene kind, so nothing already shipped regresses.

## Proposed shape

### 1. A new scene kind: `environment`
Alongside `plate`, a scene may declare an environment:

```
environment: {
  assetId: "<glb>",            // the space itself, embedded GLB
  spawn: { position, yaw },     // where the worker starts, on the floor
  walkable: { kind: "mesh" | "polygon", ref },   // floor surface or 2-D boundary
  scale: "metric"               // 1 unit = 1 m, asserted at import
}
```
Hotspots in an environment scene are placed by **xyz** instead of (x, y) — the requirements' Hotspot object already allows `t_sec or xyz`. Overlays, activities, phases, gates, freshness and assessor evaluation are unchanged: they attach to hotspots and phases, not to plates.

A scene has either a plate or an environment. Existing packages (format ≤9) are untouched.

### 2. Locomotion
Teleport (arc + snap turn) as the default; continuous thumbstick as an option per worker. Comfort first: no artificial acceleration, vignette during continuous movement, floor-locked. The implementation reference is `Interactive/Samples/firsthand` (locomotion/teleport, hand + controller), read before writing — suite rule; nothing is recalled from memory or copied from a sibling project. The walkable surface is authored (a floor mesh or a polygon), never inferred from the whole model, so a worker cannot walk into a wall or off a trench edge unless the author lets them.

### 3. In-world training UI
- Hotspots become 3-D markers anchored to the model (the runtime already renders sphere markers and selects them by physics ray).
- The activity/reference panels already grab-move and face the viewer; in an environment they spawn near the active hotspot rather than at a fixed plate position.
- Phase transitions can move the spawn: Induct at the gate, Shadow at the workbench, Prove at the control point — reusing the environment layout labels the templates already carry.

### 4. Content pipeline for the spaces
- **Models are photorealistic and built from scratch** (suite rule): Blender-generated geometry with PBR materials through the suite's own generation scripts; downloaded environment assets are not the answer. Meshy is already authorised and used for objects; whether it is appropriate for whole rooms is untested and would need a paid-generation authorisation.
- **Capture-derived rooms are the other route:** the suite's `vrsplat`/`vrsimulator` pipeline turns a 360° walk into a Gaussian-splat room the worker can walk in — the client's actual site, not a modelled likeness. That is a cross-project dependency and the operator's call; it is the path most consistent with "honest capture" and with 360-first.
- Budget per environment on Quest 3S (proposed, to be measured): ≤300k triangles, ≤16 materials, textures ≤2048², baked lighting, no real-time shadows. The GLB validator's 200k-vertex ceiling and 12 MB asset limit would need raising for environments specifically, or environments would be a separate asset class with its own limits.

### 5. Consumers
- **Native Unity:** full support — locomotion, colliders, spatial hotspots.
- **WebXR:** environment scenes render from the spawn point with snap turn only in the first version; teleport later.
- **Phone AR / flat browser:** environment scenes present as a fixed-viewpoint render with the hotspot list; the training flow stays usable.

### 6. Phasing (each phase verified on the headset before the next)
1. **Contract:** scene kind, xyz hotspots, walkable surface, spawn; validators and tests on both readers; authoring UI in the composer.
2. **One environment, one scenario:** the trench (scenario A) as a modelled space with the four inspection points, teleport, and the existing Induct/Shadow/Prove flow. Measured frame time recorded.
3. **The remaining templates** as spaces: Site, Plant, Workshop first (the pilot scenarios), then Field, Office, Studio, Clinic, Community.
4. **Capture-derived rooms** via the suite pipeline, if the operator opens that door.

### 7. What this deliberately does not do
- No physics simulation of tools or machinery (requirements non-goal).
- No multi-user presence; assessment presence stays an external stream reference.
- No change to grading, evidence or identity — CareerWIL boundaries hold.

## Decisions needed before phase 1
1. Headset-first for environment scenes is acceptable (phone consumers get a fixed view)?
2. Modelled environments (Blender/Meshy), capture-derived rooms (vrsplat), or both?
3. Which scenario proves the phase — trench (A) is proposed.
4. Asset ceilings for environments (raise the GLB limits or add an asset class).
