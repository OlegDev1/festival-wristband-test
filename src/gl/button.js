/* Side button a touch above 3 o'clock (group rotated 14°): a flatter darker-silver pill set into a dark slot that reads as
   the shadow gap around it. Glows coral (emissive) while the SOS chapter is on (v.sos). */
import * as THREE from 'three';

export function makeButton(){
  const btnMat=new THREE.MeshPhysicalMaterial({color:0x86878c,metalness:1,roughness:.32,emissive:0xff5a3c,emissiveIntensity:0});
  const bg=new THREE.Group();bg.rotation.z=14*Math.PI/180;
  const slot=new THREE.Mesh(new THREE.CapsuleGeometry(8,32,8,32),new THREE.MeshStandardMaterial({color:0x0b0a0c,roughness:.7}));slot.scale.set(.35,1,1);slot.position.x=129.6;bg.add(slot);
  const btn=new THREE.Mesh(new THREE.CapsuleGeometry(6,30,10,32),btnMat);btn.scale.set(.62,1,1);btn.position.x=131.6;bg.add(btn);
  return {object:bg,update(v){btnMat.emissiveIntensity=v.sos?2.2:0}};
}
