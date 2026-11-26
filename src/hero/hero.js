/* Hero: wordmark + tagline strings, and their fade/lift as the story starts (frame.hero 1 → 0). */
import {$} from '../core/dom.js';
import {addStrings} from '../core/i18n.js';

addStrings('hero',{
  ru:{tag:"Найди своих в любой толпе.",sub:"Браслет для фестивалей, который знает, где твои друзья.",scroll:"Листай вниз"},
  en:{tag:"Never lose your people in the crowd.",sub:"A festival wristband that knows where your friends are.",scroll:"Scroll down"},
  es:{tag:"No vuelvas a perder a los tuyos.",sub:"Una pulsera para festivales que sabe dónde están tus amigos.",scroll:"Desliza hacia abajo"}
});

const heroT=$('#heroT'),heroF=$('#heroF');

export function update(f){
  const ho=f.hero,vis=ho>0?'visible':'hidden';
  heroT.style.opacity=ho;heroT.style.setProperty('--hy',`${(-f.u*60).toFixed(1)}px`);heroT.style.visibility=vis;
  heroF.style.opacity=ho;heroF.style.visibility=vis;
}
