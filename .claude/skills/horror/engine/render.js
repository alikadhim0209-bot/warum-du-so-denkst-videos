#!/usr/bin/env node
/* =====================================================================================
   HE · render.js – rendert eine Story (story.js + timing.json) zu einem stummen MP4
   oder zu Standbildern.

   node render.js <projekt> [--out video_silent.mp4] [--workers 4] [--scale 1.5]
                            [--from 0] [--to <dauer>] [--fps 30]
                            [--stills 1.2,12.5,40] [--stills-shots] [--list]

   --stills t1,t2,…   PNG-Standbilder (in <projekt>/stills/) – schnell zum Prüfen
   --stills-shots     je ein Standbild aus der Mitte jeder Einstellung
   --list             nur die Shot-Liste mit Zeiten ausgeben
   ===================================================================================== */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const flag = (name) => args.includes('--' + name);
if (!args[0] || args[0].startsWith('--')) { console.error('Aufruf: node render.js <projektordner> [optionen]'); process.exit(2); }
const project = path.resolve(args[0]);
const fps = +opt('fps', 30);
const scale = +opt('scale', 1.5);
const workers = +opt('workers', 4);
const ENGINE = __dirname;

function launchOpts() {
  const o = { args: ['--disable-web-security', '--allow-file-access-from-files', '--font-render-hinting=none', '--disable-lcd-text'] };
  if (fs.existsSync('/opt/pw-browsers/chromium') && process.env.HE_EXEC) o.executablePath = process.env.HE_EXEC;
  return o;
}

async function makePage(browser, timing) {
  const ctx = await browser.newContext({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(ENGINE, 'page.html'));
  await page.evaluate(async () => {
    await Promise.all([document.fonts.load("700 60px SS3B"), document.fonts.load("900 60px SS3K"), document.fonts.load("700 20px SCP")]);
  });
  // optionale Zusatz-Bibliotheken des Projekts (z. B. eigenes Monster) vor der Story laden
  const extra = path.join(project, 'lib');
  if (fs.existsSync(extra)) for (const f of fs.readdirSync(extra).filter((f) => f.endsWith('.js')).sort()) await page.addScriptTag({ path: path.join(extra, f) });
  await page.addScriptTag({ path: path.join(project, 'story.js') });
  const shots = await page.evaluate((t) => HE.load(t), timing);
  if (errors.length) throw new Error('Fehler in der Seite:\n' + errors.join('\n'));
  const cdp = await ctx.newCDPSession(page);
  return { page, cdp, shots, errors };
}

async function grab(cdp, format = 'jpeg') {
  // clip.scale = deviceScaleFactor → echte 1080×1920 (ohne clip liefert CDP nur 720×1280)
  const clip = { x: 0, y: 0, width: 720, height: 1280, scale };
  const r = await cdp.send('Page.captureScreenshot', format === 'png' ? { format: 'png', clip } : { format: 'jpeg', quality: 92, optimizeForSpeed: true, clip });
  return Buffer.from(r.data, 'base64');
}

(async () => {
  const timing = JSON.parse(fs.readFileSync(path.join(project, 'timing.json'), 'utf8'));
  const dur = timing.duration;
  const browser = await chromium.launch(launchOpts());
  try {
    if (flag('list')) {
      const { shots } = await makePage(browser, timing);
      shots.forEach((s) => console.log(`${s.start.toFixed(2).padStart(7)}–${s.end.toFixed(2).padStart(7)}  (${s.dur.toFixed(1)} s)  ${s.id}`));
      return;
    }
    const stillsArg = opt('stills', null);
    if (stillsArg || flag('stills-shots')) {
      const { page, cdp, shots, errors } = await makePage(browser, timing);
      let times = stillsArg ? stillsArg.split(',').map(Number) : shots.map((s) => +(s.start + Math.min(s.dur * 0.6, s.dur - 0.3)).toFixed(2));
      const dir = path.join(project, 'stills'); fs.mkdirSync(dir, { recursive: true });
      if (!stillsArg) for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(dir, f)); // alte Shot-Standbilder weg
      for (const T of times) {
        const r = await page.evaluate((T) => HE.render(T), T);
        if (errors.length) throw new Error(errors.join('\n'));
        const f = path.join(dir, `t${T.toFixed(2).padStart(7, '0')}_${r.shot}.png`);
        fs.writeFileSync(f, await grab(cdp, 'png'));
        console.log(f);
      }
      return;
    }
    // ---------------------------------------------------------------- Video
    const from = +opt('from', 0), to = Math.min(+opt('to', dur), dur);
    const f0 = Math.round(from * fps), f1 = Math.round(to * fps);
    const total = f1 - f0;
    const out = path.resolve(project, opt('out', 'video_silent.mp4'));
    const tmp = path.join(project, '.segments'); fs.mkdirSync(tmp, { recursive: true });
    const W = Math.min(workers, Math.max(1, Math.ceil(total / 60)));
    const per = Math.ceil(total / W);
    const t0 = Date.now(); let done = 0;
    const jobs = [];
    for (let k = 0; k < W; k++) {
      const a = f0 + k * per, b = Math.min(f1, a + per);
      if (a >= b) continue;
      const seg = path.join(tmp, `seg${String(k).padStart(2, '0')}.mp4`);
      jobs.push((async () => {
        const { page, cdp, errors } = await makePage(browser, timing);
        const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
        for (let f = a; f < b; f++) {
          await page.evaluate((T) => HE.render(T), f / fps);
          if (errors.length) throw new Error(`Frame ${f}: ` + errors.join('\n'));
          const buf = await grab(cdp);
          if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
          done++;
          if (done % 150 === 0) {
            const el = (Date.now() - t0) / 1000;
            process.stdout.write(`  ${done}/${total} Frames · ${(done / el).toFixed(1)} fps · Rest ~${Math.round((total - done) / (done / el))} s\n`);
          }
        }
        ff.stdin.end();
        await new Promise((r, j) => ff.on('close', (code) => (code ? j(new Error('ffmpeg ' + code)) : r())));
        return seg;
      })());
    }
    const segs = await Promise.all(jobs);
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
    await new Promise((r, j) => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' })
      .on('close', (c) => (c ? j(new Error('concat ' + c)) : r())));
    console.log(`fertig: ${out}  (${total} Frames in ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
