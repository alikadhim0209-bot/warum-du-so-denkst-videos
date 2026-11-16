// Langer 3D-Arena-Kampf rendern: node render2.js  (braucht three@0.160.0, playwright, ffmpeg). node render2.js 17.5,26 -> Testbilder
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');const {chromium}=require('playwright');
const TMP=process.env.KAMPF_TMP||path.join(require('os').tmpdir(),'kampf-arena2');fs.mkdirSync(TMP,{recursive:true});
const THREE_JS=process.env.THREE_JS||require.resolve('three/build/three.min.js');const FPS=30,DUR=49;
(async()=>{const only=process.argv[2];
if(only!=='audio'){const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.setContent('<body style="margin:0;background:#000;overflow:hidden"><div id="gl"></div></body>');await p.addScriptTag({path:THREE_JS});
 for(const f of ['../kampf-james-vs-eddy-3d/scene.js','../kampf-james-vs-eddy-60s/scene60.js','scene-arena.js','scene-arena2.js'])await p.addScriptTag({path:path.join(__dirname,f)});
 if(only){for(const t of only.split(',')){await p.evaluate(t=>renderTK2(t),+t);await p.screenshot({path:path.join(TMP,'t'+(+t).toFixed(2)+'.jpg'),type:'jpeg',quality:70});}await b.close();return;}
 for(let i=0;i<FPS*DUR;i++){await p.evaluate(t=>renderTK2(t),i/FPS);await p.screenshot({path:path.join(TMP,'f'+String(i).padStart(4,'0')+'.jpg'),type:'jpeg',quality:92});}
 await p.evaluate(t=>renderTK2(t),27.6);await p.screenshot({path:path.join(__dirname,'cover-lang.png')});await b.close();}
const SR=44100,N=SR*DUR,mus=new Float32Array(N),sfx=new Float32Array(N);let seed=5;const nz=()=>{seed=(seed*16807)%2147483647;return seed/1073741823-1;},hz=n=>440*Math.pow(2,(n-69)/12),B=60/140;
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
drone(34,4,28,.14);for(let t=36;t<38;t+=.25)kick(t,.2+.2*(t-36));riser(35.6,2.4,.55);beat(38,41,4);drone(41.1,2.3,28,.14);beat(43.4,46,0);for(const n of [52,55,59,64])drone(46,2.8,n,.045);kick(46,.8);nois(mus,46,.6,.25,false);
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
whoosh(38,3,.45);whoosh(40.6,.3,.9);thud(41,1.6);clink(41,.5,2700);boom(41,1.6);boom(41.05,1.2);const tr=43.4+.5/.4;whoosh(tr-.3,.35,.5);thud(tr,1);boom(tr,.8);thud(41+.9/.45,.8);thud(41+.9/.45+.06,.7);
const wet=new Float32Array(N);for(const [d,gn] of [[.031,.78],[.039,.77],[.047,.76]]){const D=Math.floor(d*SR*5),c=new Float32Array(N);for(let i=0;i<N;i++){c[i]=mus[i]*.6+sfx[i]*.5+(i>=D?c[i-D]*gn*.8:0);wet[i]+=c[i]*.07;}}
const pcm=Buffer.alloc(44+N*2);pcm.write('RIFF',0);pcm.writeUInt32LE(36+N*2,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(SR,24);pcm.writeUInt32LE(SR*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(N*2,40);
for(let i=0;i<N;i++){const t=i/SR,duck=t>43.4&&t<46?.45:1;pcm.writeInt16LE(Math.round(Math.tanh((mus[i]*1.1*duck+sfx[i]*.55+wet[i])*.8)*29000),44+i*2);}
fs.writeFileSync(path.join(TMP,'ton.wav'),pcm);if(only==='audio'){console.log('ton fertig');return;}
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i "${TMP}/f%04d.jpg" -i "${TMP}/ton.wav" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium -c:a aac -b:a 192k -shortest -movflags +faststart "${path.join(__dirname,'video-lang.mp4')}"`);console.log('fertig');})();
