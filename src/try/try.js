/* Try it mode. Owns the full-screen overlay (.try), its "Try it" buttons ([data-try] in the header and the end section),
   the zoom in / out and the gestures that play each feature.
   How it works: on open, every chapter screen (.scr, built by src/chapters) is moved out of the stage band's #screen into
   a CSS pill device that sets its own --k, so the screens render sharp at any size; the device is FLIP-animated from the
   stage .face rect to its own rect (transform only, so its rest state has no transform). On close it zooms back and the
   screens go home. It never touches the rendered frames, so a new band model doesn't affect it.
   While open, try mode drives chapters.update({si, lt}) itself: each gesture moves lt toward a target (table in TAP below),
   and main.js skips the scroll timeline (update() returns true).
   Navigation: it opens on its own launcher screen (.scr-launch: small clock + 2 × 4 app icons, si = -1); tap an icon to
   open that feature; the side button on the pill or a swipe right goes back to the launcher. */
import {$,$$,clamp,reduce} from '../core/dom.js';
import {addStrings,strings,onLang} from '../core/i18n.js';
import * as chapters from '../chapters/chapters.js';
import * as timeline from '../story/timeline.js';

addStrings('try',{
  en:{open:'Try it',cta:'Try it yourself',close:'Close',home:'Tap a feature to try it',back:'Side button or swipe right: back home',crew:'Tap to change colour',bump:'Tap to bump bands',
    radar:'Tap for the next friend',find:'Tap to start walking',meet:"Tap: it's time · again: on my way",places:'Tap for the next place',
    ghost:'Tap to go ghost',sos:'Hold to send SOS'},
  es:{open:'Pruébalo',cta:'Pruébalo tú mismo',close:'Cerrar',home:'Toca una función para probarla',back:'Botón lateral o desliza a la derecha: inicio',crew:'Toca para cambiar de color',bump:'Toca para chocar las pulseras',
    radar:'Toca para ver al siguiente',find:'Toca para empezar a caminar',meet:'Toca: es la hora · otra vez: voy',places:'Toca para el siguiente lugar',
    ghost:'Toca para el modo fantasma',sos:'Mantén pulsado para enviar SOS'},
  ru:{open:'Попробовать',cta:'Попробуй сам',close:'Закрыть',home:'Нажми на функцию, чтобы попробовать',back:'Боковая кнопка или свайп вправо: домой',crew:'Нажми, чтобы сменить цвет',bump:'Нажми, чтобы стукнуться браслетами',
    radar:'Нажми — следующий друг',find:'Нажми, чтобы пойти',meet:'Нажми: пора · ещё раз: уже иду',places:'Нажми — следующее место',
    ghost:'Нажми, чтобы стать невидимкой',sos:'Удерживай, чтобы отправить SOS'}
});

const ZOOM_MS=600,EASE='cubic-bezier(.2,.8,.2,1)';
let ids=[],on=false,busy=false,own=false,last=null,opener=null;
let si=-1,lt=0,tgt=0,spd=1,holding=false,raf=0,lastT=0;
let el,bg,dev,pill,scr,hint,launch,side,xBtn,clock=0;

/* lt helpers: jump, or move to `to` over `ms` */
const set=v=>{lt=tgt=v;kick()};
const play=(to,ms)=>{tgt=to;spd=Math.max(1e-6,Math.abs(to-lt)/ms);kick()};
const next=n=>set(((Math.floor(lt*n)+1)%n)/n+.01);

/* tap on the device, per chapter (thresholds come from each chapter's step()) */
/* launcher icons: one per feature (the story's home clock is replaced by the launcher itself) */
const ICON={
  crew:'<circle cx="7" cy="16" r="3.2"/><circle cx="17" cy="16" r="3.2"/><circle cx="12" cy="7.5" r="3.2"/>',
  bump:'<rect x="2.5" y="8" width="8" height="8" rx="2.5"/><rect x="13.5" y="8" width="8" height="8" rx="2.5"/><path d="M12 4v2.5M12 17.5V20"/>',
  radar:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6-6"/>',
  find:'<path d="M12 3.5 19 20l-7-3.8L5 20z"/>',
  meet:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.5l3.5 2"/>',
  places:'<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  ghost:'<path d="M5.5 20V11a6.5 6.5 0 0 1 13 0v9l-2.2-1.8L14 20l-2-1.8L10 20l-2.3-1.8z"/><path d="M9.5 11h.01M14.5 11h.01"/>',
  sos:'<path d="M12 3.5 21 19.5H3z"/><path d="M12 10v4M12 16.8h.01"/>'
};
const TINT={crew:'var(--coral)',bump:'var(--lime)',radar:'var(--cyan)',find:'var(--cyan)',meet:'var(--lime)',places:'var(--sun)',ghost:'var(--ink)',sos:'#ff5a3c'};

