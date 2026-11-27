/* Chapter · Ghost mode: privacy. A ghost disc and a toggle; part way through the toggle flips on, the disc fades to a
   dashed outline and floats, and the screen says you are hidden for the next hour. */
import {txt} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('ghost',{
  ru:{label:"Невидимка",title:"Нужна пауза? Стань невидимкой.",body:"Тебя видят только приглашённые друзья. Режим невидимки скрывает тебя на час, а все данные удаляются после фестиваля.",we:"Невидимка",on:"Скрыт",off:"Виден",subOff:"Компания видит тебя",subOn:"на ближайший час"},
  en:{label:"Ghost mode",title:"Need a break? Go ghost.",body:"Only friends you invite can ever see you. Ghost mode hides you for an hour, and your data is deleted after the festival.",we:"Ghost mode",on:"Hidden",off:"Visible",subOff:"Your crew can see you",subOn:"for the next hour"},
  es:{label:"Modo fantasma",title:"¿Un respiro? Modo fantasma.",body:"Solo te ven los amigos que invitas. El modo fantasma te oculta durante una hora y tus datos se borran tras el festival.",we:"Modo fantasma",on:"Oculto",off:"Visible",subOff:"Tu grupo te ve",subOn:"durante una hora"}
});

const S={on:false};

export default {
  id:'ghost',
  pose:[6,4,1],
  screen:`
<div class="scr scr-ghost">
  <span class="we" data-r="we"></span>
  <i class="disc"><svg viewBox="0 0 24 24"><path d="M6 20V10.5a6 6 0 0 1 12 0V20l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><circle cx="10" cy="10.5" r=".9" fill="currentColor"/><circle cx="14" cy="10.5" r=".9" fill="currentColor"/></svg></i>
  <b class="wm" data-r="state"></b>
  <span class="ws" data-r="sub"></span>
  <span class="tg"><i></i></span>
</div>`,
  step(lt){S.on=lt>=.4},
  draw(r,t){
    r.root.classList.toggle('ghosted',S.on);
    txt(r.we,t.we);txt(r.state,S.on?t.on:t.off);txt(r.sub,S.on?t.subOn:t.subOff);
  }
};
