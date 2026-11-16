// Arcade-Kampf (läuft im Browser, 320x240). renderGame(t) zeichnet Sekunde t. BODY wird vom Renderskript gesetzt.
const W=320,H=240,GY=198,S=.062,OUT='#17110f',FOOT={J:1562,E:1650};
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),eo=u=>1-Math.pow(1-u,3),ei=u=>u*u,lin=u=>u;
function kf(t,k,fn=lin){if(t<=k[0][0])return k[0][1];for(let i=1;i<k.length;i++)if(t<=k[i][0]){const u=fn((t-k[i-1][0])/(k[i][0]-k[i-1][0]));return k[i-1][1]+(k[i][1]-k[i-1][1])*u;}return k[k.length-1][1];}
const rnd=i=>{const x=Math.sin(i*127.1)*43758.5453;return x-Math.floor(x);};
// Treffer: [Zeit, Schaden, Art]
const HJ=[[2.62,6],[2.92,6],[3.22,6]];for(let i=0;i<12;i++)HJ.push([12.3+i*.16,5.5]);
const HE=[[5.4,10],[5.9,10],[6.5,14],[7.3,8],[10.2,12],[11.0,2,'block']];for(let i=0;i<8;i++)HE.push([16.6+i*.08,3]);HE.push([17.9,40]);
const hp=(L,t)=>Math.max(0,100-L.filter(h=>h[0]<=t).reduce((a,h)=>a+h[1],0)),last=(L,t)=>{let r=-9;L.forEach(h=>{if(h[0]<=t)r=h;});return r;};
function combo(L,t){let n=0,lt=-9;for(const h of L){if(h[0]>t)break;if(h[2])continue;n=(h[0]-lt<.9)?n+1:1;lt=h[0];}return t-lt<.9?n:0;}
const P=(c,k,lx,ly)=>{const dx=(lx-316)*S*c.sx,dy=(ly-FOOT[k])*S*c.sy,r=c.rot*Math.PI/180;return [c.x+dx*Math.cos(r)-dy*Math.sin(r),GY-c.y+dx*Math.sin(r)+dy*Math.cos(r)];};
const tf=(c,k)=>`translate(${c.x.toFixed(1)} ${(GY-c.y).toFixed(1)}) rotate(${c.rot.toFixed(1)}) scale(${(S*c.sx).toFixed(4)} ${(S*c.sy).toFixed(4)}) translate(-316 ${-FOOT[k]})`;
const ln=(a,b,w,col)=>`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
const arm=(a,b,col='#fff',w=3.4)=>ln(a,b,w+2.2,OUT)+ln(a,b,w,col);
const fist=(p,r=3.4)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="#fff" stroke="${OUT}" stroke-width="${Math.max(1.2,r*.14)}"/>`;
function katana(h,ang,col){const a=ang*Math.PI/180,c=Math.cos(a),s=Math.sin(a),p=(d,o=0)=>[h[0]+c*d-s*o,h[1]+s*d+c*o];return ln(p(3),p(34),3.4,OUT)+ln(p(3),p(33),1.5,'#e8eef2')+ln(p(-6),p(2),3.6,OUT)+ln(p(-6),p(2),2,col)+ln(p(3,-3),p(3,3),2.6,'#f0b429');}
const star=(c,t0,t,R,col)=>{const u=(t-t0)/.14;if(u<0||u>1)return '';let d='';for(let i=0;i<14;i++){const a=i/14*6.283+t0,r=(i%2?R*.4:R)*(.5+u*.7);d+=(i?'L':'M')+(c[0]+Math.cos(a)*r).toFixed(1)+' '+(c[1]+Math.sin(a)*r).toFixed(1);}return `<path d="${d}Z" fill="${col||'#fff7c2'}" stroke="#ff7a1e" stroke-width="1.5"/>`;};
const cres=(c,R,a0,col,op=1)=>{const p=a=>[c[0]+Math.cos(a)*R,c[1]+Math.sin(a)*R],A=p(a0-1.1),B=p(a0+1.1),M=[c[0]+Math.cos(a0)*R*.45,c[1]+Math.sin(a0)*R*.45];return `<path d="M${A[0].toFixed(1)} ${A[1].toFixed(1)} A${R} ${R} 0 0 1 ${B[0].toFixed(1)} ${B[1].toFixed(1)} Q${M[0].toFixed(1)} ${M[1].toFixed(1)} ${A[0].toFixed(1)} ${A[1].toFixed(1)}Z" fill="${col}" stroke="#fff" stroke-width="1" opacity="${op}"/>`;};
const txt=(s,x,y,sz,fill,o={})=>`<text x="${x}" y="${y}" font-size="${sz}" text-anchor="${o.a||'middle'}" fill="${fill}" stroke="${o.st||OUT}" stroke-width="${o.sw==null?2.5:o.sw}" paint-order="stroke" stroke-linejoin="round" font-family="'DejaVu Sans Mono',monospace" font-weight="bold" ${o.x||''}>${s}</text>`;
function renderGame(t){const q=Math.floor(t*15)/15; // Figuren bewegen sich „stufig“ wie Sprites
 const hpJ=hp(HJ,t),hpE=hp(HE,t),lj=last(HJ,t),le=last(HE,t),stJ=lj!==-9?t-lj[0]:9,stE=le!==-9?t-le[0]:9,ko=t>=17.9;
 const bob=Math.round(Math.sin(q*7))*1.2;
 // ---------- James ----------
 const J={x:kf(q,[[0,95],[2.6,95],[2.7,89],[3.0,82],[3.35,72],[4.6,72],[5.2,92],[6.4,110],[7.6,118],[8.6,100],[9.0,100],[10.2,196],[10.5,176],[11.4,132],[12.2,132],[14.3,92],[15.4,92],[16.4,130],[17.9,140],[30,140]]),
  y:kf(q,[[0,0],[6.38,0],[6.5,14],[6.75,0],[9.0,0],[9.55,78],[10.2,34],[10.45,0],[30,0]]),rot:0,sx:1,sy:1};
 if(stJ<.14)J.rot=-12;if(q>9.6&&q<10.2)J.rot=28;if(q>=12.3&&q<14.3)J.rot=-10+8*Math.sin(q*40);if(hpJ<20&&q>14.3&&q<15.4)J.rot=6;
 if(q>=19.2){J.y=Math.abs(Math.sin(q*9))*9;}else if(!(q>9&&q<10.45))J.y+=bob*.8+ .8;
 // ---------- Eddy ----------
 const E={x:kf(q,[[0,225],[2.2,225],[2.55,132],[3.4,118],[4.6,150],[5.4,158],[5.9,170],[6.5,178],[7.3,212],[8.0,232],[10.2,232],[10.5,250],[11.0,246],[11.4,240],[12.2,240],[14.2,240],[16.4,240],[17.2,258],[17.9,262],[18.9,318],[19.4,330],[30,330]]),
  y:kf(q,[[0,0],[6.5,0],[6.9,70],[7.3,74],[7.9,0],[17.9,0],[18.4,44],[18.9,0],[19.15,10],[19.4,0],[30,0]]),rot:0,sx:1,sy:1};
 if(stE<.14&&!(le[2]))E.rot=12;if(q>6.5&&q<7.9)E.rot=(q-6.5)*260;if(ko){E.rot=q<19.4?(q-17.9)*300:90;if(q>=19.4)E.y=0;}else E.y+=-bob*.8+.8;
 const sup=q>=12.2&&q<14.2;if(sup){const k=Math.floor((q-12.2)/.16);E.x=J.x+(k%2?-34:34)+ (rnd(k)-.5)*8;E.y=(k%3)*6;}
 const SHj=[P(J,'J',162,568),P(J,'J',470,568)],SHe=[P(E,'E',198,600),P(E,'E',434,600)];
 let back='',mid='',front='';
 // ---------- James: Arme ----------
 let jb=P(J,'J',250,780),jl=P(J,'J',600,690),fr=3.4;const chest=[E.x-7,GY-E.y-58];
 const punch=(t0,tg,d=.1)=>{const u=cl((q-(t0-d))/d)*(1-cl((q-t0-.07)/.14));if(u>0)jl=[jl[0]+(tg[0]-jl[0])*u,jl[1]+(tg[1]-jl[1])*u];};
 punch(5.4,chest);punch(5.9,chest);punch(6.5,[E.x-5,GY-96],.12);punch(7.3,[E.x-6,GY-E.y-50],.14);punch(11.0,[E.x-17,GY-62]);
 let extra='';
 if(q>=16.5&&q<17.3){for(let k=0;k<4;k++){const u=((q-16.5)/.16+k/4)%1,e=u<.5?u*2:2-u*2,tg=[E.x-8,GY-40-rnd(k+Math.floor(q*8))*40],h=[SHj[k%2][0]+(tg[0]-SHj[k%2][0])*e,SHj[k%2][1]+(tg[1]-SHj[k%2][1])*e];extra+=arm(SHj[k%2],h)+fist(h,3.8);}}
 if(q>=17.3&&q<18.7){const wu=cl((q-17.3)/.42),sl=ei(cl((q-17.75)/.15)),rc=eo(cl((q-18.15)/.5));const a=[-30,GY-78],b=[E.x<300?E.x-14:250,GY-60];let p=[jl[0]+(a[0]-jl[0])*eo(wu),jl[1]+(a[1]-jl[1])*eo(wu)];p=[p[0]+(b[0]-p[0])*sl,p[1]+(b[1]-p[1])*sl];const hm=P(J,'J',600,690);jl=[p[0]+(hm[0]-p[0])*rc,p[1]+(hm[1]-p[1])*rc];fr=3.4+19*wu*(1-rc);}
 if(q>=19.2){jb=P(J,'J',20,300+60*Math.sin(q*9));jl=P(J,'J',620,300-60*Math.sin(q*9));}
 if(q>9.6&&q<10.25){const hip=P(J,'J',400,1150),ft=[E.x-10,GY-52];front+=arm(hip,ft,'#3a2a25',4)+`<rect x="${(ft[0]-4).toFixed(1)}" y="${(ft[1]-3).toFixed(1)}" width="9" height="6" fill="#4b342b" stroke="${OUT}"/>`;}
 const jArms=(q>=16.5&&q<17.3)?extra:arm(SHj[0],jb)+fist(jb)+arm(SHj[1],jl)+fist(jl,fr);
 // ---------- Eddy: Arme + Katanas ----------
 let el=P(E,'E',70,780),er=P(E,'E',500,800),a1=-125,a2=-62;
 const slash=(t0)=>{const u=cl((q-(t0-.1))/.16);if(q>=t0-.1&&q<t0+.2){a1=-70-150*u;el=P(E,'E',70-260*Math.sin(Math.PI*u),700);if(q>=t0-.04&&q<t0+.12)mid+=cres([E.x-30,GY-E.y-60],26,Math.PI,'#eaf6ff',.9);}};
 [2.62,2.92,3.22,8.6].forEach(slash);
 if(q>=10.9&&q<11.3){a1=-100;a2=-80;el=P(E,'E',120,620);er=P(E,'E',260,640);}
 if(sup||(q>=12.0&&q<12.2)){a1=180;a2=0;el=P(E,'E',-120,640);er=P(E,'E',760,640);}
 if(q>=14.2&&q<15.4){a1=100;a2=80;}
 if(ko){a1=q*500;a2=-q*400;}
 const mh=P(E,'E',420,345),ma=180+E.rot;
 const eArms=arm(SHe[1],er,'#4d7024')+katana(er,a2+E.rot,'#6d3bb5')+fist(er,3)+arm(SHe[0],el,'#4d7024')+katana(el,a1+E.rot,'#f4f4f4')+fist(el,3)+(q>=1.4?katana(mh,ma,'#262223'):'');
 // ---------- Geschosse + Effekte ----------
 if(q>=8.6&&q<9.5){const x=E.x-30-(q-8.6)*250;mid+=cres([x,GY-58],22,Math.PI,'#bfe9ff');}
 HJ.forEach((h,i)=>{front+=star([J.x+4+(rnd(i)-.5)*14,GY-J.y-45-rnd(i+3)*40],h[0],t,13,'#eaf6ff');});
 HE.forEach((h,i)=>{front+=h[2]?star([E.x-20,GY-62],h[0],t,9,'#7fd0ff'):star([E.x-8+(rnd(i+9)-.5)*10,GY-E.y-40-rnd(i+5)*36],h[0],t,h[1]>20?40:14);});
 if(sup)for(let i=0;i<5;i++){const k=Math.floor(t*30)+i,y=GY-20-rnd(k)*100;front+=`<path d="M${(J.x-70+rnd(k+1)*40).toFixed(0)} ${y.toFixed(0)} l${(100+rnd(k+2)*40).toFixed(0)} ${((rnd(k+3)-.5)*70).toFixed(0)}" stroke="#fff" stroke-width="${1+rnd(k+4)*2}" stroke-linecap="round"/>`;}
 const ghosts=sup?[1,2].map(g=>`<g transform="translate(${(g%2?1:-1)*g*16} 0) ${tf(E,'E')}" opacity="${.4/g}">${BODY.E}</g>`).join(''):'';
 // Super-Einblendung / Bildschirm
 const supIn=(t>=12.0&&t<12.3)||(t>=15.4&&t<15.75);let dim='';if(supIn||sup||(t>=15.4&&t<17.9)){dim=`<rect width="${W}" height="${H}" fill="#06041e" opacity="${supIn?.75:.45}"/>`;if(supIn){const cx=t<13?E.x:J.x;for(let i=0;i<14;i++)dim+=`<path d="M${cx} ${GY-60} L${cx+Math.cos(i*.449+t*9)*400} ${GY-60+Math.sin(i*.449+t*9)*400}" stroke="${t<13?'#7dff9a':'#fff'}" stroke-width="3" opacity=".5"/>`;}}
 let sh=0;[lj,le].forEach(h=>{if(h!==-9&&t-h[0]<.12)sh=Math.max(sh,h[1]>20?5:2);});if(ko&&t<18.3)sh=6*(1-(t-17.9)/.4);
 const ox=Math.round((rnd(t*61)-.5)*2*sh),oy=Math.round((rnd(t*47)-.5)*2*sh),camX=cl(((J.x+Math.min(E.x,300))/2-160)*.5,-20,20);
 const wJ=stJ<.07?' filter="url(#wh)"':'',wE=stE<.07&&!le[2]?' filter="url(#wh)"':'';
 document.getElementById('bgp').setAttribute('transform',`translate(${(-camX*.4+ox).toFixed(1)} ${oy})`);
 document.getElementById('dyn').innerHTML=`<g transform="translate(${ox} ${oy})">${dim}${back}${ghosts}<g${wE}><g transform="${tf(E,'E')}">${BODY.E}</g>${eArms}</g>${mid}<g${wJ}><g transform="${tf(J,'J')}">${BODY.J}</g>${jArms}</g>${front}</g>`;
 // ---------- HUD ----------
 const bar=(x,w,v,lag,flip)=>{const f=w*v/100,l=w*lag/100;return `<rect x="${x-1.5}" y="12.5" width="${w+3}" height="10" fill="#fff" stroke="${OUT}"/><rect x="${x}" y="14" width="${w}" height="7" fill="#7a1010"/><rect x="${flip?x:x+w-l}" y="14" width="${l}" height="7" fill="#fff"/><rect x="${flip?x:x+w-f}" y="14" width="${f}" height="7" fill="${v<25&&Math.floor(t*8)%2?'#ff4a2e':'#ffd23f'}"/>`;};
 const sm=(x,v,flip)=>{const w=64,f=w*cl(v);return `<rect x="${x-1}" y="225" width="${w+2}" height="6" fill="${OUT}"/><rect x="${flip?x:x+w-f}" y="226" width="${f}" height="4" fill="${v>=1&&Math.floor(t*8)%2?'#fff':'#3fa9ff'}"/>`;};
 const smJ=t>=15.4?cl(1-(t-15.4)/2.5):cl(HE.filter(h=>h[0]<=t).length/6+HJ.filter(h=>h[0]<=t).length/14),smE=t>=12.0?cl(1-(t-12.0)/2.2):cl(HJ.filter(h=>h[0]<=t).length/3*.5+HE.filter(h=>h[0]<=t).length/6);
 let hud=bar(12,126,hpJ,hp(HJ,t-.5),false)+bar(182,126,hpE,hp(HE,t-.5),true)+`<rect x="146" y="9" width="28" height="18" fill="${OUT}" stroke="#fff"/>`+txt(String(Math.max(0,99-Math.floor(Math.max(0,Math.min(t,17.9)-2.1)))).padStart(2,'0'),160,23,14,'#ffd23f',{sw:0})+
  txt('JAMES',13,33,8,'#fff',{a:'start',sw:2})+txt('EDDY',307,33,8,'#fff',{a:'end',sw:2})+sm(12,smJ,false)+sm(244,smE,true)+txt('SUPER',80,231,6,'#9fd4ff',{a:'start',sw:1.5})+txt('SUPER',240,231,6,'#9fd4ff',{a:'end',sw:1.5})+
  txt('CREDIT 1',160,237,6,'#fff',{sw:1.5});
 const cJ=combo(HE,t),cE=combo(HJ,t);if(cJ>1)hud+=txt(cJ+' HITS!',14,52,11,'#ffd23f',{a:'start'});if(cE>1)hud+=txt(cE+' HITS!',306,52,11,'#7dff9a',{a:'end'});
 const pop=(s,t0,d,y,sz,col)=>{const u=(t-t0)/d;if(u>=0&&u<1)hud+=`<g transform="translate(160 ${y}) scale(${(1+1.2*Math.max(0,1-u*8)).toFixed(2)})">${txt(s,0,0,sz,col)}</g>`;};
 pop('ROUND 1',.3,1.0,112,30,'#ffd23f');pop('FIGHT!',1.4,.75,116,40,'#ff4a2e');
 [['IAI-SCHNITT x3',2.5,1.0],['GUMMI-PISTOLE',5.3,.9],['GUMMI-RAKETE',6.4,.9],['MONDKLINGE',8.5,.9],['STURZFLUG-TRITT',9.7,.9],['BLOCK!',10.95,.6],['SUPER: TAUSEND SCHNITTE',12.0,2.2],['DANGER!',14.4,1.0],['SUPER: GUMMI-GATLING',15.4,1.8],['RIESENFAUST!',17.4,.5]].forEach(([s,t0,d])=>{const u=(t-t0)/d;if(u>=0&&u<1&&(s!='DANGER!'||Math.floor(t*8)%2))hud+=txt(s,160,214,9,s=='DANGER!'?'#ff4a2e':'#fff',{sw:2});});
 if(t>=17.9&&t<19.2){const u=(t-17.9)/1.3;hud+=`<rect width="${W}" height="${H}" fill="#fff" opacity="${Math.max(0,1-u*5)}"/><g transform="translate(160 128) scale(${(1+2*Math.max(0,1-u*6)).toFixed(2)})">${txt('K.O.',0,0,64,'#ff4a2e',{sw:5})}</g>`;}
 if(t>=19.2){hud+=txt('JAMES WINS',160,104,28,'#ffd23f',{sw:4});if(t>=20.2)hud+=txt('GUMMI SCHLÄGT STAHL',160,124,9,'#fff');if(t>=21.3&&Math.floor(t*2.5)%2)hud+=txt('INSERT COIN',160,150,12,'#fff');}
 document.getElementById('hud').innerHTML=hud;}
