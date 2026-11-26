/* CSS 3D fallback model, built only when WebGL is not available (band.js fallback()).
   Case edge: 120 thin slats around the rim, lit from above-right, with the coral light-ring line baked into each gradient.
   Straps: many short slices along a smooth arc that wraps back like a real band, lit from above, fading out.
   Styles: .st and .seg/.sf/.sl/.sr in band.css. */
import {clamp} from '../core/dom.js';

export function buildCSSModel(watch){
  let h='';
  for(let i=0;i<120;i++){
    const a=i*3,c1=Math.max(0,Math.cos((a-50)*Math.PI/180)),c2=Math.max(0,Math.cos((a-235)*Math.PI/180));
    const l=Math.min(1,.12+.88*c1**1.6+.18*c2),L=12+l*44,f=n=>n.toFixed(1);
    h+=`<i class="st" style="--a:${a}deg;background:linear-gradient(hsl(250 5% ${f(L*.55)}%),hsl(250 5% ${f(L)}%) 30%,hsl(250 5% ${f(L)}%) 44%,hsl(9 88% ${f(30+l*28)}%) 45.5%,hsl(9 92% ${f(36+l*30)}%) 54.5%,hsl(250 5% ${f(L)}%) 56%,hsl(250 5% ${f(L*1.06)}%) 86%,hsl(250 6% ${f(Math.min(92,L+30))}%) 93%,hsl(250 5% ${f(L*.8)}%))"></i>`;
  }
  watch.insertAdjacentHTML('afterbegin',h);

  function strap(dir){
    const n=34,ds=8,len=n*ds,H=ds+1.6;let y=104,z=0,h='';
    for(let i=0;i<n;i++){
      const sm2=(i+.5)*ds,th=sm2<12?0:118*((sm2-12)/(len-12))**1.15,t=th*Math.PI/180;
      const dot=(dir<0?.55:-.55)*Math.sin(t)+.83*Math.cos(t);
      const dark=clamp(.83-dot,0,1)*.9,fade=clamp((i-n*.62)/(n*.38),0,1)**1.2,o=1-(1-dark)*(1-fade);
      const ty=dir<0?-y-H:y;
      h+=`<div class="seg" style="height:calc(var(--k)*${H}px);transform-origin:50% ${dir<0?'100%':'0'};transform:translate3d(0,calc(var(--k)*${ty.toFixed(2)}px),calc(var(--k)*${z.toFixed(2)}px)) rotateX(${(dir<0?th:-th).toFixed(2)}deg);--o:${o.toFixed(3)}"><i class="sf"></i><i class="sl"></i><i class="sr"></i></div>`;
      y+=ds*Math.cos(t);z-=ds*Math.sin(t);
    }
    watch.insertAdjacentHTML('beforeend',h);
  }
  strap(-1);strap(1);
}
