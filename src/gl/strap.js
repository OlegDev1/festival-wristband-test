/* Strap: a round braided solo loop through the case.
   Shape (loopGeometry): oval a=200, b=135 in the Y-Z plane, cross-section 124×19 with rounded edges, NF=64 samples per face,
   10 vertices per braid cell along the band. Vertex colours hold the contact shadow near the case and the darker inside of the loop.
   Material: matte woven fabric (metalness 0, roughnessMap, sheen .5, envMapIntensity .45, anisotropy .35) on the braid
   textures from braid.js, displaced by BRAID.amp. */
import * as THREE from 'three';
import {BRAID,braidTextures} from './braid.js';

function loopGeometry(){
  /* a round loop in the Y-Z plane, like a band around a wrist: a touch flatter where it runs under the case, round everywhere else */
  const a=200,b=135,nf=2.4,nb=2,raw=[];
  for(let i=0;i<=4000;i++){const t=i/4000*Math.PI*2,c=Math.cos(t),s=Math.sin(t),e=2/(c>=0?nf:nb);
    raw.push(new THREE.Vector2(a*Math.sign(s)*Math.abs(s)**e,-b+b*Math.sign(c)*Math.abs(c)**e));}
  const cum=[0];for(let i=1;i<raw.length;i++)cum.push(cum[i-1]+raw[i].distanceTo(raw[i-1]));
  /* cross-section: a thick, flattened braided tube with fully rounded edges, sampled finely so the braid can be displaced */
  const w2=62,h2=9.5,cr=9,NF=64,sec=[];
  const corner=(cx,cy,a0)=>{for(let k=0;k<=10;k++){const a1=a0+k/10*Math.PI/2;sec.push([cx+Math.cos(a1)*cr,cy+Math.sin(a1)*cr,Math.cos(a1),Math.sin(a1),.9])}};
  const face=(x0,y0,x1,y1,nx,ny)=>{for(let k=1;k<NF;k++){const f=k/NF;sec.push([x0+(x1-x0)*f,y0+(y1-y0)*f,nx,ny,1])}};
  corner(w2-cr,h2-cr,0);face(w2-cr,h2,-w2+cr,h2,0,1);corner(-w2+cr,h2-cr,Math.PI/2);
  corner(-w2+cr,-h2+cr,Math.PI);face(-w2+cr,-h2,w2-cr,-h2,0,-1);corner(w2-cr,-h2+cr,Math.PI*1.5);
  sec.push(sec[0]);
  const per=[0];for(let i=1;i<sec.length;i++)per.push(per[i-1]+Math.hypot(sec[i][0]-sec[i-1][0],sec[i][1]-sec[i-1][1]));
  /* whole braid tiles around the tube and along the loop, so there is no seam; 8 vertices per cell along the band for the displacement */
  const L=cum[cum.length-1],P=per[per.length-1],nU=Math.max(1,Math.round(P/BRAID.tile)),TU=P/nU,nV=Math.round(L/(TU*BRAID.aspect)),NS=nV*BRAID.cells*10,pts=[];let j=0;
  for(let i=0;i<NS;i++){const d=i/NS*L;while(cum[j+1]<d)j++;const f=(d-cum[j])/(cum[j+1]-cum[j]);pts.push(raw[j].clone().lerp(raw[j+1],f))}
  const M=sec.length,pos=[],nor=[],uv=[],col=[],idx=[];
  for(let i=0;i<=NS;i++){
    const q=pts[i%NS],q0=pts[(i-1+NS)%NS],q1=pts[(i+1)%NS];
    const ty=q1.x-q0.x,tz=q1.y-q0.y,tl=Math.hypot(ty,tz);let ny=tz/tl,nz=-ty/tl;
    if(ny*q.x+nz*(q.y+b)<0){ny=-ny;nz=-nz}
    for(let m=0;m<M;m++){const [sx,sn,ax,an,sh]=sec[m];
      const X=sx,Y=q.x+ny*sn,Z=q.y+nz*sn,cd=Math.hypot(Math.max(0,Math.hypot(X,Y)-130),Math.max(0,Math.abs(Z)-23)),
        il=Math.hypot(Y,Z+b)||1,inw=Math.max(0,-(ny*an*Y+nz*an*(Z+b))/il),o=sh*(1-.6*Math.exp(-cd/24))*(1-.32*inw);
      pos.push(X,Y,Z);nor.push(ax,ny*an,nz*an);uv.push(per[m]/P*nU,i/NS*nV);col.push(o,o,o);}
  }
  for(let i=0;i<NS;i++)for(let m=0;m<M-1;m++){const A=i*M+m,B=(i+1)*M+m;idx.push(A,B,A+1,B,B+1,A+1)}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);return g;
}

export function makeStrap(renderer){
  const tx=braidTextures(renderer.capabilities.getMaxAnisotropy());
  /* woven fabric like a braided solo loop: no metal, matte, a soft fibre sheen that lights up at grazing angles,
     only a faint highlight stretched along each strand */
  const strapMat=new THREE.MeshPhysicalMaterial({color:0xf26a3c,map:tx.map,normalMap:tx.normal,normalScale:new THREE.Vector2(1.15,1.15),
    displacementMap:tx.disp,displacementScale:BRAID.amp,displacementBias:-BRAID.amp*.5,
    metalness:0,roughness:1,roughnessMap:tx.disp,specularIntensity:.5,envMapIntensity:.45,anisotropy:.35,anisotropyMap:tx.aniso,
    sheen:.5,sheenRoughness:.5,sheenColor:new THREE.Color(0xffa77f),vertexColors:true,side:THREE.DoubleSide});
  return {object:new THREE.Mesh(loopGeometry(),strapMat)};
}
