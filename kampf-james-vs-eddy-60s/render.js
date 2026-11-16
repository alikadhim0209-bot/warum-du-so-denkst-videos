// 60-Sekunden-Kampf rendern: node render.js   (braucht three@0.160.0, playwright, ffmpeg)
// node render.js 1.5,4.05  -> nur Testbilder dieser Zeitpunkte nach $KAMPF_TMP
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');const {chromium}=require('playwright');
const TMP=process.env.KAMPF_TMP||path.join(require('os').tmpdir(),'kampf60');fs.mkdirSync(TMP,{recursive:true});
const THREE_JS=process.env.THREE_JS||require.resolve('three/build/three.min.js');const FPS=30,DUR=60;
(async()=>{const only=process.argv[2];
if(only!=='audio'){const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.setContent('<body style="margin:0;background:#000;overflow:hidden"><div id="gl"></div></body>');await p.addScriptTag({path:THREE_JS});await p.addScriptTag({path:path.join(__dirname,'../kampf-james-vs-eddy-3d/scene.js')});await p.addScriptTag({path:path.join(__dirname,'scene60.js')});
 if(only){for(const t of only.split(',')){await p.evaluate(t=>render60(t),+t);await p.screenshot({path:path.join(TMP,'t'+(+t).toFixed(2)+'.jpg'),type:'jpeg',quality:70});}await b.close();return;}
 for(let i=0;i<FPS*DUR;i++){await p.evaluate(t=>render60(t),i/FPS);await p.screenshot({path:path.join(TMP,'f'+String(i).padStart(4,'0')+'.jpg'),type:'jpeg',quality:92});}
 await p.evaluate(t=>render60(t),42.42);await p.screenshot({path:path.join(__dirname,'cover.png')});await b.close();}
// ---------------- Musik + Effekte (alles synthetisch) ----------------
const SR=44100,N=SR*DUR,mus=new Float32Array(N),sfx=new Float32Array(N);let seed=7;const nz=()=>{seed=(seed*16807)%2147483647;return seed/1073741823-1;};
const hz=n=>440*Math.pow(2,(n-69)/12);
function tone(buf,t0,dur,f,vol,o={}){const a=o.a||.01,r=o.r||.1,H=o.h||6,cut=o.cut||.25,n0=Math.floor(t0*SR),n=Math.floor((dur+r)*SR);let lp=0;
 for(let i=0;i<n&&n0+i<N;i++){if(n0+i<0)continue;const t=i/SR;let env=t<a?t/a:(t<dur?1:Math.max(0,1-(t-dur)/r));if(o.dec)env*=Math.exp(-t*o.dec);if(o.sw)env*=Math.min(1,t/dur)**o.sw;let s=0;const ph=2*Math.PI*f*t+(o.vib?o.vib*Math.sin(2*Math.PI*5.5*t):0);for(let h=1;h<=H;h++)s+=Math.sin(ph*h)/h;lp+=(s-lp)*cut;buf[n0+i]+=lp*env*vol;}}
const str=(t0,d,n,v)=>{tone(mus,t0,d,hz(n)*1.004,v,{a:.02,r:.12,h:8,cut:.35});tone(mus,t0,d,hz(n)*.996,v,{a:.02,r:.12,h:8,cut:.35});};
const brass=(t0,d,n,v)=>{tone(mus,t0,d,hz(n),v,{a:.05,r:.25,h:12,cut:.5,vib:.04});tone(mus,t0,d,hz(n-12),v*.6,{a:.05,r:.25,h:10,cut:.4});};
const choir=(t0,d,n,v)=>{for(const dt of [.993,1,1.007])tone(mus,t0,d,hz(n)*dt,v,{a:.35,r:.6,h:4,cut:.12,vib:.05});};
const drone=(t0,d,v)=>{tone(mus,t0,d,hz(26),v,{a:.5,r:1,h:5,cut:.08});tone(mus,t0,d,hz(38)*1.003,v*.7,{a:.5,r:1,h:6,cut:.1});};
function taiko(buf,t0,v){const n0=Math.floor(t0*SR);let lp=0;for(let i=0;i<SR*.9&&n0+i<N;i++){if(n0+i<0)continue;const t=i/SR;lp+=(nz()-lp)*.18;buf[n0+i]+=(Math.sin(2*Math.PI*(48*t+ 55*(1-Math.exp(-t*30))/30*0+ 30*t*Math.exp(-t*12)))*Math.exp(-t*5.5)*1.2+lp*Math.exp(-t*35)*.9)*v;}}
function hat(t0,v){const n0=Math.floor(t0*SR);let lp=0;for(let i=0;i<SR*.05&&n0+i<N;i++){const x=nz();lp+=(x-lp)*.3;mus[n0+i]+=(x-lp)*Math.exp(-i/SR*90)*v;}}
function riser(buf,t0,d,v){const n0=Math.floor(t0*SR);let lp=0;for(let i=0;i<SR*d&&n0+i<N;i++){const u=i/(SR*d);lp+=(nz()-lp)*(.02+.5*u*u);buf[n0+i]+=lp*u*u*v+Math.sin(2*Math.PI*(80+500*u*u)*i/SR)*u*v*.25;}}
function impact(t0,v){taiko(sfx,t0,v*1.6);const n0=Math.floor(t0*SR);let lp=0;for(let i=0;i<SR*1.6&&n0+i<N;i++){const t=i/SR;lp+=(nz()-lp)*.06;sfx[n0+i]+=(Math.sin(2*Math.PI*(34+20*Math.exp(-t*6))*t)*Math.exp(-t*2.2)+lp*Math.exp(-t*3)*1.2)*v;}}
const whoosh=(t0,d,v)=>{const n0=Math.floor(t0*SR);let lp=0;for(let i=0;i<SR*d&&n0+i<N;i++){const u=i/(SR*d);lp+=(nz()-lp)*(.05+.3*Math.sin(Math.PI*u));sfx[n0+i]+=lp*Math.sin(Math.PI*u)*v;}};
const clink=(t0,v,f)=>{const n0=Math.floor(t0*SR);for(let i=0;i<SR*.16&&n0+i<N;i++){const t=i/SR;sfx[n0+i]+=(Math.sin(2*Math.PI*f*t)+.5*Math.sin(2*Math.PI*f*1.51*t)+.3*Math.sin(2*Math.PI*f*2.76*t))*Math.exp(-t*28)*v;}};
const boing=(t0,v)=>{const n0=Math.floor(t0*SR);for(let i=0;i<SR*.35&&n0+i<N;i++){const t=i/SR;sfx[n0+i]+=Math.sin(2*Math.PI*(120+500*t)*t+3*Math.sin(2*Math.PI*22*t))*Math.exp(-t*7)*v;}};
// Harmonik: d-Moll, je 2 Takte (4 s): Dm – B – C – Dm
const ROOT=[62,58,60,62],MIN=[0,7,3,7,0,8,7,3],MAJ=[0,7,4,7,0,9,7,4],MEL=[74,77,76,74,77,81,79,77,74,77,76,72,74,72,70,69];
const ch=t=>Math.floor(t/4)%4,pat=t=>(ch(t)==0||ch(t)==3)?MIN:MAJ;
function ost(t0,t1,step,v,oct=0){for(let t=t0,i=0;t<t1-1e-6;t+=step,i++)str(t,step*.8,ROOT[ch(t)]+pat(t)[i%8]+oct,v*(i%4==0?1.3:1));}
function drums(t0,t1,lvl){for(let t=t0;t<t1-1e-6;t+=.5){const b=Math.round((t-t0)/.5)%4;if(lvl>=1&&b==0)taiko(mus,t,.9);if(lvl>=2&&b==2)taiko(mus,t,.7);if(lvl>=3){taiko(mus,t,b%2?.45:.2);hat(t+.25,.25);hat(t,.12);}if(lvl>=4){taiko(mus,t+.25,.35);taiko(mus,t+.375,.25);hat(t+.125,.15);hat(t+.375,.15);}}}
function melody(t0,t1,v,oct=0){for(let t=t0,i=Math.round(t0/2)%16;t<t1-1e-6;t+=1,i++)brass(t,.9,MEL[i%16]+oct,v);}
function pads(t0,t1,v){for(let t=t0;t<t1-1e-6;t+=4){const r=ROOT[ch(t)],third=(ch(t)==0||ch(t)==3)?3:4,d=Math.min(4,t1-t);choir(t,d-.3,r,v);choir(t,d-.3,r+third,v);choir(t,d-.3,r+7,v);}}
drone(0,12,.2);drums(0,6,1);drums(6,12,2);ost(3,8,.25,.05);ost(8,12,.25,.075);melody(8,12,.05,-12);riser(mus,10.6,1.4,.3);
drone(12,16,.22);for(let t=12.5;t<14;t+=1){taiko(mus,t,.5);taiko(mus,t+.22,.35);}riser(mus,14,2,.45);choir(14,2,62,.035);choir(14,2,69,.035);
drone(16,26,.15);ost(16,26,.125,.06);drums(16,26,3);melody(16,26,.085);pads(16,26,.03);riser(mus,24.6,1.4,.25);
tone(mus,26,3,hz(38),.2,{a:.3,r:.5,h:14,cut:.3,vib:.06});tone(mus,26,3,hz(39),.14,{a:.3,r:.5,h:14,cut:.3,vib:.06});for(let t=26;t<29;t+=1)taiko(mus,t,.7);for(let t=28,i=0;t<29;t+=.0625,i++)taiko(mus,t,.15+.03*i);riser(mus,27.4,1.6,.45);
drone(29,37,.15);ost(29,37,.125,.065);drums(29,37,4);melody(29,37,.09);melody(29,37,.045,12);pads(29,37,.035);
drone(37,40,.25);for(let t=37;t<40;t+=1)taiko(mus,t,.8);riser(mus,37.6,2.4,.5);brass(37,2.8,38,.1);
drone(40,48,.2);ost(40,48,.25,.06,-12);for(let t=40;t<48;t+=2){taiko(mus,t,1.1);taiko(mus,t+.75,.7);taiko(mus,t+1.5,.5);brass(t,.7,ROOT[ch(t)]-24,.13);brass(t+.75,.5,ROOT[ch(t)]-24,.1);}melody(40,48,.08,-12);pads(40,48,.04);
tone(mus,48,4,hz(86),.02,{a:1,r:.8,h:3,cut:.2,vib:.08});drone(48,52,.1);riser(mus,50,2,.6);for(let t=51,i=0;t<52;t+=.0625,i++)taiko(mus,t,.12+.035*i);
drone(52,54,.18);ost(52,54,.125,.075);drums(52,54,4);for(let i=0;i<8;i++)brass(52+i*.25,.22,62+[0,3,5,7,8,10,12,15][i],.09);
tone(mus,54.3,2.4,hz(93),.016,{a:.6,r:.6,h:2,cut:.2,vib:.1});
for(const n of [50,62,66,69,74,78])choir(58,2,n,.035);brass(58,2,50,.1);brass(58,2,62,.07);taiko(mus,58,1);taiko(mus,58.5,.8);
// Effekte passend zu den Szenen
whoosh(3.95,.25,.6);clink(4.03,.4,2600);boom=(t,v)=>taiko(sfx,t,v);boom(4.45,.5);whoosh(5.5,.22,.6);boom(5.7,.9);clink(5.7,.3,1900);whoosh(5.95,.6,.5);
for(let t=6.7;t<8;t+=.1){clink(t,.22,1700+(Math.round(t*10)%3)*350);boom(t,.15);}clink(8.45,.35,2300);for(const t of [9.1,9.5,9.9])whoosh(t,.35,.55);boing(10.0,.3);clink(10.65,.35,2400);whoosh(10.7,.5,.6);impact(11.2,.6);
whoosh(12.2,.8,.4);impact(13.0,.8);boing(15.2,.25);for(let k=0;k<10;k++){boom(16.13+k*.26,.5);boing(16.13+k*.26,.16);}
boom(19.42,.8);whoosh(20.0,.3,.5);whoosh(20.5,.3,.7);impact(20.8,1);whoosh(22,1.3,.35);whoosh(24.0,.5,.7);clink(24.6,.5,2600);impact(24.6,.7);boom(25.3,.5);boom(25.35,.5);
impact(26.3,.5);whoosh(27.4,.4,.5);for(let t=29.9;t<32.6;t+=.12)clink(t,.22,1600+(Math.round(t*9)%3)*380);for(let t=31.2;t<32.6;t+=.07)whoosh(t,.08,.3);impact(32.65,1);boom(33.25,.6);
whoosh(35.0,.6,.8);impact(35.6,1.2);whoosh(38,1.6,.4);impact(40.8,1.3);whoosh(42.2,.25,.8);impact(42.4,1.4);clink(43.5,.4,1500);boom(43.5,.6);
for(let t=44.05;t<46.2;t+=.157)clink(t,.25,1800+(Math.round(t*7)%3)*300);whoosh(46.6,.25,.7);clink(46.8,.5,2700);impact(46.8,.9);boom(47.6,.5);
whoosh(52,2,.5);clink(54.0,.6,2500);impact(54.0,1.6);impact(54.05,1.2);clink(56.8,.5,2800);clink(56.86,.4,2100);impact(56.8,1.5);boom(58.5,.7);boom(58.56,.7);
// einfacher Hall auf der Musik, dann mischen
const wet=new Float32Array(N);for(const [d,g] of [[.0297,.8],[.0371,.79],[.0411,.78],[.0437,.77]]){const D=Math.floor(d*SR*6),c=new Float32Array(N);for(let i=0;i<N;i++){c[i]=mus[i]+(i>=D?c[i-D]*g*.82:0);wet[i]+=c[i]*.06;}}
const pcm=Buffer.alloc(44+N*2);pcm.write('RIFF',0);pcm.writeUInt32LE(36+N*2,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(SR,24);pcm.writeUInt32LE(SR*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(N*2,40);
for(let i=0;i<N;i++){const duck=(i/SR>54.2&&i/SR<56.8)||(i/SR>48&&i/SR<50)?.6:1;pcm.writeInt16LE(Math.round(Math.tanh(((mus[i]*1.5+wet[i]*1.6)*duck+sfx[i]*.7)*.42)*31000),44+i*2);}
fs.writeFileSync(path.join(TMP,'ton.wav'),pcm);if(only==='audio'){console.log('ton fertig');return;}
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i "${TMP}/f%04d.jpg" -i "${TMP}/ton.wav" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium -c:a aac -b:a 192k -shortest -movflags +faststart "${path.join(__dirname,'video.mp4')}"`);console.log('fertig');})();
