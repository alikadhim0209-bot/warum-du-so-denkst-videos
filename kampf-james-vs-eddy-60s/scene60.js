// 60-Sekunden-Kampf. Braucht ../kampf-james-vs-eddy-3d/scene.js (Figuren, Posen, Effekte). render60(t) zeichnet Sekunde t.
const PI=Math.PI;let T=0,A0=0,SH=0,FL=0,INV=false,SPD=0,BAR=0,capOn=false,CAM=null,BIG=null,nG=0,nA=0,nC=0,LJ=false,AG=false;
const rings2=[];for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.86,1,48),fxM(0xffffff));m.rotation.x=-PI/2;m.visible=false;scene.add(m);rings2.push(m);}
const arcs2=[];for(let i=0;i<10;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(1,.1,6,28,PI*.9),fxM(0xf2f7fa));m.visible=false;scene.add(m);arcs2.push(m);}
const ov=document.createElement('div');ov.style.cssText='position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:hidden;pointer-events:none';document.body.appendChild(ov);
ov.innerHTML='<div id="spd" style="position:absolute;inset:-20%;opacity:0;-webkit-mask-image:radial-gradient(circle at 50% 46%,transparent 26%,#000 68%)"></div><div id="cuts" style="position:absolute;inset:0"></div><div id="fl2" style="position:absolute;inset:0;background:#fff;opacity:0"></div><div id="bt" style="position:absolute;left:0;right:0;top:0;height:0;background:#000"></div><div id="bb" style="position:absolute;left:0;right:0;bottom:0;height:0;background:#000"></div>'+
 '<div id="cap" style="position:absolute;left:50%;top:1480px;white-space:nowrap;font:900 78px Impact,Arial Black,sans-serif;color:#ffd23f;-webkit-text-stroke:14px #17110f;paint-order:stroke fill;opacity:0"></div><div id="big" style="position:absolute;left:50%;top:300px;transform:translateX(-50%);white-space:nowrap;font:900 112px Impact,Arial Black,sans-serif;color:#fff;-webkit-text-stroke:14px #17110f;paint-order:stroke fill;opacity:0"></div>';
const cuts=[];for(let i=0;i<40;i++){const d=document.createElement('div');d.style.cssText='position:absolute;height:10px;width:1700px;background:#fff;box-shadow:0 0 0 3px #17110f;opacity:0';document.getElementById('cuts').appendChild(d);cuts.push(d);}
const $=id=>document.getElementById(id);
function shock(c,s0,sz=14,d=.9){for(let k=0;k<3;k++){const u=(T-A0-s0-k*.12)/d;if(u>0&&u<1&&nG<rings2.length){const m=rings2[nG++];m.visible=true;m.position.set(c.x,.08+k*.02,c.z);m.scale.setScalar(1+sz*eo(u));m.material.opacity=1-u;}}}
function arc(pos,rot,sc,op){if(nA>=arcs2.length)return;const m=arcs2[nA++];m.visible=true;m.position.copy(pos);m.rotation.set(rot[0],rot[1],rot[2]);m.scale.set(sc,sc,.35);m.material.opacity=op;}
const bst=(c,s0,n,R,seed,col,d)=>burst(c,A0+s0,T,n,R,seed,col,d),pf=(c,s0,n,sp,seed)=>puff(c,A0+s0,T,n,sp,seed);
function cap(txt,s0,d=1.2){const u=(T-A0-s0)/d;if(u>=0&&u<1){const el=$('cap');el.textContent=txt;el.style.opacity=Math.min(1,u*10)*Math.min(1,(1-u)*5);el.style.transform='translateX(-50%) rotate(-4deg) scale('+(1+.7*Math.max(0,1-u*9))+')';capOn=true;}}
function flash(s0,d=.15,a=1){const u=(T-A0-s0)/d;if(u>=0&&u<1)FL=Math.max(FL,a*(1-u));}
function inv(s0,d=.1){const x=T-A0-s0;if(x>=0&&x<d)INV=true;}
function shake(s0,d,a){const u=(T-A0-s0)/d;if(u>=0&&u<1)SH=Math.max(SH,a*(1-u));}
function cutLines(s0,n,seed,d=.5){for(let i=0;i<n&&nC<cuts.length;i++){const u=(T-A0-s0-i*(d/n))/.22;if(u<0||u>1)continue;const el=cuts[nC++];el.style.opacity=1-u;el.style.left=(-310+rnd(seed+i)*80)+'px';el.style.top=(350+rnd(seed+i+9)*1200)+'px';el.style.height=(5+11*(1-u))+'px';el.style.transform='rotate('+(rnd(seed+i+3)*150-75)+'deg) scaleX('+(.35+u*.7)+')';}}
const EP={guard:[[-.25,.75,.95],[.25,.7,.9],[.75,.9,.1],[-.75,.9,.1]],rest:[[-1.02,-.25,.3],[1.02,-.25,.3],[-.3,-1,.4],[.3,-1,.4]],iai:[[-.7,-.1,.1],[-.45,-.05,.35],[-.5,-.2,-1],[-.4,-.1,-1]],
 cross:[[-.25,.9,.95],[.25,.9,.95],[.8,.7,.1],[-.8,.7,.1]],over:[[-.35,1.9,.3],[.35,1.95,.3],[.95,.3,0],[-.95,.3,0]],wide:[[-1.5,.55,0],[1.5,.55,0],[-1,.05,0],[1,.05,0]],up:[[-.5,1.9,.2],[.5,1.9,.2],[-.2,1,.1],[.2,1,.1]],
 down:[[-.9,-.5,.6],[.9,-.5,.6],[-.3,-.8,.6],[.3,-.8,.6]],cutR:[[.9,1.4,.4],[1.2,.9,.2],[.8,.7,-.3],[1,.3,-.3]],cutL:[[-1.2,.2,.9],[-.9,-.2,.9],[-1,-.3,.4],[-.9,-.5,.5]],kneel:[[-.9,-.6,.6],[.9,-.6,.6],[-.2,-1,.2],[.2,-1,.2]]};
