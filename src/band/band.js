/* The band on stage. Turns each timeline frame into a pose, follows it with a light spring, adds the haptic shake (buzz),
   and applies the look the active chapter asks for (glow colour, SOS).

   Picture: pre-rendered Blender frames (frames/, made by blender/render.py) drawn on a canvas. Frame 0 = opening pose
   (three-quarter side view), last frame = feature pose (screen toward you); the scroll turn t (0 → 1) picks the frame.
   The live HTML screen (.face/.screen, where src/chapters mounts the screens) sits on the rendered glass in CSS 3D with the
   same rotation: .persp has the same 1800·k perspective as the Blender camera, centred on the band, so they line up.
   Everything else is 2D on .pos: position, scale, the chapter's tilt (rz) and the buzz.
   Size: --k on the stage, 1 = one CSS px per Blender band unit (module 156 × 340, screen 124 × 308).

   Smooth from the first scroll:
   1. fetch: every frame starts downloading at page load, coarse to fine (ends, every 8th, 4th, 2nd, then the rest),
      FETCHES at a time, so wherever you scroll there is a close frame;
   2. decode: frames are decoded off the main thread (createImageBitmap) at the canvas size, just ahead of the scroll,
      keeping at most KEEP decoded at once (memory stays small on phones);
   3. draw: the two frames either side of the exact turn are cross-faded, so the turn is continuous instead of 1° steps.
   Small screens use the smaller copy of the frames (frames.json "m", written by render.py) when it is sharp enough. */
import {$,clamp,lerp,reduce} from '../core/dom.js';

const stage=$('#stage'),pos=$('#pos'),watch=$('#watch'),haloL=$('#haloL'),cv=$('#frames'),ctx=cv.getContext('2d');
const BASE=new URL('../../frames/',import.meta.url).href;

/* filled from frames/frames.json: poses (deg), framing box (BU around the band centre), ring centre in the opening pose */
let F={frames:1,r0:{rx:0,ry:-62},r1:{rx:4,ry:-8},box:{x:-100,y:-250,w:440,h:490},ring0:[133,0],screen:{w:124,h:308,z:33}};
const S0=.86;                                   /* opening scale */
const KEEP=30,FETCHES=6,DECODES=2;

let poses=[[0,0,0]],kk=0,wide=true,dpr=1;
const tgt={x:0,y:0,s:S0,t:0,rz:0};let cur=null,raf=0,bzT=-1e9;
const look={ring:'',glow:false,sos:false};
let meta=false,dir=null,blobs=[],bmps=[],busy=new Set(),gen=0,fgen=0,want=0,lastKey='',ready=false;

export function mount(chapterPoses){
  poses=chapterPoses;
  fetch(BASE+'frames.json').then(r=>r.json()).then(j=>{F=j;meta=true;layout(true);kick()}).catch(e=>console.warn('band frames missing',e));
}

/* ---- frames: fetch, decode, keep ---- */
function startFetch(){
  const n=F.frames,seen=new Set(),order=[],g=++fgen;
  const add=i=>{if(i>=0&&i<n&&!seen.has(i)){seen.add(i);order.push(i)}};
  add(0);add(n-1);for(const st of [8,4,2,1])for(let i=0;i<n;i+=st)add(i);
  const name=i=>F.file.replace('%03d',String(i).padStart(3,'0'));
  let k=0;
  const one=()=>{if(g!==fgen||k>=order.length)return;const i=order[k++];
    fetch(BASE+dir+name(i)).then(r=>r.ok?r.blob():null).then(b=>{if(g===fgen&&b){blobs[i]=b;pump()}}).catch(()=>{}).finally(one)};
  for(let j=0;j<FETCHES;j++)one();
}
/* decode the closest undecoded frames to where the scroll is (more ahead than behind) */
function pump(){
  const n=F.frames,g=gen;
  while(busy.size<DECODES){
    let best=-1,bd=1e9;
    for(let i=0;i<n;i++){if(!blobs[i]||bmps[i]||busy.has(i))continue;const d=i>=want?i-want:(want-i)*1.6;if(d<bd){bd=d;best=i}}
    if(best<0||bd>KEEP*.6)break;
    const i=best;busy.add(i);
    createImageBitmap(blobs[i],{resizeWidth:cv.width,resizeHeight:cv.height,resizeQuality:'high'}).catch(()=>createImageBitmap(blobs[i]))
      .then(bm=>{busy.delete(i);if(g!==gen){bm.close&&bm.close();return}
        bmps[i]=bm;evict();if(!ready&&bmps[0]){ready=true;stage.classList.add('band-ready')}lastKey='';kick();pump()})
      .catch(()=>{busy.delete(i);pump()});
  }
}
function evict(){
  const live=[];bmps.forEach((b,i)=>b&&live.push(i));
  if(live.length<=KEEP)return;
  live.sort((a,b)=>Math.abs(b-want)-Math.abs(a-want));
  for(const i of live.slice(0,live.length-KEEP)){bmps[i].close&&bmps[i].close();bmps[i]=null}
}

