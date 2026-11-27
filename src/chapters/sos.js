/* Chapter · SOS: "hold the side button" while the rim arc fills; when full the screen turns red: a check, "SOS sent",
   who got it (your crew + the nearest info booth) and the meeting point. The band's edge glows (look()). */
import {clamp,txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('sos',{
  ru:{label:"SOS",title:"Потерялся? Одна кнопка.",body:"Удержи боковую кнопку — компания и ближайшая инфостойка получат твою точку и место сбора. Работает даже без мобильной сети.",hold:"Удерживай боковую кнопку",sent:"SOS отправлен",crew:"Друзья · 4",booth:"Инфостойка",meet:"Сбор: колесо обозрения"},
  en:{label:"SOS",title:"Lost? One button.",body:"Hold the side button: your crew and the nearest info booth get your location and a meeting point. Works even with no mobile signal.",hold:"Hold the side button",sent:"SOS sent",crew:"Crew · 4",booth:"Info booth",meet:"Meet: Ferris wheel"},
  es:{label:"SOS",title:"¿Perdido? Un solo botón.",body:"Mantén pulsado el botón lateral: tu grupo y el punto de información más cercano reciben tu ubicación y un punto de encuentro. Funciona incluso sin cobertura.",hold:"Mantén el botón lateral",sent:"SOS enviado",crew:"Grupo · 4",booth:"Punto de info",meet:"Punto: la noria"}
});

const PILL='M62 3.5A58.5 58.5 0 0 1 120.5 62V246A58.5 58.5 0 0 1 3.5 246V62A58.5 58.5 0 0 1 62 3.5Z';
const S={hold:0,sent:false};

export default {
  id:'sos',
  pose:[-46,6,0],
  screen:`
<div class="scr scr-sos">
  <svg class="edge" viewBox="0 0 124 308" aria-hidden="true"><path class="val" data-r="arc" d="${PILL}" pathLength="100" stroke-dasharray="0 100" style="stroke:#fff"/></svg>
  <div class="st st-hold">
    <i class="sr2"></i><i class="sr2"></i>
    <b class="wb">SOS</b>
    <span class="ws" data-r="hold"></span>
  </div>
  <div class="st st-sent">
    <i class="disc"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></i>
    <b class="wm" data-r="sent"></b>
    <span class="to"><span class="row"><i class="dots"><i></i><i></i><i></i></i><span data-r="crew"></span></span><span class="row"><i class="ib">i</i><span data-r="booth"></span></span></span>
    <span class="ws dim" data-r="meet"></span>
  </div>
</div>`,
  step(lt){S.hold=clamp(lt/.4,0,1);S.sent=lt>=.4},
  draw(r,t){
    r.arc.setAttribute('stroke-dasharray',`${(S.hold*100).toFixed(1)} 100`);
    r.root.classList.toggle('sent',S.sent);
    txt(r.hold,t.hold);txt(r.sent,t.sent);txt(r.crew,t.crew);txt(r.booth,t.booth);txt(r.meet,t.meet);
  },
  look(){return {sos:true}}
};
