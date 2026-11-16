// Langer 3D-Arena-Kampf (49 s) mit den Fähigkeiten: James = weiße Gummi-Form (ganze Welt wird Gummi),
// Eddy = Dämonen-Form (Teufelsaura, rot glühendes Auge, Verdreifachung links/rechts), immer drei Katanas (zwei Hände + Mund).
// Braucht scene.js, scene60.js und scene-arena.js. renderTK2(t) zeichnet Videosekunde t.
const HJ3=[[5.9,6],[6.2,6],[6.55,8],[7.0,5],[7.35,6],[12.0,7],[12.6,7],[12.95,7]];for(let i=0;i<9;i++)HJ3.push([30.2+i*.3,3]);HJ3.push([33.4,8],[41.0,40]);
const HE3=[[3.3,0,'b'],[3.6,6],[4.3,7],[8.6,14],[10.6,0,'b'],[10.75,0,'b'],[10.9,4],[11.05,4],[14.2,14]];for(let i=0;i<7;i++)HE3.push([19.6+i*.3,2]);HE3.push([22.4,8],[23.4,9],[41.0,40]);
let DEM=0,tk2Ready=false;const arenaM=[],demons=[],DRED=new THREE.Color(0x4a0a12);
function tk2Setup(){if(tk2Ready)return;tk2Ready=true;
 world.all.forEach(o=>o.userData.c.copy(o.material.color));world.tx=world.g.material.map;FOG0.set(0x241c40);
 sky=function(w){const mix=h=>'#'+new THREE.Color(h).lerp(WH,w).lerp(new THREE.Color(0x3a0610),DEM*.8).getHexString(),g=skyX.createLinearGradient(0,0,0,256);g.addColorStop(0,mix(0x070a22));g.addColorStop(.55,mix(0x231c48));g.addColorStop(1,mix(0x6a3a5e));skyX.fillStyle=g;skyX.fillRect(0,0,4,256);skyT.needsUpdate=true;};
 scene.children.forEach(o=>{if(o.isMesh&&o.material.isMeshToonMaterial&&o.parent===scene&&['CylinderGeometry','BoxGeometry','TorusGeometry'].includes(o.geometry.type)){o.userData.c2=o.material.color.clone();arenaM.push(o);}});
 eds.forEach(c=>{const core=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshBasicMaterial({color:0xff1a10,fog:false})),gl=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),fxM(0xff2a1e,.45));core.position.set(-.16,.02,.585);gl.position.copy(core.position);c.head.add(core,gl);c.eye=[core,gl];core.visible=gl.visible=false;});
 const cv=document.createElement('canvas');cv.width=cv.height=512;const x=cv.getContext('2d');const rg=x.createRadialGradient(256,300,40,256,300,256);rg.addColorStop(0,'rgba(120,8,16,.95)');rg.addColorStop(.6,'rgba(50,2,8,.8)');rg.addColorStop(1,'rgba(20,0,4,0)');x.fillStyle=rg;
 x.beginPath();x.moveTo(40,512);for(let i=0;i<=16;i++){const px=40+i*27,py=(i%2?150:230)+Math.abs(i-8)*18;x.lineTo(px,py);}x.lineTo(472,512);x.closePath();x.fill();
 x.fillStyle='rgba(30,0,6,.9)';x.beginPath();x.ellipse(256,250,120,130,0,0,7);x.fill();for(const s of [-1,1]){x.beginPath();x.moveTo(256+s*70,170);x.quadraticCurveTo(256+s*190,120,256+s*170,10);x.quadraticCurveTo(256+s*130,110,256+s*110,200);x.closePath();x.fill();}
 x.fillStyle='#ff3a1e';x.shadowColor='#ff3a1e';x.shadowBlur=30;for(const s of [-1,1]){x.beginPath();x.moveTo(256+s*30,240);x.lineTo(256+s*100,205);x.lineTo(256+s*85,255);x.closePath();x.fill();}
 x.beginPath();x.moveTo(180,310);for(let i=0;i<=8;i++)x.lineTo(180+i*19,i%2?340:312);x.lineTo(332,310);x.quadraticCurveTo(256,330,180,310);x.fill();
 const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,opacity:0,fog:false}));m.visible=false;scene.add(m);demons.push(m);}}
