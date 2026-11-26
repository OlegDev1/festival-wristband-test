/* Languages (ru / en / es) and strings.
   Every feature registers its own strings under a namespace, next to its code:
     addStrings('how', {ru:{title:'…'}, en:{title:'…'}, es:{title:'…'}})
   Markup asks for a string with data-i="ns.key" (filled on every language change).
   Code reads strings('ns') for the current language, and onLang(fn) to redraw text it builds itself. */
import {$$,txt} from './dom.js';

export const LANGS=['ru','en','es'];
const dict={ru:{},en:{},es:{}},subs=[];
export let lang='en';

export function addStrings(ns,table){for(const l of LANGS)dict[l][ns]=table[l]}
export const strings=ns=>dict[lang][ns];
export function onLang(fn){subs.push(fn)}

export function setLang(l){
  lang=l;document.documentElement.lang=l;
  $$('[data-i]').forEach(e=>{const [ns,k]=e.dataset.i.split('.'),v=dict[l][ns]?.[k];if(typeof v==='string')txt(e,v)});
  try{localStorage.setItem('tribu-lang',l)}catch(e){}
  subs.forEach(f=>f(l));
}

/* saved choice, else the browser language (uk/be/kk → ru, ca/gl/eu → es), else en */
export function startLang(){
  let l='';try{l=localStorage.getItem('tribu-lang')||''}catch(e){}
  if(!LANGS.includes(l)){const n=(navigator.language||'en').toLowerCase();l=/^(ru|uk|be|kk)/.test(n)?'ru':/^(es|ca|gl|eu)/.test(n)?'es':'en'}
  setLang(l);
}
