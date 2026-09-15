# Milzet VR Studio — resumable checkpoint

Updated 2026-09-15 (Africa/Johannesburg): checkpoint refreshed; the 2026-09-10 push directive is satisfied (`main` == `origin/main` at `4f549d4`). All edits are saved; no changes discarded. This task owns only this Milzet project. Separate main VR Studio / Physio checkpoint belongs to its other task.

## Objective and approved scope

Build Milzet VR Studio content authoring and portable playback, browser/WebXR and native Unity reference consumers, using the original requirements. Continue independent original-scope coding while wearer testing is deferred. CareerWIL owns identity, enrolment, authorization, attempts, evidence storage, grading, signatures, DigitalPaper/PoE/stipends, live communications and authoritative qualification registry. Do not invent live integration success.

Authoritative project: `/Users/mziwamadoda/Projects/Binteca/Interactive/milzetvrstudio`. Default shell cwd `/Users/mziwamadoda/Documents/ChatGPT/vrstudio` is NOT the working project; do not edit it. Main sibling `vrstudio` and `Physio demo` are read-only from this task. Follow AGENTS.md and ancestor rules: recap and get confirmation for new scope, previously confirmed work stays authorized. No explanatory authored-code comments. Keep shipped client library empty, projects isolated, secrets out of exports. No new paid generation, deployment, publication, external messages or device resets. The user resumed the saved coding scope after the credit-conservation checkpoint. Company-document cleanup cancellation was unrelated to Milzet.

Coordinator task: `01a08251-ad83-7b90-83a7-a97a2a90e1b8` (Chat with Friday). It relays explicit user authorization. No subagents spawned. Read original requirements in Docs/PLAN.md and Docs/REQUIREMENTS_REVIEW_20260909.md; full PDF `/Users/mziwamadoda/Downloads/Documents/DOC-20260904-WA0001.pdf`, extracted text `Artifacts/DeviceAcceptance/original-requirements-readable.txt`.

## Latest 2026-09-10 deploy and coordination update
- Pulled latest `main` from origin and confirmed no code changes were introduced in this increment.
- Installed existing Android build `Artifacts/Builds/milzetvrstudio.apk` to Quest 3S `3487C10GBM006L` with grant-permissions + replace.
- Installed package: `com.binteca.interactive.milzet.viewer` (v1.1.1 / code 6); launch succeeds and version reports `last_update_time=2026-09-10 10:28:11`.
- Foreground immediately after launch is the Quest lock screen; user must press headset power button to expose app UI. No new runtime code defects were introduced during this run.
- Next: resume user-wearer acceptance of previously implemented Milzet fixes (menu flow, playback popup semantics, menu/interaction behavior, and no-device state) using the already-installed build when wearer testing resumes.

## Git / saved work

Branch `main`, HEAD `4f549d4` — feat: implement site freshness gates, voice authoring, assessor rubrics, and update project docs. Pushed to `origin/main`; working tree clean. No isolated worktree. Current WIP is on top of prior completed changes.

## Completed before current increment

Installed Quest 1.1.1 / version code 6, package `com.binteca.interactive.milzet.viewer`, device Quest 3S `3487C10GBM006L`. Installation 2026-09-09 17:35:28 local. APK `Artifacts/DeviceAcceptance/milzet-v1.1.1.apk`, 66,315,614 bytes, SHA256 `832e8f8c43fb2ac7f07c32b9890b07bc49da088fe8d95623a0fbae47cae91339`; installed base.apk exact hash verified. Existing 11 lesson package files preserved; sibling Studio 2.4.0/code61 and Physio 1.0.0/code1 unchanged. Installed 1.1.1 does NOT contain the new format 9 WIP.

1.1.1 fixes: pinch-only hand drag starts; tracked pinch position instead of hand aim rotation; 5cm hand drag threshold; neutral rearm after tracking/focus loss; controller grip retains 6DOF. Android input/VR focus gating. Original animated boot, hand/posture setup and Meta room setup restored; startup waits for actual head pose. Exit App pauses media, saves state and quits. Reference card padded/aspect-correct image and wrapped paged text with Read more ray control. Same-source duplicate image explicitly labelled. Prior 1.1.0 physically failed, current 1.1.1 physical outcome pending.