const TAP={
  crew:()=>next(4),
  bump:()=>{lt=0;play(.7,1200)},
  radar:()=>next(4),
  find:()=>{lt=0;play(.95,3000)},
  meet:()=>tgt<.69?play(.7,1500*(1-lt/.7)):tgt<.84?play(.85,400):set(0),
  places:()=>next(3),
  ghost:()=>play(tgt<.4?.5:0,450),
  sos:()=>{if(lt>=.4)set(0)}
};

export function mount(list){
  ids=list.map(c=>c.id);
  el=document.createElement('div');el.className='try';el.hidden=true;
  el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
  el.innerHTML=`<div class="try-bg"></div>
    <button class="try-x" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <div class="try-mid"><div class="try-dev"><button class="try-side" type="button"></button><div class="try-pill"><div class="try-scr">
      <div class="scr scr-launch"><b class="try-clock"></b><div class="try-apps"></div></div></div></div></div></div>
    <div class="try-ui"><p class="try-hint" aria-live="polite"></p><p class="try-sub"></p></div>`;
  document.body.appendChild(el);
  [bg,xBtn,dev,pill,scr,hint,launch,side]=['.try-bg','.try-x','.try-dev','.try-pill','.try-scr','.try-hint','.scr-launch','.try-side'].map(s=>el.querySelector(s));
  launch.querySelector('.try-apps').innerHTML=ids.map((id,i)=>ICON[id]?`<button type="button" class="try-app" data-n="${i}" style="--t:${TINT[id]}">
    <span><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[id]}</svg></span><em></em></button>`:'').join('');
  launch.addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(b&&on&&si<0)select(+b.dataset.n)});
  side.addEventListener('pointerdown',e=>e.stopPropagation());
  side.addEventListener('click',()=>{if(on)select(-1)});
  xBtn.addEventListener('click',()=>close());
  $$('[data-try]').forEach(b=>b.addEventListener('click',()=>open(b)));
  gestures();
  addEventListener('keydown',e=>{
    if(!on||e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.key==='Escape'){e.preventDefault();si<0?close():select(-1)}
  });
  addEventListener('popstate',()=>{if(on)close(true)});
  addEventListener('resize',()=>{if(on)size()});
  onLang(label);
}

/* from main.js on every timeline frame: remembers it; true = try mode owns the screens, skip the frame */
export function update(f){last=f;return own}

/* chapter buzz while open: shake the device (re-triggered each time) and vibrate where the phone can */
export function buzz(){
  if(!on)return;
  navigator.vibrate?.(120);
  if(reduce)return;
  pill.classList.remove('bz');void pill.offsetWidth;pill.classList.add('bz');
}

function label(){
  const t=strings('try');
  launch.querySelectorAll('[data-n]').forEach(b=>b.querySelector('em').textContent=strings(ids[b.dataset.n]).label);
  hint.textContent=si<0?t.home:t[ids[si]]||'';el.querySelector('.try-sub').textContent=si<0?'':t.back;
  xBtn.setAttribute('aria-label',t.close);el.setAttribute('aria-label',t.open);side.setAttribute('aria-label',t.back);side.title=t.back;
  tick2();
}

function size(){
  const vh=innerHeight,vw=innerWidth;
  el.style.setProperty('--k',clamp(Math.min(vh*.66,vh-210)/308,.6,Math.min(2.6,vw*.78/124)).toFixed(3));
}

/* launcher clock (minutes are enough) */
function tick2(){const d=new Date();launch.querySelector('.try-clock').textContent=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}

const nextFrame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
const face=()=>$('.face').getBoundingClientRect();

