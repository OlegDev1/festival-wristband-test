#!/bin/sh
# Renders the band frames for the website on a Mac with Blender installed (uses the Apple GPU).
# Run from anywhere:   sh blender/render-mac.sh
# Writes frames/f000.webp … f059.webp and frames/frames.json next to index.html (overwrites the draft frames).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
BL="/Applications/Blender.app/Contents/MacOS/Blender"
[ -x "$BL" ] || BL="$(ls -d /Applications/Blender*.app 2>/dev/null | head -1)/Contents/MacOS/Blender"
[ -x "$BL" ] || { echo "Blender not found in /Applications. Install it from blender.org first."; exit 1; }
echo "Building the band in your Blender version …"
"$BL" -b -P "$DIR/build.py" 2>&1 | grep -E "built|Error" || true
echo "Rendering ${FRAMES:-60} frames … (medium quality, about 4-10 minutes on an M1; full quality: PPU=3 SAMPLES=128 sh blender/render-mac.sh)"
FRAMES=${FRAMES:-60} PPU=${PPU:-2} SAMPLES=${SAMPLES:-48} OUT="$DIR/../frames" \
  "$BL" -b "$DIR/band.blend" -P "$DIR/render.py" 2>&1 | grep --line-buffered -E "^(device|frame|done)|Error"
echo "Done. Reload the page to see the new frames."
