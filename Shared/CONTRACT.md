# Shared content contract — foundation

`project.mjs` currently validates empty editable drafts only. Runtime packages are a separate upcoming schema, not these draft JSON files. WebXR and Unity are required delivery targets; neither runtime is implemented by this foundation.

Draft fields: schemaVersion=1, kind=milzet-authoring-draft, id, title, template, targets=[webxr,unity], assets=[], scenes=[], bindings=[], phases=[induct,shadow,perform,prove] each with empty steps.

Reject unknown fields and schema versions. Reject populated arrays until their validators/importers exist. An empty draft is not a playable scenario. Client assets remain outside shipped source. No executable rules, remote credentials, user identities or CareerWIL business records belong in the content contract.

The future compiled package must use relative paths, asset hashes, explicit projection, immutable revisions and validated references. Unity/WebXR adapters will share fixtures and capabilities. Use Y-up metres in the format; define coordinate/handedness conversion explicitly before 3D adapters are written.
