/* Chapter runtime (you rarely need to edit this; edit a chapter file instead).
   mount: puts each chapter's screen into the band's .screen, loads its stylesheet (<id>.css next to <id>.js), calls its mount.
   update (every frame): turns on the active screen (frame.si), lets that chapter advance its state (step), redraws every
   screen in the current language (draw), and returns the band look the active chapter asks for (look).

   A chapter module (see home.js … sos.js) default-exports:
     id       'find' — also its strings namespace and its CSS file name
     pose     [ry, rx, rz] band rotation while it is on, in degrees
     screen   markup, one root .scr.scr-<id>; [data-r=name] elements are handed to mount/draw as r.name, r.root = the .scr
     mount(r)               optional, once
     step(lt, {buzz})       optional, only while it is the active screen; lt = 0 … ~1.17 through the chapter
     draw(r, t, common)     optional, every frame and on language change; t = its own strings, common = shared strings
     look()                 optional, while active: {ring, glow, sos} for the band
   and calls addStrings(id, {ru, en, es}) with at least label, title, body (used by the caption and the rail). */
import {$,refs} from '../core/dom.js';
import {strings,onLang} from '../core/i18n.js';

const BASE_LOOK={ring:'#ff5a3c',glow:false,sos:false};
let live=[],si=-2,api=null;

export function mount(chapters,bandApi){
  api=bandApi;
  const host=$('#screen'),glass=host.querySelector('.glass'),tpl=document.createElement('template');
  live=chapters.map(c=>{
    const css=document.createElement('link');css.rel='stylesheet';css.href=new URL(`./${c.id}.css`,import.meta.url).href;document.head.appendChild(css);
    tpl.innerHTML=c.screen.trim();const el=tpl.content.firstElementChild;host.insertBefore(el,glass);
    const r=refs(el);c.mount&&c.mount(r);
    return {c,r};
  });
  onLang(draw);
}

function draw(){const cm=strings('common');live.forEach(({c,r})=>c.draw&&c.draw(r,strings(c.id),cm))}

export function update(f){
  if(f.si!==si){live.forEach(({r},i)=>r.root.classList.toggle('on',i===f.si));si=f.si}
  const a=live[f.si];
  if(a&&a.c.step)a.c.step(f.lt,api);
  draw();
  return a&&a.c.look?{...BASE_LOOK,...a.c.look()}:BASE_LOOK;
}
