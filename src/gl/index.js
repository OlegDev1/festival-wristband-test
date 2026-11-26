/* WebGL band: renderer, camera, and the parts. Units match the CSS model (k = 1), so the HTML screen sits exactly on the glass.
   Each part is a factory returning {object, update?(v)}; v is the band state sent by src/band/band.js every frame:
     {x, y, s, ry, rx, rz, k, w, h, ring, glow, sos, scr}
   Parts: lighting.js (HDRI + lights), case.js, glass.js (glass, light ring, glow), button.js, strap.js (+ braid.js texture).
   createGL throws if WebGL is unavailable; src/main.js then switches to the CSS model. */
import * as THREE from 'three';
import {setupLighting} from './lighting.js';
import {makeCase} from './case.js';
import {makeGlass} from './glass.js';
import {makeButton} from './button.js';
import {makeStrap} from './strap.js';

export function createGL(host){
  const r=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.08;r.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,100,10000);
  let lastV=null;
  /* redraw once the HDRI has replaced the placeholder reflections */
  setupLighting(scene,r,()=>lastV&&draw(lastV));
  const g=new THREE.Group();scene.add(g);
  const parts=[makeCase(),makeGlass(),makeButton(),makeStrap(r)];
  parts.forEach(p=>g.add(p.object));
  host.appendChild(r.domElement);

  const D=Math.PI/180;let lw=0,lh=0,lk=0,shown=false;
  function draw(v){
    lastV=v;
    /* camera at the same distance as the CSS perspective (1800·k), so WebGL and the HTML screen line up */
    if(v.w!==lw||v.h!==lh||v.k!==lk){lw=v.w;lh=v.h;lk=v.k;r.setSize(v.w,v.h,false);const d=1800*v.k;
      cam.aspect=v.w/v.h;cam.fov=2*Math.atan(v.h/2/d)/D;cam.position.set(0,0,d);cam.near=d*.3;cam.far=d*3;cam.updateProjectionMatrix();}
    g.position.set(v.x,-v.y,0);g.scale.setScalar(v.s*v.k);g.rotation.set(-v.rx*D,v.ry*D,-v.rz*D,'ZXY');
    parts.forEach(p=>p.update&&p.update(v));
    r.render(scene,cam);
    if(!shown){shown=true;host.classList.add('on')}
  }
  return {draw};
}
