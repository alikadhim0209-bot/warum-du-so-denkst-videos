// Erzeugt video.mp4 + cover.png: node render.js  (braucht playwright + ffmpeg)
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');const {chromium}=require('playwright');
const CH=path.join(__dirname,'../assets/charakter/');const TMP=process.env.KAMPF_TMP||path.join(require('os').tmpdir(),'kampf-frames');
fs.mkdirSync(TMP,{recursive:true});
function armlos(name){let s=fs.readFileSync(CH+name+'.svg','utf8');
  s=s.replace(/<g id="arm-(links|rechts)">[\s\S]*?<\/g>/g,'');
  const a=s.indexOf('<g id="schwerter">');if(a>0){const b=s.indexOf('<g id="umhang-hinten">');s=s.slice(0,a)+s.slice(b);}
  const vb=s.match(/viewBox="(-?\d+) (-?\d+) (\d+) (\d+)"/).slice(1).map(Number);return {s,vb};}
const FPS=30,DUR=10,N=FPS*DUR;
(async()=>{
const b=await chromium.launch();
const bodies={};
for(const n of ['james','eddy']){const {s,vb}=armlos(n);const p=await b.newPage({viewport:{width:vb[2],height:vb[3]},deviceScaleFactor:0.6});
  await p.setContent('<body style="margin:0;background:transparent">'+s+'</body>');
  bodies[n]={vb,png:(await p.screenshot({omitBackground:true})).toString('base64')};await p.close();}
const html=`<!doctype html><body style="margin:0;background:#000"><svg id="S" xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset=".55" stop-color="#ffe29a"/><stop offset="1" stop-color="#fff3cf"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<g id="cam">
 <rect x="-200" y="-200" width="1480" height="2320" fill="url(#sky)"/>
 <circle cx="540" cy="620" r="420" fill="url(#sun)"/>
 <path d="M-200 1400 L60 1120 L240 1300 L420 1040 L640 1320 L820 1100 L1040 1330 L1280 1150 L1280 1600 L-200 1600Z" fill="#e2a55a" opacity=".55"/>
 <path d="M-200 1470 L160 1330 L380 1440 L620 1300 L900 1450 L1280 1340 L1280 1600 L-200 1600Z" fill="#c9843f" opacity=".7"/>
 <rect x="-200" y="1540" width="1480" height="600" fill="#8a5a2b"/><rect x="-200" y="1540" width="1480" height="16" fill="#5e3b1b"/>
 <g fill="#6e4520"><ellipse cx="140" cy="1660" rx="60" ry="14"/><ellipse cx="620" cy="1740" rx="90" ry="16"/><ellipse cx="940" cy="1640" rx="50" ry="12"/><ellipse cx="330" cy="1820" rx="70" ry="14"/></g>
 <g id="back"></g>
 <g id="eddy"><image href="data:image/png;base64,${bodies.eddy.png}" x="${bodies.eddy.vb[0]}" y="${bodies.eddy.vb[1]}" width="${bodies.eddy.vb[2]}" height="${bodies.eddy.vb[3]}"/></g>
 <g id="james"><image href="data:image/png;base64,${bodies.james.png}" x="${bodies.james.vb[0]}" y="${bodies.james.vb[1]}" width="${bodies.james.vb[2]}" height="${bodies.james.vb[3]}"/></g>
 <g id="front"></g>
</g>
<g id="hud"></g>
</svg>
<script>
const G=1556,S=0.50,OUT='#17110f';
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;const eo=u=>1-Math.pow(1-u,3);
function kf(t,k,fn=ease){if(t<=k[0][0])return k[0][1];for(let i=1;i<k.length;i++){if(t<=k[i][0]){const u=(t-k[i-1][0])/(k[i][0]-k[i-1][0]);const a=k[i-1][1],b=k[i][1];const e=fn(u);return Array.isArray(a)?a.map((v,j)=>v+(b[j]-v)*e):a+(b-a)*e;}}return k[k.length-1][1];}
function P(c,lx,ly){const dx=(lx-316)*S*c.sx,dy=(ly-1830)*S*c.sy,r=c.rot*Math.PI/180;return [c.x+dx*Math.cos(r)-dy*Math.sin(r),G-c.y+dx*Math.sin(r)+dy*Math.cos(r)];}
const tf=c=>'translate('+c.x+' '+(G-c.y)+') rotate('+c.rot+') scale('+S*c.sx+' '+S*c.sy+') translate(-316 -1830)';
function rnd(i){const x=Math.sin(i*127.1)*43758.5453;return x-Math.floor(x);}
function arm(A,B,o={}){const w=o.w||26,n=22,wob=o.wob||0,ph=o.ph||0,bend=o.bend||0;const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;let d='';
 for(let i=0;i<=n;i++){const u=i/n,off=Math.sin(Math.PI*u)*(bend+wob*Math.sin(u*Math.PI*5+ph));d+=(i?'L':'M')+(A[0]+dx*u+nx*off).toFixed(1)+' '+(A[1]+dy*u+ny*off).toFixed(1);}
 const op=o.op==null?1:o.op;
 return '<g opacity="'+op+'"><path d="'+d+'" fill="none" stroke="'+OUT+'" stroke-width="'+(w+12)+'" stroke-linecap="round" stroke-linejoin="round"/><path d="'+d+'" fill="none" stroke="'+(o.col||'#fff')+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/></g>';}
function fist(B,r,op=1){return '<g opacity="'+op+'"><circle cx="'+B[0]+'" cy="'+B[1]+'" r="'+r+'" fill="#fff" stroke="'+OUT+'" stroke-width="'+Math.max(6,r*0.12)+'"/><path d="M'+(B[0]+r*.15)+' '+(B[1]-r*.55)+' q'+r*.3+' '+r*.55+' 0 '+r*1.1+' M'+(B[0]-r*.25)+' '+(B[1]-r*.5)+' q'+r*.25+' '+r*.5+' 0 '+r+'" fill="none" stroke="'+OUT+'" stroke-width="'+Math.max(3,r*.06)+'" stroke-linecap="round"/></g>';}
function sword(H,ang,col,glow){const a=ang*Math.PI/180,c=Math.cos(a),s=Math.sin(a),L=270;const p=(d,o=0)=>(H[0]+c*d-s*o).toFixed(1)+' '+(H[1]+s*d+c*o).toFixed(1);
 return (glow?'<path d="M'+p(20)+' L'+p(L)+'" stroke="#9dff8a" stroke-width="'+(30+glow*30)+'" stroke-linecap="round" opacity="'+(.35*glow)+'"/>':'')+
 '<path d="M'+p(18)+' L'+p(L)+'" stroke="'+OUT+'" stroke-width="18" stroke-linecap="round"/><path d="M'+p(20)+' L'+p(L-4)+'" stroke="#eef3f6" stroke-width="9" stroke-linecap="round"/>'+
 '<path d="M'+p(-46)+' L'+p(14)+'" stroke="'+OUT+'" stroke-width="22" stroke-linecap="round"/><path d="M'+p(-44)+' L'+p(12)+'" stroke="'+col+'" stroke-width="13" stroke-linecap="round"/>'+
 '<path d="M'+p(16,-26)+' L'+p(16,26)+'" stroke="'+OUT+'" stroke-width="18" stroke-linecap="round"/><path d="M'+p(16,-24)+' L'+p(16,24)+'" stroke="#f0b429" stroke-width="10" stroke-linecap="round"/>';}
function sparks(c,t0,t,n,R,col,seed){const u=(t-t0)/0.3;if(u<0||u>1)return '';let o='';for(let i=0;i<n;i++){const a=rnd(seed+i)*6.283,r1=R*(.2+u*.8)*(0.5+rnd(seed+i+50)),r2=r1+R*.35*(1-u);o+='<path d="M'+(c[0]+Math.cos(a)*r1).toFixed(0)+' '+(c[1]+Math.sin(a)*r1).toFixed(0)+' L'+(c[0]+Math.cos(a)*r2).toFixed(0)+' '+(c[1]+Math.sin(a)*r2).toFixed(0)+'" stroke="'+col+'" stroke-width="'+(10*(1-u)+2)+'" stroke-linecap="round"/>';}
 return o+'<circle cx="'+c[0]+'" cy="'+c[1]+'" r="'+(R*.5*(1-u))+'" fill="#fff" opacity="'+(1-u)+'"/>';}
function star(c,t0,t,R){const u=(t-t0)/0.22;if(u<0||u>1)return '';let d='';for(let i=0;i<16;i++){const a=i/16*6.283,r=(i%2?R*.45:R)*(.6+u*.6);d+=(i?'L':'M')+(c[0]+Math.cos(a)*r).toFixed(0)+' '+(c[1]+Math.sin(a)*r).toFixed(0);}return '<path d="'+d+'Z" fill="#fff7c2" stroke="#ff8a1e" stroke-width="10" opacity="'+(1-u*u)+'"/>';}
function crescent(c,R,a0,a1,col,op,w){const p=a=>[(c[0]+Math.cos(a)*R),(c[1]+Math.sin(a)*R)];const A=p(a0),B=p(a1),large=Math.abs(a1-a0)>Math.PI?1:0,sw=a1>a0?1:0;const R2=R*(1-w);const A2=[c[0]+Math.cos(a0)*R,c[1]+Math.sin(a0)*R],mid=(a0+a1)/2;
 const C=[c[0]+Math.cos(mid)*R2*0.9,c[1]+Math.sin(mid)*R2*0.9];
 return '<path d="M'+A[0].toFixed(0)+' '+A[1].toFixed(0)+' A'+R+' '+R+' 0 '+large+' '+sw+' '+B[0].toFixed(0)+' '+B[1].toFixed(0)+' Q'+C[0].toFixed(0)+' '+C[1].toFixed(0)+' '+A[0].toFixed(0)+' '+A[1].toFixed(0)+'Z" fill="'+col+'" stroke="#fff" stroke-width="6" opacity="'+op+'"/>';}
function lines(t,t0,t1,y0,y1,dir){if(t<t0||t>t1)return '';let o='';for(let i=0;i<14;i++){const y=y0+(y1-y0)*rnd(i+Math.floor(t*30)*3),x=rnd(i*7+Math.floor(t*30))*1080,l=140+rnd(i)*260;o+='<path d="M'+x+' '+y+' h'+(dir*l)+'" stroke="#fff" stroke-width="'+(4+rnd(i+9)*6)+'" stroke-linecap="round" opacity=".7"/>';}return o;}
function dust(c,t0,t,n,sp){const u=(t-t0)/0.8;if(u<0||u>1)return '';let o='';for(let i=0;i<n;i++){const dir=rnd(i+c[0])<.5?-1:1;o+='<circle cx="'+(c[0]+dir*sp*eo(u)*(0.3+rnd(i*3+1)))+'" cy="'+(c[1]-30*rnd(i+2)-60*u*rnd(i+5))+'" r="'+(26+40*rnd(i+8))*(.5+u*.6)+'" fill="#e9d2a6" stroke="#b08a52" stroke-width="4" opacity="'+(.9*(1-u))+'"/>';}return o;}
function render(t){
 const J={x:kf(t,[[0,270],[3.4,270],[3.8,240],[4.3,290],[6.0,290],[6.6,230],[7.3,270],[7.6,255],[8.3,220],[10,220]]),
  y:kf(t,[[0,0],[3.62,0],[4.15,470],[5.0,520],[5.85,470],[6.3,0]]),rot:kf(t,[[0,0],[1.2,0],[2.1,-11],[2.36,7],[2.9,0],[3.6,0],[4.1,-8],[5.9,-6],[6.3,0],[6.45,0],[7.05,-10],[7.35,6],[8.1,0],[10,0]]),
  sx:1,sy:kf(t,[[0,1],[3.45,1],[3.6,.86],[3.8,1.1],[4.2,1],[6.25,1.06],[6.36,.84],[6.6,1],[10,1]])};J.sx=1/Math.sqrt(J.sy);
 const E={x:kf(t,[[0,810],[2.36,810],[2.62,890],[3.3,870],[3.9,470],[4.35,520],[4.62,810],[6.1,810],[7.0,850],[7.3,810],[7.6,825],[8.3,870],[10,870]]),
  y:kf(t,[[0,0],[4.3,0],[4.45,90],[4.62,0],[10,0]]),rot:kf(t,[[0,0],[2.36,0],[2.5,8],[3.0,0],[3.3,-4],[3.8,-12],[4.3,-3],[4.62,0],[6.2,0],[7.0,7],[7.3,-7],[8.1,0],[10,0]]),sx:1,sy:kf(t,[[0,1],[3.2,1],[3.35,.9],[3.6,1.04],[4,1],[6.9,.92],[7.25,1.05],[7.6,1],[10,1]])};E.sx=1/Math.sqrt(E.sy);
 // leichtes Atmen
 const br=1+Math.sin(t*5)*.008;J.sy*=br;E.sy*=(2-br);
 document.getElementById('james').setAttribute('transform',tf(J));document.getElementById('eddy').setAttribute('transform',tf(E));
 let back='',f='';
 // --- James Arme ---
 const JS=[P(J,150,650),P(J,482,650)];
 let jh=P(J,470,900),jr=24,wob=0,bend=18,jh2=P(J,170,900);
 if(t>=1.2&&t<2.1){jh=kf(t,[[1.2,P(J,470,900)],[2.1,[-520,1010]]],eo);wob=14*Math.sin(t*30);}
 else if(t>=2.1&&t<2.36){jh=kf(t,[[2.1,[-520,1010]],[2.36,[672,1130]]],u=>u*u);bend=0;}
 else if(t>=2.36&&t<2.5){jh=[672+rnd(t*90)*8,1130];bend=0;}
 else if(t>=2.5&&t<3.4){const u=(t-2.5)/.9;jh=kf(t,[[2.5,[672,1130]],[3.4,P(J,470,900)]],eo);wob=60*(1-u)*Math.sin(t*38);bend=0;}
 else if(t>=6.45&&t<7.1){const u=(t-6.45)/.65;jh=kf(t,[[6.45,P(J,470,900)],[7.1,[-60,1000]]],eo);jr=24+150*eo(u);wob=10*Math.sin(t*30);}
 else if(t>=7.1&&t<7.35){jh=kf(t,[[7.1,[-60,1000]],[7.35,[520,1090]]],u=>u*u);jr=174;bend=0;}
 else if(t>=7.35&&t<7.65){jh=[520+rnd(t*77)*14,1090+rnd(t*31)*10];jr=174;bend=0;}
 else if(t>=7.65&&t<8.5){const u=(t-7.65)/.85;jh=kf(t,[[7.65,[520,1090]],[8.5,P(J,470,900)]],eo);jr=174-150*eo(u);wob=50*(1-u)*Math.sin(t*36);bend=0;}
 f+='<circle cx="'+JS[0][0]+'" cy="'+JS[0][1]+'" r="26" fill="#c9222b" stroke="'+OUT+'" stroke-width="7"/><circle cx="'+JS[1][0]+'" cy="'+JS[1][1]+'" r="26" fill="#c9222b" stroke="'+OUT+'" stroke-width="7"/>';
 const gat=t>=4.5&&t<5.95;
 if(gat){ // Gummi-Gatling
  for(let k=0;k<6;k++){const per=.3,u=((t-4.5)/per+k/6)%1;const S0=JS[k%2];const tgt=[700+rnd(k)*150,1040+rnd(k+3)*200];const e=u<.45?(u/.45):1-(u-.45)/.55;const H=[S0[0]+(tgt[0]-S0[0])*e,S0[1]+(tgt[1]-S0[1])*e];
   f+=arm(S0,H,{w:22,op:.55+.45*e})+fist(H,22+10*e,.6+.4*e);}
 }else{ if(t>=5.95&&t<6.45){jh=P(J,470,900);jh2=P(J,170,900);}
  f+=arm(JS[0],jh2,{bend:-18});f+=fist(jh2,22);
  f+=arm(JS[1],jh,{w:26,wob,bend,ph:t*20});f+=fist(jh,jr);}
 // --- Eddy Arme + Schwerter ---
 const ES=[P(E,150,650),P(E,482,650)];
 let h1,h2,a1,a2,glow=0;
 const draw=cl((t-.45)/.5);
 h1=P(E,120+40*(1-draw),900-80*draw);h2=P(E,500-30*(1-draw),900-70*draw);a1=kf(t,[[0,95],[.45,95],[.95,-125]]);a2=kf(t,[[0,85],[.45,85],[.95,-60]]);
 if(t>=2.0&&t<3.2){const u=cl((t-2.0)/.3),v=cl((t-2.8)/.4);const m=u*(1-v);h1=kf(m,[[0,h1],[1,P(E,150,790)]]);h2=kf(m,[[0,h2],[1,P(E,300,800)]]);a1=-125+m*(-10);a2=-60+m*(-150);if(t>=2.36&&t<2.6){h1[0]+=rnd(t*99)*8;h2[1]+=rnd(t*55)*8;}}
 if(t>=3.2&&t<4.62){a1=kf(t,[[3.2,-125],[3.6,-40],[4.0,-200],[4.3,-250],[4.62,-125]]);h1=kf(t,[[3.2,h1],[3.6,P(E,300,720)],[4.0,P(E,40,960)],[4.62,h1]]);a2=kf(t,[[3.2,-60],[3.7,10],[4.1,-170],[4.62,-60]]);h2=kf(t,[[3.2,h2],[3.7,P(E,520,780)],[4.1,P(E,180,1000)],[4.62,h2]]);}
 if(t>=4.62&&t<6.1){const w=cl((t-4.62)/.15)*(1-cl((t-5.95)/.15));h1=kf(w,[[0,h1],[1,P(E,150,560)]]);h2=kf(w,[[0,h2],[1,P(E,420,540)]]);a1=-125+w*(25+55*Math.sin(t*42));a2=-60+w*(-30+55*Math.sin(t*37+1));}
 if(t>=6.2&&t<7.0){const u=eo((t-6.2)/.8);h1=kf(u,[[0,h1],[1,P(E,460,700)]]);h2=kf(u,[[0,h2],[1,P(E,560,820)]]);a1=-125+u*95;a2=-60+u*70;glow=u;}
 if(t>=7.0&&t<7.65){const u=cl((t-7.0)/.3,0,1);const e=u*u;h1=kf(e,[[0,P(E,460,700)],[1,P(E,10,880)]]);h2=kf(e,[[0,P(E,560,820)],[1,P(E,60,700)]]);a1=-30-e*190;a2=10-e*150;glow=1;}
 if(t>=7.65&&t<8.6){const u=eo((t-7.65)/.95);h1=kf(u,[[0,P(E,10,880)],[1,P(E,130,900)]]);h2=kf(u,[[0,P(E,60,700)],[1,P(E,500,900)]]);a1=-220+u*335;a2=-140+u*210;glow=1-u;}
 if(t>=8.6){h1=P(E,130,900);h2=P(E,500,900);a1=115;a2=70;}
 const showSw=t>.45;
 f+=arm(ES[1],h2,{bend:14})+(showSw?sword(h2,a2,'#b3201f',glow):'')+fist(h2,20);
 f+=arm(ES[0],h1,{bend:-14})+(showSw?sword(h1,a1,'#2f8f3c',glow):'')+fist(h1,20);
 f+='<circle cx="'+ES[0][0]+'" cy="'+ES[0][1]+'" r="26" fill="#262223" stroke="'+OUT+'" stroke-width="7"/><circle cx="'+ES[1][0]+'" cy="'+ES[1][1]+'" r="26" fill="#262223" stroke="'+OUT+'" stroke-width="7"/>';
 // --- Effekte ---
 back+=lines(t,2.1,2.4,950,1300,1)+lines(t,3.3,3.95,900,1500,-1)+lines(t,7.1,7.38,850,1350,1)+lines(t,7.0,7.38,850,1350,-1);
 if(t>=6.2&&t<7.35){const u=cl((t-6.2)/.8);back+='<circle cx="'+E.x+'" cy="'+(G-420)+'" r="'+(260+40*Math.sin(t*30))+'" fill="#7dff6a" opacity="'+(.28*u)+'"/><circle cx="'+J.x+'" cy="'+(G-420)+'" r="'+(260+40*Math.cos(t*30))+'" fill="#ff5a3c" opacity="'+(.28*u)+'"/>';}
 f+=star([690,1130],2.36,t,210)+sparks([690,1130],2.36,t,14,260,'#ffd23f',1);
 if(t>=3.7&&t<4.25){const u=(t-3.7)/.55;f+=crescent([E.x-40,G-330],330+u*60,Math.PI*0.75-u*.4,Math.PI*1.75,'#8dff78',1-u,.28);f+=crescent([E.x-80,G-260],250+u*60,Math.PI*0.6,Math.PI*1.45-u*.3,'#d8ffd0',(1-u)*.9,.3);}
 if(gat){for(let i=0;i<11;i++){const t0=4.6+i*.125;f+=sparks([700+rnd(i)*160,1020+rnd(i+20)*160],t0,t,7,110,i%2?'#ffd23f':'#fff',i*13);}}
 f+=dust([J.x,G],6.3,t,8,220)+dust([E.x,G],4.62,t,5,140);
 if(t>=7.3&&t<7.7){const u=(t-7.3)/.4;f+='<path d="M360 880 L760 1330" stroke="#8dff78" stroke-width="'+(46*(1-u))+'" stroke-linecap="round"/><path d="M760 880 L360 1330" stroke="#8dff78" stroke-width="'+(46*(1-u))+'" stroke-linecap="round"/><path d="M360 880 L760 1330 M760 880 L360 1330" stroke="#fff" stroke-width="'+(16*(1-u))+'" stroke-linecap="round"/>';}
 f+=star([555,1100],7.35,t,430)+sparks([555,1100],7.35,t,26,620,'#ffd23f',7)+sparks([555,1100],7.42,t,18,520,'#fff',99);
 for(let k=0;k<3;k++){const u=(t-7.35-k*.14)/.9;if(u>0&&u<1)f+='<circle cx="555" cy="1100" r="'+(80+900*eo(u))+'" fill="none" stroke="#fff" stroke-width="'+(26*(1-u))+'" opacity="'+(1-u)+'"/>';}
 f+=dust([555,G],7.4,t,14,560);
 // Kamera
 let sh=0;[[2.36,.35,26],[6.3,.25,14],[7.35,.75,54]].forEach(([t0,d,a])=>{const u=(t-t0)/d;if(u>=0&&u<1)sh=Math.max(sh,a*(1-u));});if(gat)sh=Math.max(sh,7);
 const zoom=kf(t,[[0,1.12],[1.1,1],[6.4,1],[7.1,1.06],[7.5,1],[8.6,1],[10,1.05]]);
 document.getElementById('cam').setAttribute('transform','translate('+(540+(rnd(t*61)-.5)*2*sh)+' '+(1100+(rnd(t*47)-.5)*2*sh)+') scale('+zoom+') translate(-540 -1100)');
 document.getElementById('back').innerHTML=back;document.getElementById('front').innerHTML=f;
 // HUD
 let h='';const fl=Math.max(t>=2.36?1-(t-2.36)/.12:0,t>=7.33?1-(t-7.33)/.35:0);if(fl>0)h+='<rect width="1080" height="1920" fill="#fff" opacity="'+cl(fl)*(t>7?1:.6)+'"/>';
 if(t<1.3){const u=cl(t/.25)*(1-cl((t-1.0)/.3));h+='<g opacity="'+u+'" font-family="Impact,Arial Black,sans-serif" font-weight="900" text-anchor="middle" stroke="'+OUT+'" stroke-width="14" paint-order="stroke" stroke-linejoin="round"><text x="540" y="330" font-size="112" fill="#fff">JAMES <tspan fill="#ffd23f">VS</tspan> EDDY</text></g>';}
 if(t>8.9){const u=eo(cl((t-8.9)/.3));h+='<g transform="translate(540 420) scale('+(2-u)+') rotate(-6)" opacity="'+u+'" font-family="Impact,Arial Black,sans-serif" text-anchor="middle" stroke="'+OUT+'" stroke-width="14" paint-order="stroke" stroke-linejoin="round"><text font-size="118" fill="#ffd23f">UNENTSCHIEDEN?</text></g>';}
 document.getElementById('hud').innerHTML=h;
}
</script></body>`;
const p=await b.newPage({viewport:{width:1080,height:1920}});await p.setContent(html);await p.waitForFunction(()=>[...document.images].every(i=>i.complete));await p.waitForTimeout(300);
const only=process.argv[2];
if(only){for(const t of only.split(',')){await p.evaluate(t=>render(t),+t);await p.screenshot({path:path.join(TMP,'t'+t+'.jpg'),type:'jpeg',quality:80});}await b.close();return;}
for(let i=0;i<N;i++){await p.evaluate(t=>render(t),i/FPS);await p.screenshot({path:path.join(TMP,'f'+String(i).padStart(4,'0')+'.jpg'),type:'jpeg',quality:93});}
await p.evaluate(t=>render(t),7.2);await p.screenshot({path:path.join(__dirname,'cover.png')});await b.close();
// --- Ton: einfache synthetische Effekte ---
const SR=44100,buf=new Float32Array(SR*DUR);let seed=1;const nz=()=>{seed=(seed*16807)%2147483647;return seed/1073741823-1;};
const add=(t0,d,fn)=>{for(let i=0;i<d*SR;i++){const k=Math.floor(t0*SR)+i;if(k<buf.length)buf[k]+=fn(i/SR,i/(d*SR));}};
const whoosh=(t0,d,v)=>{let lp=0;add(t0,d,(s,u)=>{lp+=(nz()-lp)*(.05+.25*u);return lp*Math.sin(Math.PI*u)*v;});};
const boom=(t0,v)=>{add(t0,.7,(s,u)=>Math.sin(2*Math.PI*(90-50*u)*s)*Math.pow(1-u,2)*v+nz()*Math.pow(1-u,8)*v*.6);};
const clink=(t0,v,f)=>add(t0,.12,(s,u)=>(Math.sin(2*Math.PI*f*s)+.5*Math.sin(2*Math.PI*f*1.51*s))*Math.pow(1-u,3)*v);
whoosh(1.2,.9,.25);whoosh(2.1,.3,.6);boom(2.36,.8);clink(2.36,.35,1900);whoosh(3.3,.7,.5);clink(3.8,.3,2400);whoosh(4.0,.3,.4);
for(let i=0;i<11;i++){clink(4.6+i*.125,.28,1700+(i%3)*350);boom(4.6+i*.125,.18);}
boom(6.3,.5);whoosh(6.45,.65,.35);whoosh(7.05,.3,.8);boom(7.35,1.2);boom(7.42,.8);clink(7.35,.4,1500);whoosh(7.5,1.2,.3);
const pcm=Buffer.alloc(44+buf.length*2);pcm.write('RIFF',0);pcm.writeUInt32LE(36+buf.length*2,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(SR,24);pcm.writeUInt32LE(SR*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(buf.length*2,40);
for(let i=0;i<buf.length;i++)pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,buf[i]*.8))*32767),44+i*2);
fs.writeFileSync(path.join(TMP,'sfx.wav'),pcm);
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i "${TMP}/f%04d.jpg" -i "${TMP}/sfx.wav" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 160k -shortest -movflags +faststart "${path.join(__dirname,'video.mp4')}"`);
console.log('fertig');
})();
