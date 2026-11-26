# Band render (Blender)

The wristband on the site is a Blender render played as frames while you scroll.

- `band.blend`: the model, materials and lights (the studio HDRI is packed inside).
- `build.py`: rebuilds `band.blend` from code (dimensions, strap path, materials). Run it if you want to change the model: `blender -b -P build.py`.
- `render.py`: renders the turn (side view → screen facing you) into `../frames/` as WebP and writes `frames.json`, which the site reads (poses, framing, screen size).

## Render on a Mac
1. Install Blender (blender.org) into Applications.
2. In Terminal, from the repo folder: `sh blender/render-mac.sh`
3. Reload the page. Commit `frames/` to publish.

Options: `PPU=3 sh blender/render-mac.sh` renders sharper (bigger files), `SAMPLES=64` renders faster, `FRAMES=90` makes the turn smoother.
The poses (`R0`, `R1`) are at the top of `render.py`; the page follows `frames.json`, so you only change them there.
