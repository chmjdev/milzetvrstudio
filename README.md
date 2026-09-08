# Milzet VR Studio

A clean content-authoring foundation derived from VR Studio. Product location: Binteca Interactive. CareerWIL is an external consumer.

## Implemented

Empty project creation; environment-template selection; four phase placeholders; browser-local save/reopen; validated empty-draft import/export; content-exclusion audit. No teaching models or media are shipped.

## Run locally

Node >=24. Run `npm ci`, `npm test`, `npm run audit:content`, and `npm run build`. `npm run dev` opens an ephemeral loopback authoring preview; use the address printed by Vite. This preview is not a registered estate service. No fixed port, remote domain or deployment is assigned. JCDS registration/deployment is a separate milestone.

## Source provenance

`UPSTREAM.json` records the committed vrstudio baseline and exact copied file hashes. This is a clean source snapshot, not a clone containing excluded model history. New authoring-shell and contract files are authored here. The original source and its uncommitted work remain untouched.

## Data

Drafts use the `milzetvrstudio.draft.v1` browser storage key. Export a JSON backup; browser storage is not permanent archival storage. Import replaces the active local draft. The current draft format is intentionally empty-only and is not a playable content package.

## Not yet implemented

Asset import, 3D composer, generation adapters, compiled package export, WebXR immersive runtime and Unity package playback. Shared contract and native target directories establish their boundaries only. Both playback targets remain required.

No paid jobs, remote repository or headset deployment occurred in this foundation. Client-generated media will be stored outside the shipped library. See `Docs/PLAN.md` for the accepted plan.
