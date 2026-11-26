/* Stage scenery: draws the crowd silhouette once, then fades scenery with the story
   (crowd leaves with the hero, beams dim and the phone-only bottom dim rises as the band docks). */
import {$} from '../core/dom.js';

const crowd=$('#crowd'),horizon=$('#horizon'),beams=$('#beams'),dimB=$('#dimB');

/* crowd silhouette: heads, shoulders, a few raised arms; seeded so it is the same on every load */
export function mount(){
  let s='',x=-12,seed=11;const r=()=>(seed=(seed*9301+49297)%233280)/233280;
  while(x<1012){const hr=9+r()*4,y=72+r()*30;
    s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${hr.toFixed(1)}"/><rect x="${(x-hr*1.6).toFixed(1)}" y="${(y+hr*.9).toFixed(1)}" width="${(hr*3.2).toFixed(1)}" height="${(170-y).toFixed(1)}" rx="${hr.toFixed(1)}"/>`;
    if(r()<.3){const ax=x+(r()<.5?-1:1)*hr*1.3,tx=ax+(r()-.5)*22;s+=`<path d="M${ax.toFixed(1)} ${(y+hr*1.6).toFixed(1)}L${tx.toFixed(1)} ${(y-38-r()*30).toFixed(1)}" stroke-width="${(hr*.85).toFixed(1)}" stroke-linecap="round"/>`}
    x+=hr*2.3+r()*10;}
  crowd.innerHTML=s;
}

export function update(f){
  crowd.style.opacity=f.hero;horizon.style.opacity=.35+.65*f.hero;
  dimB.style.opacity=f.wide?0:f.dock;beams.style.opacity=1-.55*f.dock;
}
