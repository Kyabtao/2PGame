#!/usr/bin/env node
/**
 * tools/smoke.js — headless smoke test for every game (jsdom).
 * For each game: loads its index.html, starts a round (Enter on the intro),
 * fires a burst of random clicks / key presses / timer ticks, then checks
 * no uncaught error happened and the shell rendered.
 *
 *   node tools/smoke.js            # all games
 *   node tools/smoke.js pong tron  # selected games
 *   VERBOSE=1 node tools/smoke.js  # print console output from games
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole, ResourceLoader } = require('jsdom');

class DiskLoader extends ResourceLoader {
  fetch(url) {
    const u = new URL(url);
    const file = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!fs.existsSync(file)) return Promise.reject(new Error('not found: ' + file));
    return Promise.resolve(fs.readFileSync(file));
  }
}

const ROOT = path.join(__dirname, '..');
const w = {}; global.window = w; require(path.join(ROOT, 'assets/js/games.js'));
const GAMES = w.GAMES;
const only = process.argv.slice(2);
const list = only.length ? GAMES.filter((g) => only.includes(g.id)) : GAMES;
const VERBOSE = !!process.env.VERBOSE;

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

async function run(g) {
  const dir = path.join(ROOT, 'games', g.id);
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { errors.push('jsdomError: ' + (e && e.message || e)); if (VERBOSE) console.log(e && e.stack || e); });
  vc.on('error', (...a) => { errors.push('console.error: ' + a.map(String).join(' ')); });
  if (VERBOSE) { vc.on('log', (...a) => console.log('  [log]', ...a)); vc.on('warn', (...a) => console.log('  [warn]', ...a)); }
  const dom = new JSDOM(html, { url: 'http://localhost/games/' + g.id + '/index.html', runScripts: 'dangerously', resources: new DiskLoader(), pretendToBeVisual: true, virtualConsole: vc, beforeParse(win) {
    stubCanvas(win);
    if (!win.PointerEvent) { win.PointerEvent = class PointerEvent extends win.MouseEvent { constructor(t, o) { super(t, o); this.pointerId = (o && o.pointerId) || 1; this.pointerType = 'mouse'; } }; }
    win.confirm = () => true; win.alert = () => {}; win.prompt = () => 'x';
    win.HTMLElement.prototype.setPointerCapture = () => {}; win.HTMLElement.prototype.releasePointerCapture = () => {};
    win.HTMLElement.prototype.scrollIntoView = () => {};
    win.Element.prototype.getBoundingClientRect = function () { const wd = +(this.style && parseFloat(this.style.width)) || +this.getAttribute('width') || 300; const ht = +(this.style && parseFloat(this.style.height)) || +this.getAttribute('height') || 200; return { left: 0, top: 0, right: wd, bottom: ht, width: wd, height: ht, x: 0, y: 0 }; };
    win.addEventListener('error', (e) => { errors.push('window.error: ' + (e.message || e)); });
    win.addEventListener('unhandledrejection', (e) => { errors.push('unhandledrejection: ' + (e.reason && e.reason.message || e.reason)); });
  } });
  const win = dom.window; const doc = win.document;
  await new Promise((r) => { if (doc.readyState === 'complete') r(); else win.addEventListener('load', r); });
  await new Promise((r) => setTimeout(r, 50));
  const shell = !!doc.querySelector('.topbar') && !!doc.querySelector('.scoreboard') && !!doc.querySelector('#stage');
  if (!shell) errors.push('shell not rendered');
  const key = (code, type) => win.dispatchEvent(new win.KeyboardEvent(type || 'keydown', { code, key: code, bubbles: true, cancelable: true }));
  // start
  key('Enter'); await tick(win, 60);
  const codes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyQ', 'KeyF', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space', 'ShiftRight', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyZ', 'KeyX', 'KeyC', 'Period', 'Slash', 'Backspace', 'KeyG', 'KeyH', 'KeyR', 'KeyT', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Numpad1', 'Numpad5'];
  let clicked = 0;
  for (let i = 0; i < 260 && !errors.length; i++) {
    // random click on interactive elements (skip the back link & danger buttons)
    const cands = [...doc.querySelectorAll('button, .cell, .card, .die, .chip, .bigbtn, .tbtn, canvas, svg, svg *, .hole, .tile, .opt, .keycap, [data-r], .line, .clickable, .box, .pit, .col-btn, .pad, .slot')].filter((el) => !el.closest('a') && !el.classList.contains('danger') && !el.classList.contains('back') && el.id !== 'reset' && !(el.classList.contains('btn') && el.classList.contains('icon')) && el.offsetParent !== null || el instanceof win.SVGElement);
    if (cands.length && Math.random() < 0.6) {
      const el = cands[Math.floor(Math.random() * cands.length)];
      const rect = { x: Math.random() * 300, y: Math.random() * 200 };
      const opts = { bubbles: true, cancelable: true, clientX: rect.x, clientY: rect.y, pointerId: 1, button: 0 };
      try {
        el.dispatchEvent(new win.PointerEvent('pointerdown', opts));
        el.dispatchEvent(new win.PointerEvent('pointermove', Object.assign({}, opts, { clientX: rect.x + 20, clientY: rect.y + 10 })));
        el.dispatchEvent(new win.PointerEvent('pointerup', opts));
        el.dispatchEvent(new win.MouseEvent('click', opts));
      } catch (e) { errors.push('dispatch: ' + e.message); }
      clicked++;
    } else {
      const c = codes[Math.floor(Math.random() * codes.length)];
      key(c, 'keydown'); await tick(win, 8); key(c, 'keyup');
    }
    // sometimes type into inputs
    const inp = doc.querySelector('.stage input.text, .modal input.text, .stage input[type=text]');
    if (inp && Math.random() < 0.3) { inp.value = ['apple', '42', 'a', '7', 'hello'][Math.floor(Math.random() * 5)]; inp.dispatchEvent(new win.Event('input', { bubbles: true })); inp.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true })); }
    await tick(win, 12);
  }
  await tick(win, 300);
  key('Enter'); await tick(win, 100);
  const status = doc.querySelector('.scoreboard .status'); const statusText = status ? status.textContent : '';
  const hasBoard = doc.querySelector('#stage').children.length > 0 || doc.querySelector('.overlay');
  if (!hasBoard) errors.push('stage is empty after start');
  const ls = win.localStorage; const scoreKey = '2pgame:score:' + g.id; const recorded = ls.getItem(scoreKey);
  try { win.close(); } catch (e) { /* ignore */ }
  return { errors, clicked, statusText, recorded: !!recorded };
}
function tick(win, ms) { return new Promise((r) => setTimeout(r, ms)); }

let uncaught = [];
process.on('uncaughtException', (e) => { uncaught.push(e && e.message || String(e)); });
(async () => {
  let fail = 0; let rec = 0;
  for (const g of list) {
    if (!fs.existsSync(path.join(ROOT, 'games', g.id, 'game.js'))) { console.log(`- ${g.id}: (no game.js yet)`); continue; }
    let res;
    uncaught = [];
    try { res = await run(g); } catch (e) { res = { errors: ['harness: ' + e.stack], clicked: 0 }; }
    if (uncaught.length) res.errors.push('uncaught: ' + uncaught[0]);
    if (res.recorded) rec++;
    if (res.errors.length) { fail++; console.log(`✗ ${g.id}: ${res.errors[0].split('\n')[0]}`); if (VERBOSE) console.log(res.errors.join('\n')); }
    else console.log(`✓ ${g.id}${res.recorded ? ' (result recorded)' : ''} — ${res.statusText}`);
  }
  console.log(`\n${list.length - fail}/${list.length} passed, ${rec} produced a recorded result`);
  process.exit(fail ? 1 : 0);
})();
