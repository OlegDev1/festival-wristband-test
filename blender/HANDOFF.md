# Handoff: improving the band model

Paste everything below the line into a new AI session that has this repo, and replace the first line with what you want.

---

Improve the 3D wristband model: [WHAT TO IMPROVE, e.g. add a side button for the SOS feature, nicer connectors where the strap meets the case, a more realistic weave, better lighting].

Repo: OlegDev1/festival-wristband-test. Read CLAUDE.md and blender/README.md first, and follow CLAUDE.md's working rules (list the main changes and ask me before implementing; show results right away; push to main).

How it works now:
- The band on the website is a flipbook of 60 pre-rendered pictures (frames/f000–f059.webp). Picture 0 is the side view, picture 59 faces the viewer. The scroll position picks the picture. A live HTML screen is laid on the black rendered glass in CSS 3D.
- blender/build.py builds the whole band from code (pill case, glass, a separate flat "Screen" object, the woven plum strap loop, materials, the hdr/tribu_studio.hdr lighting plus 5 sun lights, the camera, Cycles + AgX, transparent background) and saves blender/band.blend.
- blender/render.py is the "photographer". It sets 60 poses between R0 (rx 0, ry -62) and R1 (rx 4, ry -8), frames the camera with lens shift, renders each pose to WebP, and writes frames/frames.json (poses, framing box, screen size). The turn is NOT keyframed inside band.blend.
- blender/render-mac.sh runs build.py and then render.py. I run it on my Mac for the sharp set.

Rules:
- Make every model change in build.py, never by hand in band.blend: render-mac.sh rebuilds band.blend from build.py before each render.
- Do not break the screen alignment:
  - Units: 1 band unit = 0.01 Blender units = 1 CSS px at --k=1. Keep the camera 1800 units in front, with the rotation pivot at the case centre.
  - Axes: X across the wrist, Z along the case, the screen facing -Y.
  - The Screen object must stay a flat pill, 124 × 308 units, 33.05 units in front of the case centre.
  - render.py writes the screen size into frames.json by hand (meta 'screen'). If you change W, H, SCREEN_INSET or GLASS_TOP in build.py, update it there too.
  - A different screen shape also means reworking src/chapters/screen.css and the chapter screens (designed at 124 × 308).
- The turn (R0, R1, frame count) lives in render.py and reaches the site through frames.json. The scroll playback (when the turn happens, when the screen turns on, smoothing, position) lives in src/story/timeline.js and src/band/band.js. Only touch those if I ask.
- build.py needs hdr/tribu_studio.hdr next to blender/.

Testing loop (Blender runs in the sandbox via `pip install bpy --break-system-packages`; open band.blend with bpy and run render.py with runpy):
1. Run build.py, then render test pictures 0 and 59 only: env FRAMES=60 ONLY=0,59 PPU=1.2 SAMPLES=24 GPU=0 OUT=/tmp/test. Composite them on the site background #0b0809 and show me before going further.
2. Full draft set for the site: FRAMES=60 PPU=1.5 SAMPLES=20 GPU=0 OUT=<repo>/frames. On CPU this takes about 10–30 s per picture.
3. Check alignment in the browser: serve the site (python3 -m http.server 8765), take a screenshot with `.face` filled green, and make sure the green pill sits exactly on the black glass mid-turn and at the end pose. Then screenshot a feature screen (see "Quick render check" in CLAUDE.md for fonts and scroll positions).

Known limits you may be asked about: 60 pictures make the turn move in about 1° steps (fix: FRAMES=90, or cross-fade the two nearest pictures in band.js); there is no side button (the SOS chapter lights the screen edge instead).

When done: push to main (it deploys GitHub Pages) and tell me to re-render the sharp set on my Mac with `sh blender/render-mac.sh`.
