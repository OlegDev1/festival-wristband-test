/* Chapter 03 · Find: an arrow points to a friend while the distance counts down 120 → 12 m;
   near the end the arrow turns into a ping, the line says "you're close" and the band buzzes. */
import {clamp,txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('find',{
  ru:{label:"Навигация",title:"Просто иди по стрелке.",body:"Выбери друга — браслет поведёт тебя к нему и мягко завибрирует, когда вы будете рядом.",sub:"у главной сцены",near:"Ты рядом!"},
  en:{label:"Find",title:"Just follow the arrow.",body:"Pick a friend and the band guides you there, with a gentle buzz when you're close.",sub:"by the Main Stage",near:"You're close!"},
  es:{label:"Guía",title:"Solo sigue la flecha.",body:"Elige a un amigo y la pulsera te guía hasta él, con una vibración suave cuando estéis cerca.",sub:"junto al Main Stage",near:"¡Ya llegas!"}
});

const S={dist:120,near:false,ang:34};

export default {
  id:'find',
  pose:[-8,-5,0],
  screen:`
<div class="scr scr-find">
  <span class="ntop"><i class="av" data-r="av" style="--c:var(--cyan)"></i><span data-r="name"></span></span>
  <div class="ar"><i class="ping"></i><svg viewBox="0 0 100 100" data-r="arrow" aria-hidden="true"><path d="M50 6 86 84 50 66 14 84Z"/></svg></div>
  <div class="nd"><b data-r="dist">120</b><span data-r="unit"></span></div>
  <span class="ws" data-r="sub"></span>
</div>`,
  step(lt,{buzz}){
    const k=clamp(lt/.82,0,1),near=lt>.82;
    S.dist=Math.max(12,Math.round(120-108*k));S.ang=34-28*k+Math.sin(k*14)*5;
    if(near&&!S.near)buzz();S.near=near;
  },
  draw(r,t,c){
    txt(r.av,c.names[0][0]);txt(r.name,c.names[0]);txt(r.dist,String(S.dist));txt(r.unit,c.unit);
    txt(r.sub,S.near?t.near:t.sub);r.root.classList.toggle('near',S.near);
    r.arrow.style.transform=`rotate(${S.ang.toFixed(1)}deg)`;
  }
};
