# Tribu wristband site — notes for agents

Read this first. The page is split into feature folders: open only the folder for the feature you are changing.
## WORKING RULES
Goal: high quality with minimal tokens. Cut waste, not quality.
- Focus only on the key features that noticeably affect the result. Don't do minor or unnecessary stuff.
- List the main features first and ask me which to do before implementing. A crucial step that dramatically improves the result is worth spending tokens on.
- Build a good product, but don't polish or be a perfectionist.
- Verify lightly: one sanity check per change, no exhaustive testing.
- Merge and push directly to the main branch. No feature branches or PRs.
- After each change, show me the result right away and stop. Don't keep iterating on your own.
- If a fix doesn't work after 2 attempts, stop and tell me what's blocking it.
- When something is subjective (look, style, material), give me 3 quick options to choose from instead of guessing. Keep them lightweight: a screenshot of each or one simple artifact page, not three full implementations.

## Layout
No build step: plain ES modules and CSS files, served as-is. Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).
`index.html` is only the shell (static markup + CSS links); every block in it is commented with the folder that owns it.

```
index.html              shell: markup skeleton, CSS links, import map, loads src/main.js
src/main.js             boot: mounts features, starts the timeline, loads WebGL (fallback to CSS model)
src/core/               dom.js (helpers), i18n.js (languages, addStrings/strings/onLang), common-strings.js, base.css (tokens, design brief)
src/story/              timeline.js: scroll → one frame object for everyone (documented at the top); story.css (#story, sticky .stage)
src/header/             logo, RU/EN/ES switch, progress bar
src/hero/               wordmark + tagline, their strings and scroll fade
src/scene/              beams, horizon glow, crowd silhouette, phone bottom dim
src/chapters/           one file pair per chapter: <id>.js (strings, pose, screen markup, animation) + <id>.css
                        index.js = chapter order; chapters.js = runtime (contract documented at its top); screen.css = shared screen system
src/captions/           chapter captions (eyebrow, title, body) built from chapter strings
src/rail/               chapter dots + arrow/page keys
src/band/               band.js: pose, spring, buzz, look → renderer; css-model.js: CSS 3D fallback; band.css
src/gl/                 WebGL band: index.js (renderer, camera, draw), lighting.js, case.js, glass.js, button.js, strap.js, braid.js
src/sections/           how.* ("How it works"), end.* (slogan, colour range, footer)
vendor/                 three.module.min.js + RGBELoader.js (three.js r170), mapped as 'three' by the import map
hdr/, tools/            studio HDRI and its generator (tools/make_hdr.py)
```

How data flows: every scroll frame, `timeline.js` builds `frame` → `main.js` passes it to header, hero, scene, chapters
(which returns the active chapter's `look`), captions, rail, then `band.update(frame, look)` → spring → `gl.draw(v)` or CSS model.
Strings: each feature calls `addStrings('<ns>', {ru,en,es})` next to its code; markup uses `data-i="<ns>.<key>"`.
Shared strings (friend names, unit, colour names) are in `src/core/common-strings.js`.
CSS isolation: chapter CSS is scoped under `.scr-<id>` and its keyframes are prefixed `<id>-`, so a chapter edit can't leak.

## Where to change things
| What | Where |
|---|---|
| A chapter's copy, screen, animation | `src/chapters/<id>.js` + `<id>.css` only. Ids: home, radar, find, bump, places, lineup, glow, sos |
| Add / reorder chapters | `src/chapters/index.js`. Scroll length, rail and captions follow (≈180vh per chapter, `VH_PER_UNIT` in `timeline.js`) |
| Shared screen look | `src/chapters/screen.css`: `.we` coloured label, `.wb` (clock 51) / `.wm` (24) / `.nd b` (48) value, `.ws` (16) line; arcs stroke 3.5. Design size 228, scaled by `--k` |
| Scroll pacing | `src/story/timeline.js` `frame()`: `INTRO=1.6`; turn between features `blend` (second half of each chapter); screen switch `floor(q+.25)`; chapter animation `lt=fr*1.17` |
| Opening pose, band position/size | `src/band/band.js`: `R0={ry:-62,…cx:97}` (recompute `cx` if the loop size changes: x-extent midpoint after a −62° Y rotation ≈ (0.469·62 + 0.883·(2b+9.5) − 81.3)/2); `size()` (phone `w*.63/260`); `.shade` dim factor `.1` in `apply()` |
| WebGL screen overlay | `src/band/band.css`: `.webgl .screen{background:none}`, `.glass` sheen fades with `--gs` |
| Hero text | `src/hero/`: title `.hero-t` tall light Six Caps, uppercase, high up *behind* the band, size `min(64vh,70vw)`; tagline `.hero-f`; `--hy` lifts the title on scroll |
| Captions / rail | `src/captions/`, `src/rail/` (coral `.eyebrow` from each chapter's `label`) |
| Braid texture | `src/gl/braid.js`: `BRAID` + `braidTextures()`: procedural 1024 tile, 2/2 diagonal braid; colour, normal, disp (R height, G roughness), anisotropy maps |
| Band shape + material | `src/gl/strap.js`: `loopGeometry()` oval `a=200,b=135`, cross-section 124×19, `NF=64`; `strapMat` matte fabric (sheen .5, envMapIntensity .45, anisotropy .35) |
| Case | `src/gl/case.js`: body `satin` (roughness .42) + top edge `silver` (.3). Keep radius 130.2, half-thickness 23 and glass r 114.2 at z 22.7, or the HTML screen misaligns |
| Glass, light ring, glow | `src/gl/glass.js`: black dielectric, IOR 1.77, dome-bent normals; reflections fade with `v.scr` (uniforms only) |
| Button | `src/gl/button.js`: group rotated 14°, `slot` + `btn`, emissive glow for SOS |
| Lighting | `src/gl/lighting.js`: HDRI `hdr/tribu_studio.hdr` via `RGBELoader` → PMREM (regenerate: `python3 tools/make_hdr.py tinted hdr/tribu_studio.hdr`; equirect centre = +X, u .75 = +Z toward camera); `envScene()` is only the placeholder; lights hemi .08, key 2.9, side 1.5, cyan rim .7, coral .2 |
| Translations | the feature's own file (`addStrings`); shared ones in `src/core/common-strings.js` |

## Quick render check
Serve with `python3 -m http.server 8765` from the repo root. Screenshot with Playwright + `/usr/bin/google-chrome`
(`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`), viewport 390×844 at 2×, after waiting about 3.5 s.
To view feature k: `scrollTo(0, story.offsetTop + ((1.6 + k + .55)/9.6) * (story.offsetHeight - innerHeight))` (9.6 = 1.6 + number of chapters).
With swiftshader a screenshot sometimes catches a stale frame (HTML screen offset from the WebGL band); re-shoot before debugging it.
Google Fonts are not reachable from the sandbox: route `fonts.googleapis.com` to local `@fontsource/six-caps` + `unbounded` + `inter` woff2 files in Playwright, or the render falls back to system fonts.

## Not done yet (ideas, roughly by impact)
1. Band attachment: the loop passes through the middle of the case; there are no slots or connectors.
2. Ambient occlusion baked in Blender between case, button, glass edge and band.
3. Button set into a real cut-out in the case.
4. Case back details.
5. When moving to a GLB: KTX2 textures, meshopt compression, and lowering the pixel ratio automatically when the frame rate drops.
