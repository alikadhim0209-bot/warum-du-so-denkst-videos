// 3D-Szene (three.js, global THREE). render(t) zeichnet den Zeitpunkt t in Sekunden.
const W=1080,H=1920;
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.getElementById('gl').appendChild(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(55,W/H,.1,300);
// Himmel
const skyC=document.createElement('canvas');skyC.width=4;skyC.height=256;const skyX=skyC.getContext('2d');const skyT=new THREE.CanvasTexture(skyC);scene.background=skyT;const WH=new THREE.Color(0xffffff);
function sky(w){const mix=h=>'#'+new THREE.Color(h).lerp(WH,w).getHexString();const g=skyX.createLinearGradient(0,0,0,256);g.addColorStop(0,mix(0xff9d3c));g.addColorStop(.55,mix(0xffd98a));g.addColorStop(1,mix(0xfff0c8));skyX.fillStyle=g;skyX.fillRect(0,0,4,256);skyT.needsUpdate=true;}sky(0);
scene.fog=new THREE.Fog(0xffd9a0,30,90);
const gm=new THREE.DataTexture(new Uint8Array([110,110,110,255,185,185,185,255,255,255,255,255]),3,1,THREE.RGBAFormat);gm.minFilter=gm.magFilter=THREE.NearestFilter;gm.needsUpdate=true;
const toon=(c,o={})=>new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:gm},o));
const OUTM=new THREE.MeshBasicMaterial({color:0x17110f,side:THREE.BackSide});
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function add(par,geo,mat,p,o={}){const m=new THREE.Mesh(geo,mat);m.position.set(p[0],p[1],p[2]);if(o.r)m.rotation.set(o.r[0],o.r[1],o.r[2]);if(o.s)m.scale.set(o.s[0],o.s[1],o.s[2]);m.castShadow=true;par.add(m);
 if(o.ol!==0){const k=new THREE.Mesh(geo,OUTM);const t=o.ol||.05;k.scale.set(1+t,1+t,1+t);m.add(k);}return m;}
scene.add(new THREE.HemisphereLight(0xfff2d6,0x9a6a3a,1.5));
const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-6,14,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:40});scene.add(sun);
// Boden + Kulisse
{const g=new THREE.Mesh(new THREE.CircleGeometry(80,48),new THREE.MeshToonMaterial({color:0xb9783a,gradientMap:gm}));g.rotation.x=-Math.PI/2;g.receiveShadow=true;scene.add(g);
 const rnd=i=>{const x=Math.sin(i*127.1)*43758.5453;return x-Math.floor(x);};
 for(let i=0;i<16;i++){const a=i/16*6.283+rnd(i),r=24+rnd(i+3)*26,h=6+rnd(i+7)*12;add(scene,new THREE.ConeGeometry(5+rnd(i+1)*6,h,5),toon(i%2?0xd49650:0xc27f3e),[Math.cos(a)*r,h/2-.5,Math.sin(a)*r-14],{ol:0,r:[0,rnd(i)*3,0]});}
 for(let i=0;i<14;i++){const s=.2+rnd(i+20)*.5;add(scene,new THREE.DodecahedronGeometry(s),toon(0x8a5a2b),[(rnd(i+30)-.5)*18,s*.4,(rnd(i+40)-.5)*10-1],{ol:.08});}
 const sn=new THREE.Mesh(new THREE.SphereGeometry(9,24,16),new THREE.MeshBasicMaterial({color:0xfff6d8,fog:false}));sn.position.set(0,16,-70);scene.add(sn);}
const world={m:[],r:[],g:null,sun:null};scene.children.forEach(o=>{if(!o.isMesh)return;const ty=o.geometry.type;if(ty=='ConeGeometry')world.m.push(o);else if(ty=='DodecahedronGeometry')world.r.push(o);else if(ty=='CircleGeometry')world.g=o;else if(ty=='SphereGeometry'&&o.geometry.parameters.radius==9)world.sun=o;});
world.g.geometry=new THREE.PlaneGeometry(170,170,110,110);world.base=world.g.geometry.attributes.position.array.slice();world.all=world.m.concat(world.r,[world.g]);world.all.forEach(o=>{o.userData.c=o.material.color.clone();o.userData.p=o.position.clone();o.userData.s=o.scale.clone();});let worldDirty=false;const FOG0=new THREE.Color(0xffd9a0);
function worldFx(t,w,el,cx){if(!w&&!el&&!worldDirty)return;worldDirty=!!(w||el);sky(w);scene.fog.color.copy(FOG0).lerp(WH,w);world.all.forEach(o=>o.material.color.copy(o.userData.c).lerp(WH,w*.93));
 world.m.forEach((o,i)=>{const a=Math.sin(t*6+i*1.7);o.scale.set(o.userData.s.x*(1-.2*el*a),o.userData.s.y*(1+.4*el*a),o.userData.s.z*(1-.2*el*a));o.rotation.z=.3*el*Math.sin(t*4.3+i*2.1);o.position.y=o.userData.p.y+el*1.5*Math.max(0,Math.sin(t*6+i*1.7));});
 world.r.forEach((o,i)=>{const a=Math.abs(Math.sin(t*7+i*1.3));o.position.y=o.userData.p.y+el*1.6*a;o.scale.set(1+.35*el*(1-a),1-.35*el*(1-a)+.3*el*a,1+.35*el*(1-a));});
 const P=world.g.geometry.attributes.position,B=world.base;for(let i=0;i<P.count;i++){const x=B[i*3],y=B[i*3+1],rr=Math.hypot(x-cx,y);P.array[i*3+2]=el*(.55*Math.sin(rr*.9-t*8)*Math.min(1,rr/3.5)*Math.exp(-rr/38)+.5*Math.sin(x*.25+t*3)*Math.sin(y*.3-t*2.4)*Math.min(1,rr/6));}P.needsUpdate=true;world.g.geometry.computeVertexNormals();
 world.sun.scale.set(1+.3*el*Math.sin(t*5),1-.25*el*Math.sin(t*5),1);camera.fov=55+5*el*Math.sin(t*5.5);camera.updateProjectionMatrix();}