const EB=o=>Object.assign({x:0,y:0,z:0,yaw:-PI/2+.55,lean:0,hip:1.95,wide:.12},o),mo=()=>({mouth:T>=8.45,angry:AG});
function ED(c,e,pa,pb,u,o={}){const P1=EP[pa],P2=EP[pb||pa];u=u||0;const m=i=>[0,1,2].map(q=>P1[i][q]+(P2[i][q]-P1[i][q])*u);let hl=[m(0),m(1)],d=[V(...m(2)),V(...m(3))];
 if(o.spin){const a=T*20;hl=[[-.95,.5,.9],[.95,.5,.9]];d=[V(Math.cos(a),Math.sin(a),.25),V(Math.cos(1-a),Math.sin(1-a),.25)];}if(o.whirl)e.yaw+=T*17;
 const h=[side(c,e,0,hl[0][0],hl[0][1],hl[0][2]),side(c,e,0,hl[1][0],hl[1][1],hl[1][2])];e.h=h;e.bend=[V(0,-.12,0),V(0,-.12,0)];pose(c,e);show(c,true);
 for(let i=0;i<2;i++){const s=c.sw[i];s.position.copy(h[i]);s.quaternion.setFromUnitVectors(V(0,1,0),d[i].normalize().transformDirection(c.b.matrixWorld));}
 c.sw[2].visible=!!o.mouth;if(c.back)c.back.visible=!o.mouth;c.hm.map=o.angry?EF.a:EF.n;
 if(o.spin)for(let i=0;i<2&&nR<spinR.length;i++){const r=spinR[nR++];r.visible=true;r.position.copy(h[i]);r.quaternion.copy(c.b.getWorldQuaternion(new THREE.Quaternion()));r.scale.set(2.25,2.25,1);r.material.opacity=.5;}
 if(o.whirl&&nR<spinR.length){const r=spinR[nR++];r.visible=true;r.position.set(e.x,(e.y||0)+2.5,e.z||0);r.rotation.set(PI/2,0,0);r.scale.set(3.7,3.7,1);r.material.opacity=.55;}return h;}
function JB(o){const j=Object.assign({x:-2.6,y:0,z:0,yaw:PI/2-.65,lean:0,hip:1.95,wide:.14,S:1},o);j.hd=(dx,dy,dz)=>side(Jm,j,0,dx,dy,dz);j.rest=[j.hd(-1.02,-.25,.25),j.hd(1.02,-.25,.25)];j.h=[j.rest[0].clone(),j.rest[1].clone()];j.fist=[1,1];j.wob=[0,0];j.bend=[V(0,-.2,0),V(0,-.2,0)];j.ph=T*18;return j;}
function JP(j){if(LJ)Jm.hm.map=JF.l;pose(Jm,j);}
function gat(C,per,sp=1){for(let k=0;k<6;k++){const ph=T/per+k/6,u=ph%1,e2=u<.45?u/.45:1-(u-.45)/.55,nn=Math.floor(ph);const s0=Jm.sh[k%2].getWorldPosition(V()),tg=V(C.x+(rnd(k+nn)-.5)*sp,C.y+(rnd(k+3+nn)-.5)*2*sp,C.z+(rnd(k+6)-.5)*1.4*sp),h=s0.clone().lerp(tg,e2);
 gatA[k].vis(true);gatA[k].set(s0,h,V(),0,0,.12);gatF[k].visible=true;gatF[k].position.copy(h);gatF[k].scale.setScalar(1+.6*e2);burst(tg,(nn-k/6+.45)*per,T,5,.9,k*7+nn,k%2?0xffd23f:0xffffff,.2);}}
const SC=[
[0,3,s=>{JP(JB({}));ED(Ed,EB({x:2.6}),'rest');CAM={p:kf(s,[[0,[7,10,19]],[3,[0,2.6,12.8]]]),q:[0,2.4,0]};BAR=150;BIG=['JAMES <span style="color:#ffd23f">VS</span> EDDY',cl(s/.3)*(1-cl((s-2.2)/.4))];}],
[3,5,s=>{const d=ease(cl((s-1.0)/.14)),bk=ease(cl((s-1.5)/.4)),lim=ease(cl((s-.95)/.12))*(1-ease(cl((s-1.3)/.5)));
 const j=JB({lean:-1.1*lim,hip:1.95-.5*lim});const wb=Math.max(0,1-(s-1.3)/.6)*(s>1.3?1:0);j.wob=[.3*wb*Math.sin(T*30),.3*wb*Math.cos(T*30)];JP(j);if(wb>0){const sq=1+.12*wb*Math.sin(T*30);Jm.g.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));}
 const e=EB({x:2.6-3.8*d+3.8*bk,lean:.35*(1-bk),hip:1.95-.45*cl(s/.6)*(1-bk),y:1.2*Math.sin(PI*bk)});if(s<1)ED(Ed,e,'rest','iai',ease(cl(s/.7)));else ED(Ed,e,'cutL','guard',bk);
 if(s>=1&&s<1.25)arc(V(-1.5,2.4,.5),[0,0,PI*.55],3+16*(s-1),1-(s-1)*4);flash(1.05,.12,.8);inv(1.03,.07);cap('IAI-BLITZSCHNITT!',1.0,1.0);bst(V(-2.4,2.6,.5),1.45,10,1.6,2,0xffffff,.3);cutLines(1.0,2,5,.05);if(s>.95&&s<1.2)SPD=.8;shake(1.0,.3,.2);
 BAR=150*(1-cl((s-.9)/.2));CAM={p:[0,2.3,12.5],q:[0,2.3,0]};}],
