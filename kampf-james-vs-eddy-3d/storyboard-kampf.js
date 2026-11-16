// Storyboard (Standbilder) der Verwandlungs-Szene: node storyboard.js
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const THREE_JS=process.env.THREE_JS||require.resolve('three/build/three.min.js');const OUT=path.join(__dirname,'../assets/charakter/skizzen');fs.mkdirSync(OUT,{recursive:true});
const B=[[0.4,'1 · Die beiden stehen sich gegenüber'],[1.5,'2 · Eddy nimmt das dritte Schwert in den Mund und lässt die Klingen kreisen'],[2.93,'3 · Eddy stürmt wirbelnd vor und trifft'],[5.7,'4 · James lacht und wird komplett weiß'],[7.1,'5 · Die Welt wird weiß und elastisch'],[8.9,'6 · James hebt die Welt hoch'],[9.99,'7 · Er wirft sie – Eddy schneidet sie entzwei'],[12.05,'8 · Gummi-Fäuste von oben, unten, überall'],[15.1,'9 · James macht sich riesig'],[15.5,'10 · Die Riesenfaust kracht herunter'],[16.9,'11 · Eddy rastet aus'],[18.3,'12 · Drei Eddys stehen Rücken an Rücken'],[20.2,'13 · Wirbelangriff von rechts, links und hinten'],[21.27,'14 · Zusammenprall'],[23.4,'15 · Ende offen']];
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']});
const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.setContent('<body style="margin:0;overflow:hidden"><div id="gl"></div></body>');await p.addScriptTag({path:THREE_JS});await p.addScriptTag({path:path.join(__dirname,'scene.js')});
const imgs=[];for(const [t,l] of B){await p.evaluate(t=>render3(t),t);imgs.push([l,(await p.screenshot({type:'jpeg',quality:92})).toString('base64')]);}
const q=await b.newPage({viewport:{width:2820,height:3180}});
await q.setContent(`<body style="margin:0;background:#f3e3bf;font-family:Arial,sans-serif;color:#17110f"><div style="font:900 64px Impact,Arial Black,sans-serif;padding:24px 40px 10px">STORYBOARD – Der große Kampf</div>
<div style="display:grid;grid-template-columns:repeat(5,540px);gap:14px 20px;padding:0 20px">${imgs.map(([l,d])=>`<div><img src="data:image/jpeg;base64,${d}" style="width:540px;display:block;border:4px solid #17110f;box-sizing:border-box"><div style="font-size:25px;font-weight:bold;padding:6px 2px 0;height:64px">${l}</div></div>`).join('')}</div></body>`);
await q.screenshot({path:path.join(OUT,'kampf-storyboard.png')});await b.close();console.log('fertig');})();
