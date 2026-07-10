#!/usr/bin/env bash
# Final render for the hackathon submission. Run from video/.
set -euo pipefail
cd "$(dirname "$0")/.."

npx remotion render HushDemo out/hushrenewal-demo.mp4 \
  --codec=h264 --video-bitrate=8M --pixel-format=yuv420p

npx remotion ffprobe out/hushrenewal-demo.mp4 2>&1 | grep Duration