[5,8,s=>{const j=JB({});let ex=2.6+1.0*ease(cl((s-.7)/.25)),ey=0,pa='guard',pb='cross',pu=cl((s-.4)/.2),o={};
 if(s<.9){if(s<.5)j.h[1]=A(kf(s,[[0,j.rest[1].toArray()],[.5,[-12,2.6,.3]]],eo));else if(s<.7){j.h[1]=A(kf(s,[[.5,[-12,2.6,.3]],[.7,[1.9,2.5,.1]]],ei));j.bend[1]=V();SPD=.6;}else{j.h[1]=V(1.9+1.0*cl((s-.7)/.2),2.5,.1);j.bend[1]=V();}j.lean=s<.5?-.28*cl(s/.5):.3;}
 else if(s<1.7){const u=cl((s-1.0)/.5),a=1.3-2.6*ease(u),r=7*Math.sin(PI*cl((s-.9)/.8));j.f=[null,V(j.x+r*Math.cos(a)+.3,1.3*Math.min(1,r),r*Math.sin(a))];j.lean=-.25;j.h[1]=A(kf(s,[[.9,[2.9,2.5,.1]],[1.2,j.rest[1].toArray()]],eo));
  ey=2.6*Math.sin(PI*cl((s-1.05)/.5));pa='cross';pb='up';pu=Math.sin(PI*cl((s-1.05)/.5));}
 else{j.hideArm=[true,true];j.lean=.2;o.spin=true;}
 JP(j);if(s>=1.7)gat(V(3.3,2.4,.3),.3);ED(Ed,EB({x:s<1.7?ex:3.6,y:ey}),pa,pb,pu,o);
 bst(V(2.0,2.5,.3),.7,16,2.2,1,0xffd23f);shake(.7,.3,.25);flash(.7,.1,.5);cap('GUMMI-PISTOLE!',.45,.5);cap('GUMMI-PEITSCHE!',.95,.72);cap('GUMMI-GATLING!',1.7,1.2);if(s>1.7)SH=Math.max(SH,.06);
 CAM={p:kf(s,[[0,[-.5,2.5,12.5]],[.7,[1.2,2.3,11]],[1.7,[0,2.6,13.5]],[3,[2.2,2.2,12]]]),q:kf(s,[[0,[0,2.4,0]],[3,[.8,2.5,0]]])};}],
[8,12,s=>{const j=JB({});let e=EB({x:3.6}),pa='guard',pb='guard',pu=0,o={mouth:s>.45};
 if(s<1){pa='rest';pb='guard';pu=ease(cl((s-.5)/.4));BAR=150;CAM={p:[4.4,3.3,6.2],q:[3.5,3.5,0]};bst(V(3.5,3.8,.6),.45,8,1,3,0xffffff,.25);}
 else if(s<2.7){const ts=[1.1,1.5,1.9],k=ts.filter(x=>s>=x-.15).length-1;if(k>=0){pa='cutR';pb='cutL';pu=ease(cl((s-(ts[k]-.15))/.3));}
  ts.forEach((t0,i)=>{const u=(s-t0)/.4;if(u>0&&u<1)arc(V(3-6*u,2.4+(i==1?-.9:0),.3),[0,0,PI*.55],1.8+u,1);if(i==2){const ub=(s-t0-.4)/.35;if(ub>0&&ub<1)arc(V(-3+6.2*ub,2.4+2*Math.sin(PI*ub),.3),[0,0,-PI*.45],2.6,1);}});
  const d1=Math.sin(PI*cl((s-1.2)/.4)),d2=Math.sin(PI*cl((s-1.6)/.45));j.lean=-1.1*d1;j.hip=1.95-.5*d1;j.y=3.2*d2;j.tuck=.5*d2;
  bst(V(-2.2,2.6,.4),2.3,10,1.6,4,0xffffff,.25);bst(V(3.3,2.6,.4),2.65,12,1.8,6,0xffd23f,.25);cap('FLIEGENDE KLINGE!',1.05,.95);cap('GUMMI-BALLON!',2.0,.65);CAM={p:[0,2.6,13.2],q:[0,2.5,0]};}
 else{const u=cl((s-2.7)/.5);e.x=3.6-5.4*ease(u);o.whirl=true;pa='wide';const up=cl((s-3.2)/.8);j.y=16*eo(up);j.roll=up*9;j.tuck=.5*up;j.lean=-.4*up;
  bst(V(-2.2,2.4,.3),3.2,18,2.6,8,0xffd23f);shake(3.2,.4,.4);flash(3.2,.1,.7);inv(3.2,.07);cap('DRACHENWIRBEL!',2.7,1.1);if(s<3.2)SPD=.7;for(let i=0;i<4;i++)pf(V(e.x,0,0),2.7+i*.12,5,1.6,i*13);
  CAM={p:kf(s,[[2.6,[0,2.6,13.2]],[3.2,[0,2.2,13.5]],[4,[0,1.4,15]]]),q:kf(s,[[2.6,[0,2.5,0]],[3.2,[-.8,2.6,0]],[4,[-1.5,7.5,0]]])};}
 JP(j);if(s>=2&&s<2.6){const bl=Math.sin(PI*cl((s-2.0)/.6));Jm.g.scale.set(1+1.1*bl,1+.5*bl,1+1.1*bl);}ED(Ed,e,pa,pb,pu,o);}],
