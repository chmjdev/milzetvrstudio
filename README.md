# Milzet VR Studio

A content-free fork of VR Studio for authoring client-owned workplace VR scenarios. CareerWIL remains external. No inherited teaching models, avatars or lesson media are shipped.

## Current state

Implementation continues from baseline commit `1019a64`. The suite has 53 passing Node tests, passing Chrome desktop/375px workflows, native C# checks across nine smoke/verification stages (including freshness revocation and AssessorSmoke), and visible controls with simulated headset/controller input. Local Mac and Android builds have succeeded. The built Mac app passes media and multi-scene checks; the corrected Android APK (1.1.1/code 6) is installed on Quest 3S with physical wearer acceptance deferred. See the acceptance matrix for precise limits.

This is a working local authoring prototype. The complete plan is not finished. [Acceptance and compatibility](Docs/ACCEPTANCE.md) records the remaining implementation, generation, headset and onsite requirements. Historical milestone JSON files describe their original increments; [VERIFICATION_STATUS.json](Docs/VERIFICATION_STATUS.json) records this verification run.

## Available workflow

- Keep separate local client projects, switch without mixing their content, and restore complete authoring backups. Older tabs cannot save into a different active project.
- Create empty project metadata or start a playable scenario from a PNG/JPEG image or H.264 MP4 clip.
- Select flat, genuine mono equirectangular 180-degree or 360-degree projection. Source aspect and media structure are validated.
- Place up to 32 hotspots and import static embedded GLB objects, with transforms, parenting, visibility and hotspot links.
- Author Induct, Shadow, Perform and Prove subsets, ordered activities, quiz choices, evidence prompts, hint budgets and host release gates.
- Enforce site freshness windows (`validFrom`, `validUntil`) and simulate host push-kill / revocation gates with native `site.invalidated` events.
- Author scene composition, hotspots, phase transitions, and template applications via voice-driven speech-to-command workflows.
- Compose portable multi-scene experiences with completion/release gates. Reuse custom templates or eight distinct blank environment layouts.
- Place client text/image overlays, author guide paths and timed highlights, and synchronize narration with pause/seek cues.
- Prepare separate image and H.264 video delivery copies while retaining originals and checksums.
- Check the required structure of the five pilot workflows without treating those checks as client acceptance.
- Import WAV narration or record local PCM narration. Preserve original sources, rights/credit information and revisions in source-library backups.
- Prepare Meshy preview/refinement and ElevenLabs narration requests; the local worker persists submissions, receipts and uncertain states. Real paid-output acceptance remains pending.
- Preview and export a self-contained, versioned package. Restore media from IndexedDB or a package backup; native Unity consumes the browser export.
- Author private rubrics and evaluate worker attempt logs offline via the Assessor panel and native evaluator. Private rubrics remain excluded from playable exports. The receiving host owns grading, evidence, identity and durable progress.

Read the [onsite authoring guide](Docs/ONSITE_AUTHORING.md), [source and generation workflow](Docs/SOURCE_WORKFLOW.md), [package contract](Shared/CONTRACT.md) and [Unity preview instructions](Unity/README.md).

## Local checks

Use Node >=24. After `npm ci`, run:

```
npm test
python3 -B tests/generation_worker_test.py
python3 -B tests/video_derivative_test.py
npm run build
npm run build:webxr
npm run test:browser
npm run test:native
npm run test:unity
npm run audit:content
```

Browser tests create procedural fixtures in `Artifacts`; native and Unity checks consume them. Unity requires the installed editor documented in `Unity/ProjectSettings/ProjectVersion.txt`, graphics support and at least 8 GiB free disk space. Build output has a bundle-size advisory; headset performance is unmeasured.

`npm run dev` serves an ephemeral loopback preview, with no deployment or registered domain. Browser storage belongs to that origin: export source and package backups before changing ports or browsers.

## Content and delivery boundary

`UPSTREAM.json` records the copied source baseline and hashes. Test media is procedural and created on demand. Keep client-owned originals, generated files and private authoring backups outside shipped application content. Apply composition edits before exporting or switching packages.

WebXR includes in-world inspection, activities, typed responses, playback and scene progression. Unity includes a tracked camera/controller rig and physically sized world controls. Browser rays, native rendered controls and simulated device bindings are verified; physical headset interaction remains unaccepted. The five client pilot packs still require onsite content and client review. No paid generation, remote publication or headset deployment occurred in this verification run.