function limb(col,r){const m=new THREE.Mesh(new THREE.BufferGeometry(),toon(col)),o=new THREE.Mesh(new THREE.BufferGeometry(),OUTM);m.castShadow=true;scene.add(m,o);
 return {m,o,set(a,b,bend,wob=0,ph=0,rr){const n=wob?14:4,d=b.clone().sub(a),pts=[];for(let i=0;i<=n;i++){const u=i/n,p=a.clone().addScaledVector(d,u),s=Math.sin(Math.PI*u);if(bend)p.addScaledVector(bend,s);if(wob)p.y+=s*wob*Math.sin(u*Math.PI*5+ph);pts.push(p);}
  const c=new THREE.CatmullRomCurve3(pts);m.geometry.dispose();o.geometry.dispose();m.geometry=new THREE.TubeGeometry(c,n*5,rr||r,8);o.geometry=new THREE.TubeGeometry(c,n*5,(rr||r)+.035,8);},vis(v){m.visible=o.visible=v;}};}
function faceTex(kind){const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,1024,512);x.lineCap='round';x.strokeStyle='#17110f';x.fillStyle='#17110f';const cx=256,cy=250;
 if(kind=='laugh'){x.lineWidth=14;for(const s of [-1,1]){x.beginPath();x.arc(cx+s*56,cy-4,30,Math.PI*1.1,Math.PI*1.9);x.stroke();x.beginPath();x.moveTo(cx+s*96,cy-84);x.lineTo(cx+s*26,cy-70);x.stroke();}x.lineWidth=9;x.fillStyle='#7d111b';x.beginPath();x.moveTo(cx-104,cy+34);x.quadraticCurveTo(cx,cy+52,cx+104,cy+34);x.quadraticCurveTo(cx+96,cy+170,cx,cy+176);x.quadraticCurveTo(cx-96,cy+170,cx-104,cy+34);x.fill();x.stroke();x.fillStyle='#fff';x.beginPath();x.moveTo(cx-92,cy+40);x.quadraticCurveTo(cx,cy+56,cx+92,cy+40);x.lineTo(cx+84,cy+70);x.quadraticCurveTo(cx,cy+86,cx-84,cy+70);x.closePath();x.fill();x.stroke();x.fillStyle='#f4979d';x.beginPath();x.ellipse(cx,cy+148,48,24,0,0,7);x.fill();x.fillStyle='#17110f';}
 else if(kind=='james'){[[-1,1],[1,-1]].forEach(([s])=>{x.beginPath();x.ellipse(cx+s*52,cy-8,24,36,0,0,7);x.fill();x.lineWidth=16;x.beginPath();x.moveTo(cx+s*92,cy-70);x.lineTo(cx+s*22,cy-38);x.stroke();x.fillStyle='#fff';x.beginPath();x.arc(cx+s*52-8,cy-18,8,0,7);x.fill();x.fillStyle='#17110f';});
  x.lineWidth=9;x.fillStyle='#fff';x.beginPath();x.moveTo(cx-98,cy+52);x.quadraticCurveTo(cx,cy+84,cx+100,cy+40);x.quadraticCurveTo(cx+80,cy+130,cx,cy+138);x.quadraticCurveTo(cx-80,cy+130,cx-98,cy+52);x.fill();x.stroke();
  x.lineWidth=5;x.beginPath();x.moveTo(cx-86,cy+84);x.quadraticCurveTo(cx,cy+112,cx+90,cy+76);for(const d of [-50,-16,18,52]){x.moveTo(cx+d,cy+66);x.lineTo(cx+d,cy+132);}x.stroke();}
 else{x.lineWidth=7;x.fillStyle='#fff';x.beginPath();x.moveTo(cx-98,cy);x.quadraticCurveTo(cx-52,cy-34,cx-6,cy);x.quadraticCurveTo(cx-52,cy+36,cx-98,cy);x.fill();x.stroke();x.fillStyle='#17110f';x.beginPath();x.arc(cx-44,cy,18,0,7);x.fill();
  x.lineWidth=16;x.beginPath();x.moveTo(cx-104,cy-38);x.lineTo(cx-2,cy-12);x.stroke();x.lineWidth=11;x.beginPath();x.moveTo(cx+28,cy+2);x.quadraticCurveTo(cx+66,cy,cx+100,cy-22);x.stroke();x.lineWidth=7;x.beginPath();x.moveTo(cx+72,cy-90);x.quadraticCurveTo(cx+60,cy,cx+66,cy+80);x.stroke();
  x.lineWidth=8;x.beginPath();x.moveTo(cx-40,cy+92);x.lineTo(cx+40,cy+86);x.stroke();}
 x.fillStyle='rgba(244,151,157,.8)';for(const s of [-1,1]){x.beginPath();x.ellipse(cx+s*112,cy+48,22,13,0,0,7);x.fill();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function swordMesh(col){const g=new THREE.Group();add(g,new THREE.BoxGeometry(.09,2.0,.025),toon(0xf2f6f8),[0,1.12,0],{ol:.0});const o=new THREE.Mesh(new THREE.BoxGeometry(.15,2.06,.05),OUTM);o.position.y=1.12;g.add(o);
 add(g,new THREE.CylinderGeometry(.17,.17,.05,12),toon(0xf0b429),[0,.1,0],{ol:.12});add(g,new THREE.CylinderGeometry(.055,.055,.5,8),toon(col),[0,-.16,0],{ol:.25});add(g,new THREE.SphereGeometry(.075,8,8),toon(0xf0b429),[0,-.42,0],{ol:.2});
 const glow=new THREE.Mesh(new THREE.BoxGeometry(.3,2.2,.2),new THREE.MeshBasicMaterial({color:0x8dff78,transparent:true,opacity:0,depthWrite:false}));glow.position.y=1.12;g.add(glow);g.glow=glow;return g;}
function mk(kind){const J=kind=='james';const g=new THREE.Group();scene.add(g);const b=new THREE.Group();g.add(b);
 const blk=toon(0x262223),gold=toon(0xf3a91e),brn=toon(0x7a4a22),skin=toon(0xffffff);
 const top=J?skin:toon(0x4d7024);
 // muskulöser Oberkörper (V-Form), Brust, Nacken
 add(b,new THREE.CylinderGeometry(.66,.42,1.25,18),top,[0,.6,0],{s:[1,1,.74]});
 for(const s of [-1,1])add(b,new THREE.SphereGeometry(.31,14,12),top,[s*.27,.9,.3],{s:[1,.78,.6],ol:.04});
 if(J){for(let i=0;i<3;i++)for(const s of [-1,1])add(b,new THREE.SphereGeometry(.12,10,8),top,[s*.13,.5-i*.2,.36],{s:[1,.75,.5],ol:.05});}
 add(b,new THREE.CylinderGeometry(.14,.2,.4,10),skin,[0,1.36,0]);
 // Umhang + Federn/Pelz
 const capeC=J?0x8f1521:0x44691d,flC=J?[0xd5231b,0xb81c16]:[0x7fb832,0x6aa226];const T0=.35*Math.PI,TL=1.3*Math.PI;
 add(b,new THREE.CylinderGeometry(.66,1.24,2.3,20,1,true,T0,TL),toon(capeC,{side:THREE.DoubleSide}),[0,-.05,0],{ol:0});{const k=new THREE.Mesh(new THREE.CylinderGeometry(.71,1.3,2.36,20,1,true,T0,TL),OUTM);k.position.y=-.05;b.add(k);}
 const fl=(x,y,z,dir,i)=>{const h=J?.62:.42,c=add(b,new THREE.ConeGeometry(J?.24:.21,h,5),toon(flC[i%2]),[x,y,z],{ol:.1});c.quaternion.setFromUnitVectors(V(0,1,0),dir.normalize());};
 let fi=0;for(const th of [T0,T0+TL])for(let k=0;k<11;k++){const u=k/10,r=.7+.56*u,y=1.1-2.3*u,sx=Math.sin(th),sz=Math.cos(th);for(const o of [0,.22]){fl(sx*(r+o*.3)+ (th==T0?-1:1)*-o*.5*sz*0, y, sz*(r+o*.3)+o, V(sx*.7,-.5,sz*.7+.5),fi++);}}
 for(let k=0;k<=16;k++){const th=T0+TL*k/16;fl(Math.sin(th)*1.24,-1.18,Math.cos(th)*1.24,V(Math.sin(th),-.9,Math.cos(th)),fi++);}
 for(let k=0;k<12;k++){const th=6.283*k/12;if(Math.cos(th)>.55)continue;fl(Math.sin(th)*.62,1.16,Math.cos(th)*.5,V(Math.sin(th),.35,Math.cos(th)),fi++);fl(Math.sin(th)*.75,1.02,Math.cos(th)*.62,V(Math.sin(th),-.2,Math.cos(th)),fi++);}
 // Hüfte
 const thigh=toon(J?0x3f2c22:0x262223);for(const s of [-1,1])add(b,new THREE.SphereGeometry(.34,12,10),thigh,[s*.24,-.5,0],{s:[1,1.45,1.1]});
 if(J){add(b,new THREE.CylinderGeometry(.47,.47,.34,16),blk,[0,.0,0],{s:[1,1,.8]});add(b,new THREE.CylinderGeometry(.49,.49,.13,16),gold,[0,.0,0],{s:[1,1,.8],ol:0});add(b,new THREE.BoxGeometry(.34,.3,.1),gold,[0,0,.4]);add(b,new THREE.BoxGeometry(.2,.16,.12),toon(0xc98512),[0,0,.42],{ol:0});
  add(b,new THREE.CylinderGeometry(.48,.74,.5,12,1,true),toon(0xdba660,{side:THREE.DoubleSide}),[0,-.42,0],{s:[1,1,.85],ol:0});add(b,new THREE.BoxGeometry(.46,.62,.06),brn,[0,-.5,.6],{r:[-.25,0,0]});
  for(const p of [[-.1,-.38],[.1,-.38],[0,-.56]])add(b,new THREE.SphereGeometry(.05,8,8),gold,[p[0],p[1],.66+(-.38-p[1])*-.25],{ol:.2});
  add(b,new THREE.BoxGeometry(.13,1.55,.06),brn,[0,.68,.47],{r:[0,0,.75]});add(b,new THREE.BoxGeometry(.24,.24,.09),gold,[0,.68,.5],{r:[0,0,.75]});
  for(const s of [-1,1])add(b,new THREE.CylinderGeometry(.11,.11,.05,12),gold,[s*.5,1.08,.36],{r:[Math.PI/2,0,0]});}
 else{add(b,new THREE.CylinderGeometry(.44,.62,.5,12,1,true),toon(0x4d7024,{side:THREE.DoubleSide}),[0,-.38,0],{s:[1,1,.85],ol:0});add(b,new THREE.CylinderGeometry(.47,.47,.2,16),brn,[0,.02,0],{s:[1,1,.8]});add(b,new THREE.BoxGeometry(.3,.28,.1),gold,[0,.02,.4]);add(b,new THREE.BoxGeometry(.16,.14,.12),toon(0xc98512),[0,.02,.42],{ol:0});
  add(b,new THREE.BoxGeometry(.22,.24,.14),brn,[-.32,-.2,.36]);add(b,new THREE.BoxGeometry(.08,.5,.04),gold,[.26,-.25,.44]);
  for(let i=0;i<2;i++)add(b,new THREE.BoxGeometry(.3,.03,.03),toon(0x6e431f),[0,1.0-i*.14,.47],{r:[0,0,i?.5:-.5],ol:0});
  const back=swordMesh(0x262223);back.scale.setScalar(.85);back.position.set(-.1,.2,-.75);back.rotation.set(0,0,2.5);b.add(back);}
 // Kopf
 const head=new THREE.Group();head.position.y=2.02;b.add(head);
 const hm=new THREE.MeshToonMaterial({map:faceTex(kind),gradientMap:gm});add(head,new THREE.SphereGeometry(.6,32,24),hm,[0,0,0],{ol:.04});
 const hc=toon(J?0x1d191a:0x2f8f3c);const rr=i=>{const x=Math.sin(i*91.7)*43758.5;return x-Math.floor(x);};
 let acc=0;for(let i=0;acc<(J?34:44)&&i<600;i++){const th=rr(i)*6.283,el=-.45+rr(i+200)*1.95;const d=V(Math.sin(th)*Math.cos(el),Math.sin(el),Math.cos(th)*Math.cos(el));if(!(d.z<-.05||d.y>.78))continue;if(!J&&d.y<-.1)continue;if(J&&d.y>.4)continue;acc++;
  const len=J?.5+rr(i+3)*.4:.26+rr(i+3)*.14;const c=add(head,new THREE.ConeGeometry(J?.2:.17,len,5),hc,[d.x*(.58+len*.4),d.y*(.58+len*.4),d.z*(.58+len*.4)],{ol:.12});c.quaternion.setFromUnitVectors(V(0,1,0),d);}
 for(let i=0;i<6;i++){const a=(-.4+i*.16)*Math.PI,d=V(Math.sin(a)*.62,.7,Math.cos(a)*.42).normalize();const c=add(head,new THREE.ConeGeometry(.15,J?.34:.24,5),hc,[d.x*.63,d.y*.63,d.z*.63],{ol:.12});c.quaternion.setFromUnitVectors(V(0,1,0),V(d.x*.4,-1,.25).normalize());}
 add(head,new THREE.SphereGeometry(.635,20,12,0,6.3,0,1.45),hc,[0,0,0],{ol:.03,r:[-.62,0,0]});
 if(J){const hat=new THREE.Group();hat.position.y=.42;hat.rotation.set(-.12,0,.08);head.add(hat);const st=toon(0xe9c35c);add(hat,new THREE.CylinderGeometry(1.2,1.25,.07,28),st,[0,0,0],{ol:.03});add(hat,new THREE.SphereGeometry(.62,20,12,0,6.3,0,1.6),st,[0,.02,0],{s:[1,.95,1],ol:.04});add(hat,new THREE.CylinderGeometry(.64,.65,.16,24),blk,[0,.12,0],{ol:0});add(hat,new THREE.CylinderGeometry(.655,.655,.04,24),gold,[0,.17,0],{ol:0});}
 const mark=(x,y,z)=>{const o=new THREE.Object3D();o.position.set(x,y,z);b.add(o);return o;};
 const armC=J?0xffffff:0x4d7024,legC=J?0x3a2a25:0x262223;
 const c={kind,g,b,head,hm,sh:[mark(-.74,1.05,0),mark(.74,1.05,0)],hip:[mark(-.24,-.75,0),mark(.24,-.75,0)],arm:[limb(armC,.15),limb(armC,.15)],leg:[limb(legC,.15),limb(legC,.15)],hand:[],foot:[],cuff:[],brace:[]};
 for(let i=0;i<2;i++){c.hand.push(add(scene,new THREE.SphereGeometry(.21,14,12),skin,[0,0,0],{ol:.1}));
  const cf=add(scene,new THREE.SphereGeometry(.3,14,12),J?skin:blk,[0,0,0],{ol:.07});if(!J){cf.scale.set(1.25,1,1.15);add(cf,new THREE.TorusGeometry(.3,.035,6,16),gold,[0,-.06,0],{r:[Math.PI/2,0,0],ol:0});for(let k=0;k<3;k++)add(cf,new THREE.SphereGeometry(.035,6,6),gold,[(k-1)*.16,.24,.12],{ol:0});}c.cuff.push(cf);
  if(!J){const br=new THREE.Group();scene.add(br);add(br,new THREE.CylinderGeometry(.19,.2,.5,10),toon(0x6e431f),[0,0,0],{ol:.08});for(const y of [-.22,.22])add(br,new THREE.CylinderGeometry(.21,.21,.06,10),gold,[0,y,0],{ol:0});c.brace.push(br);}
  const f=new THREE.Group();scene.add(f);
  if(J){add(f,new THREE.BoxGeometry(.36,.34,.7),toon(0x4b342b),[0,.17,.12],{ol:.08});add(f,new THREE.CylinderGeometry(.2,.19,.6,10),toon(0x4b342b),[0,.6,-.02],{ol:.08});add(f,new THREE.CylinderGeometry(.28,.26,.2,10),toon(0xdba660),[0,.9,-.02],{ol:.08});}
  else{add(f,new THREE.BoxGeometry(.36,.3,.7),toon(0x1b1819),[0,.15,.12],{ol:.08});add(f,new THREE.CylinderGeometry(.25,.25,.75,10),toon(0x167a6c),[0,.7,-.02],{ol:.07});for(const y of [.36,1.06])add(f,new THREE.CylinderGeometry(.3,.3,.13,10),toon(0x1e9483),[0,y,-.02],{ol:.07});for(const y of [.55,.85])add(f,new THREE.TorusGeometry(.255,.02,5,14),toon(0x5a3519),[0,y,-.02],{r:[Math.PI/2+.5,0,0],ol:0});}
  c.foot.push(f);}
 return c;}
const Jm=mk('james'),Ed=mk('eddy');
function mats(c){const s=new Map();const ad=o=>o.traverse(m=>{if(m.isMesh&&m.material!==OUTM&&m.material.color&&!m.material.map)s.set(m.material,m.material.color.clone());});ad(c.g);c.arm.concat(c.leg).forEach(l=>ad(l.m));c.hand.concat(c.cuff,c.foot).forEach(ad);return s;}
const JM=mats(Jm),JF={n:Jm.hm.map,l:faceTex('laugh')};function whiten(w){JM.forEach((o,m)=>m.color.copy(o).lerp(WH,w));}
const swords=[swordMesh(0xf4f4f4),swordMesh(0x6d3bb5)];swords.forEach(s=>scene.add(s));
const gatA=[],gatF=[];for(let i=0;i<6;i++){gatA.push(limb(0xffffff,.12));gatF.push(add(scene,new THREE.SphereGeometry(.24,12,10),toon(0xffffff),[0,0,0],{ol:.12}));}
// Effekte
const fxM=(c,o=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,side:THREE.DoubleSide,fog:false});
const sparks=[];for(let i=0;i<90;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.06,.5,.06),fxM(0xffd23f));scene.add(m);sparks.push(m);}
const balls=[];for(let i=0;i<6;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),fxM(0xffffff));scene.add(m);balls.push(m);}
const dusts=[];for(let i=0;i<40;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),fxM(0xe9d2a6,.8));scene.add(m);dusts.push(m);}
const rings=[];for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.86,1,48),fxM(0xffffff));m.rotation.x=-Math.PI/2;scene.add(m);rings.push(m);}
const arcs=[];for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(1,.16,6,32,Math.PI*1.1),fxM(0x8dff78));m.scale.z=.15;scene.add(m);arcs.push(m);}
const aura=[new THREE.Mesh(new THREE.SphereGeometry(1.9,20,14),fxM(0xff5a3c,0)),new THREE.Mesh(new THREE.SphereGeometry(1.9,20,14),fxM(0x7dff6a,0))];aura.forEach(a=>scene.add(a));
const pl=[new THREE.PointLight(0xff5a3c,0,12),new THREE.PointLight(0x7dff6a,0,12)];pl.forEach(p=>scene.add(p));
let nS=0,nB=0,nD=0;const rnd=i=>{const x=Math.sin(i*127.1)*43758.5453;return x-Math.floor(x);};
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,eo=u=>1-Math.pow(1-u,3),ei=u=>u*u;
function kf(t,k,fn=ease){if(t<=k[0][0])return k[0][1];for(let i=1;i<k.length;i++)if(t<=k[i][0]){const u=fn((t-k[i-1][0])/(k[i][0]-k[i-1][0])),a=k[i-1][1],b=k[i][1];return Array.isArray(a)?a.map((v,j)=>v+(b[j]-v)*u):a+(b-a)*u;}return k[k.length-1][1];}
const A=a=>V(a[0],a[1],a[2]);
function burst(c,t0,t,n,R,seed,col,d=.32){const u=(t-t0)/d;if(u<0||u>1)return;for(let i=0;i<n&&nS<sparks.length;i++){const m=sparks[nS++];const dir=V(rnd(seed+i)-.5,rnd(seed+i+40)-.3,rnd(seed+i+80)-.5).normalize();m.position.copy(c).addScaledVector(dir,R*(.15+.85*eo(u))*(.5+rnd(seed+i+7)));m.quaternion.setFromUnitVectors(V(0,1,0),dir);m.scale.set(1+R*.3,(1-u)*(1+R*.6)+.1,1+R*.3);m.material.color.set(col);m.material.opacity=1-u*u;m.visible=true;}
 if(nB<balls.length){const m=balls[nB++];m.position.copy(c);m.scale.setScalar(R*.55*(.4+u*.8));m.material.opacity=(1-u)*.95;m.visible=true;}}
