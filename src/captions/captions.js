/* Chapter captions: one <article> per chapter with a coral eyebrow ("02 · Radar"), title and body, all from the chapter's
   own strings (label / title / body). The timeline decides which one shows (frame.ci). */
import {$,txt} from '../core/dom.js';
import {strings,onLang} from '../core/i18n.js';

let caps=[],ci=-2;

export function mount(chapters){
  const box=$('#caps');
  box.innerHTML=chapters.map(c=>`<article class="cap"><span class="eyebrow"></span><h2 data-i="${c.id}.title"></h2><p data-i="${c.id}.body"></p></article>`).join('');
  caps=[...box.children];
  onLang(()=>caps.forEach((e,i)=>txt(e.firstElementChild,`${String(i+1).padStart(2,'0')} · ${strings(chapters[i].id).label}`)));
}

export function update(f){
  if(f.ci!==ci){caps.forEach((e,i)=>e.classList.toggle('on',i===f.ci));ci=f.ci}
}
