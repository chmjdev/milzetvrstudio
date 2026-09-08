# Local sources and generation

Open the source library to import original PNG/JPEG/WAV/MP4/GLB files with the client owner, usage rights, credit and capture/source references. Each import keeps its original bytes and SHA-256. A derived file can point to an original; a generated file can point to a completed worker receipt. Image sources can start a playable scenario. Validated H.264 MP4 clips and embedded GLB objects can also be imported into the playable composer.

Archive an applied scenario revision before making a substantial change. The source backup contains originals, provenance, generation records and saved runtime envelopes. It can contain private authoring information: keep it with client project files. Runtime exports are separate. Browser storage is local to the origin and may be cleared; export backups for portability. Limits: 12 MB per source, 32 sources, 20 revisions, 100 generation records, 120 MB backup.

## Generation worker

Prepare a Meshy preview or ElevenLabs narration request in the source-library panel and export the job JSON. For speech, select a voice ID verified against the account's available voices. Inspect the request before authorizing a submission. Preparation is offline and free of provider calls.

Run `python3 Tools/generation_worker.py inspect /absolute/client/job.milzet-job.json` to inspect. Submit only after explicit cost/content authorization, using the installed key loader:

```
~/.local/bin/with-elevenlabs-key python3 Tools/generation_worker.py submit /absolute/client/job.milzet-job.json --output /absolute/client/generated --authorize-paid-submission
~/.local/bin/with-meshy-key python3 Tools/generation_worker.py submit /absolute/client/job.milzet-job.json --output /absolute/client/generated --authorize-paid-submission
```

Use the loader matching the job provider. The worker saves an `uncertain` state before making a paid request, holds an exclusive file lock, and never automatically retries a submission. After a timeout or crash, reconcile the request in the provider account before changing its status. Copying a prepared job file can bypass file-local deduplication; keep one authoritative job file per request.

For submitted Meshy jobs, run the same worker with `poll` and the output folder to retrieve status without generating again. Once succeeded, `fetch` retrieves the GLB from its Meshy asset URL. The geometry preview is untextured. After reviewing it, import its completed receipt and choose **Prepare texture refinement**, or run `prepare-refine` against the completed preview job with `--output /absolute/client/generated`. This creates a separate prepared child request without a provider call. Submit that new file only with authorization for the extra texture charge. Refinement requests Meshy-6, 2K PBR textures, lighting removal and GLB output. Poll and fetch the child as usual. Its parent preview ID, remote IDs, exact submitted payload hash and available per-job credit receipts remain separate; do not overwrite the preview job. The browser requires both parent and child receipts in source backups. Keep one child request per reviewed preview; creating additional child files can incur additional charges if submitted. A generated model is not a reviewed production asset. ElevenLabs returns 24 kHz mono PCM wrapped as WAV, with available request/character-count receipts. Missing cost fields are unknown, not zero.

Import the updated job JSON using **Import worker job receipt**, then import the generated WAV/GLB and choose that receipt. Review the actual output before client use. A successful status alone is not quality acceptance.

On 8 September 2026, read-only ElevenLabs subscription and Meshy balance requests authenticated successfully. Worker retry/receipt tests use local mock transports. No real generation was submitted in this milestone; actual output quality, texturing, and provider charging remain unverified.

References: https://docs.meshy.ai/en/api/text-to-3d and https://elevenlabs.io/docs/api-reference/text-to-speech/convert . Credentials are loaded only into the local worker environment and never into browser code or package files.

Local refinement verification: six worker tests cover lost-response retry blocking, separate preview/refinement records, actual remesh settings, and available cost receipts. These mocked transports do not establish provider output quality or charging.
