# Onsite authoring with the current prototype

Client projects and generated content belong to the client. Start with new captures or approved generated assets; the application ships an empty library. This guide covers the working local tools. See `ACCEPTANCE.md` for features that still require implementation or acceptance.

## Create and preserve the source

1. Open the local studio. Use **Client projects > Create separate client project** for a new client. It starts with an empty workspace and retains the previous saved project locally. Choose a **Saved client project** to reopen its sources, scenes and experience. Then use **Create scenario from image** or **Create scenario from video** to begin playable content.
2. In **Source library, revisions and generation requests**, import originals and record client ownership, usage rights, credit and capture/source references. Retain originals separately from optimized derivatives. Export a source backup; browser storage is not permanent and changes with the local origin/port.
3. Select the actual projection: ordinary images/clips use Flat; genuine mono equirectangular 180 uses 1:1 dimensions and 360 uses 2:1. A normal phone panorama is not automatically an equirectangular 180 capture. Missing coverage stays empty.
4. Import one supported plate, static embedded uncompressed GLBs and PCM WAV narration. Current limits include 12 MB per asset, eight runtime assets, 16 model objects and a 24 MB JSON package. H.264 clips are limited to 4096 pixels per side. Export fails when limits are exceeded; keep any smaller derivatives separate from original captures.

## Prepare delivery copies

Keep the original capture in the source library. For an image, select a 1024, 2048 or 4096 pixel edge and choose **Make optimized JPEG copy**. The new source retains the owner and rights and links to its original; it never enlarges an image. White replaces transparency. Review the copy before using it as a plate or diagram.

For a video, run the local FFmpeg helper from the repository root:

```sh
python3 Tools/optimize_video.py /path/to/original.mp4 /path/to/delivery.mp4 --max-edge 2048 --max-bytes 10000000
```

It creates a separate H.264 MP4 and a checksum receipt beside it, retains optional audio as AAC, and refuses to overwrite either file. FFmpeg and ffprobe must already be installed. Long clips that cannot fit the budget must be split into scenes. Inspect sharpness, orientation and audio on the target device; a passed size check does not establish visual quality. Import the original and the reviewed delivery copy into the source workflow.

## Compose and preview

Name the scenario. Place hotspots on the image or video frame, edit labels/prompts and choose narration or evidence requests. Add GLB objects, set transforms in metres/degrees, choose parents and link objects to hotspots. Keep changes within the validated budgets.

Enable the required Induct/Shadow/Perform/Prove phases. Each enabled phase needs a hotspot. Author ordered activities, acknowledgement prompts, quiz choices, observation requests or text fields. Perform can use hint budgets; Prove cannot contain hints. Set activity windows against video playback or a demonstration in the same phase. The preview pauses when a pending timed activity becomes available. In **Overlays and demonstration**, place text/image surfaces, choose phase/time visibility, and author a guide path with highlight and pause cues. Narration and video follow the demonstration clock; its duration must fit both recordings. Import overlay images before editing the composition. Preview text at its intended size and distance.

Add environment, pilot workflow, occupation/module references, source/page citations and validity dates in **Scenario references and validity**. These are metadata. The external system verifies references and decides whether a live scenario remains available. An external stream reference does not embed or start a live call.

Use **Record local narration** and **Stop and save narration**, or import WAV. Recording stays local and is limited to three minutes. Review the real microphone and playback before use; automated recording checks use synthetic audio. Generated narration follows the separate worker workflow in `SOURCE_WORKFLOW.md`.

Choose **Apply composition** before previewing the latest edits, exporting, replacing media or switching packages. Invalid edits leave the saved package intact. Visit hotspots, respond to activities and test both withheld and simulated host releases. The preview's events are test data; they do not update worker records.

## Templates and multiple scenes

Apply an environment layout for a blank spatial/phase starting point, then enter the client instructions. These layouts contain no generated environment media. Export a custom scene template to reuse its composition. On import, bind each image/model/narration slot to the new scene's client assets; templates preserve text but exclude original media and ownership metadata.

Open **Multi-scene experience**, create an experience from the saved scene, and add further scenes from different captures. Up to 16 scenes can be packaged with an explicit next-scene order and host-release rules. Apply each composition and choose **Update current scene in experience** to replace its snapshot. Export **Experience + media** (120 MB maximum), then test the complete journey. Every scene retains the 24 MB scene limit.

## Back up and hand off

Use **Complete authoring backup > Export complete authoring backup** to save project metadata, source originals, rights, private notes, revisions, the current saved scene and the full experience together. **Restore complete authoring backup** validates every component before replacing the local workspace in one transaction. It opens the restored data as a separate local workspace and retains the previous saved workspace. It then reloads the studio. An older tab cannot save into a different active client project; reload it before continuing. Keep this private authoring file with the client; distribute playable exports separately. The authoring backup limit is 300 MB. Browser storage is local to its origin and can be removed by browser cleanup.

Save a scenario revision and export the source-library backup for future authoring. Use **Attach source credits to package** to carry matching public ownership/source/generation references with the exact asset bytes. Store private rubrics with the authoring material. Export **Package + media** for playback; it excludes private rubrics. Reopen that exported file in a clean browser session and through Unity's **Milzet > Open package preview** to check media and interactions independently of browser recovery storage.

Record which source files, revision, targets and review date were accepted. Supply package/event-contract information to the receiving team. That team owns identities, actual host authorization, durable attempts, grading, evidence storage and sign-off. Keep provider credentials out of files and packages.

## Five onsite pack workflows

| Pack | Author in the studio | Acceptance still needed |
|---|---|---|
| Trench and fibre duct | Genuine 180 capture, four hotspots, PPE acknowledgement, Induct/Shadow and Prove observation prompt | Client review of capture, instructions and evidence handoff |
| Toolbox talk / permit board | Permit-board image or clip, 90-second narration, Induct and Shadow prompts | Narration quality, scene order and assessor handoff |
| Daily site log | Walk video, ordered observations and site-log text-field prompts | External transcription/document/shift workflow and client validation |
| Virtual assessment | Office/workplace plate, observation prompts, external stream/session reference | Receiving system's live presence, stream and evidence integration |
| First-aid switch test | New client captures, first-aid reference, Induct and three Prove quiz items | Six-still/180 experience order and qualified client review of content; scoring is external |

In **Multi-scene experience**, select a **Pilot structure check** and choose **Check pilot structure**. It reports missing scene, phase, media and activity structure. A passing structure check does not validate the instructions or accept a client pack.

These recipes describe the intended authoring process. They are not completed pilot packs. Environment layouts and multi-scene/template tools are available; photorealistic client environments and the actual five pilot packs must still be authored onsite. Never promote procedural test media into client instruction.
