# Local sources and generation

Open the source library to import original PNG/JPEG/WAV/MP4/GLB files with the client owner, usage rights, credit and capture/source references. Each import keeps its original bytes and SHA-256. A derived file can point to an original; a generated file can point to a completed worker receipt. Image sources can start a playable scenario. MP4/GLB storage does not yet imply playback support.

Archive an applied scenario revision before making a substantial change. The source backup contains originals, provenance, generation records and saved runtime envelopes. It can contain private authoring information: keep it with client project files. Runtime exports are separate. Browser storage is local to the origin and may be cleared; export backups for portability. Limits: 12 MB per source, 32 sources, 20 revisions, 100 generation records, 120 MB backup.

## Generation worker

Prepare a Meshy preview or ElevenLabs narration request in the source-library panel and export the job JSON. For speech, select a voice ID verified against the account's available voices. Inspect the request before authorizing a submission. Preparation is offline and free of provider calls.

Run `python3 Tools/generation_worker.py inspect /absolute/client/job.milzet-job.json` to inspect. Submit only after explicit cost/content authorization, using the installed key loader:

```
~/.local/bin/with-elevenlabs-key python3 Tools/generation_worker.py submit /absolute/client/job.milzet-job.json --output /absolute/client/generated --authorize-paid-submission
~/.local/bin/with-meshy-key python3 Tools/generation_worker.py submit /absolute/client/job.milzet-job.json --output /absolute/client/generated --authorize-paid-submission
```

Use the loader matching the job provider. The worker saves an `uncertain` state before making a paid request, holds an exclusive file lock, and never automatically retries a submission. After a timeout or crash, reconcile the request in the provider account before changing its status. Copying a prepared job file can bypass file-local deduplication; keep one authoritative job file per request.

For submitted Meshy jobs, run the same worker with `poll` and the output folder to retrieve status without generating again. Once succeeded, `fetch` retrieves the GLB from its Meshy asset URL. The geometry preview is untextured and is not a reviewed production asset; texturing/refinement still requires a separate authorized workflow. ElevenLabs returns 24 kHz mono PCM wrapped as WAV, with available request/character-count receipts. Missing cost fields are unknown, not zero.

Import the updated job JSON using **Import worker job receipt**, then import the generated WAV/GLB and choose that receipt. Review the actual output before client use. A successful status alone is not quality acceptance.

On 8 September 2026, read-only ElevenLabs subscription and Meshy balance requests authenticated successfully. Worker retry/receipt tests use local mock transports. No real generation was submitted in this milestone; actual output quality, texturing, and provider charging remain unverified.

References: https://docs.meshy.ai/en/api/text-to-3d and https://elevenlabs.io/docs/api-reference/text-to-speech/convert . Credentials are loaded only into the local worker environment and never into browser code or package files.
