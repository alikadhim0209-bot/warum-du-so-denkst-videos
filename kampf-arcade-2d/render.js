// Arcade-2D-Kampf: node render.js   (braucht playwright + ffmpeg). node render.js 2.6,5.4 -> nur Testbilder
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');const {chromium}=require('playwright');
const CH=path.join(__dirname,'../assets/charakter/'),TMP=process.env.KAMPF_TMP||path.join(require('os').tmpdir(),'kampf-arcade');fs.mkdirSync(TMP,{recursive:true});const FPS=30,DUR=24;
function cut(s,a,b){const i=s.indexOf(a),j=s.indexOf(b);if(i<0||j<0||j<i)throw new Error('Schnitt fehlt: '+a);return s.slice(0,i)+s.slice(j);}
(async()=>{const only=process.argv[2];const b=await chromium.launch();
if(only!=='audio'){
 let js=fs.readFileSync(CH+'james-federumhang.svg','utf8');js=cut(js,'<g id="arme">','<g id="federboa">');
 let es=fs.readFileSync(CH+'eddy-pelzumhang.svg','utf8');es=cut(es,'<g id="schwerter">','<g id="bein-links">');es=cut(es,'<g id="schwertgriffe">','<path id="pelz-kragen"');
 const BODY={};for(const [k,s] of [['J',js],['E',es]]){const vb=s.match(/viewBox="(-?\d+) (-?\d+) (\d+) (\d+)"/).slice(1).map(Number);const p=await b.newPage({viewport:{width:vb[2],height:vb[3]},deviceScaleFactor:.3});await p.setContent('<body style="margin:0;background:transparent">'+s+'</body>');
  BODY[k]=`<image href="data:image/png;base64,${(await p.screenshot({omitBackground:true})).toString('base64')}" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}"/>`;await p.close();}
 let planks='';for(let i=0;i<9;i++)planks+=`<path d="M${-60+i*55} 240 L${100+i*15} 172" stroke="#4a2a14" stroke-width="1"/>`;
 let lamps='';for(let i=0;i<5;i++)lamps+=`<path d="M${20+i*75} 60 v14" stroke="#2a1420"/><rect x="${15+i*75}" y="74" width="10" height="13" rx="3" fill="${i%2?'#ff5a3c':'#ffd23f'}" stroke="#2a1420"/>`;
 const p=await b.newPage({viewport:{width:320,height:240}});p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.setContent(`<body style="margin:0;background:#000;overflow:hidden"><svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240" shape-rendering="crispEdges">
 <defs><filter id="wh"><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter></defs>
 <rect width="320" height="34" fill="#2a1b4d"/><rect y="34" width="320" height="30" fill="#5b2a6b"/><rect y="64" width="320" height="28" fill="#b8405e"/><rect y="92" width="320" height="26" fill="#f08a4b"/><rect y="118" width="320" height="30" fill="#ffd27a"/>
 <g id="bgp"><circle cx="160" cy="132" r="44" fill="#fff2b8"/><rect x="100" y="120" width="120" height="3" fill="#ffd27a"/><rect x="100" y="130" width="120" height="3" fill="#ffd27a"/><rect x="100" y="140" width="120" height="3" fill="#ffd27a"/>
 <path d="M-40 150 L20 108 L60 138 L110 100 L150 144 L210 112 L260 140 L300 104 L360 150Z" fill="#7a3558"/><rect x="-40" y="148" width="400" height="26" fill="#3f5fa8"/><path d="M-40 156 h400 M-40 164 h400" stroke="#6f93d6" stroke-width="1" stroke-dasharray="14 10"/>
 <path d="M-40 60 Q160 74 360 60" stroke="#2a1420" fill="none"/>${lamps}
 <rect x="-40" y="160" width="400" height="6" fill="#6b3f1e" stroke="#2a1420"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${-30+i*52}" y="150" width="5" height="22" fill="#6b3f1e" stroke="#2a1420"/>`).join('')}</g>
 <rect y="172" width="320" height="68" fill="#8a5a2b"/><rect y="172" width="320" height="3" fill="#c78a4a"/>${planks}<path d="M0 190 h320 M0 212 h320" stroke="#6e4520" stroke-width="1"/>
 <g id="dyn"></g><g id="hud"></g></svg><script>const BODY=${JSON.stringify(BODY)};</script></body>`);
 await p.addScriptTag({path:path.join(__dirname,'spiel.js')});await p.waitForFunction(()=>typeof renderGame=='function');await p.waitForTimeout(400);
 if(only){for(const t of only.split(',')){await p.evaluate(t=>renderGame(t),+t);await p.screenshot({path:path.join(TMP,'t'+(+t).toFixed(2)+'.png')});}await b.close();return;}
 for(let i=0;i<FPS*DUR;i++){await p.evaluate(t=>renderGame(t),i/FPS);await p.screenshot({path:path.join(TMP,'f'+String(i).padStart(4,'0')+'.png')});}
 // Automaten-Gehäuse + Scheibe (Scanlines)
 const btn=(x,y,c)=>`<circle cx="${x}" cy="${y}" r="46" fill="#111"/><circle cx="${x}" cy="${y-6}" r="38" fill="${c}" stroke="#000" stroke-width="4"/><ellipse cx="${x-10}" cy="${y-22}" rx="16" ry="8" fill="#fff" opacity=".35"/>`;
 const q=await b.newPage({viewport:{width:1080,height:1920}});
 await q.setContent(`<body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1030"/><stop offset="1" stop-color="#0a0614"/></linearGradient><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a3c"/><stop offset="1" stop-color="#b81c5a"/></linearGradient></defs>
 <rect width="1080" height="1920" fill="url(#g)"/><rect x="0" y="0" width="34" height="1920" fill="#ff5a3c"/><rect x="1046" y="0" width="34" height="1920" fill="#ff5a3c"/><rect x="34" y="0" width="10" height="1920" fill="#ffd23f"/><rect x="1036" y="0" width="10" height="1920" fill="#ffd23f"/>
 <rect x="70" y="90" width="940" height="330" rx="24" fill="url(#m)" stroke="#ffd23f" stroke-width="10"/><text x="540" y="250" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="112" fill="#fff" stroke="#17110f" stroke-width="14" paint-order="stroke">GUMMI <tspan fill="#ffd23f">VS</tspan> STAHL</text>
 <text x="540" y="360" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="64" fill="#ffd23f" stroke="#17110f" stroke-width="10" paint-order="stroke">JAMES · EDDY</text>
 <rect x="24" y="524" width="1032" height="792" rx="40" fill="#050308" stroke="#2c2340" stroke-width="12"/><rect x="60" y="560" width="960" height="720" fill="#000"/>
 <path d="M0 1400 L1080 1400 L1080 1840 L0 1840Z" fill="#2a1b4d" stroke="#ffd23f" stroke-width="8"/><rect x="0" y="1840" width="1080" height="80" fill="#0a0614"/>
 <circle cx="230" cy="1640" r="74" fill="#111"/><rect x="216" y="1500" width="28" height="140" fill="#888" stroke="#000" stroke-width="4"/><circle cx="230" cy="1490" r="56" fill="#e02a2a" stroke="#000" stroke-width="5"/><ellipse cx="212" cy="1468" rx="20" ry="11" fill="#fff" opacity=".4"/>
 ${btn(520,1560,'#ffd23f')}${btn(660,1520,'#3fa9ff')}${btn(800,1500,'#3fd97a')}${btn(540,1700,'#ff5a3c')}${btn(680,1660,'#c06bff')}${btn(820,1640,'#fff')}
 <text x="230" y="1790" text-anchor="middle" font-family="Impact,sans-serif" font-size="44" fill="#ffd23f">1P</text><text x="960" y="1790" text-anchor="middle" font-family="Impact,sans-serif" font-size="44" fill="#ffd23f">START</text><circle cx="960" cy="1700" r="30" fill="#fff" stroke="#000" stroke-width="4"/></svg></body>`);
 await q.screenshot({path:path.join(TMP,'gehaeuse.png')});
 let sl='';for(let y=0;y<720;y+=3)sl+=`<rect x="60" y="${560+y+2}" width="960" height="1" fill="#000" opacity=".28"/>`;
 await q.setContent(`<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><defs><radialGradient id="v"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>${sl}<rect x="60" y="560" width="960" height="720" fill="url(#v)"/><path d="M60 560 h960 v120 Q540 620 60 760Z" fill="#fff" opacity=".05"/></svg></body>`);
 await q.screenshot({path:path.join(TMP,'scheibe.png'),omitBackground:true});await b.close();}
// ---------------- Chiptune + Effekte ----------------
const SR=44100,N=SR*DUR,buf=new Float32Array(N);let seed=3;const nz=()=>{seed=(seed*16807)%2147483647;return seed/1073741823-1;},hz=n=>440*Math.pow(2,(n-69)/12);
function sq(t0,d,f,v,duty=.5,f1){const n0=Math.floor(t0*SR);let ph=0;for(let i=0;i<d*SR&&n0+i<N;i++){const u=i/(d*SR),ff=f1?f+(f1-f)*u:f;ph+=ff/SR;buf[n0+i]+=((ph%1)<duty?1:-1)*v*Math.min(1,i/60)*Math.min(1,(1-u)*12);}}
function tri(t0,d,f,v){const n0=Math.floor(t0*SR);for(let i=0;i<d*SR&&n0+i<N;i++){const p=(f*i/SR)%1;buf[n0+i]+=(4*Math.abs(p-.5)-1)*v*Math.min(1,(1-i/(d*SR))*10);}}
function noi(t0,d,v,hold=1){const n0=Math.floor(t0*SR);let x=0;for(let i=0;i<d*SR&&n0+i<N;i++){if(i%hold==0)x=nz();buf[n0+i]+=x*v*Math.pow(1-i/(d*SR),2);}}
const st=60/160/4; // Sechzehntel
const MEL=[[76,0,76,79,0,76,74,0,71,0,74,0,76,0,0,0],[79,0,79,83,0,79,78,0,74,0,78,0,79,0,0,0],[81,0,81,84,0,81,79,0,76,0,79,0,83,0,81,79],[78,0,76,0,74,0,71,0,74,0,76,0,71,0,0,0]],BASS=[40,43,45,47];
function song(t0,t1){for(let t=t0,i=0;t<t1-1e-6;t+=st,i++){const bar=Math.floor(i/16)%4,k=i%16,n=MEL[bar][k];if(n){let len=1;while(k+len<16&&!MEL[bar][k+len])len++;sq(t,Math.min(len,3)*st*.9,hz(n),.11,.25);sq(t,Math.min(len,3)*st*.9,hz(n-12)*1.005,.05,.5);}
 if(k%2==0)tri(t,st*1.7,hz(BASS[bar]+(k%8==4?7:0)),.22);if(k%8==0)sq(t,.07,160,.2,.5,45);if(k%8==4)noi(t,.1,.16,2);if(k%2==0)noi(t,.03,.05,1);if(k%4==2&&bar%2)sq(t,st*.8,hz(MEL[bar][0]+12),.035,.125);}}
sq(.05,.07,988,.12);sq(.12,.25,1319,.12);[64,67,71,76].forEach((n,i)=>sq(.35+i*.11,.1,hz(n),.1,.25));sq(.8,.4,hz(79),.1,.25);sq(1.4,.12,hz(76),.14);sq(1.52,.5,hz(83),.14,.25);noi(1.4,.3,.2,3);
song(2.2,12.0);noi(12.0,.3,.25,4);for(let i=0;i<10;i++)sq(12.0+i*.022,.03,400+i*120,.09,.25);song(12.3,15.4);for(let i=0;i<12;i++)sq(15.4+i*.022,.03,300+i*140,.09,.25);noi(15.4,.3,.25,4);song(15.75,17.9);
const hit=(t,v=1)=>{noi(t,.09,.3*v,3);sq(t,.08,220,.14*v,.5,70);};
[2.62,2.92,3.22].forEach(t=>{noi(t-.06,.06,.1,1);hit(t,.8);});for(let i=0;i<12;i++)hit(12.3+i*.16,.6);[5.4,5.9,7.3].forEach(t=>hit(t));hit(6.5,1.2);sq(6.38,.14,300,.1,.25,900);hit(10.2,1.1);sq(9.0,.2,300,.08,.25,800);sq(8.56,.2,900,.08,.125,300);sq(11.0,.06,1500,.12,.125);sq(11.06,.06,1900,.1,.125);
for(let i=0;i<8;i++)hit(16.6+i*.08,.55);sq(17.3,.45,120,.12,.5,500);noi(17.9,.9,.5,6);sq(17.9,.9,700,.18,.5,50);noi(18.9,.12,.25,5);noi(19.15,.08,.15,5);
[[72,.12],[76,.12],[79,.12],[84,.3],[79,.12],[84,.6]].reduce((t,[n,d])=>{sq(t,d*.95,hz(n),.13,.25);tri(t,d*.95,hz(n-24),.2);return t+d;},19.25);sq(21.3,.07,988,.08);sq(21.37,.2,1319,.08);
const pcm=Buffer.alloc(44+N*2);pcm.write('RIFF',0);pcm.writeUInt32LE(36+N*2,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(SR,24);pcm.writeUInt32LE(SR*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(N*2,40);
for(let i=0;i<N;i++)pcm.writeInt16LE(Math.round(Math.tanh(buf[i]*1.3)*26000),44+i*2);fs.writeFileSync(path.join(TMP,'ton.wav'),pcm);if(only==='audio'){console.log('ton fertig');return;}
execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i "${TMP}/f%04d.png" -loop 1 -i "${TMP}/gehaeuse.png" -loop 1 -i "${TMP}/scheibe.png" -i "${TMP}/ton.wav" -filter_complex "[0:v]format=rgb24,lutrgb=r='trunc(val/28)*28+14':g='trunc(val/28)*28+14':b='trunc(val/28)*28+14',scale=960:720:flags=neighbor[g];[1:v][g]overlay=60:560[a];[a][2:v]overlay=0:0,format=yuv420p[v]" -map "[v]" -map 3:a -t ${DUR} -c:v libx264 -crf 20 -preset medium -c:a aac -b:a 160k -movflags +faststart "${path.join(__dirname,'video.mp4')}"`);
execSync(`ffmpeg -y -loglevel error -ss 12.9 -i "${path.join(__dirname,'video.mp4')}" -frames:v 1 "${path.join(__dirname,'cover.png')}"`);console.log('fertig');})();
