# milzetvrstudio content-generation fork plan

Revised 8 September 2026 after scope confirmation. Fork name, location, delivery targets and generation direction are recorded below. The content-free fork was created at commit 8ca1b0e. Multiple local authoring and playback increments are implemented. The 8 September 2026 verification rerun passed; see ACCEPTANCE.md and VERIFICATION_STATUS.json for current evidence and remaining gaps. The full plan is not complete.

## Objective

Create `milzetvrstudio`, based on `vrstudio`, in the Interactive suite at `/Users/mziwamadoda/Projects/Binteca/Interactive/milzetvrstudio`, as a reusable workplace VR content-authoring system. Authors import or generate assets, compose immersive scenarios, configure demonstrations and interactions, preview the result, and export versioned content packages for an external system such as CareerWIL.

CareerWIL is outside this product. Its requirements inform the content VR Studio must be able to produce. They do not require VR Studio to become CareerWIL or implement its business workflows.

## Confirmed decisions and content exclusion

- Product/folder name: `milzetvrstudio`.
- Source: `vrstudio`; destination: `/Users/mziwamadoda/Projects/Binteca/Interactive/milzetvrstudio`.
- Deliver portable content packages and a reference preview player.
- Support both WebXR and native Unity package playback; both are acceptance requirements.
- Client content belongs to the client and is generated/captured onsite. Supplied example media is not a prerequisite for building the tools.
- Use available Meshy, ElevenLabs and other relevant tools. Inspect installed capabilities first, use applicable skills, and add needed plugins through their supported installation/authorization flow. Provider availability and successful outputs must be verified, not inferred from installation.
- Interpret the user's final confirmation conservatively as excluding all existing teaching content: teacher/presenter avatars, anatomy models and existing equipment lesson models. Preserve reusable authoring, rendering and interaction code.

The product starts with an empty client content library. Exclude teacher models, textures, animations, roster entries and teacher-selection UI; exclude existing lesson models, narration, presentations, thumbnails, lesson manifests and bundled copies in both web and Unity resources. Remove source-content defaults and exporter dependencies that would repopulate them. Preserve upstream originals in `vrstudio`.

Audit the proposed fork's assets and references before the first build. Demonstrate that both a fresh checkout and each distributable contain none of the excluded teaching assets. If preserving upstream Git history would retain these assets, use a clean filtered source snapshot with recorded upstream commit/provenance instead of copying that asset history. Retain applicable code license notices. The Git hosting destination remains to be selected before remote publication.

Use simple procedural geometry for tool validation. Real pilot assets will be authored onsite into client projects; project data and generated client assets must remain separate from the application's shipped content.

## Product boundary

| VR Studio owns | External CareerWIL owns |
|---|---|
| Source assets, provenance, reusable scene templates and editable projects | Worker identities, enrolment and host-project membership |
| 180/360 media and 3D scene composition | Assignment and work progression records |
| Mentor demonstrations, narration, overlays, hotspots and task definitions | Live mentoring, communication and supervision services |
| Induct/Shadow/Perform/Prove content variants and authored transition rules | Authorizing real phase releases and persisting worker attempts |
| Assessment questions, rubric definitions and evidence-capture prompts | Assessment decisions, private rubric access, evidence storage and sign-offs |
| Content preview, validation, versioning and package export | Digital Paper, PoE, Board, stipend ledger and impact reporting |
| Occupation/module reference metadata and content validity metadata | Authoritative qualification registry and live-site availability decisions |

The preview player simulates interactions and produces test events. It is not the system of record for real worker progress. An exported runtime, if needed by the receiving system, uses a narrow host interface for permissions and events; it does not carry CareerWIL business services.

## Verified foundation to reuse

Canonical source: `/Users/mziwamadoda/Projects/Binteca/Interactive/vrstudio`.

- `Web/`: existing React/TypeScript viewer, Three.js/IWSDK rendering, study resources and media-loading infrastructure.
- `Web/lib/studio-runtime.ts`: reusable model/rendering behavior mixed with anatomy-specific code. Extract reusable parts into scene-preview services.
- `SharedContent/`: asset hashes, versioned inventory and provenance conventions. Its Unity-driven export is a starting point, but new authoring projects must export independently of Unity builds.
- `Tools/LessonStudio/LESSON_PACKAGE.md`: existing declarative package concept. Extend through a new version or separate scenario schema; do not silently change v1 semantics.
- `Tools/LessonStudio/AUTHORING_BACKLOG.md`: the offline browser authoring UI and native package importer are planned, not completed features.
- Unity Viewer: a potential immersive preview consumer. Its current lessons do not automatically consume the portable package format; an importer is separate work.

