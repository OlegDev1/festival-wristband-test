/* Try it mode. Owns the full-screen overlay (.try), its "Try it" buttons ([data-try] in the header and the end section),
   the zoom in / out and the gestures that play each feature.
   How it works: on open, every chapter screen (.scr, built by src/chapters) is moved out of the stage band's #screen into
   a CSS pill device that sets its own --k, so the screens render sharp at any size; the device is FLIP-animated from the
   stage .face rect to its own rect (transform only, so its rest state has no transform). On close it zooms back and the
   screens go home. It never touches the rendered frames, so a new band model doesn't affect it.
   While open, try mode drives chapters.update({si, lt}) itself: each gesture moves lt toward a target (table in TAP below),
   and main.js skips the scroll timeline (update() returns true). */
import {$,$$,clamp,reduce} from '../core/dom.js';
import {addStrings,strings,onLang} from '../core/i18n.js';
import * as chapters from '../chapters/chapters.js';
import * as timeline from '../story/timeline.js';

addStrings('try',{
  en:{open:'Try it',cta:'Try it yourself',close:'Close',home:'Swipe to explore',crew:'Tap to change colour',bump:'Tap to bump bands',
    radar:'Tap for the next friend',find:'Tap to start walking',meet:"Tap: it's time · again: on my way",places:'Tap for the next place',
    ghost:'Tap to go ghost',sos:'Hold to send SOS'},
  es:{open:'Pruébalo',cta:'Pruébalo tú mismo',close:'Cerrar',home:'Desliza para explorar',crew:'Toca para cambiar de color',bump:'Toca para chocar las pulseras',
    radar:'Toca para ver al siguiente',find:'Toca para empezar a caminar',meet:'Toca: es la hora · otra vez: voy',places:'Toca para el siguiente lugar',
    ghost:'Toca para el modo fantasma',sos:'Mantén pulsado para enviar SOS'},
  ru:{open:'Попробовать',cta:'Попробуй сам',close:'Закрыть',home:'Листай, чтобы посмотреть',crew:'Нажми, чтобы сменить цвет',bump:'Нажми, чтобы стукнуться браслетами',
    radar:'Нажми — следующий друг',find:'Нажми, чтобы пойти',meet:'Нажми: пора · ещё раз: уже иду',places:'Нажми — следующее место',
    ghost:'Нажми, чтобы стать невидимкой',sos:'Удерживай, чтобы отправить SOS'}
});

const ZOOM_MS=600,EASE='cubic-bezier(.2,.8,.2,1)';
let ids=[],on=false,busy=false,own=false,last=null,opener=null;
let si=0,lt=0,tgt=0,spd=1,holding=false,raf=0,lastT=0;
let el,bg,dev,pill,scr,hint,tabs,xBtn;

/* lt helpers: jump, or move to `to` over `ms` */
const set=v=>{lt=tgt=v;kick()};
const play=(to,ms)=>{tgt=to;spd=Math.max(1e-6,Math.abs(to-lt)/ms);kick()};
const next=n=>set(((Math.floor(lt*n)+1)%n)/n+.01);

/* tap on the device, per chapter (thresholds come from each chapter's step()) */
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
    <div class="try-mid"><div class="try-dev"><div class="try-pill"><div class="try-scr"></div></div></div></div>
    <div class="try-ui"><p class="try-hint" aria-live="polite"></p><div class="try-tabs" role="tablist"></div></div>`;
  document.body.appendChild(el);
  [bg,xBtn,dev,pill,scr,hint,tabs]=['.try-bg','.try-x','.try-dev','.try-pill','.try-scr','.try-hint','.try-tabs'].map(s=>el.querySelector(s));
  tabs.innerHTML=ids.map((id,i)=>`<button type="button" role="tab" data-n="${i}"></button>`).join('');
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(b)select(+b.dataset.n)});
  xBtn.addEventListener('click',()=>close());
  $$('[data-try]').forEach(b=>b.addEventListener('click',()=>open(b)));
  gestures();
  addEventListener('keydown',e=>{
    if(!on||e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.key==='Escape'){e.preventDefault();close()}
    const d={ArrowRight:1,ArrowDown:1,PageDown:1,ArrowLeft:-1,ArrowUp:-1,PageUp:-1}[e.key];
    if(d){e.preventDefault();select(si+d)}
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
  [...tabs.children].forEach((b,i)=>b.textContent=strings(ids[i]).label);
  hint.textContent=t[ids[si]]||'';
  xBtn.setAttribute('aria-label',t.close);el.setAttribute('aria-label',t.open);
}

function size(){
  const vh=innerHeight,vw=innerWidth;
  el.style.setProperty('--k',clamp(Math.min(vh*.66,vh-210)/308,.6,Math.min(2.6,vw*.78/124)).toFixed(3));
}

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
  si=clamp(f&&f.si>=0?f.si:0,0,ids.length-1);
  const from=face();
  $$('#screen > .scr').forEach(s=>scr.appendChild(s));own=true;
  document.documentElement.classList.add('trying');
  el.hidden=false;size();label();mark();
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
  on=false;busy=true;holding=false;
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
  [...scr.children].forEach(s=>host.insertBefore(s,glass));own=false;
  el.hidden=true;dev.getAnimations().forEach(a=>a.cancel());bg.getAnimations().forEach(a=>a.cancel());
  el.querySelector('.try-ui').style.opacity='';xBtn.style.opacity='';
  document.documentElement.classList.remove('trying');
  busy=false;
  dispatchEvent(new Event('resize'));  // the timeline re-runs on resize: the stage screen comes back where the story is
  opener?.focus({preventScroll:true});
}

function select(i){
  i=clamp(i,0,ids.length-1);if(i===si)return;
  si=i;holding=false;lt=tgt=0;mark();label();render();
}

/* light the active tab and keep it in view in the scrolling row */
function mark(){
  [...tabs.children].forEach((b,i)=>{b.setAttribute('aria-selected',i===si);b.classList.toggle('on',i===si)});
  const b=tabs.children[si];
  if(b)tabs.scrollTo({left:b.offsetLeft-(tabs.clientWidth-b.offsetWidth)/2,behavior:reduce||!on?'auto':'smooth'});
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

/* tap / hold on the device plays the feature; a sideways swipe switches feature */
function gestures(){
  let p=null;
  const end=(cancel)=>{
    if(!p)return;const g=p;p=null;
    if(g.swiped)return;
    const id=ids[si];
    if(id==='sos'){
      if(g.hold){holding=false;if(lt<.4)play(0,300);else{tgt=lt;kick()}}
      else if(!cancel)TAP.sos();
      return;
    }
    if(!cancel)TAP[id]?.();
  };
  dev.addEventListener('pointerdown',e=>{
    if(!on||e.button>0)return;
    dev.setPointerCapture?.(e.pointerId);
    p={id:e.pointerId,x:e.clientX,y:e.clientY,swiped:false,hold:false};
    if(ids[si]==='sos'&&lt<.4){p.hold=true;holding=true;kick()}
  });
  dev.addEventListener('pointermove',e=>{
    if(!p||p.swiped||e.pointerId!==p.id)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){p.swiped=true;if(p.hold){holding=false;play(0,300)}select(si+(dx<0?1:-1))}
  });
  dev.addEventListener('pointerup',e=>{if(p&&e.pointerId===p.id)end(false)});
  dev.addEventListener('pointercancel',e=>{if(p&&e.pointerId===p.id)end(true)});
  dev.addEventListener('contextmenu',e=>e.preventDefault());
}
