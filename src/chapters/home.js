/* Chapter 01 · Home screen: day label, live clock (hours over minutes), three friends nearby, battery arc around the pill. No scroll animation. */
import {txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('home',{
  ru:{label:"Главный экран",title:"Один взгляд — и ты в курсе.",body:"Время, друзья рядом и заряд — прямо на руке. Без телефона, без разблокировки, без поиска сети.",day:"Сб · день 2",near:"3 рядом"},
  en:{label:"Home screen",title:"One glance and you know.",body:"Time, friends nearby and battery, right on your wrist. No phone, no unlocking, no hunting for signal.",day:"Sat · Day 2",near:"3 nearby"},
  es:{label:"Inicio",title:"Un vistazo y lo sabes.",body:"La hora, tus amigos cerca y la batería, en tu muñeca. Sin móvil, sin desbloquear, sin buscar cobertura.",day:"Sáb · Día 2",near:"3 cerca"}
});

export default {
  id:'home',
  pose:[-10,4,0],
  screen:`
<div class="scr scr-home">
  <svg class="edge" viewBox="0 0 124 308" aria-hidden="true"><path class="trk" d="M62 3.5A58.5 58.5 0 0 1 120.5 62V246A58.5 58.5 0 0 1 3.5 246V62A58.5 58.5 0 0 1 62 3.5Z"/><path class="val" d="M62 3.5A58.5 58.5 0 0 1 120.5 62V246A58.5 58.5 0 0 1 3.5 246V62A58.5 58.5 0 0 1 62 3.5Z" pathLength="100" stroke-dasharray="86 100" style="stroke:var(--lime)"/></svg>
  <span class="we" data-i="home.day"></span>
  <b class="wb"><span data-r="hh">23</span><span data-r="mm">41</span></b>
  <span class="row"><span class="stack"><i class="av" style="--c:var(--cyan)"></i><i class="av" style="--c:var(--lime)"></i><i class="av" style="--c:var(--sun)"></i></span><span class="ws" data-i="home.near"></span></span>
</div>`,
  mount(r){
    const tick=()=>{const t=new Date();txt(r.hh,String(t.getHours()).padStart(2,'0'));txt(r.mm,String(t.getMinutes()).padStart(2,'0'))};
    tick();setInterval(tick,15000);
  }
};