/* transform that puts the device (at its rest rect `to`) onto rect `from` */
function flip(from,to){
  const sx=from.width/to.width,sy=from.height/to.height;
  return `translate(${(from.left-to.left).toFixed(1)}px,${(from.top-to.top).toFixed(1)}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
}

async function open(btn){
  if(on||busy)return;busy=true;opener=btn;
  /* the band must be on screen and facing you: else jump (no smooth scroll) to its chapter, or the last one below the story */
  let f=last;
  const sr=$('#story').getBoundingClientRect();
  if(!f||f.si<0||f.turn<.98||sr.bottom<innerHeight*.5||sr.top>0){
    const i=sr.bottom<innerHeight*.5?ids.length-1:Math.max(0,f?.si??0);
    timeline.go(i,'auto');
    await nextFrame();await nextFrame();
    f=last;
  }
  si=-1;clearInterval(clock);clock=setInterval(tick2,10000);
  const from=face();
  $$('#screen > .scr').forEach(s=>scr.appendChild(s));own=true;
  document.documentElement.classList.add('trying');
  el.hidden=false;size();label();mark();launch.classList.add('on');
  lt=tgt=0;holding=false;render();
  try{history.pushState({findmeTry:1},'')}catch(e){}
  if(!reduce){
    const to=dev.getBoundingClientRect();
    await Promise.all([
      dev.animate([{transform:flip(from,to)},{transform:'none'}],{duration:ZOOM_MS,easing:EASE}).finished,
      bg.animate([{opacity:0},{opacity:1}],{duration:ZOOM_MS*.8,easing:'ease-out'}).finished,
      el.querySelector('.try-ui').animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:400,delay:ZOOM_MS*.55,easing:'ease-out',fill:'backwards'}).finished
    ]).catch(()=>{});
  }
  on=true;busy=false;xBtn.focus({preventScroll:true});
}

async function close(fromPop){
  if(!on||busy)return;
  if(!fromPop&&history.state?.findmeTry){history.back();return}  // the popstate handler comes back here
  on=false;busy=true;holding=false;clearInterval(clock);
  cancelAnimationFrame(raf);raf=0;lastT=0;
  if(!reduce){
    const to=dev.getBoundingClientRect(),from=face();
    el.querySelector('.try-ui').style.opacity=0;xBtn.style.opacity=0;
    await Promise.all([
      dev.animate([{transform:'none'},{transform:flip(from,to)}],{duration:ZOOM_MS*.85,easing:EASE,fill:'forwards'}).finished,
      bg.animate([{opacity:1},{opacity:0}],{duration:ZOOM_MS*.85,easing:'ease-in',fill:'forwards'}).finished
    ]).catch(()=>{});
  }
  const host=$('#screen'),glass=host.querySelector('.glass');
  scr.querySelectorAll(':scope > .scr:not(.scr-launch)').forEach(s=>host.insertBefore(s,glass));own=false;
  el.hidden=true;dev.getAnimations().forEach(a=>a.cancel());bg.getAnimations().forEach(a=>a.cancel());
  el.querySelector('.try-ui').style.opacity='';xBtn.style.opacity='';
  document.documentElement.classList.remove('trying');
  busy=false;
  dispatchEvent(new Event('resize'));  // the timeline re-runs on resize: the stage screen comes back where the story is
  opener?.focus({preventScroll:true});
}

/* -1 = launcher, else a chapter index */
function select(i){
  i=clamp(i,-1,ids.length-1);if(i===si)return;
  si=i;holding=false;lt=tgt=0;mark();label();render();
}

/* launcher on/off; on entering a feature the side button pulses once so people find the way back */
function mark(){
  launch.classList.toggle('on',si<0);dev.classList.toggle('inapp',si>=0);
  if(si>=0&&!reduce){side.classList.remove('nudge');void side.offsetWidth;side.classList.add('nudge')}
}

function render(){
  const lk=chapters.update({si,lt});
  el.style.setProperty('--ring',lk.ring);
  pill.classList.toggle('glow',!!lk.glow);pill.classList.toggle('sos',!!lk.sos);
}

function kick(){if(!raf)raf=requestAnimationFrame(tick)}
function tick(now){
  const dt=lastT?Math.min(64,now-lastT):16;lastT=now;
  if(holding){tgt=.42;spd=.42/1200}
  if(lt!==tgt){const d=tgt-lt,s=spd*dt;lt=Math.abs(d)<=s?tgt:lt+Math.sign(d)*s}
  render();
  if(lt!==tgt||holding)raf=requestAnimationFrame(tick);else{raf=0;lastT=0}
}

/* tap / hold on the device plays the feature; a swipe right goes back to the launcher */
function gestures(){
  let p=null;
  const end=(cancel)=>{
    if(!p)return;const g=p;p=null;
    if(g.swiped||si<0)return;
    const id=ids[si];
    if(id==='sos'){
      if(g.hold){holding=false;if(lt<.4)play(0,300);else{tgt=lt;kick()}}
      else if(!cancel)TAP.sos();
      return;
    }
    if(!cancel)TAP[id]?.();
  };
  dev.addEventListener('pointerdown',e=>{
    if(!on||si<0||e.button>0)return;  // the launcher's icons are plain buttons (click)
    dev.setPointerCapture?.(e.pointerId);
    p={id:e.pointerId,x:e.clientX,y:e.clientY,swiped:false,hold:false};
    if(ids[si]==='sos'&&lt<.4){p.hold=true;holding=true;kick()}
  });
  dev.addEventListener('pointermove',e=>{
    if(!p||p.swiped||e.pointerId!==p.id)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(dx>40&&Math.abs(dx)>Math.abs(dy)){p.swiped=true;select(-1)}  // swipe right = back to the launcher
  });
  dev.addEventListener('pointerup',e=>{if(p&&e.pointerId===p.id)end(false)});
  dev.addEventListener('pointercancel',e=>{if(p&&e.pointerId===p.id)end(true)});
  dev.addEventListener('contextmenu',e=>e.preventDefault());
}
