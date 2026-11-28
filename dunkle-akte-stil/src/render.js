// Rendert die Szene Bild fuer Bild als PNG (Headless-Chromium + WebGL/SwiftShader).
// Aufruf: node render.js <szene> <buildDir> [startFrame] [endFrame]
//   TIMES=0.5,3.1 node render.js ...   -> nur einzelne Zeitpunkte (Testbilder)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = __dirname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const [, , scene, buildDir, startArg, endArg] = process.argv;
  const tl = JSON.parse(fs.readFileSync(path.join(buildDir, 'timeline.json'), 'utf8'));
  const plan = JSON.parse(fs.readFileSync(path.join(buildDir, 'plan.json'), 'utf8'));
  const fps = plan.fps;
  const N = Math.round(plan.duration * fps);
  const outDir = path.join(buildDir, process.env.TIMES ? 'test' : 'frames');
  fs.mkdirSync(outDir, { recursive: true });

  let frames;
  if (process.env.TIMES) frames = process.env.TIMES.split(',').map((s) => Math.round(parseFloat(s) * fps));
  else {
    const a = startArg ? parseInt(startArg, 10) : 0;
    const b = endArg ? parseInt(endArg, 10) : N;
    frames = [];
    for (let f = a; f < b; f++) frames.push(f);
  }

  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?scene=${scene}`);
  await page.waitForFunction(() => window.pageReady === true, null, { timeout: 60000 });
  await page.evaluate(([a, b]) => window.setup(a, b), [tl, plan]);

  const t0 = Date.now();
  for (const f of frames) {
    const t = f / fps;
    await page.evaluate((tt) => window.renderFrame(tt), t);
    const name = process.env.TIMES ? `t_${t.toFixed(2)}.png` : `f_${String(f).padStart(4, '0')}.png`;
    await page.screenshot({ path: path.join(outDir, name), clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  }
  console.log(`rendered ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await browser.close();
  srv.close();
})();
