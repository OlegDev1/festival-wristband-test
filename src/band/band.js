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
   2. decode: every frame is decoded (createImageBitmap, at the canvas size) as soon as it arrives, closest to the scroll
      first, and all of them are kept (≈2 MB each, ≈115 MB for 60), so scrolling back never waits for a decode;
   3. draw: the closest decoded frames either side of the exact turn are cross-faded (the two neighbours once all are in),
      so the turn is continuous instead of 1° steps, and never jumps to a far frame while frames are still loading;
      each frame is drawn where its own pose puts it (place()), so the 2D slide/zoom never drags a frame while it fades;
   4. motion: the spring is timed in ms, not per screen refresh, so it moves the same at 60 and 120 Hz and through dropped frames.
   Small screens use the smaller copy of the frames (frames.json "m", written by render.py) when it is sharp enough. */
import {$,clamp,lerp,reduce} from '../core/dom.js';

const stage=$('#stage'),pos=$('#pos'),watch=$('#watch'),haloL=$('#haloL'),cv=$('#frames'),ctx=cv.getContext('2d');
const BASE=new URL('../../frames/',import.meta.url).href;

/* filled from frames/frames.json: poses (deg), framing box (BU around the band centre), ring centre in the opening pose */
let F={frames:1,r0:{rx:0,ry:-62},r1:{rx:4,ry:-8},box:{x:-100,y:-250,w:440,h:490},ring0:[133,0],screen:{w:124,h:308,z:33}};
const S0=.86;                                   /* opening scale */
const FETCHES=6,DECODES=2;
const EASE=.14,EASE_MS=1000/60;                 /* spring: closes 14% of the gap every 1/60 s */

let poses=[[0,0,0]],kk=0,wide=true,dpr=1,tilt=0;
const tgt={x:0,y:0,s:S0,t:0,rz:0};let cur=null,raf=0,bzT=-1e9,lastT=0;
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
/* decode every downloaded frame, closest to where the scroll is first (more ahead than behind); decoded frames are kept */
function pump(){
  const n=F.frames,g=gen;
  while(busy.size<DECODES){
    let best=-1,bd=1e9;
    for(let i=0;i<n;i++){if(!blobs[i]||bmps[i]||busy.has(i))continue;const d=i>=want?i-want:(want-i)*1.6;if(d<bd){bd=d;best=i}}
    if(best<0)break;
    const i=best;busy.add(i);
    createImageBitmap(blobs[i],{resizeWidth:cv.width,resizeHeight:cv.height,resizeQuality:'high'}).catch(()=>createImageBitmap(blobs[i]))
      .then(bm=>{busy.delete(i);if(g!==gen){bm.close&&bm.close();return}
        bmps[i]=bm;lastKey='';kick();pump()})
      .catch(()=>{busy.delete(i);pump()});
  }
}

/* canvas covers the framing box around the band centre, in CSS px; backing store follows the device pixels, max 2.5×
   (3× phones: 2.5× looks as sharp on a moving band and keeps the 60 decoded frames at ~235 MB instead of ~340 MB).
   A new backing size means decoding again; a different frame set (phone vs desktop copy) means downloading again. */
function layout(force){
  if(!kk)return;
  const b=F.box,w=b.w*kk,h=b.h*kk;dpr=Math.min(window.devicePixelRatio||1,2.5);
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
  tilt=lerp(A[2],B[2],m);tgt.s=lerp(S0,1,r);tgt.t=r;tgt.rz=tilt*r;
  watch.style.setProperty('--gs',f.screen.toFixed(3));
  if(lk.ring!==look.ring){stage.style.setProperty('--ring',lk.ring);look.ring=lk.ring}
  if(lk.glow!==look.glow){look.glow=lk.glow;watch.classList.toggle('glow',look.glow);stage.classList.toggle('glowing',look.glow)}
  if(lk.sos!==look.sos){look.sos=lk.sos;watch.classList.toggle('sos',look.sos)}
  if(!cur){cur={...tgt};apply()}
  kick();
}