function embers(cx,cz,g,n,seed){for(let i=0;i<n&&nS<sparks.length;i++){const m=sparks[nS++],ph=(g*.8+rnd(seed+i))%1;m.position.set(cx+(rnd(seed+i+3)-.5)*2.4,.3+ph*5.5,cz+(rnd(seed+i+5)-.5)*1.6);m.quaternion.set(0,0,0,1);m.scale.set(1.8,.5+.5*(1-ph),1.8);m.material.color.set(i%2?0xff2a1e:0x2a0306);m.material.opacity=1-ph;m.visible=true;}}
function gameL(g){T=g;A0=0;
 const hpJ=hp2(HJ3,g),hpE=hp2(HE3,g),sj=since(HJ3,g,true),se=since(HE3,g,true),sb=since(HE3.filter(h=>h[2]),g),idle=Math.sin(g*6)*.04,fade=1-cl((g-41.2)/.8);
 const w=ease(cl((g-17.0)/1.2))*fade,w2=ease(cl((g-18.0)/1.2))*fade,el=ease(cl((g-18.4)/1.0))*kf(g,[[0,1],[19.6,1],[20.4,.35],[35.5,.35],[36.5,.8],[41,.8],[41.6,0],[60,0]]);
 DEM=ease(cl((g-25.0)/1.2))*fade;whiten(w);camera.fov=55;camera.updateProjectionMatrix();worldFx(g,w2,el,0);
 {const wm=w2>.5?null:world.tx;if(world.g.material.map!==wm){world.g.material.map=wm;world.g.material.needsUpdate=true;}}arenaM.forEach(o=>o.material.color.copy(o.userData.c2).lerp(WH,w2*.93).lerp(DRED,DEM*.6));if(w2>0||DEM>0)world.all.forEach(o=>o.material.color.lerp(DRED,DEM*.6));
 const jx=g<14.2?1.3*kf(g,[[0,-2.4],[2.6,-2.4],[3.2,-1.5],[4.5,-1.4],[5.4,-1.3],[5.9,-1.5],[6.55,-1.7],[7.4,-3.4],[8.0,-3.4],[8.4,-2.2],[9.2,-1.6],[10.4,-1.5],[11.2,-1.4],[12.0,-1.6],[12.6,-2.0],[12.95,-2.4],[13.6,-2.4],[14.2,-1.8]]):kf(g,[[14.2,-2.34],[16.2,-2.8],[21.7,-3.4],[28.5,-2.8],[33.4,-2.8],[33.9,-6.2],[38,-6.2],[41,-.9],[41.9,-5.2],[60,-5.2]]),
  jy=kf(g,[[0,0],[6.55,0],[6.9,2.6],[7.35,2.4],[7.8,0],[33.4,0],[33.65,2],[33.9,0],[41,0],[41.45,3],[41.9,0],[60,0]]);
 const ex=g<14.7?1.3*kf(g,[[0,2.4],[2.6,2.4],[3.2,1.6],[3.6,1.75],[4.3,1.9],[5.2,1.9],[5.5,1.2],[5.9,0],[6.55,-.2],[7.35,-1.0],[7.8,-.6],[8.3,-.4],[8.6,-.2],[9.0,.3],[9.6,1.4],[10.4,1.5],[11.2,1.9],[11.7,1.2],[12.0,0],[12.95,-.6],[13.6,-.2],[14.2,-.2],[14.7,4.6]]):kf(g,[[14.7,5.98],[16.2,5.98],[17.5,4.2],[19.4,3.6],[28.5,3.6],[30.0,1.6],[32.8,1.6],[33.4,-.6],[33.9,.6],[34.6,2.6],[36,5.8],[38,5.8],[41,.9],[41.9,5.2],[60,5.2]]),
  ez=kf(g,[[0,0],[5.2,0],[5.5,1.7],[5.9,.5],[6.3,0],[60,0]]),ey=kf(g,[[0,0],[8.42,0],[8.52,3.8],[8.6,0],[14.2,0],[14.45,1.6],[14.7,0],[22.4,0],[22.9,6.5],[23.2,6.5],[23.4,0],[41,0],[41.45,3],[41.9,0],[60,0]]);
 // ---------- James ----------
 const jl=cl((g-7.7)/.15)*(1-cl((g-8.15)/.3))+cl((g-33.85)/.1)*(1-cl((g-34.4)/.4))+(g>=41.9?1:0);
 if((g>=16.5&&g<30.1)||(g>=34.8&&g<41))Jm.hm.map=JF.l;
 let j=JB({x:jx,y:jy,yaw:PI/2-.25,lean:.12-1.4*jl,hip:1.95+idle-1.25*jl,step:[.35,-.35],wide:.1}),sq=0,gt=false,ball=0;
 if((g>6.55&&g<7.8)||(g>33.4&&g<33.9)||(g>41&&g<41.9)){j.roll=g*5;j.tuck=.4;}if(sj<.22&&jl<=0&&jy<=0)j.lean=-.35;
 j.h=[j.hd(-.35,.6,.6),j.hd(.35,.75,1.0)];const head=V(ex-.45,3.3+ey,ez);
 const reach=(i,t0,tg,d=.1,hold=.06,back=.14)=>{const u=cl((g-(t0-d))/d)*(1-cl((g-t0-hold)/back));if(u>0){j.h[i]=LL(j.h[i],tg,u);j.bend[i]=V(0,-.2*(1-u),0);}};
 if(g<16.2){reach(1,3.3,head);reach(1,3.6,head);reach(1,5.45,V(5.4,2.7,0),.14,.1,.25);
  {const u=cl((g-4.18)/.12)*(1-cl((g-4.36)/.15));if(u>0)j.f=[null,LL(V(jx+.5,0,.3),V(ex-.35,.75,0),u)];}
  if(g>=8.25&&g<8.85){const u=cl((g-8.25)/.15),r=cl((g-8.62)/.2);j.h=[LL(LL(j.h[0],V(ex-.1,2.4+ey,ez+.6),u),j.h[0],r),LL(LL(j.h[1],V(ex-.1,2.4+ey,ez-.6),u),j.h[1],r)];j.bend=[V(0,.6,.8),V(0,.6,-.8)];j.lean=.2;}
  gt=g>=10.5&&g<11.15;j.hideArm=[gt,gt];
  if(g>=13.55&&g<14.9){const wu=eo(cl((g-13.55)/.5)),sl=ei(cl((g-14.08)/.12)),rc=eo(cl((g-14.35)/.5)),base=j.h[1].clone();let p=LL(base,V(jx-6,3.2,.4),wu);p=LL(p,V(ex-1.0,2.5,0),sl);j.h[1]=LL(p,base,rc);j.fist[1]=1+4.5*wu*(1-rc);j.bend[1]=V();j.lean=g<14.08?-.25:.35;}}
 else if(g<19.4){const la=cl((g-16.4)/.4),shk=Math.sin(g*24)*la,up=cl((g-18.6)/.5);j.lean=-.2*la+.04*shk;j.nod=-.28*la+.08*shk;j.h=[j.hd(-.5-1.7*up,.1+2*up+.05*shk,.6),j.hd(.5+1.7*up,.1+2*up-.05*shk,.6)];j.wob=[.25*up*Math.sin(g*14),.25*up*Math.cos(g*14)];j.y=.7*Math.abs(Math.sin(g*9))*up;sq=up;}
 else if(g<21.7){const C=V(ex,2.2,0),N=7,leg=.3,s=g-19.4,i=Math.min(N-1,Math.floor(s/leg)),u=(s-i*leg)/leg,out=k=>{const a=k*2.4+.6;return V(C.x+4.6*Math.cos(a),1.2+3.8*rnd(k+2),3.2*Math.sin(a));};
  const P=s<N*leg?(u<.5?out(i).lerp(C,ei(u*2)):C.clone().lerp(out(i+1),eo(u*2-1))):out(N).lerp(V(-3.4,1.95,0),eo(cl((s-N*leg)/.2)));ball=1-cl((s-N*leg)/.2);
  j=JB({x:P.x,y:Math.max(0,P.y-1.95),z:P.z,yaw:PI/2-.25,tuck:.6*ball,hip:1.95-.5*ball,roll:g*18*ball,step:[.35,-.35],wide:.1});j.h=[j.hd(-.4,.2,.5),j.hd(.4,.2,.5)];}
 else if(g<24.2){const dig=cl((g-21.7)/.3);if(g<22.9){j.lean=.5*dig;j.hideArm=[true,true];}else if(g<23.7){const gr=cl((g-22.9)/.2),r=cl((g-23.45)/.25),E=V(ex,ey+2.2,0);j.h=[LL(LL(j.h[0],E.clone().add(V(0,0,.75)),gr),j.h[0],r),LL(LL(j.h[1],E.clone().add(V(0,0,-.75)),gr),j.h[1],r)];j.bend=[V(0,1.5,1.5),V(0,1.5,-1.5)];j.lean=g<23.3?-.3:.4;}}
 else if(g>=30.1&&g<33.4){j.h=[j.hd(-.3,.9,.9),j.hd(.3,.9,.9)];j.lean=.1+.22*Math.sin(g*40)*(sj<.2?1:.25);}
 else if(g>=36&&g<41){const pw=eo(cl((g-36)/1.8)),run=g>=38;j.lean=run?.45:-.25*pw;if(run){j.step=[.6*Math.sin(g*22),-.6*Math.sin(g*22)];j.hip=1.8;}const fu=ei(cl((g-40.5)/.5));j.h[1]=LL(LL(j.h[1],V(jx-34,3,.5),pw),V(0,2.6,.2),fu);j.fist[1]=1+5*pw+fu;j.bend[1]=V();j.wob[1]=.25*(1-fu)*Math.sin(g*30);}
 pose(Jm,j);if(gt)gat(V(ex-.4,2.5,.2),.22,.7);if(ball>0)Jm.g.scale.set(1+.25*ball,1-.15*ball,1+.25*ball);if(sq>0){const q=1+.14*sq*Math.sin(g*9);Jm.g.scale.set(1/Math.sqrt(q),q,1/Math.sqrt(q));}
 if(g>=21.7&&g<22.9){const dig=cl((g-21.7)/.3),pop=cl((g-22.4)/.5);for(let k=0;k<4;k++){const s0=Jm.sh[k%2].getWorldPosition(V()),tg=V(ex+(k<2?-.35:.35),-1+(ey+2.4)*pop,(k%2?-.35:.35)),hh=pop<=0?LL(s0,V(jx+1.2,-.6,(k%2?-.5:.5)),dig):tg;gatA[k].vis(true);gatA[k].set(s0,hh,V(0,-4*pop-.5,0),0,0,.12);gatF[k].visible=true;gatF[k].position.copy(hh);gatF[k].scale.setScalar(1.3);}}
 // ---------- Eddy + Doppelgänger ----------
 const elg=cl((g-8.6)/.05)*(1-cl((g-9.2)/.3))+cl((g-14.7)/.05)*(1-cl((g-15.5)/.4))+cl((g-23.4)/.05)*(1-cl((g-24.5)/.5))+(g>=41.9?1:0);
 const form=ease(cl((g-26.4)/.9))*(1-ease(cl((g-34.5)/.8))),dems=[];
 eds.forEach((c,k)=>{if(k&&!(g>=26.4&&g<35.3))return;const o={mouth:true,angry:g>=24.8&&g<41.2};let px=ex+(k?.8*form:0),pz=ez+[0,-1.9,1.9][k]*form,py=ey;
  const e=EB({x:px,z:pz,y:py,yaw:-PI/2+.25,lean:.1-1.3*elg,hip:1.95-idle-1.2*elg,step:[-.35,.35]});let pa='guard',pb='guard',pu=0;
  const sl2=(t0,a='cutR',b='cutL',d=.22)=>{if(g>=t0-d*.55&&g<t0+d*.6){pa=a;pb=b;pu=ease(cl((g-(t0-d*.55))/(d*.7)));}};
  if(g<16.2){if(sb<.25){pa='cross';pb='cross';}sl2(5.9);sl2(6.2,'cutL','cutR');sl2(6.55,'cutL','up');sl2(7.0,'cutR','up');sl2(7.35,'up','cutL');if(g>=11.8&&g<12.25){e.hip=1.25;e.lean=.3;}sl2(12.0);sl2(12.6,'cutL','cutR');sl2(12.95);
   if(g>8.42&&g<8.6)e.roll=(g-8.42)*20;if(g>14.2&&g<14.7){e.roll=(g-14.2)*8;e.tuck=.3;}}
  else if(g<19.4)e.lean=-.12*cl((g-17)/1);
  else if(g<21.6){o.spin=true;e.lean=.12*Math.sin(g*31);e.yaw+=1.0*Math.sin(Math.floor((g-19.4)/.3+.5)*2.1);}
  else if(g<24.5){if(g>=22.4&&g<23.4){pa='up';pb='up';e.roll=g*6;}}
  else if(g<28.5){pa=g<25?'kneel':'down';pb='guard';pu=g<25?cl((g-24.5)/.5):cl((g-27.3)/.6);e.x+=.03*Math.sin(g*70)*DEM;}
  else if(g<33.9){for(let i=0;i<9;i++)if(i%3==k){const t0=30.2+i*.3,u=(g-(t0-.15))/.3;if(u>=0&&u<1){const s=Math.sin(Math.PI*u);e.x=px+(jx+.9-px)*s;e.z=pz*(1-s);pa='cutR';pb='cutL';pu=ease(u);e.lean=.3;}}
   if(g>=32.9){const u=ease(cl((g-32.9)/.4));e.x=px+(k?(jx+2.0-px)*u:0);e.z=pz*(1-.4*u);pa='guard';pb='cutR';pu=u;sl2(33.4,'cutR','cutL',.3);}}
  else if(g>=36&&g<41.9){const run=g>=38&&g<41;pa='guard';pb='iai';pu=ease(cl((g-36.2)/.5));e.hip=1.5;e.lean=.4;if(run)e.step=[.6*Math.sin(g*22+1),-.6*Math.sin(g*22+1)];if(g>=40.8){pa='iai';pb='cutL';pu=ease(cl((g-40.85)/.15));}if(g>=41){e.roll=-g*5;e.tuck=.4;e.lean=-.4;e.hip=1.95;}}
  if(se<.22&&elg<=0&&ey<=0&&!k&&g<41)e.lean=-.35;if(elg>.5){pa='kneel';pb='kneel';}
  ED(c,e,pa,pb,pu,o);const on=DEM>.25;c.eye[0].visible=c.eye[1].visible=on;if(on){c.eye[1].scale.setScalar(1+.25*Math.sin(g*18+k));dems.push([e.x,e.y||0,e.z,k?.62:1]);embers(e.x,e.z,g,k?5:10,k*40+3);}
  if(k)pf(V(ex,0,ez),26.4,6,1.8,k*31);if(k)pf(V(px,0,pz),34.9,6,1.6,k*47);});
 // ---------- Effekte ----------
 HE3.forEach((h,i)=>{burst(V(ex-.4+(rnd(i)-.5)*.3,2.2+rnd(i+3)*1.2+ey,ez+.4),h[0],g,h[2]?8:(h[1]>12?26:12),h[2]?1.1:(h[1]>12?3.4:1.6),i*13,h[2]?0x7fd0ff:0xffb13b,.22);shake(h[0],.18,h[1]>12?.4:.08);});
 HJ3.forEach((h,i)=>{burst(V(jx+.4+(rnd(i+7)-.5)*.3,2.2+rnd(i+9)*1.2+jy,.4),h[0],g,h[1]>7?30:12,h[1]>7?4:1.6,i*17+5,DEM>.5?0xff3a2e:0xffffff,.22);shake(h[0],.18,h[1]>7?.6:.1);
  if(g>=h[0]-.05&&g<h[0]+.18)arc(V(jx+1.4,2.4,.3),[0,0,PI*.55+(i%2?.5:-.5)],1.5+(g-h[0])*4,1-(g-h[0]+.05)/.23);});
 pf(V(-4.4,0,0),7.8,8,2,3);pf(V(-.3,0,0),8.6,12,3,13);shock(V(-.3,0,0),8.6,8,.6);pf(V(5.98,0,0),14.7,10,2.5,23);shock(V(-.3,0,0),14.2,12,.7);flash(14.2,.1,.6);
 aura[0].position.set(jx,2.4+jy,0);aura[0].material.color.set(0xffffff);aura[0].material.opacity=.35*Math.sin(PI*cl((g-16.9)/1.8))+.25*cl((g-36)/1.5)*fade;aura[0].scale.setScalar(1.1+.1*Math.sin(g*20));
 for(let k=0;k<4;k++)pf(V(jx,0,0),17.0+k*.3,7,2.6,k*17);shock(V(jx,0,0),18.2,16,1.1);flash(18.2,.12,.5);
 for(let k=0;k<3;k++)pf(V(ex,0,0),22.4+k*.1,7,2,k*9);shock(V(ex,0,0),23.4,16);pf(V(ex,0,0),23.4,16,5,31);flash(23.4,.12,.8);inv(23.4,.06);
 if(DEM>0){aura[1].position.set(ex,2.4+ey,ez);aura[1].material.color.set(0x3a0408);aura[1].material.opacity=(.3+.06*Math.sin(g*24))*DEM;aura[1].scale.setScalar(.95+.25*cl((g-36)/2));pl[1].color.set(0xff2a1e);pl[1].position.set(ex-1,3,2);pl[1].intensity=30*DEM;}
 shock(V(ex,0,0),25.0,10,.9);shock(V(ex,0,0),25.6,14,.9);shock(V(ex,0,0),26.4,14,.9);flash(26.4,.12,.5);shake(25,1.6,.1);
 cutLines(30.2,30,7,2.7);if(g>30.1&&g<33)SH=Math.max(SH,.08);flash(33.4,.15,.9);inv(33.4,.07);shock(V(jx,0,0),33.4,14);pf(V(-6.2,0,0),33.9,12,3,5);
 for(let k=0;k<4;k++){shock(V(-6.2,0,0),36.2+k*.42,7,.7);shock(V(5.8,0,0),36.4+k*.42,7,.7);}if(g>=36&&g<38)SH=Math.max(SH,.05);if(g>=38&&g<41)SPD=.85;
 shock(V(0,0,0),41,24,1.2);flash(41,.25,1);inv(41,.1);shake(41,.9,.9);burst(V(0,2.6,.4),41,44,8,3,0xffd23f,.6);burst(V(0,2.6,.4),41.04,30,6,33,0xff3a2e,.55);pf(V(-5.2,0,0),41.9,12,3,61);pf(V(5.2,0,0),41.9,12,3,71);
 [['WEISSE GUMMI-FORM!',17.2,1.6],['GUMMIBALL!',19.45,1.2],['MAULWURF-FAUST!',22.1,.8],['GUMMI-HAMMER!',22.95,.9],['DÄMONEN-FORM!',25.2,1.2],['VERDREIFACHUNG!',26.5,1.4],['DÄMONEN-STURM!',30.0,1.6],['ALLES ODER NICHTS!',36.4,1.5]].forEach(([s,t0,d])=>cap(s,t0,d));
 torch.forEach((f,i)=>f.scale.setScalar(1+.18*Math.sin(g*17+i*2.1)));
 return {jx,jy,ex,ey,ez,hpJ,hpE,w,dems};}
