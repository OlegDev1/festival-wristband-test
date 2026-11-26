# Tribu wristband site — notes for agents

Read this first. The page is split into feature folders: open only the folder for the feature you are changing.
## WORKING RULES
Goal: a good result, with tokens used wisely. Spend them on what gets you to the result. Don't overthink, don't spend a long time on a simple thing, and don't polish or be a perfectionist.
- Focus only on the key features that noticeably affect the result. Don't do minor or unnecessary stuff.
- List the main features first and ask me which to do before implementing. A crucial step that dramatically improves the result is worth spending tokens on.
- Verify lightly: one sanity check per change, no exhaustive testing.
- Merge and push directly to the main branch. No feature branches or PRs.
- After each change, show me the result right away and stop. Don't keep iterating on your own.
- If a fix doesn't work after 2 attempts, stop and tell me what's blocking it.

## Layout
No build step: plain ES modules and CSS files, served as-is. Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).
`index.html` is only the shell (static markup + CSS links); every block in it is commented with the folder that owns it.

```
index.html              shell: markup skeleton, CSS links, import map, loads src/main.js
src/main.js             boot: mounts features, starts the timeline
src/core/               dom.js (helpers), i18n.js (languages, addStrings/strings/onLang), common-strings.js, base.css (tokens, design brief)
src/story/              timeline.js: scroll → one frame object for everyone (documented at the top); story.css (#story, sticky .stage)
src/header/             logo, RU/EN/ES switch, progress bar
src/hero/               wordmark + tagline, their strings and scroll fade
src/scene/              beams, horizon glow, crowd silhouette, phone bottom dim
src/chapters/           one file pair per chapter: <id>.js (strings, pose, screen markup, animation) + <id>.css
                        index.js = chapter order; chapters.js = runtime (contract documented at its top); screen.css = shared screen system
src/captions/           chapter captions (eyebrow, title, body) built from chapter strings
src/rail/               chapter dots + arrow/page keys
src/band/               band.js: turn, spring, buzz, look → loads/decodes frames ahead of the scroll, cross-fades them, turns the HTML screen; band.css
frames/                 the band rendered by Blender: f000…f059.webp (turn from side to front), m/ = smaller phone copy, frames.json (poses, framing, screen size)
blender/                band.blend + build.py (makes the model) + render.py (renders frames/); blender/README.md explains it, blender/HANDOFF.md = prompt for model work
src/sections/           how.* ("How it works"), end.* (slogan, colour range, footer)
hdr/, tools/            studio HDRI (lights the Blender render) and its generator (tools/make_hdr.py); tools/shot.mjs = site screenshots
```

How data flows: every scroll frame, `timeline.js` builds `frame` → `main.js` passes it to header, hero, scene, chapters
(which returns the active chapter's `look`), captions, rail, then `band.update(frame, look)` → spring → canvas frame for the turn + CSS 3D rotation of the HTML screen.
Strings: each feature calls `addStrings('<ns>', {ru,en,es})` next to its code; markup uses `data-i="<ns>.<key>"`.
Shared strings (friend names, unit, colour names) are in `src/core/common-strings.js`.
CSS isolation: chapter CSS is scoped under `.scr-<id>` and its keyframes are prefixed `<id>-`, so a chapter edit can't leak.

## Where to change things
| What | Where |
|---|---|
| A chapter's copy, screen, animation | `src/chapters/<id>.js` + `<id>.css` only. Ids: home, radar, find, bump, places, lineup, glow, sos |
| Add / reorder chapters | `src/chapters/index.js`. Scroll length, rail and captions follow (≈180vh per chapter, `VH_PER_UNIT` in `timeline.js`) |
| Shared screen look | `src/chapters/screen.css`: pill screen 124×308 design size, scaled by `--k`; `.we` label (9) / `.wb` clock, hours over minutes (50) / `.wm` (17) / `.nd b` (40) / `.ws` (12); edge arc = pill `<path>` starting top centre, stroke 3 |
| Scroll pacing | `src/story/timeline.js` `frame()`: `INTRO=1.6`; turn between features `blend` (second half of each chapter); screen switch `floor(q+.25)`; chapter animation `lt=fr*1.17` |
| Opening pose, band position/size | Poses live in `blender/render.py` (`R0`, `R1`) and are copied to `frames/frames.json`; change them there, I re-render on my Mac. `src/band/band.js`: opening scale `S0`, `size()` (divisor 290 = band units), chapter tilt = 2D `rz` from each chapter's `pose` (its ry/rx are ignored: the render has one turn) |
| Screen on the band | `src/band/band.css`: `.persp` (1800·k perspective at the band centre = the Blender camera), `.face` pill `--sw`×`--sh` at depth `--sz` (from frames.json), `.glass` sheen, `.glow`/`.sos` edge light |
| Hero text | `src/hero/`: title `.hero-t` tall light Six Caps, uppercase, high up *behind* the band, size `min(64vh,70vw)`; tagline `.hero-f`; `--hy` lifts the title on scroll |
| Captions / rail | `src/captions/`, `src/rail/` (coral `.eyebrow` from each chapter's `label`) |
| Band model, materials, light | `blender/build.py` (pill 156×340×60 BU, glass, screen, woven plum strap, studio HDRI + suns) → `band.blend`; then `blender/render.py` → `frames/` |
| Translations | the feature's own file (`addStrings`); shared ones in `src/core/common-strings.js` |

## Screenshot
`node tools/shot.mjs top radar` → `/tmp/shot/top.png`, `/tmp/shot/radar.png` (chapter ids or indexes; `--mobile` for a phone). Serves the site and handles fonts itself.

## Not done yet (ideas, roughly by impact)
1. Per-chapter turns: render short frame runs between chapter poses (render.py) so the band moves between features again.
2. A side button on the module for the SOS chapter.
