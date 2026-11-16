// Langer 3D-Arena-Kampf rendern: node render2.js  (braucht three@0.160.0, playwright, ffmpeg). node render2.js 17.5,26 -> Testbilder
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');const {chromium}=require('playwright');
const TMP=process.env.KAMPF_TMP||path.join(require('os').tmpdir(),'kampf-arena2');fs.mkdirSync(TMP,{recursive:true});
const THREE_JS=process.env.THREE_JS||require.resolve('three/build/three.min.js');const FPS=30,DUR=55;
(async()=>{const only=process.argv[2];
if(only!=='audio'){const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.setContent('<body style="margin:0;background:#000;overflow:hidden"><div id="gl"></div></body>');await p.addScriptTag({path:THREE_JS});
 for(const f of ['../kampf-james-vs-eddy-3d/scene.js','../kampf-james-vs-eddy-60s/scene60.js','scene-arena.js','scene-arena2.js'])await p.addScriptTag({path:path.join(__dirname,f)});
 const pic=n=>'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'../assets/charakter/'+n+'.png')).toString('base64');await p.addScriptTag({content:'window.PJ='+JSON.stringify(pic('james-federumhang'))+';window.PE='+JSON.stringify(pic('eddy-pelzumhang'))+';'});
 if(only){for(const t of only.split(',')){await p.evaluate(t=>renderTK2(t),+t);await p.screenshot({path:path.join(TMP,'t'+(+t).toFixed(2)+'.jpg'),type:'jpeg',quality:70});}await b.close();return;}
 for(let i=0;i<Math.round(FPS*DUR);i++){await p.evaluate(t=>renderTK2(t),i/FPS);await p.screenshot({path:path.join(TMP,'f'+String(i).padStart(4,'0')+'.jpg'),type:'jpeg',quality:92});}
 await p.evaluate(t=>renderTK2(t),27.6);await p.screenshot({path:path.join(__dirname,'cover-lang.png')});await b.close();}
const SR=44100,N=Math.floor(SR*DUR),mus=new Float32Array(N),sfx=new Float32Array(N);let seed=5;const nz=()=>{seed=(seed*16807)%2147483647;return seed/1073741823-1;},hz=n=>440*Math.pow(2,(n-69)/12),B=60/140;
function kick(t0,v){const n0=Math.floor(t0*SR);for(let i=0;i<SR*.3&&n0+i<N;i++){const t=i/SR;mus[n0+i]+=Math.sin(2*Math.PI*(45*t+(120-45)*(1-Math.exp(-t*28))/28))*Math.exp(-t*9)*v;}}
function nois(buf,t0,d,v,hp,dec=2){const n0=Math.floor(t0*SR);let lp=0;for(let i=0;i<SR*d&&n0+i<N;i++){const x=nz();lp+=(x-lp)*.25;buf[n0+i]+=(hp?x-lp:lp)*Math.pow(1-i/(SR*d),dec)*v;}}
function saw(buf,t0,d,f,v,cut0=.5,cut1=.05,H=10,vib=0){const n0=Math.floor(t0*SR);let lp=0;for(let i=0;i<SR*d&&n0+i<N;i++){const t=i/SR,u=i/(SR*d),ph=2*Math.PI*f*t+vib*Math.sin(2*Math.PI*6*t);let s=0;for(let h=1;h<=H;h++)s+=Math.sin(ph*h)/h;lp+=(s-lp)*(cut0+(cut1-cut0)*u);buf[n0+i]+=lp*v*Math.min(1,i/80)*Math.min(1,(1-u)*14);}}
const BASS=[28,28,31,28,28,33,31,26],CH=[[52,55,59],[52,55,59],[55,59,62],[50,54,57]];
function beat(t0,t1,lvl){for(let t=t0,i=0;t<t1-1e-6;t+=B/4,i++){const k=i%16,bar=Math.floor(i/16);if(k%4==0)kick(t,lvl>1?.5:.38);if(lvl>1&&k%4==2)nois(mus,t,.05,.1,true);if(lvl>1&&(k==4||k==12)){nois(mus,t,.14,.2,false);nois(mus,t,.1,.1,true);}
 if((lvl>0&&k%2==0)||lvl>1)saw(mus,t,B/4*.9,hz(BASS[(bar*2+Math.floor(k/8))%8]+(k%4==3?12:0)),.13,.35,.04,8);if(lvl>2&&k%2==1)nois(mus,t,.03,.05,true);if(lvl>3){nois(mus,t,.02,.04,true);if(k%4==2)kick(t,.25);}
 if(lvl>1&&k==0)CH[bar%4].forEach(n=>{saw(mus,t,B*1.5,hz(n+12)*1.004,.028,.3,.08);saw(mus,t,B*1.5,hz(n+12)*.996,.028,.3,.08);});if(lvl>2&&k%4==0)saw(mus,t,B/4*.8,hz(CH[bar%4][(i/4)%3|0]+24),.03,.6,.2,6);}}
function riser(t0,d,v){const n0=Math.floor(t0*SR);let lp=0;for(let i=0;i<SR*d&&n0+i<N;i++){const u=i/(SR*d);lp+=(nz()-lp)*(.02+.5*u*u);mus[n0+i]+=lp*u*u*v;}}
const drone=(t0,d,n,v)=>{saw(mus,t0,d,hz(n),v,.12,.1,8,.03);saw(mus,t0,d,hz(n+12)*1.004,v*.6,.12,.1,8,.03);};
saw(mus,.5,1,hz(40),.12,.3,.05);nois(mus,.5,.5,.2,false);saw(mus,1.8,.7,hz(52),.14,.5,.1);nois(mus,1.8,.4,.3,false);kick(1.8,.7);
beat(2.6,7.74,2);beat(7.74,16.2,3);drone(16.2,3.2,40,.1);for(const n of [64,67,71])drone(17,2.4,n,.03);riser(17.2,2.2,.4);beat(19.4,24.2,4);
drone(24.2,4.3,27,.18);drone(24.2,4.3,28,.12);for(let t=24.4;t<28.4;t+=.86){kick(t,.6);kick(t+.2,.4);}riser(26.6,1.9,.5);beat(28.5,34.0,4);
drone(34,9,28,.14);beat(34.5,43,2);riser(35.0,1.4,.4);drone(42.5,4,28,.14);for(let t=44.5;t<46.5;t+=.25)kick(t,.2+.2*(t-44.5));riser(44.1,2.4,.55);beat(46.5,49.5,4);
const thud=(t,v)=>{nois(sfx,t,.12,.5*v,false,3);const n0=Math.floor(t*SR);for(let i=0;i<SR*.18&&n0+i<N;i++){const x=i/SR;sfx[n0+i]+=Math.sin(2*Math.PI*(160-600*x)*x)*Math.exp(-x*22)*.6*v;}nois(sfx,t,.03,.3*v,true);};
const clink=(t,v,f)=>{const n0=Math.floor(t*SR);for(let i=0;i<SR*.16&&n0+i<N;i++){const x=i/SR;sfx[n0+i]+=(Math.sin(2*Math.PI*f*x)+.5*Math.sin(2*Math.PI*f*1.51*x)+.3*Math.sin(2*Math.PI*f*2.76*x))*Math.exp(-x*28)*v;}};
const whoosh=(t,d,v)=>{const n0=Math.floor(t*SR);let lp=0;for(let i=0;i<SR*d&&n0+i<N;i++){const u=i/(SR*d);lp+=(nz()-lp)*(.05+.3*Math.sin(Math.PI*u));sfx[n0+i]+=lp*Math.sin(Math.PI*u)*v;}};
const boom=(t,v)=>{const n0=Math.floor(t*SR);let lp=0;for(let i=0;i<SR*1.8&&n0+i<N;i++){const x=i/SR;lp+=(nz()-lp)*.06;sfx[n0+i]+=(Math.sin(2*Math.PI*(34+24*Math.exp(-x*6))*x)*Math.exp(-x*2)+lp*Math.exp(-x*3)*1.2)*v;}};
const boing=(t,v)=>{const n0=Math.floor(t*SR);for(let i=0;i<SR*.3&&n0+i<N;i++){const x=i/SR;sfx[n0+i]+=Math.sin(2*Math.PI*(120+500*x)*x+3*Math.sin(2*Math.PI*22*x))*Math.exp(-x*8)*v;}};
[[3.3,'b'],[3.6],[4.3],[8.6,'B'],[10.6,'b'],[10.75,'b'],[10.9],[11.05],[14.2,'B']].forEach(([g,k])=>{if(k=='b')clink(g,.35,2100);else{thud(g,k?1.4:1);if(k)boom(g,.5);}});
[5.9,6.2,6.55,7.0,7.35,12.0,12.6,12.95].forEach(g=>{whoosh(g-.1,.14,.5);thud(g,.9);clink(g,.18,2600);});whoosh(5.25,.3,.4);whoosh(8.3,.3,.5);whoosh(13.6,.5,.4);whoosh(14.05,.2,.8);
boom(18.2,.6);boing(18.4,.3);for(let i=0;i<7;i++){thud(19.6+i*.3,.8);boing(19.6+i*.3,.25);}boom(22.4,.7);whoosh(22.95,.3,.6);boom(23.4,1.1);
boom(25.0,.9);saw(sfx,25.0,2.6,hz(31),.2,.2,.08,12,.5);whoosh(26.4,.5,.7);whoosh(26.5,.5,.6);boom(26.4,.5);
for(let i=0;i<9;i++){const g=30.2+i*.3;whoosh(g-.12,.16,.6);thud(g,.9);clink(g,.2,2500+(i%3)*200);}whoosh(33.2,.25,.9);boom(33.4,1);clink(33.4,.4,2700);thud(33.9,.7);
boom(35.5,.9);boom(36.3,.7);[[37.25,38.5],[38.85,40.1],[40.5,42.05]].forEach(([a,b],i)=>{boom(a,.6);whoosh(a,.5,.5);whoosh(b-.55,.5,.8);boom(b,i==2?1.4:1);thud(b,1.2);if(i==2)clink(b,.5,2700);});clink(44.1,.3,2200);whoosh(43.7,.4,.4);whoosh(46.5,3,.45);whoosh(49.1,.3,.9);thud(49.5,1.6);clink(49.5,.5,2700);boom(49.5,1.6);boom(49.55,1.2);
// ---------- Kampfschreie (Formant-Synthese, ohne Worte) ----------
const vox=new Float32Array(N),endB=new Float32Array(N);
const VOW={a:[800,1200,2700],ae:[680,1750,2550],o:[480,850,2650],u:[340,760,2450],e:[480,2000,2650],m:[260,1050,2300]};
function shout(t0,d,o){const n0=Math.floor(t0*SR),n=Math.floor(d*SR),sc=o.sc||1,vs=(o.v||'a').split('-').map(k=>VOW[k]),st=[0,0,0,0,0,0],dr=o.drive||2.5;let ph=0,sub=0;
 for(let i=0;i<n&&n0+i<N;i++){if(n0+i<0)continue;const u=i/n,t=i/SR;const f0=(o.f0[0]+(o.f0[1]-o.f0[0])*Math.pow(u,o.curve||1))*(1+.012*Math.sin(2*Math.PI*5.5*t)+.008*nz());ph+=f0/SR;if(ph>=1){ph-=1;sub^=1;}
  let src=(1-2*ph)*.8+nz()*(o.breath||.12);if(o.growl)src*=1+o.growl*(sub?1:-1)*.6+o.growl*.3*Math.sin(2*Math.PI*31*t);if(t<.05&&!o.noH)src+=nz()*(1-t/.05)*1.2;
  const seg=u*(vs.length-1),k=Math.min(vs.length-2,Math.floor(seg)),fr=vs.length>1?seg-k:0,F=vs.length>1?vs[k].map((f,j)=>f+(vs[k+1][j]-f)*fr):vs[0];let y=0;
  for(let j=0;j<3;j++){const w0=2*Math.PI*F[j]*sc/SR,Q=F[j]*sc/[90,110,150][j],al=Math.sin(w0)/(2*Q),cw=Math.cos(w0),a0=1+al;const x0=src;const out=(al*x0-al*st[j*2+1]*0+0)/a0;
   const yy=(al/a0)*x0-(al/a0)*st[j*2+1]+(2*cw/a0)*st[j*2]-((1-al)/a0)*(st[j*2+1+6]||0);}
  // einfacher Resonator je Formant (Zustandsvariablen-Filter)
  for(let j=0;j<3;j++){const f=2*Math.sin(Math.PI*Math.min(F[j]*sc,8000)/SR),q=1/([6,7,9][j]);const lpS=st[j*2],bpS=st[j*2+1];const lp=lpS+f*bpS,hp=src-lp-q*bpS,bp=f*hp+bpS;st[j*2]=lp;st[j*2+1]=bp;y+=bp*[1,.55,.3][j];}
  let env=Math.min(1,t/.018)*(u<.7?1:Math.pow(1-(u-.7)/.3,1.6))*(o.swell?(.7+.3*Math.sin(Math.PI*Math.min(1,u*1.5))):1);if(o.muffle)y*=.7;
  const s=Math.tanh(y*dr*.35)*env*o.vol;vox[n0+i]+=s;if(o.muffle&&i>0)vox[n0+i]=vox[n0+i]*.6+vox[n0+i-1]*.4;}}
const J=(t,d,f0a,f0b,v,vol=.5,x={})=>shout(t,d,Object.assign({f0:[f0a,f0b],v,vol,sc:1.08,drive:3},x));
const E=(t,d,f0a,f0b,v,vol=.5,x={})=>shout(t,d,Object.assign({f0:[f0a,f0b],v,vol,sc:.9,drive:3,muffle:true},x));
const laugh=(t0,n,f0,vol,sc=1.08,gap=.15)=>{for(let i=0;i<n;i++)shout(t0+i*gap,gap*.8,{f0:[f0*(1.1-i*.03),f0*(.9-i*.03)],v:'a',vol,sc,drive:2.5});};
// James: am Anfang witzig und verspielt (hoch, hüpfend), ab der Riesenfaust ernst (tiefer, kräftig), in der Gummi-Form und später lachend
J(3.18,.2,330,400,'a',.45);J(3.48,.22,360,300,'e-a',.45);J(4.12,.32,300,420,'u-a',.5,{curve:.5});J(5.22,.45,320,450,'u-a',.5);J(8.18,.55,280,420,'u-o-a',.55);
for(let i=0;i<5;i++)J(10.5+i*.13,.11,360+i*15,330,'a',.4);J(13.5,.75,190,240,'o-a',.65,{swell:true,drive:4});
laugh(16.55,7,240,.5,1.08,.14);laugh(17.6,6,265,.5,1.08,.13);J(19.35,.4,340,460,'u-o',.45,{curve:.5});J(21.65,.3,180,165,'m-a',.4);J(22.85,.55,200,250,'a',.65,{drive:4});
laugh(34.6,7,140,.6,.9,.19);J(37.85,.5,150,190,'o-a',.7,{sc:.92,drive:4});J(39.45,.5,150,195,'o-a',.7,{sc:.92,drive:4});J(41.3,.8,140,210,'u-o-a',.8,{sc:.92,swell:true,drive:4.5});
laugh(44.6,5,230,.4,1.08,.15);J(46.5,2.9,190,260,'u-o-a',.65,{swell:true,curve:.6,drive:4.5});J(49.05,.42,260,300,'a',.8,{drive:4.5});
// James wird getroffen
J(12.0,.18,360,280,'ae',.35);J(12.62,.18,350,270,'ae',.35);J(33.42,.35,260,180,'u-a',.45);
// Eddy: durchgehend tief und ernst, kaum Tonhöhenänderung, gedämpft durch das Schwert im Mund
[5.86,6.16,6.5,6.95,7.3,12.0,12.58,12.92].forEach((t,i)=>E(t-.04,.2,98-i%2*4,90,'m',.55,{drive:4}));E(3.28,.18,92,86,'m',.35);
E(8.6,.3,105,80,'m-u',.45);E(14.2,.32,102,78,'m-u',.45);for(let i=0;i<7;i++)E(19.58+i*.3,.16,95,88,'m',.42,{drive:4});E(23.4,.4,104,76,'m-u',.5);
E(24.95,1.35,70,52,'m-o-a',.8,{growl:1,drive:7,muffle:false,swell:true,breath:.25});E(25.0,1.3,36,28,'o-a',.5,{growl:1,drive:7,muffle:false,breath:.3});
[[88,.9],[76,.85],[96,.82]].forEach(([f,s],k)=>E(26.45+k*.05,.75,f,f*.8,'m-a',.42,{sc:s,growl:.8,drive:6,muffle:false}));
for(let i=0;i<9;i++)E(30.1+i*.3,.18,[94,86,100][i%3],[86,80,92][i%3],'m',.45,{growl:.4,drive:5});
[[84,.88],[74,.84],[92,.8]].forEach(([f,s],k)=>E(33.25+k*.03,.45,f,f*.85,'m-a',.48,{sc:s,growl:.7,drive:6}));
E(41.75,.55,88,74,'m-a',.62,{growl:.8,drive:6});E(43.7,.5,82,78,'m',.32);
E(46.5,2.9,78,92,'m-o-a',.65,{growl:.9,drive:6,swell:true,curve:.6});E(46.5,2.9,39,46,'o-a',.38,{growl:1,drive:7,muffle:false});E(49.1,.4,96,82,'m-a',.72,{growl:.8,drive:6});
// ---------- Schwarzbild am Ende ----------
const endBoom=(t,v)=>{const n0=Math.floor(t*SR);let lp=0;for(let i=0;i<SR*2.2&&n0+i<N;i++){const x=i/SR;lp+=(nz()-lp)*.05;endB[n0+i]+=(Math.sin(2*Math.PI*(30+20*Math.exp(-x*5))*x)*Math.exp(-x*1.4)+lp*Math.exp(-x*2.5))*v;}};
const pad=(t0,d,f,v)=>{const n0=Math.floor(t0*SR);for(let i=0;i<SR*d&&n0+i<N;i++){const x=i/SR,u=i/(SR*d);endB[n0+i]+=(Math.sin(2*Math.PI*f*x)+.5*Math.sin(2*Math.PI*f*2.003*x)+.3*Math.sin(2*Math.PI*f*3.01*x))*Math.min(1,x/.6)*Math.min(1,(1-u)*3)*v;}};
endBoom(50.35,.9);endBoom(51.45,.6);endBoom(51.7,.6);pad(50.35,4.65,55,.12);pad(51.45,3.55,82.4,.06);pad(52.5,2.5,110,.05);
const wet=new Float32Array(N);for(const [d,gn] of [[.031,.78],[.039,.77],[.047,.76]]){const D=Math.floor(d*SR*5),c=new Float32Array(N);for(let i=0;i<N;i++){c[i]=mus[i]*.6+sfx[i]*.5+vox[i]*.45+(i>=D?c[i-D]*gn*.8:0);wet[i]+=c[i]*.07;}}
const pcm=Buffer.alloc(44+N*2);pcm.write('RIFF',0);pcm.writeUInt32LE(36+N*2,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(SR,24);pcm.writeUInt32LE(SR*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(N*2,40);
for(let i=0;i<N;i++){const t=i/SR,cut=t<49.6?1:Math.max(0,1-(t-49.6)/.7);pcm.writeInt16LE(Math.round(Math.tanh(((mus[i]*1.1+sfx[i]*.55+vox[i]*1.0+wet[i])*cut+endB[i])*.8)*29000),44+i*2);}
fs.writeFileSync(path.join(TMP,'ton.wav'),pcm);if(only==='audio'){console.log('ton fertig');return;}
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i "${TMP}/f%04d.jpg" -i "${TMP}/ton.wav" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium -c:a aac -b:a 192k -shortest -movflags +faststart "${path.join(__dirname,'video-lang.mp4')}"`);console.log('fertig');})();