[12,16,s=>{const fall=cl(s/1.0),land=cl((s-1.0)/.25);const j=JB({y:16*(1-fall*fall),tuck:.5*(1-land),hip:1.95-.8*Math.sin(PI*cl((s-1.0)/.9)),lean:s<1?-.3:0});
 if(s>1.3){const la=cl((s-1.3)/.4),shk=Math.sin(T*24)*la,up=cl((s-3.2)/.5);j.lean=-.2*la+.04*shk;j.nod=-.28*la+.08*shk;j.h=[j.hd(-.5-1.7*up,.1+2*up+.05*shk,.6),j.hd(.5+1.7*up,.1+2*up-.05*shk,.6)];j.wob=[.25*up*Math.sin(T*14),.25*up*Math.cos(T*14)];if(up>0)j.y=.8*Math.abs(Math.sin(T*9))*up;}
 JP(j);if(s>3.2){const sq=1+.14*Math.sin(T*9);Jm.g.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));}
 ED(Ed,EB({x:3.2+.6*cl((s-2)/1),lean:-.12*cl((s-2)/1)}),'guard','guard',0,mo());
 shock(V(-2.6,0,0),1.0,10);pf(V(-2.6,0,0),1.0,14,4,7);shake(1.0,.5,.4);flash(1.0,.1,.5);
 aura[0].position.set(-2.6,2.4,0);aura[0].material.color.set(0xffffff);aura[0].material.opacity=.35*Math.sin(PI*cl((s-1.9)/1.6));aura[0].scale.setScalar(1.2+.1*Math.sin(T*20));
 for(let k=0;k<4;k++)pf(V(-2.6,0,0),2.0+k*.3,7,2.6,k*17);shock(V(-2.6,0,0),3.0,16,1.1);cap('WEISSE GUMMI-FORM!',2.6,1.3);
 CAM={p:kf(s,[[0,[-2.6,1.2,10]],[1,[-2.2,1.6,10]],[1.6,[-3.0,2.8,8.2]],[3.0,[-3.0,2.8,8.6]],[4,[.3,3.2,15]]]),q:kf(s,[[0,[-2.6,9,0]],[1,[-2.6,2.2,0]],[3,[-2.9,2.9,0]],[4,[.2,2.8,0]]])};}],
[16,19,s=>{const C=V(1,2.2,0),N=10,leg=.26,i=Math.min(N-1,Math.floor(s/leg)),u=(s-i*leg)/leg,out=k=>{const a=k*2.4+.6;return V(C.x+5.2*Math.cos(a),1.2+3.8*rnd(k+2),3.2*Math.sin(a));};
 let P;if(s<N*leg)P=u<.5?out(i).lerp(C,ei(u*2)):C.clone().lerp(out(i+1),eo(u*2-1));else P=out(N).lerp(V(-3.4,1.95,0),eo(cl((s-N*leg)/.4)));
 const bu=1-cl((s-N*leg)/.3),j=JB({x:P.x,y:Math.max(0,P.y-1.95),z:P.z,tuck:.6*bu,hip:1.95-.5*bu,roll:T*18*bu});j.h=[j.hd(-.4,.2,.5),j.hd(.4,.2,.5)];JP(j);if(bu>0)Jm.g.scale.set(1+.25*bu,1-.15*bu,1+.25*bu);
 const kn=cl((s-2.2)/.4),hn=Math.floor(s/leg+.5);ED(Ed,EB({x:1,lean:.12*Math.sin(T*31)+.3*kn,hip:1.95-.6*kn,yaw:-PI/2+.55+1.2*Math.sin(hn*2.1)}),'guard','kneel',kn,Object.assign(mo(),{spin:kn<=0}));
 for(let k=0;k<N;k++)bst(C.clone().add(V(rnd(k)-.5,(rnd(k+4)-.5)*1.5,.5)),(k+.5)*leg,9,1.5,k*11,k%2?0xffd23f:0xffffff,.22);
 SH=Math.max(SH,.1*bu);SPD=.5*bu;cap('GUMMIBALL!',.05,1.2);CAM={p:[1,3.4,15.5],q:[1,2.8,0],roll:.05*Math.sin(T*3)};}],
[19,22,s=>{const j=JB({x:-3.4}),e=EB({x:2.6});let pa='kneel',pb='guard',pu=cl(s/.3);const dig=cl(s/.3),pop=cl((s-.4)/.5);let ey=7*eo(pop);if(s>=1.5)ey=7*(1-ei(cl((s-1.5)/.3)));
 if(s<1.0){j.lean=.5*dig;j.hideArm=[true,true];}
 else if(s<2.0){const gr=cl((s-1.0)/.25),E=V(2.6,ey+2.2,0);j.h=[LL(j.rest[0],E.clone().add(V(0,0,.75)),gr),LL(j.rest[1],E.clone().add(V(0,0,-.75)),gr)];j.bend=[V(0,1.5,1.5),V(0,1.5,-1.5)];j.lean=s<1.5?-.3:.4;}
 if(s>=1.8){pa='kneel';pu=0;e.hip=1.0;e.lean=.6;}else if(s>=.4){pa='up';pb='up';e.roll=T*6;}
 JP(j);if(s<1.0)for(let k=0;k<4;k++){const s0=Jm.sh[k%2].getWorldPosition(V()),tg=V(2.6+(k<2?-.35:.35),-1+(ey+2.4)*pop,(k%2?-.35:.35)),hh=pop<=0?LL(s0,V(-2.2,-.6,(k%2?-.5:.5)),dig):tg;gatA[k].vis(true);gatA[k].set(s0,hh,V(0,-4*pop-.5,0),0,0,.12);gatF[k].visible=true;gatF[k].position.copy(hh);gatF[k].scale.setScalar(1.3);}
 e.y=ey;ED(Ed,e,pa,pb,pu,mo());
 for(let k=0;k<3;k++)pf(V(2.6,0,0),.4+k*.1,7,2,k*9);bst(V(2.6,1.2,.3),.42,14,2,3,0xffd23f);shake(.42,.3,.3);cap('MAULWURF-FAUST!',.3,.9);
 bst(V(2.6,9,.3),1.25,8,1.4,5,0xffffff,.25);cap('GUMMI-HAMMER!',1.3,.9);shock(V(2.6,0,0),1.8,16);pf(V(2.6,0,0),1.8,16,5,31);shake(1.8,.6,.6);flash(1.8,.12,.8);inv(1.8,.07);
 CAM={p:kf(s,[[0,[0,2.6,13.5]],[.5,[0,2,14.5]],[1.2,[.5,1.6,16]],[1.8,[1,2.4,13]],[3,[1.5,2.6,12]]]),q:kf(s,[[0,[0,2.2,0]],[.5,[1,2.4,0]],[1.2,[1.6,5.5,0]],[1.8,[2,2,0]],[3,[1.5,2.2,0]]])};}],
