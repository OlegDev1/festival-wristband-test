/* Glass, light ring and glow.
   Glass: black sapphire over an off OLED: flat disc r 114.2 at z 22.7 (so the HTML screen still lines up) with normals bent
   like a dome that rolls off at the rim, so reflections slide across it and the edge catches a highlight. Black dielectric,
   IOR 1.77, faint iridescence (thin AR-coating tint). Reflections fade to 0 with v.scr while a feature is on screen
   (uniforms only, no shader recompile).
   Light ring around the glass takes v.ring (crew colour); v.glow brightens it and turns on the additive glow. */
import * as THREE from 'three';

function glowTexture(){
  /* a narrow glow hugging the light ring around the glass, not the whole case */
  const cv=document.createElement('canvas');cv.width=cv.height=512;const x=cv.getContext('2d');
  const g=x.createRadialGradient(256,256,0,256,256,256);
  g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.862,'rgba(255,255,255,0)');g.addColorStop(.893,'rgba(255,255,255,1)');
  g.addColorStop(.925,'rgba(255,255,255,.3)');g.addColorStop(.975,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,512,512);
  return new THREE.CanvasTexture(cv);
}

export function makeGlass(){
  const g=new THREE.Group();
  const gg=new THREE.RingGeometry(0,114.2,128,24),gp=gg.attributes.position,gn=gg.attributes.normal,nv=new THREE.Vector3();
  for(let i=0;i<gp.count;i++){const x=gp.getX(i)/114.2,y=gp.getY(i)/114.2,k=.22+1.1*Math.hypot(x,y)**7;nv.set(x*k,y*k,1).normalize();gn.setXYZ(i,nv.x,nv.y,nv.z)}
  const glassMat=new THREE.MeshPhysicalMaterial({color:0,metalness:0,roughness:.04,ior:1.77,
    iridescence:.15,iridescenceIOR:1.35,iridescenceThicknessRange:[260,420],envMapIntensity:.5});
  const glass=new THREE.Mesh(gg,glassMat);glass.position.z=22.7;g.add(glass);
  const ringMat=new THREE.MeshBasicMaterial({color:0xff5a3c,transparent:true,opacity:.6,toneMapped:false});
  const ring=new THREE.Mesh(new THREE.RingGeometry(114.7,117.7,200),ringMat);ring.position.z=23.26;g.add(ring);
  const glowMat=new THREE.MeshBasicMaterial({map:glowTexture(),color:0xff5a3c,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(260,260),glowMat);glow.position.z=23.4;g.add(glow);
  return {object:g,update(v){
    ringMat.color.set(v.ring);glowMat.color.set(v.ring);ringMat.opacity=v.glow?1:.6;glowMat.opacity=v.glow?.9:0;
    /* no reflections on the glass while the screen shows a feature */
    glassMat.envMapIntensity=.5*(1-v.scr);glassMat.specularIntensity=1-v.scr;
  }};
}
