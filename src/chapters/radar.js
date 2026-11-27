/* Chapter · Radar: rings + sweep with you in the middle and four friends around you. As you scroll it steps through
   the friends: the lit one grows, a beam joins you to them, and name, distance and spot below follow (pips = which of 4).
   The screen accent (--a) takes the lit friend's colour. */
import {txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('radar',{
  ru:{label:"Радар",title:"Видишь всю компанию.",body:"Радар показывает, где каждый из твоих друзей — даже в толпе на 50 000 человек.",near:"4 рядом",spots:["у главной сцены","на фудкорте","у бара","у колеса обозрения"]},
  en:{label:"Radar",title:"See your whole crew.",body:"The radar shows where each of your friends is — even in a crowd of 50,000.",near:"4 nearby",spots:["by the Main Stage","at the food area","at the bar","by the Ferris wheel"]},
  es:{label:"Radar",title:"Ve a todo tu grupo.",body:"El radar muestra dónde está cada uno de tus amigos, incluso entre 50.000 personas.",near:"4 cerca",spots:["junto al Main Stage","en la zona de comida","en la barra","junto a la noria"]}
});

const POS=[[74,27],[25,37],[67,76],[31,70]],DIST=[120,45,210,80],COL=['#43d9ff','#c6f24e','#ffc23d','#ff7ab6'];
const S={fi:0};
let dots=[],pips=[];

export default {
  id:'radar',
  pose:[12,6,-2],
  screen:`
<div class="scr scr-radar">
  <span class="we" data-r="near"></span>
  <div class="radar"><i class="sweep"></i><i class="beam" data-r="beam"></i><i class="me"></i>
    ${POS.map(([x,y],i)=>`<i class="av fr" style="--x:${x}%;--y:${y}%;--c:${COL[i]};--dl:${(-i*.7).toFixed(1)}s"></i>`).join('')}
  </div>
  <b class="wm" data-r="name"></b>
  <div class="nd"><b data-r="dist"></b><span data-r="unit"></span></div>
  <span class="ws" data-r="spot"></span>
  <div class="pips"><i></i><i></i><i></i><i></i></div>
</div>`,
  mount(r){dots=[...r.root.querySelectorAll('.fr')];pips=[...r.root.querySelectorAll('.pips i')]},
  step(lt){S.fi=Math.min(3,Math.floor(lt*4))},
  draw(r,t,c){
    const i=S.fi,[x,y]=POS[i],dx=x-50,dy=y-50;
    dots.forEach((e,j)=>{txt(e,c.names[j][0]);e.classList.toggle('hi',j===i)});
    pips.forEach((e,j)=>e.classList.toggle('on',j===i));
    r.root.style.setProperty('--a',COL[i]);
    r.beam.style.width=`${Math.hypot(dx,dy).toFixed(1)}%`;
    r.beam.style.transform=`rotate(${(Math.atan2(dy,dx)*180/Math.PI).toFixed(1)}deg)`;
    txt(r.near,t.near);txt(r.name,c.names[i]);txt(r.dist,String(DIST[i]));txt(r.unit,c.unit);txt(r.spot,t.spots[i]);
  }
};