[22,26,s=>{const j=JB({x:-3.8}),sp=A(kf(s,[[0,[-.6,-1.4,0]],[1.3,[-2.6,8.4,0]],[2.0,[-2.9,8.8,0]],[2.6,[3.0,3.8,0]]])),sl=s-2.6;
 if(s<3.25)slab.forEach((g,i)=>{g.visible=true;const q=i?-1:1;if(sl<0){g.position.copy(sp);g.rotation.set(0,.3,(s>1.3?.12*Math.sin(T*7):0)-(s>2?(s-2)*1.4:0));}else{g.position.set(3.0,Math.max(.2,3.8+2.5*sl-9*sl*sl),q*(1.2+2.4*Math.min(sl,.75)));g.rotation.set(q*Math.min(sl,.75)*1.6,.3,-.84+q*.3*sl);if(sl>.35)g.position.y-=(sl-.35)*9;}});
 if(s<2.6){j.h=[sp.clone().add(V(-1.4,-.75,1)),sp.clone().add(V(-.4,-.75,-1))];j.bend=[V(),V()];j.lean=s<1.3?.3:-.2;}else if(s<3.2){const u=eo((s-2.6)/.6);j.h=[LL(V(1.6,2.9,1),j.rest[0],u),LL(V(2.6,2.9,-1),j.rest[1],u)];j.wob=[.4*(1-u)*Math.sin(T*36),.4*(1-u)*Math.cos(T*36)];j.bend=[V(),V()];}
 JP(j);const up=cl((s-.6)/1.0);
 ED(Ed,EB({x:3.0,hip:1.0+.95*up,lean:.6*(1-up),nod:-.35*up}),s<2.3?'kneel':(s<3.0?'cutR':'cutL'),s<2.3?'guard':(s<3.0?'cutL':'down'),s<2.3?up:(s<3.0?ease(cl((s-2.45)/.2)):cl((s-3.0)/.5)),mo());
 for(let k=0;k<3;k++)pf(V(-.6,0,0),k*.3,8,4,k*23+5);shake(0,1.3,.12);cap('WELTENWURF!',1.9,.65);
 if(s>=2.5&&s<3.0){const u=(s-2.5)/.5;arc(V(3,3.8,.6),[0,0,PI*.05+.9],2.6+u*2,.9*(1-u));arc(V(3,3.8,.6),[0,0,PI*.05-.9],2.6+u*2,.9*(1-u));}
 bst(V(3,3.8,.4),2.6,22,3.5,11,0xffffff,.4);inv(2.6,.1);flash(2.6,.12,.9);shake(2.6,.4,.4);cap('WELTENSCHNITT!',2.6,1.1);pf(V(3,0,-3),3.3,8,3,71);pf(V(3,0,3),3.3,8,3,77);
 CAM={p:kf(s,[[0,[-.5,1.6,16]],[1.3,[-.5,1.3,17]],[2.0,[-.5,1.6,17]],[2.6,[1.2,2.4,13.5]],[3.2,[2.2,2.4,10]],[4,[3.4,2.5,8]]]),q:kf(s,[[0,[-1,2.6,0]],[1.3,[-1.5,5.4,0]],[2.0,[-1,5.2,0]],[2.6,[1.8,3.2,0]],[4,[3,2.6,0]]])};}],
[26,29,s=>{JP(JB({x:-3.8}));const form=ease(cl((s-1.4)/.6));
 eds.forEach((c,k)=>{if(k&&s<1.4)return;const th=k*2.094+.5;ED(c,EB({x:3.0+.95*form*Math.cos(th)+(k?0:.04*Math.sin(T*70)),z:.95*form*Math.sin(th),yaw:form>.02?Math.atan2(Math.cos(th),Math.sin(th)):-PI/2+.55,lean:.12}),'down','guard',cl((s-.3)/.5),mo());if(k)pf(V(3,0,0),1.4,5,1.6,k*31);});
 const au=cl((s-.3)/.5);aura[1].position.set(3,2.4,0);aura[1].material.color.set(0x0b3d1a);aura[1].material.opacity=.28*au*(1-.6*form);aura[1].scale.setScalar(.85+.3*form+.08*Math.sin(T*30));pl[1].position.set(3,2.5,2);pl[1].intensity=25*au;
 shock(V(3,0,0),.3,8,.8);shock(V(3,0,0),1.4,12,.8);shake(.3,2.5,.08);flash(1.4,.12,.6);cap('DREI-KLINGEN-DÄMON!',1.4,1.4);BAR=150*(1-cl((s-1.2)/.3));
 const a=-.5+s*.45;CAM={p:[3+8.5*Math.sin(a),3.2,8.5*Math.cos(a)],q:[3,2.6,0]};}],