The source has ongoing work. The last inspected commit was `f6fdfefb`, not an approved fork baseline. Full working-tree inspection was blocked when Git LFS attempted a write outside the permitted workspace. Choose a reviewed committed baseline before creating the fork.

## Authoring workflow

Brief → assets → scene template → spatial/timed composition → phase content → preview → validate → export.

An author should be able to:

1. Create a workplace scenario from a brief and optional occupation/module references.
2. Import genuine 180/360 media, photos, clips, GLB models, diagrams and narration.
3. Optionally request generated 3D assets, textures or narration through provider adapters, then review them before inclusion.
4. Choose Site, Plant, Workshop, Field, Studio, Office, Clinic or Community as a reusable starting template.
5. Position assets and overlays, mark interaction targets, set timing and define demonstrations.
6. Author the four phase variants, assessment items and required evidence prompts.
7. Preview the content in a desktop browser, inspect phone presentation and test immersive playback on a selected target where supported.
8. Export a validated package that an external player can import.

Manual import and template-based composition must work without an AI service. Generated assets are optional content inputs. Do not infer machine controls, operating limits or competency criteria from a generated model's appearance.

## Proposed architecture

- **Authoring project store:** local editable projects, autosave, asset library and revision history.
- **Asset pipeline:** import validation, thumbnails, format preparation, geometry budgets, provenance and checksums; optional generation adapters.
- **Scene composer:** hierarchy, transforms, media surfaces, overlays, spatial anchors, hotspot timeline and task editor.
- **Scenario compiler:** validates references and converts an editable project into a portable, declarative package.
- **Preview player:** renders the compiled package and simulates its interaction rules and phase variants.
- **Host contract:** package import, launch configuration and optional runtime callbacks. CareerWIL-specific implementation remains outside VR Studio.

Keep reusable rendering independent of anatomy lessons and of CareerWIL. Preserve the upstream application's existing work and asset originals.

## Current acceptance tracking

Current evidence is in [ACCEPTANCE.md](ACCEPTANCE.md), with the target matrix, limits and unimplemented requirements. Historical milestone JSON records retain their original scope.

- Foundation: clean-content fork complete; no inherited teaching media ships.
- Local authoring: one image/video plate, panorama projection, GLB transforms/parenting, hotspots, activities, references, narration recording, source backups and revisions implemented and tested. Environment and custom templates, multi-scene experiences, overlays, demonstration paths, synchronized narration, derivatives, complete backups, isolated client workspaces, voice-driven authoring, site freshness/revocation gates, and offline assessor mode rubric evaluation are now implemented. Actual client content remains open.
- Generation: resumable local Meshy/ElevenLabs worker and receipt flow implemented; six mocked worker tests pass. Actual paid outputs remain unaccepted and the prepared test requires approval.
- Browser: full desktop/375px suite passed with zero page errors; production and WebXR builds passed. In-world controls and desktop ray checks pass; headset acceptance remains incomplete.
- Native: fresh browser packages passed C# and Unity Play Mode visual/media/activity checks. 9 native test suites pass (including ReaderSmoke revocation checks and AssessorSmoke rubric grading). Tracked camera/controller code and world controls pass simulated input and rendering checks. Local viewer builds exist; physical headset acceptance remains unfinished.
- Client content: procedural fixtures only. All five onsite packs and receiving-team acceptance remain pending.

## Delivery milestones

### 0. Fork baseline and content contract

- Use the confirmed local name/destination; inspect the current source and select the reviewed source commit before execution.
- Create an isolated clean-content fork from the reviewed source, retaining applicable licenses and recording upstream provenance. Follow the exclusion audit above rather than carrying excluded assets through Git history.
- Inventory reusable code and unfinished Creator work; remove inherited content references and test clean startup without the excluded models.
- Define a draft content contract and a small independent reference consumer. Package authoring can proceed against fixtures without CareerWIL source access.
- Resolve the repository's Node requirement discrepancy: package metadata specifies >=24 while the README says 22.13+.

Acceptance: reproducible starting point and an agreed draft package schema with a clear producer/consumer boundary.

### 1. Asset library and editable projects

