/* Chapter 08 · SOS: "hold the button" while the rim arc fills; when full the screen turns red, says it was sent to
   4 friends with a meeting point, and the side button glows (look()). */
import {clamp,txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('sos',{
  ru:{label:"SOS",title:"Потерялся? Одна кнопка.",body:"Удержи боковую кнопку — друзья получат твою точку и место сбора. Работает даже без мобильной сети.",hold:"Удерживай кнопку",sent:"Отправлено 4 друзьям",meet:"Сбор: колесо обозрения"},
  en:{label:"SOS",title:"Lost? One button.",body:"Hold the side button — your friends get your location and a meeting point. Works even with no mobile signal.",hold:"Hold the button",sent:"Sent to 4 friends",meet:"Meet: Ferris wheel"},
  es:{label:"SOS",title:"¿Perdido? Un solo botón.",body:"Mantén pulsado el botón lateral: tus amigos reciben tu ubicación y un punto de encuentro. Funciona incluso sin cobertura.",hold:"Mantén el botón",sent:"Enviado a 4 amigos",meet:"Punto: la noria"}
});

const S={hold:0,sent:false};

export default {
  id:'sos',
  pose:[-46,6,0],
  screen:`
<div class="scr scr-sos">
  <i class="sr2"></i><i class="sr2"></i>
  <svg class="edge" viewBox="0 0 124 308" aria-hidden="true"><path class="val" data-r="arc" d="M62 3.5A58.5 58.5 0 0 1 120.5 62V246A58.5 58.5 0 0 1 3.5 246V62A58.5 58.5 0 0 1 62 3.5Z" pathLength="100" stroke-dasharray="0 100" style="stroke:#fff"/></svg>
  <b class="wb">SOS</b>
  <span class="ws" data-r="a"></span>
  <span class="ws dim" data-r="b"></span>
</div>`,
  step(lt){S.hold=clamp(lt/.4,0,1);S.sent=lt>=.4},
  draw(r,t){
    r.arc.setAttribute('stroke-dasharray',`${(S.hold*100).toFixed(1)} 100`);
    r.root.classList.toggle('sent',S.sent);txt(r.a,S.sent?t.sent:t.hold);txt(r.b,S.sent?t.meet:'');
  },
  look(){return {sos:true}}
};
