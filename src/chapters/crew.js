/* Chapter · Crew (was Glow): your private crew — its name, a disc with its initials and its colour. As you scroll the
   colour steps through coral → lagoon → lime → sun and the band's light ring, halo and glow take it (look()). */
import {txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('crew',{
  ru:{label:"Компания",title:"Своя компания, свой цвет.",body:"Создай закрытую компанию, дай ей имя и цвет. Ночью браслет светится этим цветом — своих видно издалека.",we:"Твоя компания",n:"4 друга"},
  en:{label:"Crew",title:"Your crew, your colour.",body:"Create a private crew, give it a name and a colour. At night the band glows in it, so your people spot you from afar.",we:"Your crew",n:"4 friends"},
  es:{label:"Grupo",title:"Tu grupo, tu color.",body:"Crea un grupo privado, ponle nombre y color. De noche la pulsera brilla con él para que los tuyos te vean desde lejos.",we:"Tu grupo",n:"4 amigos"}
});

const RING=['#ff5a3c','#43d9ff','#c6f24e','#ffc23d'];   /* the four strap colours; names in common.cols */
const S={gi:0};
let sws=[];

export default {
  id:'crew',
  pose:[-26,12,0],
  end:.76,
  screen:`
<div class="scr scr-crew">
  <span class="we" data-r="we"></span>
  <i class="disc" data-r="ini"></i>
  <b class="wm" data-r="name"></b>
  <span class="ws" data-r="sub"></span>
  <div class="sws">${RING.map(c=>`<i style="--c:${c}"></i>`).join('')}</div>
</div>`,
  mount(r){sws=[...r.root.querySelectorAll('.sws i')]},
  step(lt){S.gi=Math.min(3,Math.floor(lt*4))},
  draw(r,t,c){
    sws.forEach((e,i)=>e.classList.toggle('on',i===S.gi));
    txt(r.we,t.we);txt(r.ini,c.crew.split(' ').map(w=>w[0]).join(''));txt(r.name,c.crew);txt(r.sub,`${c.cols[S.gi]} · ${t.n}`);
  },
  look(){return {ring:RING[S.gi],glow:true}}
};
