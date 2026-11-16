// 10-Sekunden-Schnittfassung des großen Kampfs (Szene: ../kampf-james-vs-eddy-3d/scene.js, Funktion render3).
// node render.js   (braucht three@0.160.0, playwright, ffmpeg)
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');const {chromium}=require('playwright');
const TMP=process.env.KAMPF_TMP||path.join(require('os').tmpdir(),'kampf3d-v2');fs.mkdirSync(TMP,{recursive:true});
const THREE_JS=process.env.THREE_JS||require.resolve('three/build/three.min.js');const FPS=30,DUR=10;
// Schnittliste: [Quelle von, Quelle bis, Dauer im Video]
const CUT=[[.8,3.3,2.0],[4.6,7.2,1.5],[8.3,10.4,1.6],[10.6,12.2,1.2],[14.4,15.9,1.2],[17.3,18.4,.5],[19.6,21.6,1.5],[23.0,23.5,.5]];
const src=t=>{let a=0;for(const [s,e,d] of CUT){if(t<a+d)return s+(e-s)*(t-a)/d;a+=d;}return CUT[CUT.length-1][1];};
const dst=s=>{let a=0;for(const [s0,e,d] of CUT){if(s>=s0&&s<=e)return a+d*(s-s0)/(e-s0);a+=d;}return null;};
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']});
const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
const txt='position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;font-family:Impact,Arial Black,sans-serif;-webkit-text-stroke:14px #17110f;paint-order:stroke fill;opacity:0';
await p.setContent(`<body style="margin:0;background:#000;overflow:hidden"><div id="gl"></div><div id="flash" style="position:absolute;inset:0;background:#fff;opacity:0"></div>
<div id="title" style="${txt};top:230px;font-size:112px;color:#fff">JAMES <span style="color:#ffd23f">VS</span> EDDY</div><div id="end" style="${txt};top:330px;font-size:70px;color:#ffd23f"></div></body>`);
await p.addScriptTag({path:THREE_JS});await p.addScriptTag({path:path.join(__dirname,'../kampf-james-vs-eddy-3d/scene.js')});
for(let i=0;i<FPS*DUR;i++){await p.evaluate(t=>render3(t),src(i/FPS));await p.screenshot({path:path.join(TMP,'f'+String(i).padStart(4,'0')+'.jpg'),type:'jpeg',quality:93});}
await p.evaluate(t=>render3(t),8.9);await p.screenshot({path:path.join(__dirname,'cover.png')});await b.close();
// Ton: einfache synthetische Effekte, an die Schnittliste angepasst
const SR=44100,buf=new Float32Array(SR*DUR);let seed=1;const nz=()=>{seed=(seed*16807)%2147483647;return seed/1073741823-1;};
const add=(s0,d,fn)=>{const t0=dst(s0);if(t0==null)return;for(let i=0;i<d*SR;i++){const k=Math.floor(t0*SR)+i;if(k<buf.length)buf[k]+=fn(i/SR,i/(d*SR));}};
const whoosh=(t0,d,v)=>{let lp=0;add(t0,d,(s,u)=>{lp+=(nz()-lp)*(.05+.25*u);return lp*Math.sin(Math.PI*u)*v;});};
const boom=(t0,v)=>add(t0,.7,(s,u)=>Math.sin(2*Math.PI*(90-50*u)*s)*Math.pow(1-u,2)*v+nz()*Math.pow(1-u,8)*v*.6);
const clink=(t0,v,f)=>add(t0,.12,(s,u)=>(Math.sin(2*Math.PI*f*s)+.5*Math.sin(2*Math.PI*f*1.51*s))*Math.pow(1-u,3)*v);
clink(.85,.3,2200);for(let s=1.0;s<2.9;s+=.16)whoosh(s,.14,.22);boom(2.95,.8);clink(2.95,.35,1900);
whoosh(4.7,1.4,.3);boom(6.1,.5);whoosh(6.3,.8,.3);whoosh(8.3,.9,.4);whoosh(9.45,.5,.7);clink(9.97,.4,2400);boom(9.97,.7);
for(let s=10.65;s<12.2;s+=.1){clink(s,.26,1700+Math.round((s*10)%3)*350);boom(s,.15);}
whoosh(14.6,.6,.4);whoosh(15.2,.25,.8);boom(15.45,1.2);boom(15.52,.8);whoosh(17.3,.5,.4);
for(let s=19.7;s<21.2;s+=.115)clink(s,.26,1600+Math.round((s*9)%3)*380);boom(21.25,1.2);clink(21.25,.4,1500);whoosh(23.0,.5,.2);
const pcm=Buffer.alloc(44+buf.length*2);pcm.write('RIFF',0);pcm.writeUInt32LE(36+buf.length*2,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(SR,24);pcm.writeUInt32LE(SR*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(buf.length*2,40);
for(let i=0;i<buf.length;i++)pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,buf[i]*.8))*32767),44+i*2);fs.writeFileSync(path.join(TMP,'sfx.wav'),pcm);
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i "${TMP}/f%04d.jpg" -i "${TMP}/sfx.wav" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 160k -shortest -movflags +faststart "${path.join(__dirname,'video.mp4')}"`);console.log('fertig');})();