/* where frame i belongs, as a canvas transform. The part of the 2D move that follows the turn (sliding the ring to the
   centre, zoom, tilt) is pinned to each frame's own pose instead of the current one, so a frame never slides while it
   fades. Before, each frame slid ~2 px with the move and then the next one faded in ~2 px back: the strap wobbled. */
function place(i){
  const n=F.frames,d=(n>1?i/(n-1):1)-cur.t,c=cv.width/(F.box.w*kk),[cx,cy]=F.ring0;
  const k=(S0+(1-S0)*(n>1?i/(n-1):1))/cur.s,dr=tilt*d*Math.PI/180,r=-cur.rz*Math.PI/180;
  const dx=cx*kk*S0*d/cur.s,dy=cy*kk*S0*d/cur.s,ox=-F.box.x*kk*c,oy=-F.box.y*kk*c;
  const A=k*Math.cos(dr),B=k*Math.sin(dr);
  return [A,B,-B,A,ox+c*(dx*Math.cos(r)-dy*Math.sin(r))-(A*ox-B*oy),oy+c*(dx*Math.sin(r)+dy*Math.cos(r))-(B*ox+A*oy)];
}

/* the exact turn sits between two frames: cross-fade the closest decoded frame at or below it with the closest at or above
   (the two neighbours once all are decoded; additive, so it is an exact mix even at soft edges), each at its own place.
   The band fades in once the frame for the current scroll position is decoded. */
function draw(t){
  const n=F.frames,f=clamp(t,0,1)*(n-1);
  if(Math.round(f)!==want){want=Math.round(f);pump()}
  if(!ready){if(!bmps[want])return;ready=true;stage.classList.add('band-ready')}
  let a=Math.floor(f),b=Math.ceil(f);
  while(a>=0&&!bmps[a])a--;
  while(b<n&&!bmps[b])b++;
  if(a<0&&b>=n)return;
  if(a<0)a=b;else if(b>=n)b=a;
  let w=b>a?(f-a)/(b-a):0;
  if(w<.004)b=a;else if(w>.996)a=b;
  const pa=place(a),pb=a===b?pa:place(b);
  const key=`${a}|${b}|${Math.round(w*64)}|${pa.map(v=>v.toFixed(2))}|${pb.map(v=>v.toFixed(2))}`;
  if(key===lastKey)return;lastKey=key;
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.clearRect(0,0,cv.width,cv.height);
  if(a!==b){
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=1-w;ctx.setTransform(...pa);ctx.drawImage(bmps[a],0,0,cv.width,cv.height);
    ctx.globalAlpha=w;ctx.setTransform(...pb);ctx.drawImage(bmps[b],0,0,cv.width,cv.height);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }else{ctx.setTransform(...pa);ctx.drawImage(bmps[a],0,0,cv.width,cv.height)}
  ctx.setTransform(1,0,0,1,0,0);
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
/* spring step sized by the real time since the last frame (one 60 Hz frame after a pause), capped so a stall can't overshoot */
function tick(now){
  const dt=lastT?Math.min(64,now-lastT):EASE_MS;lastT=now;
  let moving=false;const f=reduce?1:1-Math.pow(1-EASE,dt/EASE_MS);
  for(const k in tgt){const d=tgt[k]-cur[k],eps=k==='t'||k==='s'?.0005:.02;if(Math.abs(d)>eps){cur[k]+=d*f;moving=true}else cur[k]=tgt[k]}
  if(performance.now()-bzT<480)moving=true;
  apply();
  if(moving)raf=requestAnimationFrame(tick);else{raf=0;lastT=0}
}
function kick(){if(cur&&!raf)raf=requestAnimationFrame(tick)}
addEventListener('resize',()=>{layout();kick()});

/* haptic shake, called by chapters (find: you're close, bump: joined) */
export function buzz(){if(reduce)return;bzT=performance.now();kick()}
