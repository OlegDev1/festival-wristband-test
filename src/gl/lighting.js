/* Lighting and reflections.
   Reflections: custom studio HDRI hdr/tribu_studio.hdr (1024x512, ~300 KB, made by tools/make_hdr.py), PMREM-prefiltered once.
   Black studio: overhead softbox, key softbox behind the camera, tall gradient panel the glass mirrors (left-back), two strip
   lights, faint coral + cyan accents. Regenerate: python3 tools/make_hdr.py tinted hdr/tribu_studio.hdr
   (equirect centre = +X, u .75 = +Z toward camera).
   envScene() (synthetic panels) stands in only until the HDR has loaded (or if it fails), so the metal is never black.
   Direct lights: hemi .08, key 2.9, neutral side light 1.5 from the right (shapes the strap), cyan rim .7, coral .2. */
import * as THREE from 'three';
import {RGBELoader} from '../../vendor/RGBELoader.js';

const HDR=new URL('../../hdr/tribu_studio.hdr',import.meta.url).href;

function envScene(){
  const s=new THREE.Scene();s.background=new THREE.Color(0x060407);
  const add=(w,h,col,i,p)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(i),side:THREE.DoubleSide}));m.position.set(...p);m.lookAt(0,0,0);s.add(m)};
  add(9,3,'#ffffff',5,[0,6,3]);add(2,9,'#ffffff',2.6,[6.5,1,4]);add(3,3,'#ffffff',2,[-3,3,6]);
  /* studio strips for polished steel and the glass: two long thin softboxes give crisp streak highlights, a dim panel behind the camera keeps camera-facing metal from going black */
  add(16,.45,'#ffffff',8,[0,4,6.5]);add(.45,14,'#ffffff',5,[-7.5,0,5]);add(14,9,'#fff4ec',.22,[0,0,10]);
  /* big soft panel back-left: what the glass mirrors in the hero 3/4 pose, so it reads as a sheen sweeping across the black */
  add(9,12,'#ffffff',1.5,[-7,2,-5]);
  add(1.6,9,'#ff5a3c',3.4,[-6,0,2]);add(1.6,7,'#43d9ff',2.2,[5,0,-5]);add(11,2,'#ffb48a',.9,[0,-6,2]);
  return s;
}

/* onHDR: called once the HDRI reflections are in, so the caller can redraw */
export function setupLighting(scene,renderer,onHDR){
  const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(envScene(),.03).texture;
  new RGBELoader().load(HDR,t=>{const old=scene.environment;scene.environment=pm.fromEquirectangular(t).texture;
    t.dispose();old.dispose();pm.dispose();onHDR()},undefined,()=>pm.dispose());
  scene.add(new THREE.HemisphereLight(0xffffff,0x2a1210,.08));
  const key=new THREE.DirectionalLight(0xfff1e6,2.9);key.position.set(300,500,600);scene.add(key);
  const rim=new THREE.DirectionalLight(0x43d9ff,.7);rim.position.set(-500,120,-400);scene.add(rim);
  const warm=new THREE.DirectionalLight(0xff5a3c,.2);warm.position.set(-400,-300,300);scene.add(warm);
  /* neutral side light from the right, where most of the loop faces: gives the strap a real light-to-shadow falloff
     instead of the flat coral wash it got when only the accent light reached it */
  const side=new THREE.DirectionalLight(0xfff4ec,1.5);side.position.set(700,250,150);scene.add(side);
}
