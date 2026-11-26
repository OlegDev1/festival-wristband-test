/* Chapter rail: one dot per chapter, tap to jump; arrow and page keys step through chapters.
   The lit dot comes from the timeline (frame.ri, -1 = rail hidden). */
import {$} from '../core/dom.js';
import {addStrings,strings,onLang} from '../core/i18n.js';
import {go,step} from '../story/timeline.js';

addStrings('rail',{ru:{label:"Главы"},en:{label:"Chapters"},es:{label:"Capítulos"}});

const rail=$('#rail');
let dots=[],ri=-2;

export function mount(chapters){
  rail.innerHTML=chapters.map(()=>'<button type="button"></button>').join('');
  dots=[...rail.children];
  dots.forEach((b,i)=>b.addEventListener('click',()=>go(i)));
  onLang(()=>{
    rail.setAttribute('aria-label',strings('rail').label);
    dots.forEach((b,i)=>b.setAttribute('aria-label',`${i+1}. ${strings(chapters[i].id).label}`));
  });
  addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
    const d={ArrowRight:1,PageDown:1,ArrowLeft:-1,PageUp:-1}[e.key];
    if(d&&step(d))e.preventDefault();
  });
}

export function update(f){
  if(f.ri===ri)return;
  rail.classList.toggle('on',f.ri>=0);
  dots.forEach((b,i)=>i===f.ri?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));
  ri=f.ri;
}
