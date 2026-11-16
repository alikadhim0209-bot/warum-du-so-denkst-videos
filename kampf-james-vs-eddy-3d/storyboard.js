// Storyboard (Standbilder) der Verwandlungs-Szene: node storyboard.js
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const THREE_JS=process.env.THREE_JS||require.resolve('three/build/three.min.js');const OUT=path.join(__dirname,'../assets/charakter/skizzen');fs.mkdirSync(OUT,{recursive:true});
const B=[[0.2,'1 · James steht Eddy gegenüber'],[1.0,'2 · James fängt an zu lachen'],[1.9,'3 · Er wird von innen weiß'],[2.7,'4 · Haare, Hut, Kleidung: alles weiß'],[3.5,'5 · Das Weiß greift auf die Welt über'],[4.2,'6 · Boden und Berge werden elastisch'],[5.0,'7 · Alles wabert und hüpft'],[5.8,'8 · Weiße Gummi-Welt, James lacht']];
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']});
const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.setContent('<body style="margin:0;overflow:hidden"><div id="gl"></div></body>');await p.addScriptTag({path:THREE_JS});await p.addScriptTag({path:path.join(__dirname,'scene.js')});
const imgs=[];for(const [t,l] of B){await p.evaluate(t=>render2(t),t);imgs.push([l,(await p.screenshot({type:'jpeg',quality:92})).toString('base64')]);}
const q=await b.newPage({viewport:{width:2260,height:2140}});
await q.setContent(`<body style="margin:0;background:#f3e3bf;font-family:Arial,sans-serif;color:#17110f"><div style="font:900 64px Impact,Arial Black,sans-serif;padding:24px 40px 10px">STORYBOARD – James' Verwandlung</div>
<div style="display:grid;grid-template-columns:repeat(4,540px);gap:14px 20px;padding:0 20px">${imgs.map(([l,d])=>`<div><img src="data:image/jpeg;base64,${d}" style="width:540px;display:block;border:4px solid #17110f;box-sizing:border-box"><div style="font-size:27px;font-weight:bold;padding:6px 2px 0">${l}</div></div>`).join('')}</div></body>`);
await q.screenshot({path:path.join(OUT,'verwandlung-storyboard.png')});await b.close();console.log('fertig');})();