function puff(c,t0,t,n,sp,seed){const u=(t-t0)/.9;if(u<0||u>1)return;for(let i=0;i<n&&nD<dusts.length;i++){const m=dusts[nD++];const a=rnd(seed+i)*6.283;m.position.set(c.x+Math.cos(a)*sp*eo(u)*(.4+rnd(seed+i+3)),.25+u*.9*rnd(seed+i+5),c.z+Math.sin(a)*sp*.6*eo(u));m.scale.setScalar((.3+.5*rnd(seed+i+9))*(.6+u));m.material.opacity=.8*(1-u);m.visible=true;}}
function pose(c,p){c.g.position.set(p.x,p.y||0,p.z||0);c.g.rotation.y=p.yaw;c.b.position.y=p.hip==null?1.95:p.hip;c.b.rotation.x=p.lean||0;c.b.rotation.z=p.roll||0;c.head.rotation.x=-(p.lean||0)*.6+(p.nod||0);c.head.rotation.y=p.look||0;c.g.updateMatrixWorld(true);
 const fw=V(Math.sin(p.yaw),0,Math.cos(p.yaw));
 for(let i=0;i<2;i++){const s=i?1:-1,sh=c.sh[i].getWorldPosition(V()),hp=c.hip[i].getWorldPosition(V());
  const tuck=p.tuck||0;const ft=p.f&&p.f[i]?p.f[i]:c.g.localToWorld(V(s*(.3+(p.wide||0)),.0+tuck*(i?1.1:.7),(p.step?p.step[i]:0)-tuck*.3));
  c.foot[i].position.copy(ft);c.foot[i].rotation.set(tuck*.6,p.yaw,0);const an=ft.clone();an.y+=.4;c.leg[i].set(hp,an,fw.clone().multiplyScalar(.22));
  const h=p.h[i];c.cuff[i].position.copy(sh);if(!p.hideArm||!p.hideArm[i]){c.arm[i].vis(true);c.hand[i].visible=true;c.arm[i].set(sh,h,p.bend?p.bend[i]:V(0,-.15,0),p.wob?p.wob[i]:0,p.ph||0);c.hand[i].position.copy(h);c.hand[i].scale.setScalar(p.fist?p.fist[i]:1);if(c.brace[i]){const dv=h.clone().sub(sh);c.brace[i].position.copy(sh).addScaledVector(dv,.74);c.brace[i].quaternion.setFromUnitVectors(V(0,1,0),dv.normalize());}}else{c.arm[i].vis(false);c.hand[i].visible=false;}}}
