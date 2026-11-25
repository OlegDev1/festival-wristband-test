# Tribu wristband site — notes for agents

Read this first; it saves you from re-reading the 700-line `index.html`.

## Owner's working rules
- Spend few tokens. Do only the high-impact items asked for; no polish such as fingerprints, micro-bevels or brushing lines.
  Final assets will be modelled and baked in Blender later, so the web version only needs to look good, not perfect.
- One sanity render per change, not exhaustive testing.
- Workflow: branch → PR via `gh api` REST (GraphQL is blocked in Claude sessions) → merge only when the owner says so.
  Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## Layout
Single file `index.html` plus vendored `three.module.min.js` (three.js, loaded through an import map).
- **CSS** at the top. In WebGL mode: `.webgl .screen{background:none}` (the HTML UI sits over the WebGL glass),
  `.glass` sheen fades with `--gs`, and `.shade` dims only a little (factor `.1` in `apply()`).
- **Script 1** holds the page logic and the scroll story: i18n (ru/en/es), the CSS 3D fallback model, and
  `update()` (scroll → pose and screens) → `apply()` (spring) → `tribuGL.draw(v)`.
- **Script 2 (module)** is the WebGL watch.

## Where to change things (search for these strings)
| What | Where |
|---|---|
| Scroll length | `#story{…height:1732vh}` (≈180vh per unit); units in `const N=8,INTRO=1.6,U=INTRO+N`. Adding a chapter = +1 to N, a pose in `P`, a `.scr`, a `.cap`, labels in `e:[…]`, +180vh |
| Turn between features | `m=sm(clamp((fr-.5)/.5…` (second half of each feature); screen switch `floor(q+.25)`; feature animation progress `lt=fr*1.17` |
| Hero text | Title is tall, solid white Anton (uppercase). `.hero-t` / `.hero-f`: wide = text column left, band right (`tgt.x=vw*.17` from the start); phone = wordmark top, tagline bottom. `--hy` lifts them on scroll |
| Screen UI | one system: `.we` coloured label, `.wb` (clock 51) / `.wm` (24) / `.nd b` (48) value, `.ws` (16) line; arcs stroke 3.5. Design size 228, scaled by `--k`. Phone band size: `size()` `w*.63/260` |
| Chapters | `.cap` has a coral `.eyebrow` (`data-e`); `#rail` dots (`go(i)`), arrow/page keys step chapters |
| Opening pose | `R0={ry:-62,…cx:97}`. Recompute `cx` if the loop size changes: x-extent midpoint after a −62° Y rotation ≈ (0.469·62 + 0.883·(2b+9.5) − 81.3)/2 |
| Braid texture | `BRAID` + `braidTextures()`: procedural 1024 tile, 2/2 diagonal braid. Cords run along each strand; per-strand tone and hue. Outputs: colour map, normal map, disp (R = height, G = roughness), anisotropy map |
| Band shape | `loopGeometry()`: oval `a=200,b=135`, cross-section 124×19, `NF=64`, 10 vertices per cell. Vertex colours hold the contact shadow near the case and the darker inside of the loop |
| Band material | `strapMat`: matte fabric (metalness 0, roughnessMap, sheen .5, envMapIntensity .45, anisotropy .35) |
| Case | `caseGeometry()`: machined lathe profile split into body (`satin`, brushed anisotropic, roughness .42) and top edge (`silver`, roughness .3). Keep radius 130.2, half-thickness 23 and glass r 114.2 at z 22.7, or the HTML screen misaligns |
| Glass | `glassMat`: black dielectric, IOR 1.77, faint iridescence, dome-bent normals on a flat ring mesh. Reflections fade to 0 with `v.scr` while features are on screen (uniforms only, no shader recompile) |
| Button | group `bg` rotated 14° (above 3 o'clock); `slot` = dark gap, `btn` = darker silver pill; emissive glow for SOS |
| Lighting | `envScene()` = synthetic studio panels → PMREM. Lights: hemi .08, key 2.9, neutral side light 1.5 from the right (shapes the strap), cyan rim .7, coral .2 |

## Quick render check
Serve with `python3 -m http.server 8765` from the repo root. Screenshot with Playwright + `/usr/bin/google-chrome`
(`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`), viewport 390×844 at 2×, after waiting about 3.5 s.
To view feature k: `scrollTo(0, story.offsetTop + ((1.6 + k + .55)/9.6) * (story.offsetHeight - innerHeight))`.
Google Fonts are not reachable from the sandbox: route `fonts.googleapis.com` to local `@fontsource/anton` + `unbounded` + `inter` woff2 files in Playwright, or the render falls back to system fonts.

## Not done yet (ideas, roughly by impact)
1. Band attachment: the loop passes through the middle of the case; there are no slots or connectors.
2. Ambient occlusion baked in Blender between case, button, glass edge and band.
3. A real photographed studio HDRI instead of the synthetic panels.
4. Button set into a real cut-out in the case.
5. Case back details.
6. When moving to a GLB: KTX2 textures, meshopt compression, and lowering the pixel ratio automatically when the frame rate drops.
