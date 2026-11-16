// 3D-Arena-Kampf im Stil eines 3D-Prügelspiels. Braucht scene.js und scene60.js (Figuren, Posen, Effekte).
// renderTK(t) zeichnet Videosekunde t (0–27): Kampf, Zeitlupe beim K.O., Wiederholung, Siegerpose.
const HJ2=[[5.9,7],[6.2,7],[6.55,10],[7.0,6],[7.35,8],[12.0,9],[12.6,10],[12.95,10],[17.9,4],[18.2,4],[18.5,4],[18.8,4],[19.1,4],[19.4,4],[20.2,40]];
const HE2=[[3.3,0,'b'],[3.6,6],[4.3,7],[8.6,18],[10.6,0,'b'],[10.75,0,'b'],[10.9,5],[11.05,5],[14.2,26]];
const hp2=(L,g)=>Math.max(0,100-L.filter(h=>h[0]<=g).reduce((a,h)=>a+h[1],0));
const since=(L,g,real)=>{let r=9;L.forEach(h=>{if(h[0]<=g&&(!real||!h[2]))r=g-h[0];});return r;};
function combo2(L,g){let n=0,d=0,lt=-9;for(const h of L){if(h[0]>g)break;if(h[2])continue;if(h[0]-lt<1.0){n++;d+=h[1];}else{n=1;d=h[1];}lt=h[0];}return g-lt<1.0?[n,d]:[0,0];}
const torch=[];let tkReady=false;
function tkSetup(){if(tkReady)return;tkReady=true;
 const gr=skyX.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#070a22');gr.addColorStop(.55,'#231c48');gr.addColorStop(1,'#6a3a5e');skyX.fillStyle=gr;skyX.fillRect(0,0,4,256);skyT.needsUpdate=true;
 scene.fog.color.set(0x241c40);scene.fog.near=24;scene.fog.far=75;
 scene.children.forEach(o=>{if(o.isHemisphereLight){o.intensity=.8;o.color.set(0x8fa4ff);o.groundColor.set(0x3a2a4a);}if(o.isDirectionalLight){o.intensity=1.5;o.color.set(0xcfdcff);}});
 world.m.forEach(o=>o.material.color.set(0x241f44));world.r.forEach(o=>o.visible=false);world.sun.material.color.set(0xeaf0ff);world.sun.scale.setScalar(.45);world.sun.position.set(-14,26,-70);
 const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#5a586c';x.fillRect(0,0,512,512);x.strokeStyle='#33303f';x.lineWidth=8;for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,512);x.moveTo(0,i*64);x.lineTo(512,i*64);x.stroke();}
 const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(16,16);world.g.material.map=tx;world.g.material.color.set(0xffffff);world.g.material.needsUpdate=true;
 add(scene,new THREE.TorusGeometry(8.5,.12,6,48),toon(0xf0b429),[0,.06,0],{r:[Math.PI/2,0,0],ol:0});
 for(let i=0;i<8;i++){const a=i/8*6.283+.39,px=Math.cos(a)*10.5,pz=Math.sin(a)*10.5;if(pz>6)continue;add(scene,new THREE.CylinderGeometry(.45,.55,5,8),toon(0x5a5670),[px,2.5,pz],{ol:.04});add(scene,new THREE.BoxGeometry(1.3,.4,1.3),toon(0x6a6680),[px,5.1,pz],{ol:.05});
  const fl=new THREE.Mesh(new THREE.SphereGeometry(.38,10,8),new THREE.MeshBasicMaterial({color:0xffb347,fog:false}));fl.position.set(px,5.75,pz);scene.add(fl);torch.push(fl);const L=new THREE.PointLight(0xff9a3c,30,22);L.position.set(px,5.8,pz);scene.add(L);}
 add(scene,new THREE.BoxGeometry(9,.7,.8),toon(0x8f1521),[0,7.2,-11],{ol:.03});add(scene,new THREE.BoxGeometry(10.5,.5,1),toon(0x8f1521),[0,8.1,-11],{ol:.03});for(const s of [-1,1])add(scene,new THREE.CylinderGeometry(.4,.4,7.2,8),toon(0x8f1521),[s*3.6,3.6,-11],{ol:.04});
 const h=document.createElement('div');h.id='tk';h.style.cssText='position:absolute;left:0;top:0;width:1080px;height:1920px;pointer-events:none;font-family:Impact,Arial Black,sans-serif';ov.appendChild(h);}
