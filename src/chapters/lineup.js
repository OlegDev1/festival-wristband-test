/* Chapter 06 · Lineup: the set playing now with an equaliser, the next set below; the rim arc fills as you scroll. */
import {addStrings} from '../core/i18n.js';

addStrings('lineup',{
  ru:{label:"Лайнап",title:"Не пропусти свой сет.",body:"Отметь артистов заранее — за 10 минут до начала браслет напомнит и покажет дорогу к сцене.",now:"Сейчас · Main Stage",next:"Далее 00:30 · Duo Brisa"},
  en:{label:"Lineup",title:"Never miss your set.",body:"Star artists in advance — ten minutes before they start, the band reminds you and points the way to the stage.",now:"Now · Main Stage",next:"Next 00:30 · Duo Brisa"},
  es:{label:"Cartel",title:"No te pierdas tu concierto.",body:"Marca a tus artistas y, diez minutos antes, la pulsera te avisa y te indica el camino al escenario.",now:"Ahora · Main Stage",next:"Luego 00:30 · Duo Brisa"}
});

const S={set:.3};

export default {
  id:'lineup',
  pose:[10,-4,-2],
  screen:`
<div class="scr scr-lineup">
  <svg class="edge" viewBox="0 0 228 228" aria-hidden="true"><circle class="trk" cx="114" cy="114" r="106"/><circle class="val" data-r="arc" cx="114" cy="114" r="106" pathLength="100" stroke-dasharray="30 100" transform="rotate(-90 114 114)" style="stroke:var(--sun)"/></svg>
  <span class="we" data-i="lineup.now" style="--a:var(--sun)"></span>
  <b class="wm">Kora Lumen</b>
  <span class="eq"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i><i style="--i:3"></i><i style="--i:4"></i></span>
  <span class="ws dim" data-i="lineup.next"></span>
</div>`,
  step(lt){S.set=lt},
  draw(r){r.arc.setAttribute('stroke-dasharray',`${(28+64*S.set).toFixed(1)} 100`)}
};
