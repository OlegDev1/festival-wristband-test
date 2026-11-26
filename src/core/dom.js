/* Tiny shared helpers. No feature logic lives here. */
export const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
export const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* set text only when it changed (screens are redrawn on every scroll frame) */
export const txt=(el,s)=>{if(el&&el.textContent!==s)el.textContent=s};
/* every [data-r] element under root, by name: <b data-r="dist"> → refs(root).dist; refs(root).root is root itself */
export function refs(root){const r={root};root.querySelectorAll('[data-r]').forEach(e=>r[e.dataset.r]=e);return r}