[29,34,s=>{const TG=[[2.5,0],[-2.5,0],[0,-2.6]],go=ease(cl(s/.8)),close=cl((s-.8)/2.4),fly=eo(cl((s-3.7)/.6)),lie=cl((s-4.2)/.2);
 const j=JB({x:-7.5*fly,y:3*Math.sin(PI*cl((s-3.7)/.6)),yaw:s<3.7?Math.sin(T*2.6)*1.3:PI/2-.65,roll:fly<1?fly*8:0,lean:s>2.2&&s<3.7?.25*Math.sin(T*40):(-1.3*lie),hip:1.95-1.3*lie});
 if(s>=1.0&&s<2.2){const a=T*16,u=cl((s-1.0)/.3)*(1-cl((s-2.0)/.2));j.h=[LL(j.rest[0],V(3.2*Math.cos(a),2.5,3.2*Math.sin(a)),u),LL(j.rest[1],V(-3.2*Math.cos(a),2.5,-3.2*Math.sin(a)),u)];j.bend=[V(),V()];}
 if(s>2.2)Jm.hm.map=JF.n;if(s>2.2)pose(Jm,j);else JP(j);
 eds.forEach((c,k)=>{const th=k*2.094+.5,fx=3+.95*Math.cos(th),fz=.95*Math.sin(th),rr=1-.35*close,x=fx+(TG[k][0]*rr-fx)*go,z=fz+(TG[k][1]*rr-fz)*go,wh=s<3.6;
  ED(c,EB({x,z,y:Math.sin(PI*go)*(k?2.4:.6),yaw:Math.atan2(-x,-z),lean:wh?0:.2}),wh?'wide':'cutL','cutL',0,Object.assign(mo(),{whirl:wh}));});
 for(let i=0;i<22;i++){const k=i%3;bst(V(TG[k][0]*.4,1.6+rnd(i)*1.8,TG[k][1]*.4+.3),.9+i*.12,5,.9,i*19,i%2?0xffd23f:0xffffff,.2);}
 cutLines(2.2,36,7,1.4);cap('TAUSEND SCHNITTE!',2.2,1.3);if(s>2.2&&s<3.6)SH=Math.max(SH,.12);
 bst(V(0,2.5,.3),3.65,30,5,3,0xffffff,.4);flash(3.65,.15,1);inv(3.65,.1);shake(3.65,.5,.5);shock(V(0,0,0),3.65,14);pf(V(-7.5,0,0),4.25,12,3,5);
 CAM={p:kf(s,[[0,[1.5,4.4,15]],[.8,[0,4.8,14.5]],[2.2,[0,3.6,11.5]],[3.6,[0,3.6,11.5]],[4.2,[-2.5,3.4,15]],[5,[-3,3.2,15]]]),q:kf(s,[[0,[1.2,2.3,0]],[.8,[0,2.2,0]],[3.6,[0,2.4,0]],[4.2,[-3,2,0]],[5,[-3.5,1.8,0]]])};}],
[34,37,s=>{const up=cl((s-.2)/1.0),j=JB({x:-7.5,lean:-1.3*(1-up)-.9*cl((s-1.6)/.2),hip:.65+1.3*up});Jm.hm.map=JF.n;pose(Jm,j);const gone=s>=2.0;
 eds.forEach((c,k)=>{if(k&&gone)return;const z=[0,-1.7,1.7][k];ED(c,EB({x:2.5,z,lean:s>2?.25:.15,hip:s>2?1.8+.05*Math.sin(T*6):1.95}),s<.95?'guard':(s<2?'cutR':'cutL'),s<.95?'cutR':(s<2?'cutL':'down'),s<.95?cl((s-.3)/.6):(s<2?ease(cl((s-.95)/.15)):cl((s-2)/.4)),mo());
  if(k)pf(V(2.5,0,z),2.0,8,1.6,k*53);const u=(s-1.0)/.6;if(u>0&&u<1)arc(V(2-8.5*u,2.5,z*(1-u)+.3),[0,0,PI*.55],1.8+2.4*u,1);});
 cap('DREIFACH-KLINGE!',.95,1.2);if(s>1&&s<1.6)SPD=.6;
 bst(V(-7,2.4,.4),1.6,40,6,9,0xffffff,.5);flash(1.6,.2,1);inv(1.6,.1);shake(1.6,.7,.7);shock(V(-7,0,0),1.6,16);for(let k=0;k<5;k++)pf(V(-7,0,0),1.6+k*.12,12,5,k*29);
 CAM={p:kf(s,[[0,[0,3,15]],[1,[.5,2.8,15]],[1.6,[-3,3,17]],[3,[-2.5,3,17.5]]]),q:kf(s,[[0,[1.5,2.4,0]],[1,[1,2.4,0]],[1.6,[-3.5,2.4,0]],[3,[-3,2.4,0]]])};}],
[37,40,s=>{const S=1+2.4*ease(cl((s-1.0)/1.6)),shk=Math.sin(T*24),j=JB({x:-6,S,lean:-.15+.03*shk,nod:-.2+.08*shk});j.h=[j.hd(-1.6,.6,.4),j.hd(1.6,.6,.4)];JP(j);
 ED(Ed,EB({x:3,nod:-.4*cl((s-1)/1),lean:-.1}),'down','guard',cl((s-1.2)/.6),mo());
 for(let k=0;k<6;k++)pf(V(-6,0,0),k*.35,10,4+k,k*13);shake(1.0,1.8,.15);shock(V(-6,0,0),1.0,18,1.2);shock(V(-6,0,0),2.0,22,1.2);cap('RIESEN-FORM!',1.3,1.3);
 CAM={p:kf(s,[[0,[-2.5,3,16]],[1,[-1.5,3,18]],[2.8,[0,3,31]],[3,[0,3,31]]]),q:kf(s,[[0,[-3.5,2.4,0]],[1,[-3,3,0]],[2.8,[-1,6.5,0]],[3,[-1,6.5,0]]])};}],
