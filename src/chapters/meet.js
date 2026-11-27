/* Chapter · Meet-up: a meeting point and time set in the app. The countdown runs 15 → 5 min and the edge arc fills;
   at 5 min the band buzzes, the disc pulses and an "On my way" button appears; then it is tapped (filled) and the line
   says how many friends are on the way. */
import {clamp,txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('meet',{
  ru:{label:"Встреча",title:"Одно место. Одно время. Один сигнал.",body:"Выбери место и время в приложении. Когда пора, браслеты всей компании вибрируют, а одно касание говорит, что ты уже идёшь.",we:"Встреча",place:"Фудкорт",in:"через",unit:"мин",go:"Уже иду",inv:"Позваны 4 друга",going:"3 из 4 в пути"},
  en:{label:"Meet-up",title:"One spot. One time. One buzz.",body:"Pick a place and a time in the app. When it's time, every band in your crew buzzes, and one tap tells them you're on your way.",we:"Meet-up",place:"Food area",in:"in",unit:"min",go:"On my way",inv:"4 friends invited",going:"3 of 4 on the way"},
  es:{label:"Quedada",title:"Un sitio. Una hora. Un aviso.",body:"Elige un lugar y una hora en la app. Cuando toca, todas las pulseras del grupo vibran y con un toque dices que vas de camino.",we:"Quedada",place:"Zona de comida",in:"en",unit:"min",go:"Voy para allá",inv:"4 amigos invitados",going:"3 de 4 en camino"}
});

const PILL='M62 3.5A58.5 58.5 0 0 1 120.5 62V246A58.5 58.5 0 0 1 3.5 246V62A58.5 58.5 0 0 1 62 3.5Z';
const S={min:15,due:false,going:false,k:0};

export default {
  id:'meet',
  pose:[10,-4,-2],
  end:.82,
  screen:`
<div class="scr scr-meet">
  <svg class="edge" viewBox="0 0 124 308" aria-hidden="true"><path class="trk" d="${PILL}"/><path class="val" data-r="arc" d="${PILL}" pathLength="100" stroke-dasharray="0 100" style="stroke:var(--lime)"/></svg>
  <span class="we" data-r="we"></span>
  <i class="disc"><svg viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg></i>
  <b class="wm" data-r="place"></b>
  <div class="nd"><span data-r="in"></span><b data-r="min"></b><span data-r="unit"></span></div>
  <span class="go" data-r="go"></span>
  <span class="ws" data-r="sub"></span>
</div>`,
  step(lt,{buzz}){
    S.k=clamp(lt/.55,0,1);S.min=Math.round(15-10*S.k);
    const due=lt>=.55;if(due&&!S.due)buzz();S.due=due;S.going=lt>=.8;
  },
  draw(r,t){
    r.root.classList.toggle('due',S.due);r.root.classList.toggle('going',S.going);
    r.arc.setAttribute('stroke-dasharray',`${(S.k*100).toFixed(1)} 100`);
    txt(r.we,t.we);txt(r.place,t.place);txt(r.in,t.in);txt(r.min,String(S.min));txt(r.unit,t.unit);
    txt(r.go,S.going?`✓ ${t.go}`:t.go);txt(r.sub,S.going?t.going:t.inv);
  }
};