- Add project creation, local save/reopen and asset import.
- Support GLB, photos, video and audio, retaining source credit, licenses and hashes.
- Record media projection explicitly: photo, ordinary clip, phone_180 or genuine 360; never manufacture missing coverage by relabelling it.
- Preserve source files and create optimized preview/export derivatives separately.
- Integrate Meshy for applicable 3D/texture generation and ElevenLabs for applicable narration/audio, plus other installed capabilities as needed. Preserve a manual import path when a provider is unavailable. Persist job IDs, status, cost receipts and provenance to prevent duplicate submissions. No paid generation occurs as part of planning.

Acceptance: an author saves and reopens a project with one immersive media plate, one newly generated 3D object and narration, with every asset resolved. Complete and inspect real generation outputs during implementation; a configured plugin or mock response does not pass the generation acceptance check.

### 2. Scene composer

- Implement reusable environment templates and a scene hierarchy.
- Add placement, rotation, scale, grouping, visibility and interaction-target selection for 3D assets.
- Add 180/360 surfaces, photo panels and clip playback with appropriate projection.
- Add labels, SOP panels, PPE/limit overlays, diagrams and module/page citations.
- Add spatial hotspots and time-based hotspots, with inspection, hazard, tool, task, quiz and observation variants.
- Use the existing lesson controls only where the asset supports them. Full crane/welding physics is outside the first version.

Acceptance: author the trench scene with four hotspots and overlays entirely through the editor, then reproduce it from saved data.

### 3. Demonstration and scenario content

- Author Induct narration and acknowledgements.
- Author Shadow demonstrations using recorded media, paths, highlights, freeze points and commentary.
- Author Perform steps, ordering, constraints and hint budgets.
- Author Prove items with hints disabled, rubric definitions and evidence-capture prompts.
- Provide audio recording/import, narration timing and optional text-to-speech generation with text alternatives.
- Attach occupation/module references at scenario, task and hotspot level. These are references, not an authoritative qualification database.
- Represent external release requirements as declarative host-controlled gates. In preview, show clearly labelled simulated gate controls.

Acceptance: all four variants preview correctly; switching occupation bindings preserves the same editor and player.

### 4. Portable package compiler and preview

Proposed package contents:

- Versioned manifest: package ID, content revision, title, template, entry scene and target capabilities.
- Assets: relative paths, media/projection metadata, byte sizes, hashes and provenance.
- Scenes: objects, transforms, media surfaces, overlays and hotspot anchors/timing.
- Scenario content: phases, steps, demonstrations, hints, constraints, assessment definitions and evidence prompts.
- External references: occupation IDs, KM/PM/WM tags, source/page locators and optional host-project reference.
- Host interface version: external gates and event definitions where interactive delivery requires them.

Use data-only rules from a fixed supported set. Reject executable scripts, path traversal, unknown schema versions, duplicate IDs, missing assets and invalid references. Keep editable source projects distinct from compiled packages.

The exported runtime may emit hotspot selections, step completion, hint use, answers and evidence requests with package revision identifiers. The receiving system owns identity, persistence and final progression decisions. Sensitive answer keys/rubrics must be separable from worker-delivered content; hiding them visually is insufficient.

Acceptance: export → import into a clean reference consumer → play without access to the authoring project. Preview and imported playback match. No Unity rebuild is needed to export a scenario.

### 5. Produce the five requested pilot content packs

| Pack | VR Studio deliverable | External responsibility |
|---|---|---|
| Trench and fibre duct | 180 scene, four hotspots, PPE prompt, Induct/Shadow and Prove observation content | Actual acknowledgement, observation and Digital Paper evidence |
| Toolbox talk / permit board | Photo/scene composition, 90-second mentor narration and Shadow sequence | Worker assignment and assessor review |
| Daily site log | Virtual-walk scene, observation prompts and site-log field definitions | Transcription/document workflow, saved log and stipend record |
| Virtual assessment | Assessment-room content, observation positions and external-stream reference/placeholder | Live streaming, virtual presence, assessment session and PoE |
| First-aid switch test | Same template engine with first-aid references, Induct and three-item Prove quiz | Real attempt, scoring decision and evidence record |

The client owns pilot content and will generate/capture it onsite. Build capture/import and generation workflows for the five pack types, using procedural fixtures to validate tooling first. Do not copy existing VR Studio teaching content or assume access to CareerWIL media. Final pilot-pack acceptance happens after onsite authoring and client review; it is distinct from editor readiness.

