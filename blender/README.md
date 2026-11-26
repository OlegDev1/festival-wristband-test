# The band render (Blender)

## The idea in one minute
The wristband on the website is not live 3D. It works like a **flipbook**: 60 still pictures of the band, each turned a
little more, from the side view (picture 0) to facing you (picture 59). As you scroll, the page shows the picture that
matches your scroll position. Then it lays the live screen (normal HTML) on top of the black glass in that picture.

**Blender only makes the 60 pictures. The website plays them.**

## What is in this folder
| File | What it is | When you touch it |
|---|---|---|
| `band.blend` | The 3D band: model, materials, lights, camera. The studio lighting image is packed inside. | Open it to look around. You can edit it in Blender, but read the warning below. |
| `build.py` | The code that built `band.blend`. I made the model by writing code instead of clicking in Blender. Running it re-creates `band.blend` from scratch. | When you change the model by code (what an AI agent does). |
| `render.py` | The "photographer". It turns the band in 60 small steps, renders a picture at each step in Cycles, saves them to `../frames/` plus a smaller copy for phones in `../frames/m/`, and writes `../frames/frames.json` (poses, framing, screen size) for the website. | To change the start or end pose, the number of pictures, or the quality. |
| `render-mac.sh` | One command that runs `build.py`, then `render.py`, with the Blender installed on your Mac. | This is what you run. |

**Why not just press Render → Render Animation in Blender?** The turning is not stored in `band.blend`;
`render.py` does it step by step. Render Animation would give you the same picture many times.

**Warning:** `render-mac.sh` runs `build.py` first, which re-creates `band.blend`. If you edited `band.blend` by hand in
Blender and want to keep that, run only the render step:
`/Applications/Blender.app/Contents/MacOS/Blender -b blender/band.blend -P blender/render.py`

## Render the sharp pictures on a Mac (no git needed)
1. Install the latest Blender from blender.org into Applications.
2. On GitHub, click **Code → Download ZIP** (the whole site is only about 4 MB) and unzip it.
   `build.py` also needs the `hdr/` folder next to `blender/`, so take the whole zip, not just this folder.
3. In Terminal, go into the unzipped folder and run `sh blender/render-mac.sh`.
   The first line should say `device METAL` (the Mac's graphics chip). If it says `CPU`, it still works, only slower.
   It prints one line per picture.
4. To publish: on GitHub open the `frames` folder → **Add file → Upload files** → drag in everything from your new
   `frames` folder (60 `.webp` files, `frames.json`, and the `m` folder with the phone copies) → **Commit changes**.
   The site updates in about a minute.

Options, set before the command, e.g. `FRAMES=90 sh blender/render-mac.sh`:
- `FRAMES` (60): number of pictures. The site cross-fades between neighbours, so 60 already turns smoothly; more pictures
  mainly make the first download bigger (that matters most on phones). The site reads the count from `frames.json`.
- `PPU` (2.4): sharpness (pixels per band unit). 2.4 is sharp on retina screens.
- `SAMPLES` (128): render quality vs time.
- `MOBILE` (0.7): size of the phone copy in `frames/m/`; `0` turns it off.

## How the live screen lines up with the picture
Blender renders the screen **black** (switched off). It never renders HTML. The website puts the HTML screen on top
and turns it in CSS 3D exactly like the band in the picture:
- same units: 1 band unit = 1 CSS pixel (times the page scale `--k`)
- same camera: 1800 units in front of the band = CSS perspective 1800 px, centred on the band
- same turn: the scroll value that picks the picture also sets the CSS rotation
- same screen: a 124 × 308 pill, 33 units in front of the case centre (sizes come from `frames.json`)

## Where each part of the animation lives
| Part | Where | Needs a re-render? |
|---|---|---|
| The model (shape, materials, light) | `blender/build.py` → `band.blend` | yes |
| The turn: start pose `R0`, end pose `R1`, number of pictures, camera framing | `blender/render.py` | yes |
| When the turn happens while scrolling, when the screen turns on, where the band sits, the smoothing | `src/story/timeline.js`, `src/band/band.js` | no |
| What the screens show | `src/chapters/` | no |

## Known limits
- How the site keeps the turn smooth (`src/band/band.js`): all pictures start downloading at page load, coarse to
  fine; they are decoded in the background just ahead of the scroll (at most 30 kept in memory); the two pictures
  either side of the exact turn are cross-faded; phones download the smaller `m/` copy when it is sharp enough.
- The screen size in `render.py` (the `screen` entry written to `frames.json`) is typed by hand. If `W`, `H`,
  `SCREEN_INSET` or `GLASS_TOP` change in `build.py`, change it there too, or the HTML screen will not line up.
- Rebuilding needs `../hdr/tribu_studio.hdr` (a copy is packed in `band.blend`, but `build.py` loads the file).
