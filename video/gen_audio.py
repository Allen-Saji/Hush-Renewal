#!/usr/bin/env python3
"""
Generate the HushRenewal demo voiceover, one MP3 per scene, then probe each
clip's duration and emit the locked durationInFrames (at 30fps) for the
composition.

Uses ElevenLabs (voice Adam). The key is read from ELEVENLABS_API_KEY or
~/.config/elevenlabs-key and is never printed.

  Run from video/:  python3 gen_audio.py
  FORCE=1 python3 gen_audio.py   # regenerate even if mp3 already exists
"""
import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from pathlib import Path

HERE = Path(__file__).resolve().parent
AUDIO_DIR = HERE / "public" / "audio" / "hush-demo"
FPS = 30
TAIL_PAD_FRAMES = 12  # ~0.4s of breathing room after each VO

AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def api_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        key_file = Path.home() / ".config" / "elevenlabs-key"
        if key_file.exists():
            key = key_file.read_text().strip()
    if not key:
        sys.exit("No ElevenLabs key: set ELEVENLABS_API_KEY or ~/.config/elevenlabs-key")
    return key


def tts(text: str, spec: dict, out: Path):
    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{spec['voice_id']}"
        f"?output_format={spec['output_format']}"
    )
    payload = json.dumps(
        {
            "text": text,
            "model_id": spec["model_id"],
            "voice_settings": spec["voice_settings"],
        }
    ).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "xi-api-key": api_key(),
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            out.write_bytes(resp.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"TTS HTTP {e.code}: {e.read().decode()[:300]}")


def probe_seconds(mp3: Path) -> float:
    """Duration in seconds via Remotion's bundled ffprobe."""
    res = subprocess.run(
        ["npx", "remotion", "ffprobe", str(mp3)],
        cwd=HERE,
        capture_output=True,
        text=True,
    )
    blob = res.stderr + res.stdout
    for line in blob.splitlines():
        line = line.strip()
        if line.startswith("Duration:"):
            hms = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = hms.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    sys.exit(f"could not parse duration for {mp3.name}:\n{blob[:400]}")


def main():
    spec = json.loads((HERE / "narration.json").read_text())
    force = os.environ.get("FORCE") == "1"
    frames = {}
    total = 0
    print(f"audio dir: {AUDIO_DIR}\n")
    for scene in spec["scenes"]:
        out = AUDIO_DIR / f"{scene['id']}.mp3"
        if force or not out.exists():
            print(f"[gen] {scene['id']} ({scene['label']})")
            tts(scene["text"], spec, out)
        else:
            print(f"[skip] {scene['id']} exists")
        secs = probe_seconds(out)
        f = int(secs * FPS + 0.999) + TAIL_PAD_FRAMES
        frames[scene["id"]] = f
        total += f
        print(f"       {secs:6.2f}s  ->  {f} frames")
    print("\n// ---- locked SCENE_FRAMES (paste into HushDemo.tsx) ----")
    print("export const SCENE_FRAMES = {")
    for k, v in frames.items():
        print(f"  {k}: {v},")
    print("} as const;")
    print(f"// total {total} frames = {total / FPS:.1f}s")
    (HERE / "scene_frames.json").write_text(json.dumps(frames, indent=2))


if __name__ == "__main__":
    main()
