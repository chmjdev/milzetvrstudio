import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


def digest(path):
    checksum = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            checksum.update(block)
    return checksum.hexdigest()


def probe(path, ffprobe):
    result = subprocess.run([ffprobe, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def optimize(source, destination, max_edge=2048, max_bytes=10000000):
    source, destination = Path(source).resolve(), Path(destination).resolve()
    receipt_path = destination.with_suffix(destination.suffix + ".derivative.json")
    if not source.is_file() or source == destination or destination.exists() or receipt_path.exists():
        raise ValueError("Choose an existing source and a new output path; originals are never replaced.")
    if destination.suffix.lower() != ".mp4" or max_edge not in (1024, 2048, 4096) or not 100000 <= max_bytes <= 12000000:
        raise ValueError("Use MP4, a 1024/2048/4096 pixel edge and a 0.1–12 MB delivery budget.")
    ffmpeg, ffprobe = shutil.which("ffmpeg"), shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("Install FFmpeg and ffprobe before preparing video derivatives.")
    metadata = probe(source, ffprobe)
    streams = [s for s in metadata["streams"] if s["codec_type"] == "video"]
    if len(streams) != 1:
        raise ValueError("The source must contain one video stream.")
    duration = float(metadata["format"]["duration"])
    if not math.isfinite(duration) or not 0 < duration <= 600:
        raise ValueError("Choose a clip between zero and 600 seconds.")
    audio = any(s["codec_type"] == "audio" for s in metadata["streams"])
    bitrate = int(max_bytes * 8 * .88 / duration) - (96000 if audio else 0)
    if bitrate < 150000:
        raise ValueError("This duration cannot fit the delivery budget at the minimum bitrate; split the clip into scenes.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="milzet-encode-", dir=destination.parent) as temporary:
        directory = Path(temporary)
        output, passlog = directory / "delivery.mp4", directory / "pass"
        scale = f"scale=w='min({max_edge},iw)':h='min({max_edge},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1"
        common = [ffmpeg, "-v", "error", "-nostdin", "-i", str(source), "-map", "0:v:0", "-vf", scale, "-c:v", "libx264", "-preset", "medium", "-pix_fmt", "yuv420p", "-b:v", str(bitrate), "-passlogfile", str(passlog)]
        subprocess.run(common + ["-pass", "1", "-an", "-f", "null", "-"], check=True, stdout=subprocess.DEVNULL, timeout=1200)
        sound = ["-map", "0:a:0?", "-c:a", "aac", "-b:a", "96k"] if audio else ["-an"]
        subprocess.run(common + ["-pass", "2"] + sound + ["-map_metadata", "-1", "-movflags", "+faststart", "-n", str(output)], check=True, timeout=1200)
        encoded = probe(output, ffprobe)
        stream = next(s for s in encoded["streams"] if s["codec_type"] == "video")
        if output.stat().st_size > max_bytes or stream["codec_name"] != "h264" or max(stream["width"], stream["height"]) > max_edge:
            raise RuntimeError("Encoded output failed its delivery budget; choose a shorter clip or larger budget.")
        receipt = {"version": 1, "kind": "milzet-media-derivative", "tool": "ffmpeg", "sourceName": source.name, "outputName": destination.name, "sourceSha256": digest(source), "outputSha256": digest(output), "bytes": output.stat().st_size, "width": stream["width"], "height": stream["height"], "duration": float(encoded["format"]["duration"]), "targetMaxBytes": max_bytes}
        os.link(output, destination)
        with receipt_path.open("x") as handle:
            json.dump(receipt, handle, indent=2)
            handle.write("\n")
    return receipt


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a local H.264 delivery copy while preserving the original capture.")
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--max-edge", type=int, default=2048, choices=(1024, 2048, 4096))
    parser.add_argument("--max-bytes", type=int, default=10000000)
    args = parser.parse_args()
    print(json.dumps(optimize(args.source, args.destination, args.max_edge, args.max_bytes), indent=2))
