// Generischer Seiten-Teil: laedt die Szene, steuert Untertitel / Schwarzblende.
// Die Szene (z.B. /demo-aufzug/scene.js) exportiert build({canvas, plan, timeline}) -> {update(t)}.
const params = new URLSearchParams(location.search);
const sceneName = params.get('scene') || 'demo-aufzug';
const mod = await import(`/${sceneName}/scene.js`);

let api = null;
let captions = [];
let plan = null;
const capEl = document.getElementById('cap');
const blackEl = document.getElementById('black');
let lastCap = null;

function capHtml(text) {
  // *WORT* -> rotes Schluesselwort
  return text.replace(/\*([^*]+)\*/g, '<span class="r">$1</span>');
}

window.setup = async (timeline, p) => {
  plan = p;
  captions = timeline.captions || [];
  await Promise.all([
    document.fonts.load('92px Anton'),
    document.fonts.load('700 25px "Space Mono"'),
    ...[300, 400, 500, 600, 700].map((w) => document.fonts.load(`${w} 40px Inter`)),
  ]);
  await document.fonts.ready;
  api = await mod.build({ canvas: document.getElementById('gl'), plan, timeline });
  return true;
};

window.renderFrame = (t) => {
  api.update(t);
  // Untertitel
  const c = captions.find((c) => t >= c.start && t < c.end);
  if (!c || (plan.black && t >= plan.black[0])) {
    capEl.innerHTML = '';
    lastCap = null;
  } else {
    if (lastCap !== c) { capEl.innerHTML = capHtml(c.text); lastCap = c; }
    // kurzer "Pop" beim Erscheinen
    const k = Math.min(1, (t - c.start) / 0.09);
    const s = 0.86 + 0.14 * (1 - Math.pow(1 - k, 3));
    capEl.style.transform = `translateY(-50%) scale(${s.toFixed(4)})`;
  }
  // Schwarzblende am Ende
  blackEl.style.opacity = plan.black && t >= plan.black[0] ? '1' : '0';
  const endEl = document.getElementById('theend');
  if (endEl) endEl.style.opacity = plan.theEnd && t >= plan.theEnd ? String(Math.min(1, (t - plan.theEnd) / 0.25)) : '0';
  return true;
};

window.pageReady = true;
