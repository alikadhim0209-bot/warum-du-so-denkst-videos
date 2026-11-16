// Erzeugt video.mp4 + cover.png: npm i three@0.160.0 playwright && node render.js  (braucht ffmpeg)
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');const {chromium}=require('playwright');
const TMP=process.env.KAMPF_TMP||path.join(require('os').tmpdir(),'kampf3d');fs.mkdirSync(TMP,{recursive:true});
const THREE_JS=process.env.THREE_JS||require.resolve('three/build/three.min.js');const FPS=30,DUR=10;
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']});
const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('console',m=>{if(m.type()=='error')console.log('ERR',m.text())});p.on('pageerror',e=>console.log('PAGEERR',e.message));
const txt='position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;font-family:Impact,Arial Black,sans-serif;-webkit-text-stroke:14px #17110f;paint-order:stroke fill;opacity:0';
await p.setContent(`<body style="margin:0;background:#000;overflow:hidden"><div id="gl"></div><div id="flash" style="position:absolute;inset:0;background:#fff;opacity:0"></div>
<div id="title" style="${txt};top:230px;font-size:112px;color:#fff">JAMES <span style="color:#ffd23f">VS</span> EDDY</div><div id="end" style="${txt};top:330px;font-size:118px;color:#ffd23f">UNENTSCHIEDEN?</div></body>`);
await p.addScriptTag({path:THREE_JS});await p.addScriptTag({path:path.join(__dirname,'scene.js')});
const only=process.argv[2];
if(only){for(const t of only.split(',')){await p.evaluate(t=>render(t),+t);await p.screenshot({path:path.join(TMP,'t'+t+'.jpg'),type:'jpeg',quality:80});}await b.close();return;}
for(let i=0;i<FPS*DUR;i++){await p.evaluate(t=>render(t),i/FPS);await p.screenshot({path:path.join(TMP,'f'+String(i).padStart(4,'0')+'.jpg'),type:'jpeg',quality:93});}
await p.evaluate(t=>render(t),5.2);await p.screenshot({path:path.join(__dirname,'cover.png')});await b.close();
const sfx=path.join(__dirname,'sfx.wav');
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i "${TMP}/f%04d.jpg" -i "${sfx}" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 160k -shortest -movflags +faststart "${path.join(__dirname,'video.mp4')}"`);console.log('fertig');})();