Nine Unity verification receipts passed before current WIP (`Artifacts/DeviceAcceptance/reference-polish-unity.log`, `Artifacts/UnityVisual/*-verification.json`). Actual Mac ARM64 1.1.1 build passed Commons five packs / 14 activities and generated cone/audio playback (`Artifacts/Commons/native-1.1.1.log`, `Artifacts/Generation/native-1.1.1.log`, `Artifacts/DeviceAcceptance/interaction-mac-build.log`). Android build/manifest/signature verification passed (`interaction-android-build.log`, `interaction-artifact.json`, `interaction-install.json`). Visual checks `Artifacts/UnityVisual/reference-card-polished.png` and `startup-preferences.png` completed.

Five public-source Commons examples and generated cone/audio are demonstration content, not actual client onsite packs. Paid generation already completed: Meshy 30 credits, ElevenLabs 118 credits; do not repeat. Receipts in Artifacts/Commons and Artifacts/Generation. Shipped client library remains empty at last content audit.

## Latest completed increment: structured reference bindings

Completed after user resumed. Package v9 adds strict author-supplied scenario/hotspot/activity references: occupationRef, moduleKind (empty/KM/PM/WM), moduleRef and sourceCitation, with id/scope/targetId. Both JS and C# validate exact fields, string types, limits and valid targets. Browser editor supports adding, rebinding and removing references; target deletion cleans bindings. Both browsers and Unity show scoped reference text with immersive pagination. Template v2 preserves references; applying older templates clears prior bindings. Package versions 1–8 and template v1 remain supported. Installed 1.1.1 does not include this source change.

Files: Shared/references.mjs, package.mjs, authoring.mjs, templates.mjs, immersive-controls.mjs; Web/reference-editor.jsx, composer.jsx, activity-editor.jsx, activity-preview.jsx, playable.jsx; Unity/Assets/Milzet/Runtime/PackageReader.cs and PackageWorldUI.cs; Unity/Assets/Milzet/Editor/ReferenceVerification.cs and NativePreview.cs; Unity/Tests/ReferenceSmoke.cs; tests/references.test.mjs, references-browser.mjs, immersive-controls.test.mjs; scripts/test-native.mjs, verify-unity.py; package.json; Shared/CONTRACT.md and current acceptance/status documents.

Verified results:
- 45/45 Node tests pass.
- Native reader suites all pass (8 suites), including 12 reference negative fixtures.
- Full browser regression and dedicated reference browser tests pass: three scopes, scoped display, export/reimport, rebinding, deletion cleanup, empty bindings, 375px layout, zero page errors.
- Production and WebXR builds pass; existing bundle-size advisory (931.31kB JS, gzip257.04kB).
- Content audit and git diff whitespace check pass. No deployment or additional paid generation.

## Completed increment (2026-09-10): freshness, voice-command authoring & assessor rubrics

Completed following explicit user confirmation:
1. **Site Freshness & Validity / Host Kill-Switch Gate**:
   - `Shared/freshness.mjs`: `evaluateFreshness(context, nowIso)` validates scenario date windows (`validFrom`, `validUntil`) and reports structured validity status.
   - `Shared/package.mjs`: Session enforces freshness at startup and transition, implements `session.revoke(reason)`, and emits `site.invalidated` and `scenario.revoked` host events.
   - `Unity/Assets/Milzet/Runtime/PackageReader.cs`: Native C# session checks freshness against UTC date, supports `Revoke(reason)`, blocks actions when revoked, and emits `site.invalidated`.
   - `Web/playable.jsx`: Added host push-kill simulation trigger in the local test host panel.
   - Tested in `tests/freshness.test.mjs` and native `ReaderSmoke.cs`.

2. **Voice-Driven Authoring Workflow**:
   - `Shared/voice-commands.mjs`: Parser for authoring intents (`add_hotspot` with spatial positioning like "top right", "center", etc., `navigate_phase`, `next_phase`, `apply_template`, `inspect_hotspot`, `trigger_audio`).
   - `Web/voice-authoring.jsx`: Web Speech API recognition interface with manual transcript fallback, parsed intent preview, and execution callbacks into manifest and composer.
   - Tested in `tests/voice-commands.test.mjs` (navigation, templates, spatial coordinates, inspection, audio actions, and callback execution).

3. **Assessor Mode & Private Rubric Evaluation**:
   - `Shared/assessor.mjs`: Authoring schema validation for private rubrics and `evaluateAttempt(rubric, eventLog)` computing scores, criteria completion, hint penalties, evidence requests, and pass/fail status offline.
   - `Unity/Assets/Milzet/Runtime/AssessorEvaluator.cs`: Native C# evaluator parity for rubric criteria scoring and event log verification.
   - `Web/assessor-panel.jsx`: Evaluator UI allowing rubric definition, attempt log evaluation, criteria breakdown, and export of evaluation receipts (`milzet-assessor-report`).
   - Tested in `tests/assessor.test.mjs` and native `AssessorSmoke.cs`.