[40,44,s=>{const j=JB({x:-6,S:3.4}),e=EB({x:2.5});let pa='guard',pb='guard',pu=0;
 if(s<1.3){const u=cl(s/.6),dn=ei(cl((s-.6)/.2));j.f=[null,V(2.5-4*(1-ease(u)),7*ease(u)*(1-dn),0)];j.lean=-.15;const dg=ease(cl((s-.55)/.3));e.x=2.5+2.3*dg;e.y=1.4*Math.sin(PI*dg);e.roll=-dg*6.283;}
 else{e.x=4.8;const up=cl((s-1.4)/.6),dn=ei(cl((s-2.2)/.2)),psh=cl((s-3.0)/.5),top=V(j.x+4,17,0),hp=V(4.8,3.7+1.2*psh,0);j.h[1]=s<2.2?LL(j.rest[1],top,eo(up)):LL(top,hp,dn);if(s>=2.4&&s<3.4)j.h[1].x+=rnd(T*77)*.15;
  j.lean=s<2.2?-.2:.3;if(s>=3.5){const rc=eo(cl((s-3.5)/.4));j.h[1]=LL(V(4.8,4.9,0),V(j.x+5,14,0),rc);j.lean=.3-.55*rc;}j.fist[1]=1+1.3*up;j.bend[1]=V();
  const pr=cl((s-2.4)/.15)*(1-psh);pb='over';pu=cl((s-1.6)/.5);e.y=-.45*pr;e.hip=1.95-.75*pr;e.x+=.05*Math.sin(T*60)*pr;}
 JP(j);ED(Ed,e,pa,pb,pu,mo());
 shock(V(2.5,0,0),.8,18);pf(V(2.5,0,0),.8,16,6,3);shake(.8,.6,.6);flash(.8,.1,.6);cap('RIESEN-STAMPFER!',.3,.9);
 shock(V(4.8,0,0),2.4,20);pf(V(4.8,0,0),2.4,18,7,9);bst(V(4.8,3,.5),2.4,36,7,7,0xffd23f,.55);shake(2.4,.8,.8);flash(2.4,.15,1);inv(2.4,.1);cap('RIESENFAUST!',2.0,1.2);bst(V(4.8,5,.5),3.5,20,3,17,0xffffff,.35);shake(3.5,.3,.3);
 aura[1].position.set(4.8,2.4,0);aura[1].material.color.set(0x0b3d1a);aura[1].material.opacity=.25*cl((s-2.8)/.4);aura[1].scale.setScalar(.9);
 CAM={p:kf(s,[[0,[0,3,31]],[2.2,[0,3,31]],[2.5,[2,2,22]],[4,[3,2.4,18]]]),q:kf(s,[[0,[-1,6.5,0]],[2.2,[-1,6,0]],[2.5,[1,4,0]],[4,[2.5,4,0]]])};}],
[44,48,s=>{const shr=ease(cl((s-3.0)/.8)),j=JB({x:-6,S:3.4-2.4*shr,lean:s>2.8?-.5*(1-shr):.1}),hand=V(4.8,.6,0);j.h[1]=s<2.8?hand:LL(hand,j.rest[1],eo(cl((s-2.8)/.5)));j.fist[1]=s<2.8?2.3:1;j.bend[1]=V();Jm.hm.map=JF.n;pose(Jm,j);
 const sh=Jm.sh[1].getWorldPosition(V()),run=cl(s/2.2),jump=cl((s-2.2)/.6),fall=cl((s-2.9)/.7);let P=LL(hand,sh,run);P.y+=.45;
 if(s<2.2)ED(Ed,EB({x:P.x,y:P.y,z:P.z+.2,yaw:-PI/2+.2,lean:.45,step:[.5*Math.sin(T*24),-.5*Math.sin(T*24)]}),'cutL','cutL',0,mo());
 else if(s<2.9){P=LL(sh.clone().add(V(0,.45,0)),V(j.x+1.2,sh.y+4.2,2.2),eo(jump));P.y+=2.5*Math.sin(PI*jump);ED(Ed,EB({x:P.x,y:P.y,z:P.z,yaw:-PI/2+.2,tuck:.4,lean:.2}),'cutR','cutL',ease(cl((s-2.7)/.15)),mo());}
 else{P=LL(V(-4.8,15,2.2),V(2.6,0,0),ei(fall));ED(Ed,EB({x:P.x,y:P.y,z:P.z,tuck:.4*(1-fall),hip:1.95-.5*Math.sin(PI*cl((s-3.6)/.4))}),'cutL','guard',fall,mo());}
 for(let i=0;i<14;i++){const u=i/14;bst(LL(hand,sh,u).add(V(0,.6,.6)),u*2.2+.05,5,1,i*7,i%2?0xffd23f:0xffffff,.22);}
 if(s>=2.7&&s<3.2){const u=(s-2.7)/.5;arc(V(-5,14.4,2.6),[0,0,PI*.55],5+4*u,1-u);}
 inv(2.8,.12);flash(2.8,.15,1);shake(2.8,.6,.6);cap('GIPFELSCHNITT!',2.6,1.2);bst(V(-5,14.4,2.5),2.8,30,6,5,0xffffff,.5);for(let k=0;k<5;k++)pf(V(-6,0,0),3.0+k*.15,12,5,k*19);shock(V(2.6,0,0),3.6,8);if(s<2.2)SPD=.4;
 CAM={p:s<2.9?[P.x+2.5,P.y+1.2,P.z+11]:kf(s,[[2.9,[-2,10,22]],[3.6,[0,3,16]],[4,[0,2.8,14]]]),q:s<2.9?[P.x-.5,P.y+1.5,P.z]:kf(s,[[2.9,[-4,9,0]],[3.6,[-1.5,3,0]],[4,[0,2.4,0]]])};}],
[48,52,s=>{const pw=cl((s-2.0)/1.8),br=Math.sin(T*6)*.06*(1-pw),j=JB({lean:.3*(1-pw)-.25*pw,hip:1.8+br+.15*pw});if(pw>0){j.h[1]=LL(j.rest[1],V(-40,3,.5),eo(pw));j.wob[1]=.2*Math.sin(T*30);j.fist[1]=1+4*pw;}JP(j);
 ED(Ed,EB({x:2.6,lean:.25+.1*pw,hip:1.8-br-.3*pw}),'down','iai',ease(pw),mo());
 aura[1].position.set(2.6,2.2,0);aura[1].material.color.set(0x0b3d1a);aura[1].material.opacity=.25*pw;aura[1].scale.setScalar(.9+.08*Math.sin(T*30));aura[0].position.set(-2.6,2.4,0);aura[0].material.color.set(0xffffff);aura[0].material.opacity=.3*pw;aura[0].scale.setScalar(1.2+.1*Math.sin(T*26));
 for(let k=0;k<4;k++){shock(V(-2.6,0,0),2.0+k*.45,7,.7);shock(V(2.6,0,0),2.2+k*.45,7,.7);}if(pw>0)SH=Math.max(SH,.05*pw);
 cap('ALLES ODER NICHTS!',2.3,1.5);BAR=150;CAM={p:kf(s,[[0,[0,2.4,13.5]],[2,[0,2.4,12]],[4,[0,2.2,10.5]]]),q:[0,2.3,0]};}],