Acceptance: each pack opens in the reference consumer; authoring and export cover all five content use cases without occupation-specific application code.

### 6. Playback validation and handoff

- Verify desktop preview and phone layout, and validate WebXR immersive playback and native Unity playback against the supported target matrix.
- Implement and validate the native Unity package importer as a required deliverable. Both Unity and WebXR must consume the same content contract; document supported capabilities and reject unsupported package features explicitly.
- Test save/reopen, export/import, projection accuracy, hotspot timing, spatial placement, narration sync, phase rules, missing resources and unsupported capabilities.
- Run applicable lint, type, package-validation and browser checks. Use measured asset/performance budgets for supported targets.
- Deliver the editor, package specification, reference preview player, WebXR runtime, Unity importer/runtime, compatibility matrix and onsite authoring guide. Produce and review the five client packs onsite as a separate content-acceptance milestone.
- Validate one package with the external CareerWIL team when its consumer contract is available. This confirms compatibility; it does not implement CareerWIL.

Acceptance: an author can independently create, preview, export and reopen a new scenario, and the documented consumer can play the exported content.

## Remaining implementation prerequisites

1. Approve and complete the exact prepared generation test in `Review/Generation/`, including real output review and package playback. Authentication and mocked tests do not establish output quality.
2. Complete the local template, multi-plate, demonstration and integrated project-authoring gaps listed in `ACCEPTANCE.md`.
3. Finish immersive interaction and native XR implementation, then review the concrete headset test/deployment scope. Establish measured device budgets.
4. Agree onsite capture/generation and client review procedures. Use `ONSITE_AUTHORING.md`; keep private authoring backups and originals separate from worker packages.
5. Validate the package/host contract with the receiving CareerWIL team when available. Its business workflows remain outside this fork.

Catalogue inconsistencies in the PDF must remain visible: missing credits, alternate/malformed IDs, and the Built environment template conflict on page 12. Proposed construction default is Site, matching the pilot. Preserve externally supplied references without silently treating them as verified registry data.

## Completion definition

The fork is complete for this scope when `milzetvrstudio` starts without inherited teaching content, can create new client-owned VR content onsite using verified generation/import tools, preview its interactions, and export portable packages that play in both WebXR and native Unity. CareerWIL's user management, progression records, evidence, assessment decisions and stipends remain external.

## Sources and planning limits

Requirements: `/Users/mziwamadoda/Downloads/DOC-20260904-WA0001.pdf`, particularly pp. 18–31 for scenario content and pilot use cases, and pp. 1–17 for catalogue/template context. The user's clarified content-generation scope takes precedence over broader application requirements in the PDF.

Repository references reviewed: `README.md`, `AGENTS.md`, `.agents/VR_TOOLCHAIN.md`, `Web/README.md`, `Web/package.json`, `Web/lib/database.ts`, `Web/lib/session.ts`, `Web/lib/studio-runtime.ts`, `SharedContent/README.md`, `Tools/LessonStudio/LESSON_PACKAGE.md` and `Tools/LessonStudio/AUTHORING_BACKLOG.md`.

The clean local repository and foundation build exist. The playable increment adds local code and tests; no paid generation, remote publication or headset deployment has occurred. Estimates follow baseline inspection and verification of the two required delivery targets; the PDF's historical prototype date is not a delivery commitment.

### Local visual authoring increment — 8 September 2026

The flat-image composer now creates packages directly from imported images, edits hotspot anchors/prompts/evidence/narration, and authors four-phase subsets with host gates. Applied edits are validated and recovered with their media. The browser-authored package is also checked by the native C# reader/session. See `COMPOSER_STATUS.json` for verification and limits. This increment does not complete the general 3D composer or 180/360 playback.

### Immersive images — 8 September 2026

Mono 180°/360° image authoring and playback now pass browser export/recovery and actual Unity Play Mode colour-orientation, coverage, ray and completion checks. See `PROJECTION_STATUS.json`. Both accept the same version-2 package. Video, stereo, device acceptance and 3D composition remain separate unfinished work.

### MP4 clips — 8 September 2026

Shared version-3 H.264 MP4 packages now pass browser playback/export and Unity Play Mode decode, advancement and seek checks. See `VIDEO_STATUS.json`. Source library/revision/provenance and prepared generation jobs are implemented; read-only provider authentication is verified, while real generation still requires authorization and output review.
