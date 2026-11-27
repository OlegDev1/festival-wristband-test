/* Closing section + footer: strings, and the colour names under the mini bands (from common.cols). */
import {$$,txt} from '../core/dom.js';
import {addStrings,strings,onLang} from '../core/i18n.js';

addStrings('end',{
  ru:{kick:"Цвета",title:"FindMe. Своих не теряют.",body:"Четыре цвета ремешка — по одному на каждую компанию.",note:"Концепт продукта · учебный проект · 2026"},
  en:{kick:"Colours",title:"FindMe. Nobody gets left behind.",body:"Four strap colours — one for every crew.",note:"Product concept · university project · 2026"},
  es:{kick:"Colores",title:"FindMe. Aquí no se pierde nadie.",body:"Cuatro colores de correa, uno para cada grupo.",note:"Concepto de producto · proyecto universitario · 2026"}
});

export function mount(){
  const names=$$('.cols [data-c]');
  onLang(()=>{const cols=strings('common').cols;names.forEach(e=>txt(e,cols[+e.dataset.c]))});
}
