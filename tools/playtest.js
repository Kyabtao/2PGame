#!/usr/bin/env node
/**
 * tools/playtest.js — auto-plays every game until it produces a result.
 *
 * The point of this test is the thing a smoke test cannot check: does the
 * game actually *finish*? Each game is loaded, started, then driven by a
 * simple bot that taps the available options, types into inputs and presses
 * keys. As soon as the engine records a result (`Store.record`) the game
 * passes. Games that never end, or that throw while being played, fail.
 *
 *   node tools/playtest.js                    # all games
 *   node tools/playtest.js sos hex-a-gone     # selected games
 *   BUDGET=12000 node tools/playtest.js       # longer per-game time budget
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole, ResourceLoader } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const BUDGET = +(process.env.BUDGET || 12000);   // ms of real time per game
const STEPS = +(process.env.STEPS || 4000);      // bot actions per game
const SEED = +(process.env.SEED || 1);
const WORDS = ['apple', 'bricks', 'seven', 'house', 'train', 'zebra', 'queen', 'joker', '51', '42', '7', 'x'];

class DiskLoader extends ResourceLoader {
  fetch(url) {
    const u = new URL(url);
    const file = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!fs.existsSync(file)) return Promise.reject(new Error('not found: ' + file));
    return Promise.resolve(fs.readFileSync(file));
  }
}

const w = {}; global.window = w; require(path.join(ROOT, 'assets/js/games.js'));
const GAMES = w.GAMES;
const only = process.argv.slice(2);
const list = only.length ? GAMES.filter((g) => only.includes(g.id)) : GAMES;

let seed = SEED * 9301;
const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const pickR = (a) => a[Math.floor(rand() * a.length) % a.length];

function stubCanvas(win) {
  const noop = () => {};
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return null;
      if (k === 'measureText') return () => ({ width: 10 });
      if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop: noop });
      if (k === 'isPointInPath') return () => false;
      return noop;
    },
    set() { return true; },
  });
  win.HTMLCanvasElement.prototype.getContext = () => ctx;
  win.HTMLCanvasElement.prototype.toDataURL = () => '';
}

const CLICKABLE = 'button:not([disabled]), .cell, .chip, .card, .die, .tile, .box, .slot, .pit, .hole, .line, .keycap, .bigbtn, .tbtn, .opt, .clickable, [data-r], [data-c], canvas, svg *, .pad > *';

async function play(g) {
  const dir = path.join(ROOT, 'games', g.id);
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e && e.message || e)));
  vc.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));
  const dom = new JSDOM(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), {
    url: 'http://localhost/games/' + g.id + '/index.html',
    runScripts: 'dangerously', resources: new DiskLoader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(win) {
      stubCanvas(win);
      if (!win.PointerEvent) win.PointerEvent = class PointerEvent extends win.MouseEvent { constructor(t, o) { super(t, o); this.pointerId = (o && o.pointerId) || 1; this.pointerType = 'mouse'; } };
      win.confirm = () => true; win.alert = () => {}; win.prompt = () => 'apple';
      win.HTMLElement.prototype.setPointerCapture = () => {}; win.HTMLElement.prototype.releasePointerCapture = () => {};
      win.HTMLElement.prototype.scrollIntoView = () => {};
      win.Element.prototype.getBoundingClientRect = function () {
        const wd = +(this.style && parseFloat(this.style.width)) || +this.getAttribute('width') || 320;
        const ht = +(this.style && parseFloat(this.style.height)) || +this.getAttribute('height') || 240;
        return { left: 0, top: 0, right: wd, bottom: ht, width: wd, height: ht, x: 0, y: 0 };
      };
      win.addEventListener('error', (e) => errors.push('window.error: ' + (e.message || e)));
      win.addEventListener('unhandledrejection', (e) => errors.push('unhandledrejection: ' + (e.reason && e.reason.message || e.reason)));
    },
  });
  const win = dom.window, doc = win.document;
  const tick = (ms) => new Promise((r) => setTimeout(r, ms || 8));
  await new Promise((r) => { if (doc.readyState === 'complete') r(); else win.addEventListener('load', r); });
  const key = (code, type) => win.dispatchEvent(new win.KeyboardEvent(type || 'keydown', { code, key: code.replace(/^Digit/, ''), bubbles: true, cancelable: true }));
  const recorded = () => { try { const v = JSON.parse(win.localStorage.getItem('2pgame:score:' + g.id) || 'null'); return v && v.n > 0 ? v : null; } catch (e) { return null; } };
  const vis = (el) => !!el && el.isConnected && !el.disabled && el.getAttribute('aria-hidden') !== 'true' && el.getBoundingClientRect().width > 0;
  const clickable = () => [...doc.querySelectorAll(CLICKABLE)]
    .filter((el) => !el.closest('a') && !el.closest('.topbar') && !el.closest('.hint') && !el.classList.contains('back') && !el.classList.contains('danger') && !el.classList.contains('ghost') && !el.classList.contains('icon') && vis(el))
    // undo / reset style buttons roll the game backwards: a bot pressing them
    // never reaches a result, so the harness ignores them.
    .filter((el) => !/\b(undo|reset|clear|take back)\b/i.test((el.textContent || '').trim()))
    // SVG boards draw lots of decorative shapes; only the transparent hit
    // areas are interactive, and every game styles those with cursor:pointer.
    .filter((el) => el.namespaceURI !== 'http://www.w3.org/2000/svg' || (el.style && el.style.cursor === 'pointer'));
  const tap = (el) => {
    const o = { bubbles: true, cancelable: true, clientX: 10 + rand() * 280, clientY: 10 + rand() * 200, pointerId: 1, button: 0 };
    try {
      el.dispatchEvent(new win.PointerEvent('pointerdown', o));
      el.dispatchEvent(new win.PointerEvent('pointermove', Object.assign({}, o, { clientX: o.clientX + 12, clientY: o.clientY + 8 })));
      el.dispatchEvent(new win.PointerEvent('pointerup', o));
      el.dispatchEvent(new win.MouseEvent('click', o));
    } catch (e) { errors.push('dispatch: ' + e.message); }
  };
  const keys = ['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'KeyA', 'KeyD', 'KeyW', 'KeyS'];
  let typed = 0, taps = 0, started = false, idx = 0;

  // intro → start
  key('Enter'); await tick(40); started = true;
  const t0 = Date.now();
  let step = 0;
  let lastResult = null, lastSig = '', same = 0;
  while (step < STEPS && Date.now() - t0 < BUDGET) {
    step++;
    const res = recorded();
    if (res) { lastResult = res; break; }
    // 1. type into a visible input if there is one
    const inp = [...doc.querySelectorAll('input[type=text], input[type=number], input[type=password], input:not([type])')].find((e) => vis(e) && !e.classList.contains('pname') && !e.disabled);
    if (inp && typed < 400) {
      typed++;
      const want = inp.inputMode === 'numeric' || inp.type === 'number' ? String(1 + Math.floor(rand() * 8)) : pickR(WORDS);
      inp.value = want;
      inp.dispatchEvent(new win.Event('input', { bubbles: true }));
      inp.dispatchEvent(new win.Event('change', { bubbles: true }));
      key('Enter'); await tick(6);
      continue;
    }
    const els = clickable();
    const seen = (sel) => [...doc.querySelectorAll(sel)].filter((e) => vis(e) && !e.closest('.topbar') && !e.closest('a'));
    // The engine marks legal destinations with .dot and the active piece with
    // .hl, so the bot plays "obvious" games far more realistically than by
    // throwing random taps at the board.
    const dots = seen('.dot'), hls = seen('.cell.hl, .piece.hl');
    let target = null;
    if (dots.length) target = dots[Math.floor(rand() * dots.length)];
    else if (hls.length && rand() < 0.3) target = hls[Math.floor(rand() * hls.length)];
    else if (els.length) { idx = (idx + (rand() < 0.25 ? 1 + Math.floor(rand() * 2) : 1)) % els.length; target = els[rand() < 0.15 ? Math.floor(rand() * els.length) : idx]; }
    if (target && rand() < 0.9) { tap(target); taps++; }
    else {
      const k = pickR(keys);
      key(k, 'keydown'); await tick(4); key(k, 'keyup');
    }
    // Back off when the stage stops changing: canvas games spend most of a
    // turn animating, and hammering taps at 6ms each just burns the budget.
    const sig = (doc.querySelector('.stage') ? doc.querySelector('.stage').textContent : '').slice(0, 220) + '|' + (doc.querySelector('.status') ? doc.querySelector('.status').textContent : '');
    if (sig === lastSig) { same++; if (same > 18) await tick(same > 90 ? 300 : 90); } else { same = 0; lastSig = sig; await tick(2); }
    if (step % 200 === 0) await tick(50); // let timers/animation frames catch up
    // if an overlay appeared, dismiss it by hitting its primary button
    const ov = doc.querySelector('.overlay .buttons .btn.primary');
    if (ov && !recorded()) { /* leave result modal alone; close stray toasts */ }
  }
  const noteEl = doc.querySelector('.stage .muted');
  const status = doc.querySelector('.scoreboard .status');
  const statusText = status ? status.textContent.trim() : '';
  if (!lastResult) {
    // give pending timers a moment to land the result
    await tick(350);
    lastResult = recorded();
  }
  try { win.close(); } catch (e) { /* ignore */ }
  return { errors, taps, steps: step, result: lastResult, statusText, note: noteEl ? noteEl.textContent.slice(0, 70) : '' };
}

(async () => {
  const bad = [], good = [];
  for (const g of list) {
    if (!fs.existsSync(path.join(ROOT, 'games', g.id, 'game.js'))) { console.log(`- ${g.id}: no game.js`); continue; }
    let r;
    try { r = await play(g); } catch (e) { r = { errors: ['harness: ' + e.message], taps: 0, steps: 0 }; }
    const line = `${r.result ? '✓' : '✗'} ${g.id.padEnd(26)} ${r.result ? `result recorded (${r.result.w[0]}–${r.result.d}d, ${r.result.n} played)` : `NO RESULT after ${r.steps} actions, ${r.taps} taps · status "${r.statusText}" · ${r.note || ''}`}  ${r.errors.length ? '⚠ ' + r.errors[0].split('\n')[0] : ''}`;
    console.log(line);
    if (r.errors.length || !r.result) bad.push(g.id); else good.push(g.id);
  }
  console.log(`\n${good.length}/${list.length} games finished with a recorded result`);
  if (bad.length) console.log('needs work: ' + bad.join(', '));
  process.exit(bad.length ? 1 : 0);
})();
