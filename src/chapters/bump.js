/* Chapter 04 · Bump: two bands (you + a friend) slide together; at half way they touch, a ring bursts,
   "+ Lucas joined your crew" appears and the band buzzes. */
import {clamp,txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('bump',{
  ru:{label:"Знакомство",title:"Стукнитесь браслетами.",body:"Познакомился с кем-то у сцены? Одно касание — и новый друг уже в твоей компании.",pre:"Поднеси браслеты",ok:"теперь в компании"},
  en:{label:"Bump",title:"Bump bands.",body:"Met someone by the stage? One tap and they're in your crew.",pre:"Bring bands together",ok:"joined your crew"},
  es:{label:"Choque",title:"Choca las pulseras.",body:"¿Has conocido a alguien junto al escenario? Un toque y ya está en tu grupo.",pre:"Acerca las pulseras",ok:"ya está en tu grupo"}
});

const S={g:0,ok:false};

export default {
  id:'bump',
  pose:[16,3,2],
  screen:`
<div class="scr scr-bump">
  <div class="bump" data-r="bump"><i class="burst"></i><i class="bb a" data-r="a"></i><i class="bb b" data-r="b"></i></div>
  <span class="wm" data-r="title"></span>
  <span class="ws" data-r="sub"></span>
</div>`,
  step(lt,{buzz}){
    S.g=clamp(lt/.5,0,1);const ok=lt>.5;
    if(ok&&!S.ok)buzz();S.ok=ok;
  },
  draw(r,t,c){
    txt(r.a,c.you);txt(r.b,c.names[1][0]);
    r.bump.style.setProperty('--g',`calc(var(--k)*${(S.ok?24:S.g*15).toFixed(1)}px)`);
    r.root.classList.toggle('ok',S.ok);txt(r.title,S.ok?`+ ${c.names[1]}`:'');txt(r.sub,S.ok?t.ok:t.pre);
  }
};
