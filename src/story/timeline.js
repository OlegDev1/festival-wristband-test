/* The scroll clock. Turns the scroll position inside #story into story time and hands every feature one frame object.
   Story units: INTRO (hero, then the band turns to face you), then one unit per chapter. Each unit ≈ 360vh of scrolling.
   Each chapter unit: the screen switches a quarter unit early (floor(q+.25)); the band turns to the next pose in the
   second half (blend); every chapter's own animation runs over the same stretch: lp = 0 → 1 over the first half,
   then holds its end state while the band turns (chapters.js scales lp to each chapter's own `end`).

   frame = {
     vw, vh, wide          viewport; wide = wider than 760px (caption left, band right)
     p                     0..1 through the story section
     u, q                  story time; q = u - INTRO (negative during the intro)
     hero                  1 → 0  hero text fades as you start scrolling
     turn                  0 → 1  band turns from the opening pose to face you
     screen                0 → 1  screen UI fades in on the glass (glass reflections fade out)
     dock                  0 → 1  band moves to its feature spot (right on wide, up on phone)
     fi, blend             chapter whose pose the band is in, and 0 → 1 turn toward the next chapter's pose
     si, lp                screen shown (-1 = none) and its animation progress (0 → 1, the same pace for every chapter)
     ci                    caption shown (-1 = none)
     ri                    rail dot lit (-1 = rail hidden)
   } */
import {$,clamp,sm,reduce} from '../core/dom.js';

export const INTRO=1.6;
const VH_PER_UNIT=360;
let N=1,U=INTRO+1;
const story=$('#story'),stage=$('#stage');
const span=()=>Math.max(1,story.offsetHeight-stage.clientHeight);

function frame(){
  const vh=stage.clientHeight,vw=innerWidth,len=Math.max(1,story.offsetHeight-vh);
  const p=clamp(-story.getBoundingClientRect().top/len,0,1),u=p*U,q=u-INTRO;
  const turn=sm(clamp((u-.1)/1.15,0,1));
  let fi=0,fr=0;if(q>=0){fi=Math.min(N-1,Math.floor(q));fr=q-fi}
  const blend=q>=0?sm(clamp((fr-.5)/.5,0,1)):0;
  const si=turn<.72?-1:(q<0?0:Math.min(N-1,Math.floor(q+.25)));
  const lp=(q>=0&&si===fi)?clamp(fr/.5,0,1):0;
  const qq=q+.25,cx=Math.min(N-1,Math.floor(qq)),w=qq-cx;
  const ci=(q>=0&&w>.05&&(w<.93||cx===N-1))?cx:-1;
  const ri=q<-.3||p>=.999?-1:clamp(Math.round(q-.55),0,N-1);
  return {vw,vh,wide:vw>760,p,u,q,
    hero:1-clamp((u-.04)/.5,0,1),turn,screen:clamp((turn-.45)/.3,0,1),dock:sm(clamp((u-.9)/.8,0,1)),
    fi,blend,si,lp,ci,ri};
}

/* chapters = number of chapters; onFrame(frame) runs on load, scroll and resize */
export function start(chapters,onFrame){
  N=chapters;U=INTRO+N;story.style.height=`${Math.round(U*VH_PER_UNIT+4)}vh`;
  const run=()=>onFrame(frame());
  /* at most one update per screen refresh, however many scroll events arrive */
  let q=0;const queue=()=>{if(!q)q=requestAnimationFrame(()=>{q=0;run()})};
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',run);
  run();
}

/* jump to the middle of chapter i (its screen is fully on there); behavior 'auto' = instant (src/try) */
export function go(i,behavior){scrollTo({top:story.offsetTop+((INTRO+clamp(i,0,N-1)+.55)/U)*span(),behavior:behavior||(reduce?'auto':'smooth')})}

/* step d chapters from the current one (before chapter 1 = back to the top); false if there is nowhere to go */
export function step(d){
  const p=(scrollY-story.offsetTop)/span();if(p<-.01||p>1)return false;
  const q=p*U-INTRO,c=q<0?-1:Math.round(q-.55),n=c+d;
  if(n>=N)return false;
  if(n<0)scrollTo({top:story.offsetTop,behavior:reduce?'auto':'smooth'});else go(n);
  return true;
}