function gameTK(g){T=g;A0=0;
 const hpJ=hp2(HJ2,g),hpE=hp2(HE2,g),sj=since(HJ2,g,true),se=since(HE2,g,true),sb=since(HE2.filter(h=>h[2]),g),ko=g>=20.2,idle=Math.sin(g*6)*.04;
 const jx=kf(g,[[0,-2.4],[2.6,-2.4],[3.2,-1.5],[4.5,-1.4],[5.4,-1.3],[5.9,-1.5],[6.55,-1.7],[7.4,-3.4],[8.0,-3.4],[8.4,-2.2],[9.2,-1.6],[10.4,-1.5],[11.2,-1.4],[12.0,-1.6],[12.6,-2.0],[12.95,-2.4],[13.6,-2.4],[14.2,-1.8],[16.5,-2.0],[17.9,-2.0],[19.4,-2.6],[20.2,-2.8],[20.95,-6.5],[30,-6.5]])*1.3,
  jy=kf(g,[[0,0],[6.55,0],[6.9,2.6],[7.35,2.4],[7.8,0],[20.2,0],[20.6,3.2],[20.95,0],[30,0]]);
 const ex=kf(g,[[0,2.4],[2.6,2.4],[3.2,1.6],[3.6,1.75],[4.3,1.9],[5.2,1.9],[5.5,1.2],[5.9,0],[6.55,-.2],[7.35,-1.0],[7.8,-.6],[8.3,-.4],[8.6,-.2],[9.0,.3],[9.6,1.4],[10.4,1.5],[11.2,1.9],[11.7,1.2],[12.0,0],[12.95,-.6],[13.6,-.2],[14.2,-.2],[14.7,4.6],[16.5,4.6],[17.0,3.6],[17.6,3.6],[17.9,-.4],[19.4,-1.0],[20.2,-1.4],[21,-1.2],[30,-1.2]])*1.3,
  ez=kf(g,[[0,0],[5.2,0],[5.5,1.7],[5.9,.5],[6.3,0],[30,0]]),ey=kf(g,[[0,0],[8.42,0],[8.52,3.8],[8.6,0],[14.2,0],[14.45,1.6],[14.7,0],[19.9,0],[20.2,1.8],[20.6,0],[30,0]]);
 // ---------- James ----------
 const jl=cl((g-7.7)/.15)*(1-cl((g-8.15)/.3))+(g>=20.95?1:0);
 const j=JB({x:jx,y:jy,yaw:PI/2-.25,lean:.12-1.4*jl,hip:1.95+idle-1.25*jl,step:[.35,-.35],wide:.1});
 if(g>6.55&&g<7.8){j.roll=(g-6.55)*5;j.tuck=.4;}if(g>20.2&&g<20.95){j.roll=-(g-20.2)*7;j.tuck=.3;j.lean=-.6;}if(sj<.22&&jl<=0&&jy<=0)j.lean=-.35;
 j.h=[j.hd(-.35,.6,.6),j.hd(.35,.75,1.0)];const head=V(ex-.45,3.3+ey,ez);
 const reach=(i,t0,tg,d=.1,hold=.06,back=.14)=>{const u=cl((g-(t0-d))/d)*(1-cl((g-t0-hold)/back));if(u>0){j.h[i]=LL(j.h[i],tg,u);j.bend[i]=V(0,-.2*(1-u),0);}};
 reach(1,3.3,head);reach(1,3.6,head);reach(1,5.45,V(4.2,2.7,0),.14,.1,.25);
 {const u=cl((g-4.18)/.12)*(1-cl((g-4.36)/.15));if(u>0)j.f=[null,LL(V(jx+.5,0,.3),V(ex-.35,.75,0),u)];}
 if(g>=8.25&&g<8.85){const u=cl((g-8.25)/.15),r=cl((g-8.62)/.2);j.h=[LL(LL(j.h[0],V(ex-.1,2.4+ey,ez+.6),u),j.h[0],r),LL(LL(j.h[1],V(ex-.1,2.4+ey,ez-.6),u),j.h[1],r)];j.bend=[V(0,.6,.8),V(0,.6,-.8)];j.lean=.2;}
 const gt=g>=10.5&&g<11.15;j.hideArm=[gt,gt];
 if(g>=13.55&&g<14.9){const wu=eo(cl((g-13.55)/.5)),sl=ei(cl((g-14.08)/.12)),rc=eo(cl((g-14.35)/.5)),base=j.h[1].clone();let p=LL(base,V(jx-6,3.2,.4),wu);p=LL(p,V(ex-1.0,2.5,0),sl);j.h[1]=LL(p,base,rc);j.fist[1]=1+4.5*wu*(1-rc);j.bend[1]=V();j.lean=g<14.08?-.25:.35;}
 pose(Jm,j);if(gt)gat(V(ex-.4,2.5,.2),.22,.7);
 // ---------- Eddy ----------
 const el=cl((g-8.6)/.05)*(1-cl((g-9.2)/.3))+cl((g-14.7)/.05)*(1-cl((g-15.5)/.4));
 const e=EB({x:ex,z:ez,y:ey,yaw:-PI/2+.25,lean:.1-1.3*el,hip:1.95-idle-1.2*el,step:[-.35,.35]});let pa='guard',pb='guard',pu=0;const o={mouth:g>=16.9,angry:g>=16.5&&g<21.5};
 const sl2=(t0,a='cutR',b='cutL',d=.22)=>{if(g>=t0-d*.55&&g<t0+d*.6){pa=a;pb=b;pu=ease(cl((g-(t0-d*.55))/(d*.7)));}};
 if(sb<.25){pa='cross';pb='cross';}
 sl2(5.9);sl2(6.2,'cutL','cutR');sl2(6.55,'cutL','up');sl2(7.0,'cutR','up');sl2(7.35,'up','cutL');
 if(g>=11.8&&g<12.25){e.hip=1.25;e.lean=.3;}sl2(12.0);sl2(12.6,'cutL','cutR');sl2(12.95);
 if(se<.22&&el<=0&&ey<=0)e.lean=-.35;if(g>8.42&&g<8.6)e.roll=(g-8.42)*20;if(g>14.2&&g<14.7){e.roll=(g-14.2)*8;e.tuck=.3;}
 if(g>=16.5&&g<17.6){pa='down';pb='guard';pu=cl((g-17.1)/.4);}if(g>=17.6&&g<17.9){pa='iai';pb='iai';e.lean=.45;e.hip=1.6;}
 [17.9,18.2,18.5,18.8,19.1,19.4].forEach((t0,i)=>sl2(t0,i%2?'cutL':'cutR',i%2?'cutR':'cutL',.28));
 if(g>=19.55&&g<20.05){pa='iai';pb='iai';pu=0;e.hip=1.45;e.lean=.4;}sl2(20.2,'iai','up',.3);
 if(g>=21.6){pa='down';pb='up';pu=ease(cl((g-22.3)/.5));e.yaw=-PI/2+.25+1.3*ease(cl((g-21.8)/.8));e.lean=0;}
 ED(Ed,e,pa,pb,pu,o);
 // ---------- Effekte ----------
 HE2.forEach((h,i)=>{burst(V(ex-.4+(rnd(i)-.5)*.3,2.2+rnd(i+3)*1.2+ey,ez+.4),h[0],g,h[2]?8:(h[1]>15?26:12),h[2]?1.1:(h[1]>15?3.4:1.6),i*13,h[2]?0x7fd0ff:0xffb13b,.22);shake(h[0],.18,h[1]>15?.4:.08);});
 HJ2.forEach((h,i)=>{burst(V(jx+.4+(rnd(i+7)-.5)*.3,2.2+rnd(i+9)*1.2+jy,.4),h[0],g,h[1]>15?30:12,h[1]>15?4:1.6,i*17+5,0xffffff,.22);shake(h[0],.18,h[1]>15?.6:.08);
  if(g>=h[0]-.05&&g<h[0]+.18)arc(V(ex-1.1,2.4+ey*.5,ez+.3),[0,0,PI*.55+(i%2?.5:-.5)],1.5+(g-h[0])*4,1-(g-h[0]+.05)/.23);});
 if(hpJ<35&&!ko){aura[0].position.set(jx,2.3+jy,0);aura[0].material.color.set(0xff2a1e);aura[0].material.opacity=.16+.05*Math.sin(g*24);aura[0].scale.setScalar(.8);}
 if((hpE<35&&g<21)||(g>=16.5&&g<20.3)){const s=g>=16.5&&g<17.9;aura[1].position.set(ex,2.3+ey,ez);aura[1].material.color.set(s?0x0b3d1a:0xff2a1e);aura[1].material.opacity=(s?.32:.16)+.05*Math.sin(g*24);aura[1].scale.setScalar(s?.95:.8);}
 pf(V(-3.4,0,0),7.8,8,2,3);pf(V(-.2,0,0),8.6,12,3,13);shock(V(-.2,0,0),8.6,8,.6);pf(V(4.6,0,0),14.7,10,2.5,23);shock(V(-.2,0,0),14.2,12,.7);flash(14.2,.1,.6);
 shock(V(3.6,0,0),16.6,10,.9);shock(V(3.6,0,0),17.0,12,.9);for(let i=0;i<3;i++)pf(V(3.6-i*1.3,0,0),17.62+i*.08,5,1.4,i*7+40);
 shock(V(-2.6,0,0),20.2,18,1.2);flash(20.2,.18,1);inv(20.2,.06);pf(V(-6.5,0,0),20.95,12,3,61);
 torch.forEach((f,i)=>f.scale.setScalar(1+.18*Math.sin(g*17+i*2.1)));
 return {jx,jy,ex,ey,ez,hpJ,hpE,ko};}
