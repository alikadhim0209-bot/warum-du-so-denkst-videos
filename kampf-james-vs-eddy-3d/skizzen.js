// Erzeugt Charakterblätter (Standbilder) aus den 3D-Figuren: node skizzen.js
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const THREE_JS=process.env.THREE_JS||require.resolve('three/build/three.min.js');const OUT=path.join(__dirname,'../assets/charakter/skizzen');fs.mkdirSync(OUT,{recursive:true});
const VIEWS={james:[['Vorne',0,''],['Halbprofil',.7,''],['Seite',1.57,''],['Hinten',3.14,''],['Gummischlag',.9,'punch'],['Riesenfaust',.5,'fist']],
 eddy:[['Vorne',0,''],['Halbprofil',-.7,''],['Seite',-1.57,''],['Hinten',3.14,''],['Deckung',-.5,'guard'],['Schwerthieb',-.9,'slash']]};
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']});
const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.setContent('<body style="margin:0;overflow:hidden"><div id="gl"></div></body>');await p.addScriptTag({path:THREE_JS});await p.addScriptTag({path:path.join(__dirname,'scene.js')});
await p.evaluate(()=>{scene.background=new THREE.Color(0xf3e3bf);scene.fog=null;scene.children.forEach(m=>{if(m.isMesh&&m.geometry&&(m.geometry.type=='ConeGeometry'||m.geometry.type=='DodecahedronGeometry'||(m.geometry.type=='SphereGeometry'&&m.geometry.parameters.radius==9)))m.visible=false;if(m.isMesh&&m.geometry.type=='CircleGeometry')m.material.color.set(0xe6d2a4);});
 window.shot=(kind,yaw,act)=>{sparks.concat(balls,dusts,rings,arcs,gatF).forEach(m=>m.visible=false);gatA.forEach(a=>a.vis(false));aura.forEach(a=>a.material.opacity=0);pl.forEach(l=>l.intensity=0);
  const J=kind=='james',c=J?Jm:Ed,o=J?Ed:Jm;const q={x:0,y:0,yaw,lean:0,wide:.1};const hd=(dx,dy,dz)=>side(c,q,0,dx,dy,dz);
  q.h=[hd(-1.02,-.25,.25),hd(1.02,-.25,.25)];let d=[V(-.3,-1,.4),V(.3,-1,.4)],cam=[0,2.5,9.6],look=[0,2.35,0];
  if(act=='punch'){q.lean=.25;q.h=[hd(-.9,.5,-.4),hd(.3,.7,4.6)];q.bend=[V(0,-.2,0),V()];cam=[1.2,2.6,12.5];look=[1.6,2.3,0];}
  if(act=='fist'){q.lean=-.12;q.h=[hd(-1.0,-.2,.3),hd(1.3,1.7,1.4)];q.fist=[1,4.5];cam=[.6,2.8,11.5];look=[.6,2.6,0];}
  if(act=='guard'){q.h=[hd(-.25,.75,.95),hd(.25,.7,.9)];d=[V(.75,.9,.1),V(-.75,.9,.1)];cam=[0,2.8,11];look=[0,2.7,0];}
  if(act=='slash'){q.lean=.4;q.hip=1.6;q.step=[.6,-.5];q.h=[hd(-1.1,.3,.9),hd(.2,.4,1.0)];d=[V(-1,-.1,.5),V(-.9,.2,.6)];cam=[-.6,2.4,11.5];look=[-.8,2.0,0];}
  pose(c,q);pose(o,{x:300,yaw:0,h:[V(300,1,0),V(300,1,0)]});
  swords.forEach((s,i)=>{s.visible=!J;if(!J){s.position.copy(q.h[i]);s.quaternion.setFromUnitVectors(V(0,1,0),d[i].clone().normalize().transformDirection(Ed.b.matrixWorld));s.glow.material.opacity=0;}});
  camera.position.set(...cam);camera.lookAt(...look);renderer.render(scene,camera);};});
for(const k of ['james','eddy']){const imgs=[];for(const [label,yaw,act] of VIEWS[k]){await p.evaluate(([k,y,a])=>shot(k,y,a),[k,yaw,act]);imgs.push([label,(await p.screenshot({type:'jpeg',quality:92})).toString('base64')]);}
 const q=await b.newPage({viewport:{width:1700,height:2120}});
 await q.setContent(`<body style="margin:0;background:#f3e3bf;font-family:Impact,Arial Black,sans-serif;color:#17110f"><div style="font-size:72px;padding:26px 40px 6px">${k=='james'?'JAMES – Federumhang':'EDDY – Pelzumhang'}</div>
 <div style="display:grid;grid-template-columns:repeat(3,540px);gap:10px 20px;padding:0 20px">${imgs.map(([l,d])=>`<div style="position:relative"><img src="data:image/jpeg;base64,${d}" style="width:540px;display:block;border:4px solid #17110f;box-sizing:border-box"><div style="position:absolute;left:14px;top:8px;font-size:34px">${l}</div></div>`).join('')}</div></body>`);
 await q.screenshot({path:path.join(OUT,k+'-3d.png')});await q.close();}
await b.close();console.log('fertig');})();
