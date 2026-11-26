/* Chapter 07 · Glow: six colour swatches around the rim; as you scroll the crew colour steps through
   coral → lagoon → lime → sun, and the band's light ring, halo and glow take that colour (look()). */
import {txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('glow',{
  ru:{label:"Подсветка",title:"Светится цветом вашей компании.",body:"Ночью ободок горит вашим общим цветом — своих видно издалека.",crew:"Цвет компании"},
  en:{label:"Glow",title:"Glows in your crew's colour.",body:"At night the ring lights up in your shared colour, so your people can spot you from afar.",crew:"Crew colour"},
  es:{label:"Luz",title:"Brilla con el color de tu grupo.",body:"De noche, el aro se ilumina con vuestro color para que los tuyos te vean desde lejos.",crew:"Color del grupo"}
});

const RING=['#ff5a3c','#43d9ff','#c6f24e','#ffc23d'];   /* the four strap colours; names in common.cols */
const S={gi:0};
let swatches=[];

export default {
  id:'glow',
  pose:[-26,12,0],
  screen:`
<div class="scr scr-glow">
  <i class="sw" style="--a:0deg;--c:#ff5a3c"></i><i class="sw" style="--a:60deg;--c:#43d9ff"></i><i class="sw" style="--a:120deg;--c:#c6f24e"></i><i class="sw" style="--a:180deg;--c:#ffc23d"></i><i class="sw" style="--a:240deg;--c:#ff7ab6"></i><i class="sw" style="--a:300deg;--c:#f4f1ec"></i>
  <span class="we" data-i="glow.crew"></span>
  <b class="wm" data-r="name"></b>
</div>`,
  mount(r){swatches=[...r.root.querySelectorAll('.sw')]},
  step(lt){S.gi=Math.min(3,Math.floor(lt*4))},
  draw(r,t,c){swatches.forEach((e,i)=>e.classList.toggle('on',i===S.gi));txt(r.name,c.cols[S.gi])},
  look(){return {ring:RING[S.gi],glow:true}}
};
