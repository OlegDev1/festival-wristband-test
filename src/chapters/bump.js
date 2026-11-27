/* Chapter · Bump: two mini bands (yours coral, a new friend's lime) slide together; at half way they touch, a ring
   bursts, "+ Lucas joined Primavera Squad" appears and the band buzzes. */
import {clamp,txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('bump',{
  ru:{label:"Знакомство",title:"Стукнитесь браслетами.",body:"Познакомился с кем-то у сцены? Одно касание — и новый друг уже в твоей компании. Больше никто не войдёт без приглашения.",we:"Добавить друга",pre:"Стукнитесь",hint:"браслетами, чтобы добавить",ok:"теперь в"},
  en:{label:"Bump",title:"Bump bands.",body:"Met someone by the stage? One tap and they're in your crew. Nobody else gets in without an invite.",we:"Add a friend",pre:"Bump bands",hint:"to add them to your crew",ok:"joined"},
  es:{label:"Choque",title:"Choca las pulseras.",body:"¿Has conocido a alguien junto al escenario? Un toque y ya está en tu grupo. Nadie más entra sin invitación.",we:"Añadir amigo",pre:"Choca",hint:"las pulseras para añadirle",ok:"se une a"}
});

const S={g:0,ok:false};

export default {
  id:'bump',
  pose:[16,3,2],
  screen:`
<div class="scr scr-bump">
  <span class="we" data-r="we"></span>
  <div class="bump" data-r="bump"><i class="burst"></i><i class="bb a" style="--c:var(--coral)"><i></i></i><i class="bb b" style="--c:var(--lime)"><i></i></i></div>
  <b class="wm" data-r="title"></b>
  <span class="ws" data-r="sub"></span>
</div>`,
  step(lt,{buzz}){
    S.g=clamp(lt/.5,0,1);const ok=lt>.5;
    if(ok&&!S.ok)buzz();S.ok=ok;
  },
  draw(r,t,c){
    r.bump.style.setProperty('--g',`calc(var(--k)*${((S.ok?1:S.g*S.g)*17).toFixed(1)}px)`);
    r.root.classList.toggle('ok',S.ok);
    txt(r.we,t.we);txt(r.title,S.ok?`+ ${c.names[1]}`:t.pre);txt(r.sub,S.ok?`${t.ok} ${c.crew}`:t.hint);
  }
};
