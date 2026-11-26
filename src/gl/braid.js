/* Braid texture for the strap: a procedural 1024 tile of a 2/2 diagonal braid (like a braided solo loop).
   Cords run along each strand; every strand keeps its own tone and hue.
   Outputs: colour map, normal map, disp (R = height, G = roughness), anisotropy map. Used by strap.js. */
import * as THREE from 'three';

/* braid, in band units: how far the strands stand proud of the tube (amp), the width of one texture tile (tile, 4 x 4 cells),
   and how much longer a tile is along the band than across it (aspect: steeper strands). loopGeometry fits whole tiles. */
export const BRAID={amp:5.4,tile:66,cells:4,aspect:1.2};
export function braidTextures(maxAniso){
  /* a 2/2 diagonal braid, like a braided solo loop: two families of strands cross at an angle, each strand passing over two
     and under two of the other family, so the surface is a herringbone of puffy segments with rounded ends. Every strand is a
     twisted bundle of filaments (fine slanted ticks) and keeps its own slight tone. One seamless tile = 4 x 4 cells.
     Out: colour (grooves baked in), normal map, displacement (segments only, so the outline is bumpy too), and an anisotropy
     map that stretches the highlight along each strand, for a glossy yarn with a metallic sheen. */
  const S=1024,N=BRAID.cells,cs=S/N,TU=BRAID.tile,TV=BRAID.tile*BRAID.aspect;
  const H=new Float32Array(S*S),R=new Float32Array(S*S),D=new Float32Array(S*S),C=new Float32Array(S*S),FA=new Uint8Array(S*S),SI=new Uint8Array(S*S);
  let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const tone=[],lift=[],hue=[];for(let i=0;i<2*N;i++){tone.push(.8+rnd()*.26);lift.push(.9+rnd()*.1);hue.push([1+(rnd()-.5)*.06,1+(rnd()-.5)*.16,1+(rnd()-.5)*.12])}
  const fib=new Float32Array(S*S);for(let i=0;i<S*S;i++)fib[i]=rnd();
  const m4=v=>((v%4)+4)%4,mN=v=>((v%N)+N)%N;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const X=(x+.5)/cs,Y=(y+.5)/cs,a=X-Y,b=X+Y,ia=Math.floor(a),ib=Math.floor(b),sum=ia+ib;
    let best=-1,bf=0,bp=0,bs=0,bd=0;
    for(let f=0;f<2;f++){
      /* family 0 runs along b (across a), family 1 runs along a (across b); they are over in opposite halves of the cycle */
      const ac=f?b:a,al=f?a:b,st=f?ib:ia,p=(2*(ac-Math.floor(ac))-1)/.95,body=.4*Math.sqrt(Math.max(0,1-p*p));
      const ph=m4(sum+(f?2:0))+(al-Math.floor(al)),over=ph<2,sg=over?ph-1:ph-3;
      let h=body,dh=0;
      if(over){
        const ap=p<0?-p:p,q=(sg<0?-sg:sg)/1.1,e=1-p*p*(.55+.45*ap)-q*q*q;
        if(e>0){
          const pill=Math.sqrt(Math.min(1,e/.85));
          dh=pill*lift[f*N+mN(st)]*(.88+.12*sg);h=body+(1-body)*dh;
        }
      }
      if(h>best){best=h;bf=f;bp=p;bs=sg;bd=over?dh:0}
    }
    const i=y*S+x,st=bf?ib:ia;
    D[i]=best;FA[i]=bf;SI[i]=bf*N+mN(st);
    /* twisted yarn: slanted ply ridges, each split into fine filaments with their own tone */
    /* yarn: ~7 rounded cords run along each strand with a slight twist, dark seams between them, every cord split into filaments */
    const on=Math.min(1,best*2.2),tw=bp*3.5+bs*.7,cf=tw-Math.floor(tw),cord=Math.sqrt(Math.max(0,1-(2*cf-1)**2)),fl=tw*4,fi=Math.floor(fl);
    const fh=Math.abs(Math.sin(fi*12.9898+st*78.233+bf*37.719)*43758.5453)%1;
    H[i]=best+on*(.085*(cord-.75)+.008*(fh-.5))+(fib[i]-.5)*.006;
    C[i]=tone[bf*N+mN(st)]*(.17+.83*Math.min(1,best*1.15))*(1-on*.2*(1-cord))*(.94+.1*fh*on);
    R[i]=.95-.3*bd*cord-.05*fh*on;
  }
  const n=new ImageData(S,S),c=new ImageData(S,S),d=new ImageData(S,S),an=new ImageData(S,S),at=(x,y)=>H[((y+S)%S)*S+(x+S)%S];
  const gx=BRAID.amp*S/(2*TU)*1.05,gy=BRAID.amp*S/(2*TV)*1.05;
  /* strand directions in the tangent frame (u right, v up; canvas y runs down): family 0 = (+u,-v), family 1 = (+u,+v) */
  const dl=Math.hypot(TU*TU,TV*TV),d0=[TU*TU/dl,-TV*TV/dl],d1=[TU*TU/dl,TV*TV/dl];
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const dx=(at(x+1,y)-at(x-1,y))*gx,dy=(at(x,y+1)-at(x,y-1))*gy,l=Math.hypot(dx,dy,1),i=(y*S+x)*4,k=y*S+x;
    n.data[i]=(-dx/l*.5+.5)*255;n.data[i+1]=(dy/l*.5+.5)*255;n.data[i+2]=(1/l*.5+.5)*255;n.data[i+3]=255;
    const hs=hue[SI[k]];c.data[i]=Math.min(255,C[k]*hs[0]*255);c.data[i+1]=Math.min(255,C[k]*hs[1]*255);c.data[i+2]=Math.min(255,C[k]*hs[2]*255);c.data[i+3]=255;
    d.data[i]=d.data[i+2]=Math.min(255,D[k]*255);d.data[i+1]=R[k]*255;d.data[i+3]=255;
    const dd=FA[k]?d1:d0;an.data[i]=(dd[0]*.5+.5)*255;an.data[i+1]=(dd[1]*.5+.5)*255;an.data[i+2]=Math.min(255,(.35+.65*Math.min(1,D[k]*1.4))*255);an.data[i+3]=255;
  }
  const tex=(img,srgb)=>{const cv=document.createElement('canvas');cv.width=cv.height=S;cv.getContext('2d').putImageData(img,0,0);
    const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,maxAniso);if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t};
  return {map:tex(c,true),normal:tex(n,false),disp:tex(d,false),aniso:tex(an,false)};
}
