/* Chapter captions: one <article> per chapter with a coral eyebrow ("02 · Radar"), title and body, all from the chapter's
   own strings (label / title / body). The timeline decides which one shows (frame.ci). */
import {$,txt,clamp} from '../core/dom.js';
import {strings,onLang} from '../core/i18n.js';

let caps=[],ci=-2,box=null,capY='';

export function mount(chapters){
  box=$('#caps');
  box.innerHTML=chapters.map(c=>`<article class="cap"><span class="eyebrow"></span><h2 data-i="${c.id}.title"></h2><p data-i="${c.id}.body"></p></article>`).join('');
  caps=[...box.children];
  onLang(()=>caps.forEach((e,i)=>txt(e.firstElementChild,`${String(i+1).padStart(2,'0')} · ${strings(chapters[i].id).label}`)));
}

/* phone: band centre sits at .37vh once docked (band.js), its rendered bottom ≈ 220 band units below, scaled by k (band.js size()) */
function place(f){
  const k=clamp(Math.min(f.vw*.63/290,f.vh*.34/290),.5,1.8),y=f.wide?'':`${Math.round(f.vh*.37+220*k+30)}px`;
  if(y!==capY){box.style.setProperty('--capY',y||null);capY=y}
}

export function update(f){
  place(f);
  if(f.ci!==ci){caps.forEach((e,i)=>e.classList.toggle('on',i===f.ci));ci=f.ci}
}
