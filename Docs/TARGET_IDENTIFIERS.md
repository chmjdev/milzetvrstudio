# Confirmed Milzet target identities

| Target | Exact identifier | Effective local configuration |
| --- | --- | --- |
| Creator | com.binteca.interactive.milzet.creator | Default Vite build emits this web manifest ID into dist/manifest.webmanifest |
| Viewer | com.binteca.interactive.milzet.viewer | Unity standalone and Android application identifiers, with default identifier override enabled |
| WebXR | com.binteca.interactive.milzet.webxr | Vite --mode webxr emits this web manifest ID into dist-webxr/manifest.webmanifest |

Creator and WebXR currently share the browser authoring/preview implementation. These are web manifest identities, not Android applicationIds. There is no native Creator application in this repository. A later native Creator wrapper must use the reserved Creator identifier. The native Unity project is the Viewer target.

No app was installed, uninstalled, migrated or published. Changing an Android applicationId creates a distinct app identity for future builds; existing installed apps/data are untouched. Browser recovery keys are unchanged, and the manifests do not establish offline/service-worker support. Native headset packaging, signing and deployment remain separate acceptance work.
