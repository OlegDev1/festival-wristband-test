/* The band on stage. Turns each timeline frame into a pose (where the band sits and how it is turned), follows it with a
   light spring, adds the haptic shake (buzz), and applies the look the active chapter asks for (ring colour, glow, SOS).
   Draws through one renderer: WebGL (src/gl, preferred) or, if that is not available, the CSS 3D model (css-model.js).
   Size: --k on the stage, 1 = a 260px case. Chapter poses come from each chapter's `pose` ([ry, rx, rz] in degrees). */
import {$,clamp,lerp,reduce} from '../core/dom.js';
import {buildCSSModel} from './css-model.js';

const stage=$('#stage'),watch=$('#watch'),pos=$('#pos'),haloL=$('#haloL');

/* opening pose: three-quarter, not a flat profile, so the loop reads as a ring with depth and a sliver of glass shows.
   cx/cy: centre of case + loop on screen for this pose, in band units (recompute if the pose or the loop size changes) */
const R0={ry:-62,rx:0,rz:0,s:.86,cx:97,cy:0};

let poses=[[0,0,0]],gl=null,fell=false,kk=0,wide=true;
/* scroll → targets; a light spring follows them */
const tgt={x:0,y:0,s:R0.s,ry:R0.ry,rx:R0.rx,rz:R0.rz};let cur=null,raf=0,bzT=-1e9;
const look={ring:'',glow:false,sos:false,scr:0};

export function mount(chapterPoses){poses=chapterPoses}

/* size: the band is drawn at real pixels through --k, so text stays sharp. Phone: w*.63/260 */
function size(f){
  const k=f.wide?Math.min(f.vh*.44/260,f.vw*.3/260):Math.min(f.vw*.63/260,f.vh*.34/260),n=+clamp(k,.5,1.8).toFixed(3);
  if(n!==kk){kk=n;stage.style.setProperty('--k',kk)}
  wide=f.wide;
}

/* f = timeline frame, lk = {ring, glow, sos} from the active chapter */
export function update(f,lk){
  size(f);
  const r=f.turn,m=f.blend,m2=f.dock,A=poses[f.fi],B=poses[Math.min(poses.length-1,f.fi+1)];
  tgt.x=(wide?f.vw*.17*m2:0)-R0.cx*kk*R0.s*(1-r);
  tgt.y=(wide?0:-f.vh*.13*m2+f.vh*.015*(1-m2))-R0.cy*kk*R0.s*(1-r);
  tgt.s=lerp(R0.s,1,r);
  tgt.ry=lerp(R0.ry,lerp(A[0],B[0],m),r);tgt.rx=lerp(R0.rx,lerp(A[1],B[1],m),r);tgt.rz=lerp(R0.rz,lerp(A[2],B[2],m),r);
  look.scr=f.screen;watch.style.setProperty('--gs',f.screen.toFixed(3));
  if(lk.ring!==look.ring){stage.style.setProperty('--ring',lk.ring);look.ring=lk.ring}
  look.glow=lk.glow;look.sos=lk.sos;
  watch.classList.toggle('glow',look.glow);stage.classList.toggle('glowing',look.glow);watch.classList.toggle('sos',look.sos);
  if(!cur){cur={...tgt};apply()}
  kick();
}

function apply(){
  const bt=performance.now()-bzT,bx=bt<450?Math.sin(bt*.085)*5*kk*(1-bt/450):0;
  const tr=`translate3d(${(cur.x+bx).toFixed(1)}px,${cur.y.toFixed(1)}px,0)`;
  pos.style.transform=tr;haloL.style.transform=tr;
  watch.style.transform=`scale(${cur.s.toFixed(4)}) rotateZ(${cur.rz.toFixed(2)}deg) rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg)`;
  const cf=Math.cos(cur.ry*Math.PI/180)*Math.cos(cur.rx*Math.PI/180);
  watch.style.setProperty('--fs',((1-cf)*(gl?.1:.55)).toFixed(3));
  watch.style.setProperty('--spec',(cur.ry*1.6+cur.rx).toFixed(1));
  if(gl)gl.draw({x:cur.x+bx,y:cur.y,s:cur.s,ry:cur.ry,rx:cur.rx,rz:cur.rz,k:kk,w:stage.clientWidth,h:stage.clientHeight,ring:look.ring,glow:look.glow,sos:look.sos,scr:look.scr});
}
function tick(){
  let moving=false;const f=reduce?1:.14;
  for(const k in tgt){const d=tgt[k]-cur[k];if(Math.abs(d)>.02){cur[k]+=d*f;moving=true}else cur[k]=tgt[k]}
  if(performance.now()-bzT<480)moving=true;
  apply();raf=moving?requestAnimationFrame(tick):0;
}
function kick(){if(cur&&!raf)raf=requestAnimationFrame(tick)}

/* haptic shake, called by chapters (find: you're close, bump: joined) */
export function buzz(){if(reduce)return;bzT=performance.now();kick()}

/* renderer = {draw(v)} from src/gl */
export function useGL(renderer){if(fell)return;gl=renderer;kick()}
export function fallback(){if(gl||fell)return;fell=true;watch.classList.remove('webgl');buildCSSModel(watch);kick()}
export const fellBack=()=>fell;