function renderTK2(t){tkSetup();tk2Setup();reset();nG=nA=nC=0;rings2.concat(arcs2,demons).forEach(m=>m.visible=false);cuts.forEach(c=>c.style.opacity=0);SH=FL=SPD=BAR=0;INV=capOn=false;LJ=false;show(Jm,true);eds.forEach(c=>{if(c.eye)c.eye[0].visible=c.eye[1].visible=false;});
 let g,mode='fight';if(t<41)g=t;else if(t<42.6)g=41+(t-41)*.45;else if(t<43.4)g=41.72+(t-42.6);else if(t<46){g=40.5+(t-43.4)*.4;mode='replay';}else{g=43+(t-46);mode='win';}
 const s=gameL(g),mx=(s.jx+s.ex)/2,sep=Math.abs(s.ex-s.jx),my=2.3+Math.max(s.jy,s.ey)*.45;let p,q,roll=0;
 if(mode=='replay'){const a=.5+(t-43.4)*.2;p=[11*Math.sin(a),1.6,12*Math.cos(a)];q=[0,2.7,0];BAR=120;}
 else if(mode=='win'){const a=(t-46)*.2;p=[4*Math.sin(a),7,19];q=[0,1,0];}
 else if(g<2.6){const a=1.25*(1-ease(g/2.6));p=[13*Math.sin(a),2.6+3.5*(1-ease(g/2.6)),13*Math.cos(a)];q=[0,2.3,0];}
 else if(g>=16.3&&g<18.9){const u=ease(cl((g-16.3)/.6));p=[s.jx+2.6,3.0,6.2+2.5*(1-u)];q=[s.jx,3.2,0];BAR=150;}
 else if(g>=24.6&&g<28.5){const u=ease(cl((g-24.6)/.8));p=[s.ex-8.8,4.4-.8*(1-u),.3];q=[s.ex,3.1,0];BAR=150;show(Jm,false);}
 else{const z=11.2+sep*.75;p=[mx+1.2*Math.sin(g*.35),2.5+(my-2.3)*.5,z];q=[mx,my,0];if(g>=36&&g<38)BAR=150;if(g>=40.6&&g<42.6){p=[mx+2.5,1.5,z-1];roll=-.06;}}
 camera.position.set(p[0]+(rnd(t*61)-.5)*2*SH,p[1]+(rnd(t*47)-.5)*2*SH,p[2]);camera.lookAt(q[0],q[1],q[2]);camera.rotation.z+=roll;camera.updateMatrixWorld();
 s.dems.forEach((d,i)=>{const m=demons[i];if(!m)return;m.visible=true;const dir=V(d[0]-camera.position.x,0,d[2]-camera.position.z).normalize();m.position.set(d[0]+dir.x*1.6,d[1]+3.9*d[3]+.2,d[2]+dir.z*1.6);m.quaternion.copy(camera.quaternion);const sc=9.5*d[3]*(1+.05*Math.sin(g*9+i));m.scale.set(sc,sc,1);m.material.opacity=DEM*(.85+.1*Math.sin(g*13+i));});
 renderer.render(scene,camera);
 $('fl2').style.opacity=cl(FL);renderer.domElement.style.filter=INV?'invert(1) contrast(1.5)':(mode=='replay'?'saturate(.55) contrast(1.1)':'');$('bt').style.height=$('bb').style.height=BAR+'px';$('big').style.opacity=0;if(!capOn)$('cap').style.opacity=0;
 const sp=$('spd');sp.style.opacity=SPD;if(SPD>0)sp.style.background='repeating-conic-gradient(from '+(rnd(Math.floor(t*30)*13)*360)+'deg at 50% 46%,rgba(0,0,0,0) 0deg 4.4deg,rgba(255,255,255,.8) 4.4deg 5deg)';
 const white=s.w>.5,dem=DEM>.5;
 const bar=(side,v,lag,glow,label)=>{const L=side=='l',fill=`position:absolute;top:0;bottom:0;${L?'right':'left'}:0`;return `<div style="position:absolute;${L?'left:96px':'right:96px'};top:96px;width:372px;height:36px;transform:skewX(${L?-20:20}deg);background:#1a1420;border:4px solid ${glow&&Math.floor(t*6)%2?glow:'#dfe5f2'};box-shadow:0 0 ${glow?26:0}px ${glow||'#000'};overflow:hidden"><div style="${fill};width:${lag}%;background:#d22"></div><div style="${fill};width:${v}%;background:linear-gradient(#fff3a0,#ffb21f 55%,#f07a12)"></div></div>`+
  `<div style="position:absolute;${L?'left:14px':'right:14px'};top:74px;width:78px;height:78px;border-radius:50%;background:${L?(white?'#f4f1ea':'#c9222b'):(dem?'#3a0408':'#3f8a2a')};border:5px solid #dfe5f2;color:${L&&white?'#17110f':'#fff'};font-size:54px;line-height:78px;text-align:center">${L?'J':'E'}</div>`+
  `<div style="position:absolute;${L?'left:104px':'right:104px'};top:142px;font-size:40px;color:#fff;-webkit-text-stroke:7px #14101c;paint-order:stroke fill;font-style:italic">${L?'JAMES':'EDDY'}</div>`+(label?`<div style="position:absolute;${L?'left:250px':'right:230px'};top:148px;font-size:30px;color:${glow};-webkit-text-stroke:6px #14101c;paint-order:stroke fill;font-style:italic">${label}</div>`:'');};
 const gl=Math.min(g,41),big=(s2,u,col,sz=190,top=720)=>`<div style="position:absolute;left:50%;top:${top}px;transform:translateX(-50%) skewX(-10deg) scale(${(1+1.4*Math.max(0,1-u*7)).toFixed(2)});white-space:nowrap;font-size:${sz}px;font-style:italic;color:${col};-webkit-text-stroke:18px #14101c;paint-order:stroke fill;opacity:${Math.min(1,(1-u)*6)}">${s2}</div>`;
 let h=bar('l',s.hpJ,hp2(HJ3,gl-.5),white?'#ffffff':'',white?'GUMMI-FORM':'')+bar('r',s.hpE,hp2(HE3,gl-.5),dem?'#ff2a1e':'',dem?'DÄMON':'')+`<div style="position:absolute;left:480px;top:70px;width:120px;height:104px;background:linear-gradient(#34344a,#0c0c14);border:5px solid #dfe5f2;border-radius:14px;color:#ffe36a;font-size:76px;line-height:104px;text-align:center">${String(Math.max(0,99-Math.floor(Math.max(0,gl-2.5)))).padStart(2,'0')}</div>`+
  [0,1].map(i=>`<div style="position:absolute;left:${i?610:442}px;top:150px;width:22px;height:22px;transform:rotate(45deg);border:4px solid #dfe5f2;background:#1a1420"></div>`).join('');
 const cj=combo2(HE3,g),ce=combo2(HJ3,g),cb=(c,col,side)=>`<div style="position:absolute;${side}:40px;top:330px;text-align:${side};font-style:italic;color:${col};-webkit-text-stroke:9px #14101c;paint-order:stroke fill"><span style="font-size:96px">${c[0]}</span><span style="font-size:48px"> HITS</span><div style="font-size:36px;color:#fff">${c[1]} SCHADEN</div></div>`;
 if(cj[0]>1&&g<41)h+=cb(cj,'#ffe36a','left');if(ce[0]>1&&g<41)h+=cb(ce,'#ff5a4a','right');
 if(t>=.5&&t<1.6)h+=big('RUNDE 1',(t-.5)/1.1,'#fff',170);if(t>=1.8&&t<2.6)h+=big('KÄMPFT!',(t-1.8)/.8,'#ffb21f',210);
 if(mode=='fight'&&g>=41)h+=big('DOPPEL-K.O.',cl((t-41)/2.6),'#ff3b2e',128);
 if(mode=='replay')h+=`<div style="position:absolute;left:40px;top:260px;font-size:64px;font-style:italic;color:#fff;-webkit-text-stroke:9px #14101c;paint-order:stroke fill;opacity:${Math.floor(t*3)%2?1:.35}">▶ WIEDERHOLUNG</div>`;
 if(mode=='win')h+=big('UNENTSCHIEDEN',cl((t-46.1)/12),'#ffe36a',84,620);
 $('tk').innerHTML=h;}
