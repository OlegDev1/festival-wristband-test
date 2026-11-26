/* Chapter 02 · Radar: rings + sweep, you in the middle, four friends pulsing around you, nearest friend named below.
   No scroll animation (the sweep and pulses are CSS). */
import {txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('radar',{
  ru:{label:"Радар",title:"Видишь всю компанию.",body:"Радар показывает, где каждый из твоих друзей — даже в толпе на 50 000 человек."},
  en:{label:"Radar",title:"See your whole crew.",body:"The radar shows where each of your friends is — even in a crowd of 50,000."},
  es:{label:"Radar",title:"Ve a todo tu grupo.",body:"El radar muestra dónde está cada uno de tus amigos, incluso entre 50.000 personas."}
});

let friends=[];

export default {
  id:'radar',
  pose:[12,6,-2],
  screen:`
<div class="scr scr-radar">
  <div class="radar"><i class="sweep"></i></div>
  <i class="me"></i>
  <i class="av fr hi" style="--x:70%;--y:30%;--c:var(--cyan);--dl:0s"></i>
  <i class="av fr" style="--x:27%;--y:38%;--c:var(--lime);--dl:-.8s"></i>
  <i class="av fr" style="--x:62%;--y:70%;--c:var(--sun);--dl:-1.6s"></i>
  <i class="av fr" style="--x:33%;--y:66%;--c:#ff7ab6;--dl:-1.2s"></i>
  <span class="ws rl"><b data-r="name"></b> <span data-r="dist"></span></span>
</div>`,
  mount(r){friends=[...r.root.querySelectorAll('.fr')]},
  draw(r,t,c){
    friends.forEach((e,i)=>txt(e,c.names[i][0]));
    txt(r.name,c.names[0]);txt(r.dist,`· 120 ${c.unit}`);
  }
};