Verified results:
- 53/53 Node tests pass across all suites.
- 9 native C# smoke/test suites pass via Unity Mono.
- Content audit passes (clean shipped library).
- Production and WebXR builds pass with zero errors.

## Outstanding items inventory (refreshed 2026-09-15)

Current state: `main` == `origin/main` at `82571a7`. Quest 3S `3487C10GBM006L` carries viewer 1.2.0 / code 7 (commit `ac25fb6`, APK sha256 `b6a21648…8603`), installed via metavr 2026-09-15 01:40:35 and launched; receipt `Artifacts/DeviceAcceptance/install-20260915.json`. Tests at that commit: 53/53 Node, content audit clean, 9/9 native C# suites. `Artifacts/DeviceAcceptance/` logs, receipts and screenshots are tracked since `82571a7`; APKs and recordings stay local.

1. **Wearer acceptance on build 1.2.0 (Quest 3S)** — nothing has been physically accepted on any build yet:
   - 1.1.1 interaction fixes: pinch-only drag start, 5cm drag threshold, stable panel facing, controller grip 6DOF, neutral rearm after focus/tracking loss, Exit App save-and-quit, reference card pagination.
   - Format 9 features first on-device in 1.2.0: site freshness / host kill-switch (`site.invalidated`, `scenario.revoked`), assessor rubric evaluation.
   - Real Toolbox talk movie playback (earlier Play example was a still-image presentation, not a video failure).
   - Physical WebXR immersive session verification (browser consumer).
   - Testing is user-driven; no unsolicited device querying.

2. **Device state anomaly to explain** — at install time the headset held no Milzet package, and none of the sibling Studio 2.4.0 / Physio 1.0.0 packages recorded here on 2026-09-10. Uninstall vs. reset not determined. If the 11 lesson package files on the device mattered, check whether they survived; do not assume.

3. **Voice authoring on device** — `Web/voice-authoring.jsx` is browser-only (Web Speech API with manual fallback). No native voice path exists and none is scoped; confirm with the user before adding one.

4. **Onsite client content capture** (external to tooling): 180°/360° capture for the 5 pilot scenarios (Trench & fibre duct, Toolbox talk, Daily site log, Virtual assessment, First-aid switch). Current Commons assets are technical demonstration packs only.

5. **CareerWIL external boundaries**: worker identity/enrolment, qualification registry, authoritative grading/PoE, live communication/presence, stipend records remain external, interacting only through the package and event interfaces. Do not invent integration success.

6. **Repo hygiene** — `Unity/.utmp/` compiler intermediates are tracked and churn on every build; candidate for `.gitignore` + `git rm --cached`. Needs a decision, not done.

7. **Workstation USB note** — a Chrome WebUSB permission auto-claims the Quest on connect and blocks ADB (no debugging prompt appears). Remove the Quest 3S entry at `chrome://settings/content/usbDevices`, or quit Chrome before device work.

## Physical and external pending

User explicitly will test later: stop requesting headset input or checking device. Last observed Quest app PID25090 alive but system SensorLock/Guardian focused: “Press the power button to enable cameras and microphones.” Controllers connected inactive, tracking NONE. This is not a new 1.1.1 failure. User-recorded 1.1.0 menu rotation issue reviewed; repaired in code, still requires wearer acceptance. Actual Bluetooth unpairing was not demonstrated (later both controllers active tracked with same ids). Do not reset/re-pair devices.

Most recent recording `Artifacts/DeviceAcceptance/wearer-162607.mp4` reviewed via contact sheets; decode succeeded with duplicate-DTS muxer warnings. User's Play example was a still-image Presentation test with authored one-second guide pause and duplicated source/reference image, not a video failure. Real Toolbox talk movie acceptance pending. Original 31-page onsite/live assessment vision remains partially external/unfulfilled.

## Runtime / active processes

All owned verification processes finished. Latest Unity test process exited 0; no owned coding/build process remains running. Existing user/dev servers were not stopped. Quest may remain installed/running; no device checks performed during this increment. Unity 6000.3.22f1; Node v26.5.0; native reader uses bundled Unity Mono. Use original suite `.agents/VR_TOOLCHAIN.md`, metavr/hzdb only for future authorized device work. No raw adb or unauthorized installs.