function side(c,p,i,dx,dy,dz){c.g.position.set(p.x,p.y||0,p.z||0);c.g.rotation.y=p.yaw;c.b.position.y=p.hip==null?1.95:p.hip;c.b.rotation.x=p.lean||0;c.g.updateMatrixWorld(true);return c.b.localToWorld(V(dx,dy,dz));}
function render(t){whiten(0);worldFx(t,0,0,0);Jm.hm.map=JF.n;Jm.g.scale.set(1,1,1);Ed.g.scale.set(1,1,1);nS=nB=nD=0;sparks.concat(balls,dusts,rings,arcs).forEach(m=>m.visible=false);
 const br=Math.sin(t*5)*.02;
 // ---------- James ----------
 const j={x:kf(t,[[0,-2.5],[3.4,-2.5],[3.8,-2.9],[4.3,-2.6],[6.0,-2.6],[6.6,-2.9],[7.3,-2.5],[7.6,-2.8],[8.3,-3.1],[10,-3.1]]),y:kf(t,[[0,0],[3.62,0],[4.15,3.6],[5.0,4.0],[5.85,3.6],[6.3,0]]),
  yaw:Math.PI/2-.55,lean:kf(t,[[0,0],[1.2,0],[2.1,-.28],[2.36,.3],[2.9,0],[3.5,0],[3.62,.25],[4.1,-.2],[5.9,.25],[6.3,0],[6.45,0],[7.05,-.3],[7.35,.35],[8.1,0],[10,0]]),
  hip:1.95+br+kf(t,[[0,0],[3.45,0],[3.6,-.45],[3.8,0],[6.28,0],[6.4,-.5],[6.7,0],[10,0]]),tuck:kf(t,[[0,0],[3.7,0],[4.1,.5],[5.9,.5],[6.25,0]]),wide:.08};
 const rest=i=>side(Jm,j,i,(i?1:-1)*1.02,-.25,.25);
 j.h=[rest(0),rest(1)];j.fist=[1,1];j.wob=[0,0];j.bend=[V(0,-.2,0),V(0,-.2,0)];j.ph=t*20;
 if(t>=1.2&&t<2.1){j.h[1]=A(kf(t,[[1.2,rest(1).toArray()],[2.1,[-13,2.6,.3]]],eo));j.wob[1]=.12*Math.sin(t*30);}
 else if(t>=2.1&&t<2.36){j.h[1]=A(kf(t,[[2.1,[-13,2.6,.3]],[2.36,[1.25,2.5,.1]]],ei));j.bend[1]=V();}
 else if(t>=2.36&&t<2.5){j.h[1]=V(1.25+rnd(t*90)*.06,2.5,.1);j.bend[1]=V();}
 else if(t>=2.5&&t<3.4){const u=(t-2.5)/.9;j.h[1]=A(kf(t,[[2.5,[1.25,2.5,.1]],[3.4,rest(1).toArray()]],eo));j.wob[1]=.6*(1-u)*Math.sin(t*38);j.bend[1]=V();}
 else if(t>=6.45&&t<7.1){const u=(t-6.45)/.65;j.h[1]=A(kf(t,[[6.45,rest(1).toArray()],[7.1,[-7.5,3.4,.4]]],eo));j.fist[1]=1+5.5*eo(u);j.wob[1]=.1*Math.sin(t*30);}
 else if(t>=7.1&&t<7.35){j.h[1]=A(kf(t,[[7.1,[-7.5,3.4,.4]],[7.35,[-.55,2.5,.1]]],ei));j.fist[1]=6.5;j.bend[1]=V();}
 else if(t>=7.35&&t<7.65){j.h[1]=V(-.55+rnd(t*77)*.1,2.5+rnd(t*31)*.08,.1);j.fist[1]=6.5;j.bend[1]=V();}
 else if(t>=7.65&&t<8.5){const u=(t-7.65)/.85;j.h[1]=A(kf(t,[[7.65,[-.55,2.5,.1]],[8.5,rest(1).toArray()]],eo));j.fist[1]=6.5-5.5*eo(u);j.wob[1]=.5*(1-u)*Math.sin(t*36);j.bend[1]=V();}
 const gat=t>=4.5&&t<5.95;j.hideArm=[gat,gat];pose(Jm,j);
 for(let k=0;k<6;k++){gatA[k].vis(gat);gatF[k].visible=gat;if(gat){const u=((t-4.5)/.3+k/6)%1,e=u<.45?u/.45:1-(u-.45)/.55;const s0=Jm.sh[k%2].getWorldPosition(V());const tg=V(1.3+rnd(k)*.9,1.6+rnd(k+3)*1.9,(rnd(k+6)-.5)*1.4);const h=s0.clone().lerp(tg,e);gatA[k].set(s0,h,V());gatF[k].position.copy(h);gatF[k].scale.setScalar(1+.6*e);}}
 // ---------- Eddy ----------
 const e={x:kf(t,[[0,2.5],[2.36,2.5],[2.62,3.3],[3.3,3.1],[3.9,-.9],[4.3,-.6],[4.62,2.5],[6.1,2.5],[7.0,2.8],[7.3,2.1],[7.6,2.6],[8.3,3.1],[10,3.1]]),y:kf(t,[[0,0],[4.3,0],[4.45,.9],[4.62,0],[10,0]]),yaw:-Math.PI/2+.55,
  lean:kf(t,[[0,0],[2.36,0],[2.5,-.25],[3.0,0],[3.3,.15],[3.8,.45],[4.3,.1],[4.62,0],[4.7,-.15],[5.9,-.15],[6.2,0],[7.0,-.2],[7.3,.4],[8.1,0],[10,0]]),
  hip:1.95-br+kf(t,[[0,0],[3.2,0],[3.4,-.35],[4.3,-.25],[4.62,0],[6.2,0],[6.9,-.4],[7.3,-.1],[7.7,0],[10,0]]),wide:.12,step:[kf(t,[[0,0],[3.3,0],[3.8,.6],[4.3,0],[10,0]]),kf(t,[[0,0],[3.3,0],[3.8,-.5],[4.3,0],[10,0]])]};
 const eh=(dx,dy,dz)=>side(Ed,e,0,dx,dy,dz);const dr=cl((t-.45)/.5);
 let h=[eh(-1.02,-.2+.5*dr,.25+.5*dr),eh(1.02,-.2+.5*dr,.25+.5*dr)],d=[V(-.25,1,.25),V(.25,1,.25)]; // Schwertrichtungen (Körper-lokal, wird unten gedreht)
 const L=(a,b,u)=>a.clone().lerp(b,u);
 if(t>=2.0&&t<3.2){const m=cl((t-2.0)/.3)*(1-cl((t-2.8)/.4));h[0]=L(h[0],eh(-.25,.75,.95),m);h[1]=L(h[1],eh(.25,.7,.9),m);d[0]=L(d[0],V(.75,.9,.1),m);d[1]=L(d[1],V(-.75,.9,.1),m);}
 if(t>=3.2&&t<4.62){const u=cl((t-3.2)/.5),sw=cl((t-3.7)/.4),bk=cl((t-4.3)/.3);h[0]=L(L(h[0],eh(.9,.9,.2),u),eh(-1.1,.3,.9),sw);h[0]=L(h[0],eh(-.85,.3,.75),bk);d[0]=L(L(d[0],V(1,.3,-.3),u),V(-1,-.1,.5),sw);d[0]=L(d[0],V(-.25,1,.25),bk);h[1]=L(L(h[1],eh(1.1,.6,-.2),u),eh(.2,.4,1.0),sw);h[1]=L(h[1],eh(.85,.3,.75),bk);d[1]=L(L(d[1],V(1,.5,-.5),u),V(-.9,.2,.6),sw);d[1]=L(d[1],V(.25,1,.25),bk);}
 if(t>=4.62&&t<6.1){const w=cl((t-4.62)/.15)*(1-cl((t-5.95)/.15));h[0]=L(h[0],eh(-.5,1.5,.6),w);h[1]=L(h[1],eh(.5,1.6,.6),w);d[0]=L(d[0],V(.9*Math.sin(t*42),1,.5+.3*Math.cos(t*42)),w);d[1]=L(d[1],V(.9*Math.sin(t*37+1),1,.5+.3*Math.cos(t*33)),w);}
 let glow=0;
 if(t>=6.2&&t<7.0){const u=eo((t-6.2)/.8);h[0]=L(h[0],eh(-.9,.9,-.5),u);h[1]=L(h[1],eh(.9,.9,-.5),u);d[0]=L(d[0],V(-.6,.5,-1),u);d[1]=L(d[1],V(.6,.5,-1),u);glow=u;}
 if(t>=7.0&&t<7.65){const u=ei(cl((t-7.0)/.3));h[0]=L(eh(-.9,.9,-.5),eh(.5,.2,1.3),u);h[1]=L(eh(.9,.9,-.5),eh(-.5,.3,1.3),u);d[0]=L(V(-.6,.5,-1),V(.9,-.5,.6),u);d[1]=L(V(.6,.5,-1),V(-.9,-.5,.6),u);glow=1;}
 if(t>=7.65&&t<8.6){const u=eo((t-7.65)/.95);h[0]=L(eh(.5,.2,1.3),eh(-.85,-.3,.3),u);h[1]=L(eh(-.5,.3,1.3),eh(.85,-.3,.3),u);d[0]=L(V(.9,-.5,.6),V(-.3,-1,.4),u);d[1]=L(V(-.9,-.5,.6),V(.3,-1,.4),u);glow=1-u;}
 if(t>=8.6){h=[eh(-.85,-.3,.3),eh(.85,-.3,.3)];d=[V(-.3,-1,.4),V(.3,-1,.4)];}
 e.h=h;e.bend=[V(0,-.12,0),V(0,-.12,0)];pose(Ed,e);
 for(let i=0;i<2;i++){const s=swords[i];s.visible=t>.45;s.position.copy(h[i]);const wd=d[i].clone().normalize().transformDirection(Ed.b.matrixWorld);s.quaternion.setFromUnitVectors(V(0,1,0),wd);s.glow.material.opacity=.45*glow;}
 // ---------- Effekte ----------
 burst(V(1.3,2.5,.3),2.36,t,16,2.2,1,0xffd23f);
 if(t>=3.7&&t<4.3){const u=(t-3.7)/.6,m=arcs[0];m.visible=true;m.position.set(e.x-.3,1.5,0);m.rotation.set(Math.PI/2,0,2.2-u*1.2);m.scale.set(2.6+u,2.6+u,.5);m.material.opacity=1-u;}
 if(gat)for(let i=0;i<11;i++)burst(V(1.5+rnd(i)*.8,2+rnd(i+20)*1.6,.6+(rnd(i+5)-.5)),4.6+i*.125,t,5,.9,i*13,i%2?0xffd23f:0xffffff,.22);
 puff(V(j.x,0,0),6.3,t,10,2.2,1);puff(V(e.x,0,0),4.62,t,6,1.3,30);puff(V(e.x+1,0,0),3.4,t,6,1.6,60);
 const ch=cl((t-6.2)/.8)*(t<7.35?1:0);aura[0].position.set(j.x,2.3,0);aura[1].position.set(e.x,2.3,0);aura.forEach((a,i)=>{a.material.opacity=.1*ch;a.scale.setScalar(1+.08*Math.sin(t*30+i));});pl[0].position.set(j.x,2.5,1.5);pl[1].position.set(e.x,2.5,1.5);pl.forEach(p=>p.intensity=18*ch);
 if(t>=7.28&&t<7.75){const u=(t-7.28)/.47;for(let i=0;i<2;i++){const m=arcs[1+i];m.visible=true;m.position.set(.7,2.4,.5);m.rotation.set(0,0,(i?.25:-.75)*Math.PI-.55*Math.PI+0);m.rotation.set((i?1:-1)*.6,0,Math.PI*.45+(i?.3:-.3));m.scale.set(1.3+u,1.3+u,.4);m.material.opacity=.85*(1-u);}}
 burst(V(0,2.5,.4),7.35,t,34,5.5,7,0xffd23f,.5);burst(V(0,2.5,.4),7.42,t,24,4.5,99,0xffffff,.45);
 for(let k=0;k<3;k++){const u=(t-7.35-k*.14)/.9;if(u>0&&u<1){const m=rings[k];m.visible=true;m.position.set(0,.06+k*.02,0);m.scale.setScalar(1+13*eo(u));m.material.opacity=1-u;}}
 puff(V(0,0,0),7.4,t,18,6,90);
 // ---------- Kamera ----------
 const cp=kf(t,[[0,[5,7.5,15]],[1.2,[0,2.6,12.6]],[2.0,[-1.2,2.5,12.2]],[2.4,[1.2,2.3,11.2]],[3.2,[.6,2.2,12.4]],[4.1,[1.5,1.2,12.6]],[5.2,[4.6,1.0,11.6]],[6.0,[3.6,1.6,12.4]],[6.5,[0,2.4,13.2]],[7.2,[0,2.2,11.2]],[7.5,[0,2.6,13.4]],[8.4,[0,2.8,13]],[10,[-5.5,3.6,12]]]);
 const cq=kf(t,[[0,[0,2.4,0]],[1.2,[0,2.4,0]],[3.2,[0,2.3,0]],[4.1,[-.4,3.2,0]],[5.2,[-.3,3.4,0]],[6.0,[0,2.8,0]],[6.5,[0,2.4,0]],[10,[0,2.3,0]]]);
 let sh=0;[[2.36,.35,.28],[6.3,.25,.14],[7.35,.75,.6]].forEach(([t0,dd,a])=>{const u=(t-t0)/dd;if(u>=0&&u<1)sh=Math.max(sh,a*(1-u));});if(gat)sh=Math.max(sh,.06);
 camera.position.set(cp[0]+(rnd(t*61)-.5)*2*sh,cp[1]+(rnd(t*47)-.5)*2*sh,cp[2]);camera.lookAt(cq[0],cq[1],cq[2]);
 renderer.render(scene,camera);
 // ---------- Overlay ----------
 const fl=Math.max(t>=2.36?1-(t-2.36)/.12:0,t>=7.33?1-(t-7.33)/.35:0);document.getElementById('flash').style.opacity=cl(fl)*(t>7?1:.55);
 document.getElementById('title').style.opacity=cl(t/.25)*(1-cl((t-1.0)/.3));const u=eo(cl((t-8.9)/.3));const en=document.getElementById('end');en.style.opacity=u;en.style.transform='translateX(-50%) rotate(-6deg) scale('+(2-u)+')';
}