function renderTK(t){tkSetup();reset();nG=nA=nC=0;rings2.concat(arcs2).forEach(m=>m.visible=false);cuts.forEach(c=>c.style.opacity=0);SH=FL=SPD=BAR=0;INV=capOn=false;LJ=false;whiten(0);
 let g,mode='fight';if(t<20)g=t;else if(t<21.2)g=20+(t-20)*.42;else if(t<22.2)g=20.504+(t-21.2)*.9;else if(t<24.6){g=19.7+(t-22.2)*.4;mode='replay';}else{g=22+(t-24.6);mode='win';}
 const s=gameTK(g),mx=(s.jx+s.ex)/2,sep=Math.abs(s.ex-s.jx),my=2.3+Math.max(s.jy,s.ey)*.45;let p,q,roll=0;
 if(mode=='replay'){const a=(t-22.2)*.25;p=[s.jx-5.5*Math.cos(a)+1,1.3,6.5+2*Math.sin(a)];q=[(s.jx+s.ex)/2,2.6+s.jy*.5,0];BAR=120;}
 else if(mode=='win'){const a=.9-(t-24.6)*.35;p=[s.ex+8*Math.sin(a),3,8*Math.cos(a)];q=[s.ex,2.7,0];}
 else if(g<2.6){const a=1.25*(1-ease(g/2.6));p=[13*Math.sin(a),2.6+3.5*(1-ease(g/2.6)),13*Math.cos(a)];q=[0,2.3,0];}
 else if(g>=16.5&&g<17.6){const u=ease(cl((g-16.5)/.5));p=[s.ex-2.2,3.3,5.2+3*(1-u)];q=[s.ex,3.5,0];BAR=150;}
 else{const z=11.2+sep*.75+(g>17.6&&g<20.2?-1.2:0);p=[mx+1.2*Math.sin(g*.35),2.5+(my-2.3)*.5,z];q=[mx,my,0];if(g>=19.6&&g<21.4){p=[mx+2.5,1.5,z-1];roll=-.06;}}
 camera.fov=55;camera.updateProjectionMatrix();camera.position.set(p[0]+(rnd(t*61)-.5)*2*SH,p[1]+(rnd(t*47)-.5)*2*SH,p[2]);camera.lookAt(q[0],q[1],q[2]);camera.rotation.z+=roll;renderer.render(scene,camera);
 $('fl2').style.opacity=cl(FL);renderer.domElement.style.filter=INV?'invert(1) contrast(1.5)':(mode=='replay'?'saturate(.55) contrast(1.1)':'');$('bt').style.height=$('bb').style.height=BAR+'px';$('spd').style.opacity=0;$('cap').style.opacity=0;$('big').style.opacity=0;
 // ---------- Anzeige ----------
 const bar=(side,v,lag,rage)=>{const L=side=='l',fill=`position:absolute;top:0;bottom:0;${L?'right':'left'}:0`;return `<div style="position:absolute;${L?'left:96px':'right:96px'};top:96px;width:372px;height:36px;transform:skewX(${L?-20:20}deg);background:#1a1420;border:4px solid ${rage&&Math.floor(t*6)%2?'#ff3b2e':'#dfe5f2'};box-shadow:0 0 ${rage?26:0}px #ff2a1e;overflow:hidden"><div style="${fill};width:${lag}%;background:#d22"></div><div style="${fill};width:${v}%;background:linear-gradient(#fff3a0,#ffb21f 55%,#f07a12)"></div></div>`+
  `<div style="position:absolute;${L?'left:14px':'right:14px'};top:74px;width:78px;height:78px;border-radius:50%;background:${L?'#c9222b':'#3f8a2a'};border:5px solid #dfe5f2;color:#fff;font-size:54px;line-height:78px;text-align:center">${L?'J':'E'}</div>`+
  `<div style="position:absolute;${L?'left:104px':'right:104px'};top:142px;font-size:40px;color:#fff;-webkit-text-stroke:7px #14101c;paint-order:stroke fill;font-style:italic">${L?'JAMES':'EDDY'}</div>`+(rage?`<div style="position:absolute;${L?'left:330px':'right:330px'};top:146px;font-size:34px;color:#ff3b2e;-webkit-text-stroke:6px #14101c;paint-order:stroke fill;font-style:italic;opacity:${Math.floor(t*6)%2?1:.5}">RAGE</div>`:'');};
 const gl=Math.min(g,20.2),big=(s2,u,col,sz=190)=>`<div style="position:absolute;left:50%;top:720px;transform:translateX(-50%) skewX(-10deg) scale(${(1+1.4*Math.max(0,1-u*7)).toFixed(2)});white-space:nowrap;font-size:${sz}px;font-style:italic;color:${col};-webkit-text-stroke:18px #14101c;paint-order:stroke fill;opacity:${Math.min(1,(1-u)*6)}">${s2}</div>`;
 let h=bar('l',s.hpJ,hp2(HJ2,gl-.5),s.hpJ<35&&s.hpJ>0)+bar('r',s.hpE,hp2(HE2,gl-.5),s.hpE<35)+`<div style="position:absolute;left:480px;top:70px;width:120px;height:104px;background:linear-gradient(#34344a,#0c0c14);border:5px solid #dfe5f2;border-radius:14px;color:#ffe36a;font-size:76px;line-height:104px;text-align:center">${String(Math.max(0,60-Math.floor(Math.max(0,gl-2.5)))).padStart(2,'0')}</div>`+
  [0,1].map(i=>`<div style="position:absolute;left:${i?610:442}px;top:150px;width:22px;height:22px;transform:rotate(45deg);border:4px solid #dfe5f2;background:${i&&mode=='win'?'#ffe36a':'#1a1420'}"></div>`).join('');
 const cj=combo2(HE2,g),ce=combo2(HJ2,g);if(cj[0]>1)h+=`<div style="position:absolute;left:40px;top:330px;font-style:italic;color:#ffe36a;-webkit-text-stroke:9px #14101c;paint-order:stroke fill"><span style="font-size:96px">${cj[0]}</span><span style="font-size:48px"> HITS</span><div style="font-size:36px;color:#fff">${cj[1]} SCHADEN</div></div>`;
 if(ce[0]>1)h+=`<div style="position:absolute;right:40px;top:330px;text-align:right;font-style:italic;color:#9dff8a;-webkit-text-stroke:9px #14101c;paint-order:stroke fill"><span style="font-size:96px">${ce[0]}</span><span style="font-size:48px"> HITS</span><div style="font-size:36px;color:#fff">${ce[1]} SCHADEN</div></div>`;
 if(t>=.5&&t<1.6)h+=big('RUNDE 1',(t-.5)/1.1,'#fff',170);if(t>=1.8&&t<2.6)h+=big('KÄMPFT!',(t-1.8)/.8,'#ffb21f',210);
 if(mode=='fight'&&g>=20.2&&t<22.2)h+=big('K.O.',cl((t-20.48)/1.7),'#ff3b2e',300);
 if(mode=='fight'&&g>=16.5&&g<17.6)h+=`<div style="position:absolute;left:50%;top:1500px;transform:translateX(-50%) skewX(-10deg);white-space:nowrap;font-size:84px;font-style:italic;color:#9dff8a;-webkit-text-stroke:12px #14101c;paint-order:stroke fill">DREI-KLINGEN-STIL</div>`;
 if(mode=='replay')h+=`<div style="position:absolute;left:40px;top:260px;font-size:64px;font-style:italic;color:#fff;-webkit-text-stroke:9px #14101c;paint-order:stroke fill;opacity:${Math.floor(t*3)%2?1:.35}">▶ WIEDERHOLUNG</div>`;
 if(mode=='win')h+=big('EDDY GEWINNT',cl((t-24.7)/8),'#ffe36a',118).replace('top:720px','top:1380px');
 $('tk').innerHTML=h;}
