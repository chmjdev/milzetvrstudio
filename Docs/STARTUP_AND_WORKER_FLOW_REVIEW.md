# Original startup and worker-flow review — 9 September 2026

## Verified original startup

Read-only source: `/Users/mziwamadoda/Projects/Binteca/Interactive/vrstudio` (current README identifies 2.4.0/code 60).

- `StudioLaunchFlow` plays the actual nested MetaLogoSplash timeline with Binteca title, then shows setup each fresh launch.
- `StudioMenu.ConfigureLaunch` offers preferred Left/Right hand, Sitting/Standing and Enter Studio. `StudioLaunchPreferences` saves only confirmed selections and recalls them next launch.
- Placement uses measured camera position and horizontal heading. Sitting uses 0.85 reach; hand preference mirrors panels. Neither changes the tracked head/hands.
- `AnatomyRoomLayout` runs after entry, requests `com.oculus.permission.USE_SCENE`, invokes real `OVRScene.RequestSpaceSetup`, loads device scene via MRUK, validates a floor polygon and free room location, and reports denial, cancellation/unavailable room or retry instead of pretending success.
- Original package dependencies include Meta XR Core and MRUK 85.0.0. Milzet currently has neither: it uses OpenXR 1.15.1 and its own runtime UI. Therefore faithful scanning requires actual dependency/native initialization and permission integration, not just copied buttons.

## Omitted from Milzet

Original animated boot, preference deck/storage, hand-based initial placement, seated reach, real scene permission/setup/load/retry, and room-aware placement were not ported. Milzet currently requests floor tracking and creates its flat display at world height 1.5 m. Its menu is initially positioned from head pose; that does not make the content seated-aware. Attaching the guide to the display alone does not correct initial eye-height placement.

## Concrete restoration scope requiring confirmation

Port only original boot/setup assets and behavior into Milzet, preserving provenance; add preferred hand/posture saved on Enter; initialize content and panels from actual tracked eye height and preferred-side reach; preserve manual placement until explicit recall. Integrate the original real Meta scene permission, system Space Setup, MRUK room load and placement/retry using existing installed SDK versions where compatible. Keep head/hand tracking poses untouched. Use room geometry for spatial content and eye-relative placement for flat reading displays. Include denied/cancelled/missing-room states, setup re-entry, build/manifest validation, and coordinated seated/standing headset acceptance. No teaching assets or changes to original/Physio projects. Do not claim scanning before successful system/provider results.

This materially expands the current portable OpenXR viewer with Meta room-scene services and the original animation dependency. The user explicitly approved this recap through the coordinator. Implementation and validation are underway.

## Requirement-based worker hierarchy

Original PDF pages 18–20 define Capture → Induct → Shadow → Perform → Prove → Close, with mentor, worker, assessor, seconder and host roles. It explicitly uses Worker rather than Learner. The worker viewer must follow the authored subset/order of phases, never fabricate completion or authorization.

| Stage | Visible purpose | Milzet behavior / gap |
|---|---|---|
| Boot / setup | Comfortable entry and room setup | Original behavior restoration proposed above |
| Lessons | Choose an assigned workplace scenario | Direct package/experience list; packages are delivery files, not a separate learning step; real assignments/role identity require host integration |
| Scenario overview | Project, brief, occupation/module/source and current phase | Present authored context and references; do not invent validated registry data |
| Induct | Watch orientation, inspect PPE/permit/risk points, confirm understanding | View/Play plus phase markers/tasks; real voice confirmation pending |
| Shadow | Follow mentor demonstration, inspect freeze cues, identify hazards | Synced demonstration/guide, markers and authored questions; live mentor presence external |
| Perform | Carry out sequenced work with recorded hints | Ordered tasks, responses and hint events; real voice/photo evidence pending |
| Prove | Unsupervised work and assessment prompts | No hints; activity events; authoritative grading/signatures external |
| Close | Hand off evidence and productive-work record | External evidence/grade/signature/stipend host; do not display local test completion as certified completion |

Within the chosen scenario, View/Play is media control, Inspect opens marked explanations, and Tasks contains current-phase actions/questions. These are tools inside the phase, not substitutes for the required phase hierarchy. Sources retains attribution/module references. Layout contains comfort/recall settings. Opening a lesson should show its phase and appropriate next action; completion advances only through the authored gates.

The broader open requirements remain in `REQUIREMENTS_REVIEW_20260909.md`: onsite five-pack media, authoritative qualification/module binding, real evidence capture and receiving-team integration, live freshness/kill-switch and host services. Commons demonstrations are not completed onsite client packs.