[52,55,s=>{const run=ei(cl(s/1.6)),jx=-9+8.2*run,ex=9-8.2*run,j=JB({x:jx,lean:.45,step:[.6*Math.sin(T*22),-.6*Math.sin(T*22)],hip:1.8}),fu=ei(cl((s-1.5)/.5));
 j.h[1]=s>=2?V(.2+rnd(T*77)*.12,2.6+rnd(T*31)*.1,.2):LL(V(jx-30,3,.5),V(.2,2.6,.2),fu);j.fist[1]=5+2*fu;j.bend[1]=V();j.wob[1]=.3*(1-fu)*Math.sin(T*30);JP(j);
 ED(Ed,EB({x:ex,lean:.45,hip:1.6,step:[.6*Math.sin(T*22+1),-.6*Math.sin(T*22+1)]}),'iai','cutL',ease(cl((s-1.85)/.15)),mo());
 if(s<2)SPD=.9;inv(2.0,.14);if(s>=2.14)FL=Math.max(FL,cl((s-2.14)/.5));shake(2.0,.9,.9);shock(V(0,0,0),2.0,24,1.2);bst(V(0,2.6,.4),2.0,44,8,3,0xffd23f,.6);bst(V(0,2.6,.4),2.05,30,6,33,0xffffff,.55);
 if(s>=1.8&&s<2.3){const u=(s-1.8)/.5;arc(V(.6,2.6,.5),[0,0,PI*.55],3+5*u,1-u);}
 CAM={p:kf(s,[[0,[0,3,30]],[1.6,[0,2.4,13]],[2,[0,2.4,11.5]],[3,[0,2.4,11.5]]],ei),q:[0,2.4,0]};}],
[55,58,s=>{FL=Math.max(FL,1-cl(s/.7));const jolt=cl((s-1.8)/.1)*(1-cl((s-2.2)/.6)),j=JB({x:3.2,yaw:PI/2+.3,lean:.25-.5*jolt,hip:1.8});j.h[1]=j.hd(1.3,.4,1.0);j.fist[1]=1.6;Jm.hm.map=JF.n;pose(Jm,j);
 ED(Ed,EB({x:-3.2,yaw:-PI/2-.3,lean:.35-.5*jolt,hip:1.55}),'cutL','cutL',0,mo());
 BAR=170;cutLines(1.8,10,91,.12);inv(1.8,.1);flash(1.9,.2,.9);shake(1.8,.8,.8);shock(V(0,0,0),1.8,22,1.3);bst(V(-3.2,2.5,.4),1.85,26,4,5,0xffffff,.5);bst(V(3.2,2.5,.4),1.85,26,4,15,0xffd23f,.5);for(let k=0;k<4;k++)pf(V(0,0,0),1.8+k*.1,14,7,k*41);
 CAM={p:kf(s,[[0,[0,2.2,12.5]],[1.8,[0,2.2,11.5]],[3,[0,2.6,13]]]),q:[0,2.3,0]};}],
[58,60.1,s=>{const f=ease(cl(s/.6)),j=JB({x:3.2,yaw:PI/2+.3,lean:-1.35*f,hip:1.8-1.2*f});j.h=[j.hd(-1.6,.2,.1),j.hd(1.6,.2,.1)];JP(j);
 ED(Ed,EB({x:-3.2,yaw:-PI/2-.3,lean:-1.35*f,hip:1.55-1.0*f}),'cutL','wide',f,{mouth:true,angry:false});
 pf(V(3.6,0,0),.5,10,2.5,3);pf(V(-3.6,0,0),.5,10,2.5,13);shake(.5,.3,.2);BIG=['UNENTSCHIEDEN!',eo(cl((s-.9)/.3))];CAM={p:kf(s,[[0,[0,2.8,13]],[1.2,[0,13,7]],[2,[0,14,6.5]]]),q:[0,.8,0]};}]
];
function render60(t){T=t;reset();nG=nA=nC=0;rings2.concat(arcs2).forEach(m=>m.visible=false);cuts.forEach(c=>c.style.opacity=0);SH=FL=SPD=BAR=0;INV=capOn=false;CAM=BIG=null;
 LJ=(t>=13.3&&t<31.2)||(t>=37.4&&t<44)||(t>=50&&t<55)||t>=58.5;AG=(t>=26.3&&t<48)||(t>=52&&t<58);
 const w=ease(cl((t-14.0)/1.2)),w2=ease(cl((t-15.0)/1.0)),el=ease(cl((t-15.2)/.8))*kf(t,[[0,1],[16.5,1],[17.5,.35],[60,.35]]);
 whiten(w);camera.fov=55;camera.updateProjectionMatrix();worldFx(t,w2,el,0);
 for(const [a,b,fn] of SC)if(t>=a&&t<b){A0=a;fn(t-a);break;}
 const c=CAM||{p:[0,2.6,13],q:[0,2.4,0]};camera.position.set(c.p[0]+(rnd(t*61)-.5)*2*SH,c.p[1]+(rnd(t*47)-.5)*2*SH,c.p[2]);camera.lookAt(c.q[0],c.q[1],c.q[2]);camera.rotation.z+=(c.roll||0)+.04*el*Math.sin(t*4);renderer.render(scene,camera);
 $('fl2').style.opacity=cl(FL);renderer.domElement.style.filter=INV?'invert(1) contrast(1.5)':'';$('bt').style.height=$('bb').style.height=BAR+'px';
 const sp=$('spd');sp.style.opacity=SPD;if(SPD>0){const col=w2>.5?'rgba(23,17,15,.55)':'rgba(255,255,255,.8)';sp.style.background='repeating-conic-gradient(from '+(rnd(Math.floor(t*30)*13)*360)+'deg at 50% 46%,rgba(0,0,0,0) 0deg 4.4deg,'+col+' 4.4deg 5deg)';}
 if(!capOn)$('cap').style.opacity=0;const bg=$('big');if(BIG){bg.innerHTML=BIG[0];bg.style.opacity=BIG[1];}else bg.style.opacity=0;}