// ---------- Verwandlung: James lacht, wird weiß, die Welt wird weiß und elastisch (0–6 s) ----------
function render2(t){nS=nB=nD=0;sparks.concat(balls,dusts,rings,arcs,gatF).forEach(m=>m.visible=false);gatA.forEach(a=>a.vis(false));pl.forEach(l=>l.intensity=0);
 const lach=cl((t-.3)/.5),w=ease(cl((t-1.5)/1.3)),w2=ease(cl((t-3.0)/1.4)),el=ease(cl((t-3.2)/1.2));
 Jm.hm.map=lach>.2?JF.l:JF.n;whiten(w);worldFx(t,w2,el,-1.6);
 const sh=Math.sin(t*24)*lach,bo=Math.abs(Math.sin(t*9))*el;
 const j={x:-1.6,y:bo*.9,yaw:.45,lean:-.22*lach+.05*sh,nod:-.3*lach+.1*sh,hip:1.95+.06*sh-.25*el*(1-Math.abs(Math.sin(t*9))),wide:.14,tuck:bo*.25};
 const hd=(dx,dy,dz)=>side(Jm,j,0,dx,dy,dz);j.h=[hd(-1.02+.5*lach-1.2*el,-.25+.35*lach+1.9*el+.05*sh,.25+.35*lach),hd(1.02-.5*lach+1.2*el,-.25+.35*lach+1.9*el-.05*sh,.25+.35*lach)];j.wob=[.25*el*Math.sin(t*14),.25*el*Math.cos(t*14)];j.ph=t*18;j.bend=[V(0,-.2,0),V(0,-.2,0)];
 pose(Jm,j);const sq=1+.16*el*Math.sin(t*9);Jm.g.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));
 const back=cl((t-1.6)/1.2);const e={x:2.3+.9*back,y:0,yaw:-1.0,lean:-.18*back,hip:1.95-.15*back,wide:.14,step:[-.3*back,.3*back]};const eh=(dx,dy,dz)=>side(Ed,e,0,dx,dy,dz);
 e.h=[eh(-.25-.3*(1-back),.75*back-.2*(1-back),.95),eh(.25+.3*(1-back),.7*back-.2*(1-back),.9)];e.bend=[V(0,-.12,0),V(0,-.12,0)];pose(Ed,e);Ed.g.scale.set(1-.05*el*Math.sin(t*7),1+.07*el*Math.sin(t*7),1);
 const d=[V(.75-.9*(1-back),.9,.1),V(-.75+.9*(1-back),.9,.1)];for(let i=0;i<2;i++){const s=swords[i];s.visible=true;s.position.copy(e.h[i]);s.quaternion.setFromUnitVectors(V(0,1,0),d[i].clone().normalize().transformDirection(Ed.b.matrixWorld));s.glow.material.opacity=0;}
 // weißes Leuchten + Dampfwolken während der Verwandlung
 aura[0].position.set(j.x,2.4,0);aura[0].material.color.set(0xffffff);aura[0].material.opacity=.35*Math.sin(Math.PI*cl((t-1.4)/1.8));aura[0].scale.setScalar(1+.5*w+.1*Math.sin(t*20));aura[1].material.opacity=0;
 for(let k=0;k<4;k++)puff(V(j.x,0,0),1.5+k*.35,t,7,2.6,k*17);for(let k=0;k<3;k++){const u=(t-2.6-k*.2)/1.1;if(u>0&&u<1){const m=rings[k];m.visible=true;m.position.set(j.x,.08+k*.02,0);m.scale.setScalar(1+16*eo(u));m.material.opacity=1-u;}}
 const cp=kf(t,[[0,[-.2,2.6,10.5]],[1.4,[-1.2,2.8,8.2]],[2.8,[-1.0,2.6,9.2]],[4.2,[.4,3.0,13.5]],[6,[.8,3.4,15.5]]]),cq=kf(t,[[0,[.2,2.4,0]],[1.4,[-1.4,2.9,0]],[2.8,[-1.2,2.7,0]],[4.2,[.3,2.8,0]],[6,[.4,3.0,0]]]);
 camera.position.set(cp[0],cp[1],cp[2]);camera.lookAt(cq[0],cq[1],cq[2]);camera.rotation.z+=.05*el*Math.sin(t*4);renderer.render(scene,camera);}