/* canvas covers the framing box around the band centre, in CSS px; backing store follows the device pixels (max 2×).
   A new backing size means decoding again; a different frame set (phone vs desktop copy) means downloading again. */
function layout(force){
  if(!kk)return;
  const b=F.box,w=b.w*kk,h=b.h*kk;dpr=Math.min(window.devicePixelRatio||1,2);
  Object.assign(cv.style,{left:`${b.x*kk}px`,top:`${b.y*kk}px`,width:`${w}px`,height:`${h}px`});
  stage.style.setProperty('--sw',F.screen.w);stage.style.setProperty('--sh',F.screen.h);stage.style.setProperty('--sz',F.screen.z);
  if(!meta)return;
  const pw=Math.min(Math.round(w*dpr),b.px?b.px[0]:4096),ph=Math.round(pw*b.h/b.w);
  if(!force&&cv.width===pw&&cv.height===ph)return;
  cv.width=pw;cv.height=ph;lastKey='';
  gen++;busy.clear();bmps.forEach(bm=>bm&&bm.close&&bm.close());bmps=[];
  const nd=F.m&&F.m.px&&F.m.px[0]>=pw*.85?F.m.dir:'';
  if(nd!==dir){dir=nd;blobs=[];startFetch()}
  pump();
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
  if(lk.ring!==look.ring){stage.style.setProperty('--ring',lk.ring);look.ring=lk.ring}
  if(lk.glow!==look.glow){look.glow=lk.glow;watch.classList.toggle('glow',look.glow);stage.classList.toggle('glowing',look.glow)}
  if(lk.sos!==look.sos){look.sos=lk.sos;watch.classList.toggle('sos',look.sos)}
  if(!cur){cur={...tgt};apply()}
  kick();
}

/* the exact turn sits between two frames: cross-fade them (additive, so it is an exact mix even at soft edges) */
function draw(t){
  const n=F.frames,f=clamp(t,0,1)*(n-1),i0=Math.min(n-1,Math.floor(f)),w=f-i0;
  if(Math.round(f)!==want){want=Math.round(f);pump()}
  if(!ready)return;
  let A=bmps[i0],B=w>.004&&i0+1<n?bmps[i0+1]:null,ia=i0;
  if(!A){for(let d=1;d<n;d++){if(bmps[i0+d]){A=bmps[i0+d];ia=i0+d;break}if(bmps[i0-d]){A=bmps[i0-d];ia=i0-d;break}}B=null}
  if(!A)return;
  const key=B?`${ia}|${Math.round(w*48)}`:`${ia}`;
  if(key===lastKey)return;lastKey=key;
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.clearRect(0,0,cv.width,cv.height);
  if(B){
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=1-w;ctx.drawImage(A,0,0,cv.width,cv.height);
    ctx.globalAlpha=w;ctx.drawImage(B,0,0,cv.width,cv.height);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }else ctx.drawImage(A,0,0,cv.width,cv.height);
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
addEventListener('resize',()=>{layout();kick()});

/* haptic shake, called by chapters (find: you're close, bump: joined) */
export function buzz(){if(reduce)return;bzT=performance.now();kick()}
