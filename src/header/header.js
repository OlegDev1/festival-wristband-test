/* Header: language switch buttons and the scroll progress bar (frame.p = 0..1 through the story). */
import {$,$$} from '../core/dom.js';
import {setLang,onLang} from '../core/i18n.js';

const prog=$('#prog');

export function mount(){
  const btns=$$('.lang button');
  btns.forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.l)));
  onLang(l=>btns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.l===l))));
}

export function update(f){prog.style.transform=`scaleX(${f.p.toFixed(4)})`}
