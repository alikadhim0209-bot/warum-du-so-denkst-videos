// Rendert duell.html Bild fuer Bild.  node render.js sheet <out.png> t1 t2 ...  |  node render.js video <out.mp4>
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : 'text/javascript' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(8766, r));
  const [mode, out, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('SEITENFEHLER', e.message); process.exitCode = 1; });
  await page.goto('http://localhost:8766/duell/duell.html');
  await page.waitForFunction('window.bereit === true', null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);

  if (mode === 'sheet') {
    const dir = fs.mkdtempSync(path.join(path.dirname(out), 'sheet-'));
    const ts = rest.map(Number);
    for (let i = 0; i < ts.length; i++) {
      await page.evaluate(t => window.frame(t), ts[i]);
      await page.screenshot({ path: path.join(dir, String(i).padStart(3, '0') + '.png') });
    }
    const cols = Math.min(6, ts.length), rows = Math.ceil(ts.length / cols);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(dir, '%03d.png'),
      '-vf', `scale=324:576,tile=${cols}x${rows}`, '-frames:v', '1', out]);
    fs.rmSync(dir, { recursive: true });
  } else {
    const dauer = await page.evaluate('window.DAUER'), fps = 30, n = Math.round(dauer * fps);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.frame(t), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 90 === 0) console.log(`Bild ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log('fertig', out);
  }
  await browser.close(); server.close();
})();
