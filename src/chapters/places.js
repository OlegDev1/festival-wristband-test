/* Chapter 05 · Places: bar, water, toilets light up in turn as you scroll. Built for the tall pill, top to bottom:
   label, big sun disc with the place icon, name, arrow + distance, queue note, three pips (which of the three). */
import {txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('places',{
  ru:{label:"Места",near:"Ближайшее",title:"Бар, вода, туалет — что ближе.",body:"Браслет знает карту фестиваля и показывает, что ближе всего и где короче очередь.",spots:[["Бар","очередь ~4 мин"],["Вода","бесплатно"],["Туалет","без очереди"]]},
  en:{label:"Places",near:"Nearest",title:"Bar, water, toilets — closest first.",body:"The band knows the festival map and shows what's nearest and where the queue is shortest.",spots:[["Bar","~4 min queue"],["Water","free"],["Toilets","no queue"]]},
  es:{label:"Lugares",near:"Lo más cerca",title:"Barra, agua, baños: lo más cerca.",body:"La pulsera conoce el mapa del festival y te indica qué está más cerca y dónde hay menos cola.",spots:[["Barra","cola ~4 min"],["Agua","gratis"],["Baños","sin cola"]]}
});

const DIST=[80,60,140],ANG=[-30,50,140];   /* per spot: metres, arrow angle */
const S={spot:0};
let ics=[],pips=[];

export default {
  id:'places',
  pose:[-14,6,0],
  screen:`
<div class="scr scr-places">
  <span class="we" data-r="near"></span>
  <div class="disc">
    <svg class="ic" viewBox="0 0 24 24"><path d="M5 4h14l-7 8zM12 12v7M8 20h8"/></svg>
    <svg class="ic" viewBox="0 0 24 24"><path d="M12 3c3.5 4.5 6 7.6 6 10.5a6 6 0 0 1-12 0C6 10.6 8.5 7.5 12 3z"/></svg>
    <b class="ic">WC</b>
  </div>
  <b class="wm" data-r="name"></b>
  <div class="nd"><svg viewBox="0 0 100 100" data-r="arrow" aria-hidden="true"><path d="M50 6 86 84 50 66 14 84Z"/></svg><b data-r="dist"></b><span data-r="unit"></span></div>
  <span class="ws" data-r="note"></span>
  <div class="pips"><i></i><i></i><i></i></div>
</div>`,
  mount(r){ics=[...r.root.querySelectorAll('.ic')];pips=[...r.root.querySelectorAll('.pips i')]},
  step(lt){S.spot=Math.min(2,Math.floor(lt*3))},
  draw(r,t,c){
    ics.forEach((e,i)=>e.classList.toggle('on',i===S.spot));
    pips.forEach((e,i)=>e.classList.toggle('on',i===S.spot));
    txt(r.near,t.near);txt(r.name,t.spots[S.spot][0]);txt(r.dist,String(DIST[S.spot]));txt(r.unit,c.unit);txt(r.note,t.spots[S.spot][1]);
    r.arrow.style.transform=`rotate(${ANG[S.spot]}deg)`;
  }
};
