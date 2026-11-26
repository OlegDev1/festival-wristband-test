/* Scroll recorder for the band: logs every animation frame while you scroll, then downloads band-log.json.
   Use (desktop Chrome, on the live site): open the console (Cmd+Option+J / Ctrl+Shift+J) and run
     import('https://olegdev1.github.io/festival-wristband-test/tools/scroll-log.js?'+Date.now())
   Chrome may ask you to type "allow pasting" first. Then scroll like you normally do: recording stops by itself
   2.5 s after the scrolling ends (or after 20 s) and the file downloads. Nothing on the page changes.

   Each frame row: t (ms), gap since previous frame, scrollY, scroll events in that frame, the band pose that band.js
   wrote (picture index from rotateY, x, y, scale, tilt), and the canvas draws (picture id, alpha, offset).
   Also: long animation frames (Chrome's own report of frames that took > 50 ms, with the scripts that ran). */
const T0 = performance.now(), rows = [], loaf = [], ids = new WeakMap();
let nextId = 0, scrolls = 0, lastScroll = 0, started = false, draws = [], pose = null, prevT = T0;
const pos = document.getElementById('pos'), watch = document.getElementById('watch');

const di = CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage = function (im, ...a) {
  if (im instanceof ImageBitmap) {
    if (!ids.has(im)) ids.set(im, nextId++);
    const m = this.getTransform();
    draws.push([ids.get(im), +this.globalAlpha.toFixed(3), +m.e.toFixed(2), +m.f.toFixed(2), +m.a.toFixed(4)]);
  }
  return di.call(this, im, ...a);
};
const readPose = () => {
  const w = watch.style.transform, p = pos.style.transform;
  const ry = +(w.match(/rotateY\(([-\d.]+)/) || [0, NaN])[1];
  const m = p.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px.*scale\(([\d.]+)\) rotate\(([-\d.]+)deg/) || [];
  return [+((ry + 62) / 54 * 59).toFixed(3), +m[1], +m[2], +m[3], +m[4]];
};
const mo = new MutationObserver(() => { pose = readPose() });
mo.observe(pos, {attributes: true, attributeFilter: ['style']});
mo.observe(watch, {attributes: true, attributeFilter: ['style']});
const onScroll = () => { scrolls++; lastScroll = performance.now(); started = true };
addEventListener('scroll', onScroll, {passive: true});
let po = null;
try {
  po = new PerformanceObserver(l => l.getEntries().forEach(e => loaf.push({t: +(e.startTime - T0).toFixed(1), dur: Math.round(e.duration),
    block: Math.round(e.blockingDuration || 0), render: Math.round(e.renderStart ? e.renderStart - e.startTime : -1),
    scripts: (e.scripts || []).map(s => [s.sourceURL && s.sourceURL.split('/').pop(), s.sourceFunctionName || s.invoker, Math.round(s.duration)])})));
  po.observe({type: 'long-animation-frame', buffered: false});
} catch (e) {}

function frame(now) {
  rows.push([+(now - T0).toFixed(1), +(now - prevT).toFixed(1), Math.round(scrollY), scrolls, pose, draws]);
  prevT = now; scrolls = 0; draws = []; pose = null;
  const t = performance.now();
  if ((started && t - lastScroll > 2500) || t - T0 > 20000) return finish();
  requestAnimationFrame(frame);
}
function finish() {
  CanvasRenderingContext2D.prototype.drawImage = di; mo.disconnect(); removeEventListener('scroll', onScroll); po && po.disconnect();
  const out = {when: new Date().toISOString(), ua: navigator.userAgent, dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight,
    cols: ['t', 'gap', 'scrollY', 'scrollEvents', 'pose[pic,x,y,scale,tilt]', 'draws[[id,alpha,dx,dy,scale]]'], rows, loaf};
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], {type: 'application/json'}));
  a.download = 'band-log.json'; document.body.appendChild(a); a.click(); a.remove();
  console.log(`%cband-log.json downloaded: ${rows.length} frames, ${loaf.length} long frames`, 'color:#ff5a3c;font-weight:bold');
}
console.log('%cRecording. Scroll now; it stops 2.5 s after you stop scrolling.', 'color:#ff5a3c;font-weight:bold');
requestAnimationFrame(frame);
