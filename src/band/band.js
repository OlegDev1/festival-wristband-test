/* The band on stage. Turns each timeline frame into a pose, follows it with a light spring, adds the haptic shake (buzz),
   and applies the look the active chapter asks for (glow colour, SOS).

   Picture: pre-rendered Blender frames (frames/, made by blender/render.py) drawn on a canvas. Frame 0 = opening pose
   (three-quarter side view), last frame = feature pose (screen toward you); the scroll turn t (0 → 1) picks the frame.
   The live HTML screen (.face/.screen, where src/chapters mounts the screens) sits on the rendered glass in CSS 3D with the
   same rotation: .persp has the same 1800·k perspective as the Blender camera, centred on the band, so they line up.
   Everything else is 2D on .pos: position, scale, the chapter's tilt (rz) and the buzz.
   Size: --k on the stage, 1 = one CSS px per Blender band unit (module 156 × 340, screen 124 × 308). */
import {$,clamp,lerp,reduce} from '../core/dom.js';

const stage=$('#stage'),pos=$('#pos'),watch=$('#watch'),haloL=$('#haloL'),cv=$('#frames'),ctx=cv.getContext('2d');
const BASE=new URL('../../frames/',import.meta.url).href;

/* filled from frames/frames.json: poses (deg), framing box (BU around the band centre), ring centre in the opening pose */
let F={frames:1,r0:{rx:0,ry:-62},r1:{rx:4,ry:-8},box:{x:-100,y:-250,w:440,h:490},ring0:[133,0],screen:{w:124,h:308,z:33}};
const imgs=[];let shownIdx=-1,ready=false;
const S0=.86;                                   /* opening scale */

let poses=[[0,0,0]],kk=0,wide=true,dpr=1;
const tgt={x:0,y:0,s:S0,t:0,rz:0};let cur=null,raf=0,bzT=-1e9;
const look={ring:'',glow:false,sos:false};

export function mount(chapterPoses){
  poses=chapterPoses;
  fetch(BASE+'frames.json').then(r=>r.json()).then(j=>{F=j;layout();load()}).catch(e=>console.warn('band frames missing',e));
}

/* frame 0 and the last frame first (opening + features), then the rest in order */
function load(){
  const n=F.frames,order=[0,n-1];for(let i=1;i<n-1;i++)order.push(i);
  const name=i=>F.file.replace('%03d',String(i).padStart(3,'0'));
  let next=0;
  const one=()=>{if(next>=order.length)return;const i=order[next++],im=new Image();im.decoding='async';
    im.onload=()=>{imgs[i]=im;if(!ready&&imgs[0]){ready=true;stage.classList.add('band-ready')}shownIdx=-1;kick();one()};
    im.onerror=one;im.src=BASE+name(i)};
  one();one();one();
}

/* canvas covers the framing box around the band centre, in CSS px; backing store follows the device pixels */
function layout(){
  const b=F.box,w=b.w*kk,h=b.h*kk;dpr=Math.min(window.devicePixelRatio||1,2);
  Object.assign(cv.style,{left:`${b.x*kk}px`,top:`${b.y*kk}px`,width:`${w}px`,height:`${h}px`});
  const pw=Math.min(Math.round(w*dpr),b.px?b.px[0]:4096),ph=Math.round(pw*b.h/b.w);
  if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;shownIdx=-1}
  stage.style.setProperty('--sw',F.screen.w);stage.style.setProperty('--sh',F.screen.h);stage.style.setProperty('--sz',F.screen.z);
}

/* size: the band is drawn at real pixels through --k, so text stays sharp */
function size(f){
  const k=f.wide?Math.min(f.vh*.44/290,f.vw*.3/290):Math.min(f.vw*.63/290,f.vh*.34/290),n=+clamp(k,.5,1.8).toFixed(3);
  if(n!==kk){kk=n;stage.style.setProperty('--k',kk);layout()}
  wide=f.wide;
}

/* f = timeline frame, lk = {ring, glow, sos} from the active chapter */
export function update(f,lk){
  size(f);
  const r=f.turn,m=f.blend,m2=f.dock,A=poses[f.fi],B=poses[Math.min(poses.length-1,f.fi+1)];
  const [cx,cy]=F.ring0;
  tgt.x=(wide?f.vw*.17*m2:0)-cx*kk*S0*(1-r);
  tgt.y=(wide?0:-f.vh*.13*m2+f.vh*.015*(1-m2))-cy*kk*S0*(1-r);
  tgt.s=lerp(S0,1,r);tgt.t=r;tgt.rz=lerp(0,lerp(A[2],B[2],m),r);
  watch.style.setProperty('--gs',f.screen.toFixed(3));
  stage.style.setProperty('--scr',f.screen.toFixed(3));
  if(lk.ring!==look.ring){stage.style.setProperty('--ring',lk.ring);look.ring=lk.ring}
  look.glow=lk.glow;look.sos=lk.sos;
  watch.classList.toggle('glow',look.glow);stage.classList.toggle('glowing',look.glow);watch.classList.toggle('sos',look.sos);
  if(!cur){cur={...tgt};apply()}
  kick();
}

function draw(t){
  if(!ready)return;
  const n=F.frames,want=Math.round(clamp(t,0,1)*(n-1));
  let i=want;for(let d=1;!imgs[i]&&d<n;d++){if(imgs[want-d]){i=want-d;break}if(imgs[want+d]){i=want+d;break}}
  if(!imgs[i]||i===shownIdx)return;
  shownIdx=i;ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(imgs[i],0,0,cv.width,cv.height);
}

function apply(){
  const bt=performance.now()-bzT,bx=bt<450?Math.sin(bt*.085)*5*kk*(1-bt/450):0;
  const tr=`translate3d(${(cur.x+bx).toFixed(1)}px,${cur.y.toFixed(1)}px,0)`;
  pos.style.transform=`${tr} scale(${cur.s.toFixed(4)}) rotate(${cur.rz.toFixed(2)}deg)`;haloL.style.transform=tr;
  const rx=lerp(F.r0.rx,F.r1.rx,cur.t),ry=lerp(F.r0.ry,F.r1.ry,cur.t);
  watch.style.transform=`rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
  const cf=Math.cos(ry*Math.PI/180)*Math.cos(rx*Math.PI/180);
  watch.style.setProperty('--fs',((1-cf)*.35).toFixed(3));
  draw(cur.t);
}
function tick(){
  let moving=false;const f=reduce?1:.14;
  for(const k in tgt){const d=tgt[k]-cur[k],eps=k==='t'||k==='s'?.0005:.02;if(Math.abs(d)>eps){cur[k]+=d*f;moving=true}else cur[k]=tgt[k]}
  if(performance.now()-bzT<480)moving=true;
  apply();raf=moving?requestAnimationFrame(tick):0;
}
function kick(){if(cur&&!raf)raf=requestAnimationFrame(tick)}
addEventListener('resize',()=>{if(kk)layout();kick()});

/* haptic shake, called by chapters (find: you're close, bump: joined) */
export function buzz(){if(reduce)return;bzT=performance.now();kick()}
