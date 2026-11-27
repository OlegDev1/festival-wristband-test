// Screenshots of the site for agents in the sandbox. One command, no setup:
//   node tools/shot.mjs [top|how|bottom|<chapter id>|<chapter index> ...] [--mobile] [--out DIR]
//   e.g. node tools/shot.mjs top radar sos   →  /tmp/shot/top.png, radar.png, sos.png
// Serves the repo itself, uses /usr/bin/google-chrome (or $CHROME), and swaps Google Fonts for local @fontsource copies
// (the sandbox can't reach Google Fonts). First run installs playwright-core + fonts into /tmp/shot-deps (npm).
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {existsSync, readdirSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DEPS = process.env.SHOT_DEPS || '/tmp/shot-deps';
const FONTS = path.join(DEPS, 'node_modules/@fontsource');
const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const oi = args.indexOf('--out'), OUT = oi >= 0 ? args[oi + 1] : '/tmp/shot';
const targets = args.filter((a, i) => !a.startsWith('--') && !(oi >= 0 && i === oi + 1));
if (!targets.length) targets.push('top');

if (!existsSync(path.join(DEPS, 'node_modules/playwright-core'))) {
  console.log(`installing playwright-core + fonts into ${DEPS} …`);
  execSync(`mkdir -p ${DEPS} && npm i --prefix ${DEPS} --no-audit --no-fund --silent playwright-core @fontsource/six-caps @fontsource/inter @fontsource/unbounded`, {stdio: 'inherit'});
}
const {chromium} = createRequire(path.join(DEPS, 'node_modules/'))('playwright-core');

// static server for the repo, plus /__fonts/ for the local font files
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'};
const server = createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = url.startsWith('/__fonts/') ? path.join(FONTS, url.slice(9)) : path.join(ROOT, url.endsWith('/') ? url + 'index.html' : url);
  try { res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream'}); res.end(await readFile(file)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// Google Fonts css2 URL → the matching @fontsource weight files, with their urls pointed at /__fonts/
async function fontCss(u) {
  let css = '';
  for (const fam of new URL(u).searchParams.getAll('family')) {
    const [name, spec = ''] = fam.split(':');
    const pkg = name.trim().toLowerCase().replace(/\s+/g, '-');
    const dir = path.join(FONTS, pkg);
    if (!existsSync(dir)) continue;
    const want = (spec.split('@')[1] || '400').split(';');
    const have = readdirSync(dir).filter(f => /^\d+\.css$/.test(f)).map(f => f.slice(0, -4));
    for (const w of want.filter(w => have.includes(w)).length ? want.filter(w => have.includes(w)) : have.slice(0, 1))
      css += (await readFile(path.join(dir, `${w}.css`), 'utf8')).replaceAll('url(./files/', `url(${BASE}__fonts/${pkg}/files/`);
  }
  return css;
}

const browser = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox']});
const page = await browser.newPage(mobile ? {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true}
                                          : {viewport: {width: 1440, height: 900}});
await page.route('**/fonts.googleapis.com/**', async r => r.fulfill({contentType: 'text/css', body: await fontCss(r.request().url())}));
await page.route('**/fonts.gstatic.com/**', r => r.abort());
page.on('pageerror', e => console.log('page error:', e.message));
await page.goto(BASE, {waitUntil: 'load'});
execSync(`mkdir -p ${OUT}`);

for (const t of targets) {
  // same scroll position as the rail's go(i): the middle of chapter i
  const y = await page.evaluate(async t => {
    if (t === 'top') return 0;
    if (t === 'how') return document.querySelector('.how').offsetTop - 40;
    if (t === 'bottom') return document.documentElement.scrollHeight;
    const list = (await import(new URL('src/chapters/index.js', location.href))).default;
    const {INTRO} = await import(new URL('src/story/timeline.js', location.href));
    const i = /^\d+$/.test(t) ? +t : list.findIndex(c => c.id === t);
    if (i < 0 || i >= list.length) return null;
    const story = document.querySelector('#story'), stage = document.querySelector('#stage');
    return story.offsetTop + ((INTRO + i + .55) / (INTRO + list.length)) * Math.max(1, story.offsetHeight - stage.clientHeight);
  }, t);
  if (y === null) { console.log(`skip ${t}: no such chapter`); continue; }
  await page.evaluate(y => scrollTo(0, y), y);
  await page.waitForTimeout(2500);
  const file = path.join(OUT, `${t}${mobile ? '-m' : ''}.png`);
  await page.screenshot({path: file});
  console.log(file);
}
await browser.close();
server.close();
