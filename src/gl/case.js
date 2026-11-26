/* Watch case: machined lathe profile split into body (satin, circular-brushed, roughness .42) and top edge (polished
   silver, roughness .3), plus a dark glossy back.
   Keep outer radius 130.2, half-thickness 23 and the lip at z 23.2 / glass r 114.2 at z 22.7 (glass.js), or the HTML screen
   and the light ring misalign. */
import * as THREE from 'three';

function caseGeometry(){
  /* machined profile (r, z), split where the straight flank meets the rolled top edge: body = satin, bezel = polished */
  const V=(r,z)=>new THREE.Vector2(r,z),arc=(cx,cz,rx,rz,a0,a1,n,o)=>{for(let k=0;k<=n;k++){const a=a0+(a1-a0)*k/n;o.push(V(cx+Math.cos(a)*rx,cz+Math.sin(a)*rz))}};
  const body=[V(86,-23),V(100,-23)];arc(110,-8,20.2,15,-Math.PI/2,0,20,body);body.push(V(130.2,0),V(130.2,7));
  const top=[];arc(119,7,11.2,16.2,0,Math.PI/2,22,top);top.push(V(116.5,23.2),V(114.6,23.2),V(113.6,22.4));
  return [body,top].map(p=>{const g=new THREE.LatheGeometry(p,256);g.rotateX(Math.PI/2);return g});
}

export function makeCase(){
  const g=new THREE.Group();
  /* polished steel: pure metal, no clearcoat (a second lobe on metal only blurs the streaks and costs a pass on phones) */
  const silver=new THREE.MeshStandardMaterial({color:0xd6d7db,metalness:1,roughness:.3,envMapIntensity:1,side:THREE.DoubleSide});
  /* satin flank and back edge: circular-brushed metal (highlight smeared around the case), polished top edge and lip */
  const satin=new THREE.MeshPhysicalMaterial({color:0xc4c5ca,metalness:1,roughness:.42,anisotropy:.45,envMapIntensity:.95,side:THREE.DoubleSide});
  const [cb,ct]=caseGeometry();g.add(new THREE.Mesh(cb,satin));g.add(new THREE.Mesh(ct,silver));
  const back=new THREE.Mesh(new THREE.CircleGeometry(87,128),new THREE.MeshPhysicalMaterial({color:0x17161b,roughness:.3,clearcoat:1,clearcoatRoughness:.1}));
  back.geometry.rotateY(Math.PI);back.position.z=-23.05;g.add(back);
  return {object:g};
}
