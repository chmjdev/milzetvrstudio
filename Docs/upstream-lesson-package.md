# Binteca lesson package v1

The browser heart player consumes this portable, data-only format. The future offline Windows/browser authoring UI should export the same contract. A native Unity package-import adapter remains a follow-on; existing native lessons are not automatically claimed to consume this format.

A package is a directory (or ZIP of that directory) containing `lesson.json` and its referenced model, image and audio files. Asset paths are relative to that directory. Original sources stay in the project's Models collection; package preparation copies only the selected lesson's runtime assets and records their SHA-256 hashes.

## Manifest

`schemaVersion` is `1`. `id` is a stable lowercase slug; `title` names the lesson. `assets` records each asset's stable ID, relative path, kind (`model`, `image` or `audio`), byte length, SHA-256, source credit and license/source URL. `views` associates model assets with a title, display height in metres and supported controls. `steps` contains ordered instructions, a view ID, and optional image and narration IDs. `entryStep` names the first step.

The initial heart package is one lesson with four existing views: supplied Meshy exterior, open cutaway, geometric sections, and the named beating heart. It preserves the source distinction: Meshy sections are geometric pieces, not anatomical labels. Named anatomy and contraction morphs come from the existing cardiac derivative. Original diagrams retain their descriptions and attribution.

## Rules and interaction limits

- v1 browser models are self-contained glTF 2.0 GLBs with embedded buffers and images. External GLB dependencies and unsupported required extensions are rejected.
- v1 is declarative. It contains no JavaScript, shaders, expressions, executable source-site scripts or AI dependency.
- View controls are drawn from the player's fixed set: rotate, scale, grab, separate, assemble, transparency, cutaway and heartbeat. A view enables only the controls supported by that model.
- Heartbeat uses the existing named atrial/ventricular morph targets; whole-object scaling does not simulate a beat.
- A cutaway lists exact `cutawayNodes` from the source GLB. It changes visibility without editing geometry.
- A step can select a view, show a resource and offer narration. The player owns Next/Back history and input bindings; the author does not supply executable transitions.
- External credit/source links are metadata. Runtime assets must resolve within the package directory. Reject absolute paths, parent traversal, duplicate IDs, unknown controls and unresolved asset/view references.
- Load only the selected model. Release its geometry, textures, material instances and interaction targets before replacing it. Treat rapid selection as a request sequence; an older result cannot replace a newer choice.
- State belongs to the player session: current step/view, model transform, detached pieces, transparency, audio and pause state. Session state is not written back into the source package.

## Authoring round trip still to implement

The offline authoring UI will import GLBs and resources, let humans configure steps/templates/rules and preview them, validate this contract, and export a package. ZIP import and the native Unity adapter are separate work from the first browser demonstration. No store registration or public release is implied by this format.
