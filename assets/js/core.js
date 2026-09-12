/* ==========================================================================
   2PGame — shared game engine
   Provides: Store (localStorage), Sfx (WebAudio), Input (keyboard + touch
   pads), UI helpers (grid, cards, dice, canvas), utils and the Game shell
   used by every game page (scoreboard, overlays, result recording).
   ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ utils */
  /** rnd(n) → integer 0..n-1; rnd(a, b) → integer a..b inclusive. */
  const rnd = (n, b) => (b === undefined ? Math.floor(Math.random() * n) : n + Math.floor(Math.random() * (b - n + 1)));
  const rndf = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[rnd(arr.length)];
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rnd(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${pad2(s % 60)}`; };
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Tiny hyperscript: h('div', {class:'x', onclick:fn}, 'text', el, [els]) */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k in el && typeof v !== 'string' && k !== 'width' && k !== 'height') el[k] = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    const add = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    };
    children.forEach(add);
    return el;
  }

  /* ------------------------------------------------------------------ store */
  const NS = '2pgame:';
  const Store = {
    get(k, d) { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { /* quota / private mode */ } },
    del(k) { try { localStorage.removeItem(NS + k); } catch (e) { /* ignore */ } },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(NS)) out.push(k.slice(NS.length)); } } catch (e) { /* ignore */ } return out; },
    players() { const p = Store.get('players', null); return Array.isArray(p) && p.length === 2 ? p : ['Player 1', 'Player 2']; },
    setPlayers(p) { Store.set('players', [String(p[0] || 'Player 1').slice(0, 16), String(p[1] || 'Player 2').slice(0, 16)]); },
    settings() { return Object.assign({ sound: true, pad: 'auto' }, Store.get('settings', {})); },
    setSettings(s) { Store.set('settings', Object.assign(Store.settings(), s)); },
    score(id) { return Object.assign({ w: [0, 0], d: 0, n: 0, last: [], streak: { p: 0, n: 0 }, best: {} }, Store.get('score:' + id, {})); },
    saveScore(id, s) { Store.set('score:' + id, s); },
    resetScore(id) { Store.del('score:' + id); },
    resetAll() { Store.keys().filter((k) => k.startsWith('score:')).forEach((k) => Store.del(k)); },
    allScores() { const o = {}; Store.keys().filter((k) => k.startsWith('score:')).forEach((k) => { o[k.slice(6)] = Store.score(k.slice(6)); }); return o; },
    /** winner: 0 = draw, 1 or 2 = player. Returns updated score record. */
    record(id, winner, detail) {
      const s = Store.score(id);
      s.n += 1;
      if (winner === 1 || winner === 2) {
        s.w[winner - 1] += 1;
        s.streak = s.streak.p === winner ? { p: winner, n: s.streak.n + 1 } : { p: winner, n: 1 };
      } else { s.d += 1; s.streak = { p: 0, n: 0 }; }
      s.last.unshift({ w: winner, t: Date.now(), d: detail ? String(detail).slice(0, 80) : '' });
      s.last = s.last.slice(0, 20);
      Store.saveScore(id, s);
      return s;
    },
    /** Track a "best" value per game (e.g. fastest reaction). lower=true means smaller is better. */
    best(id, key, value, player, lower) {
      const s = Store.score(id);
      const cur = s.best[key];
      if (!cur || (lower ? value < cur.v : value > cur.v)) { s.best[key] = { v: value, p: player, t: Date.now() }; Store.saveScore(id, s); return true; }
      return false;
    },
  };

  /* -------------------------------------------------------------------- sfx */
  const Sfx = {
    ctx: null,
    get enabled() { return Store.settings().sound !== false; },
    set enabled(v) { Store.setSettings({ sound: !!v }); },
    init() {
      if (!this.ctx) { try { const AC = global.AudioContext || global.webkitAudioContext; if (AC) this.ctx = new AC(); } catch (e) { this.ctx = null; } }
      if (this.ctx && this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) { /* ignore */ } }
    },
    tone(freq, dur, type, vol, when) {
      if (!this.enabled || !this.ctx) return;
      try {
        const t0 = this.ctx.currentTime + (when || 0);
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type || 'square';
        o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(vol == null ? 0.06 : vol, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(this.ctx.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.02);
      } catch (e) { /* ignore */ }
    },
    play(name) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      switch (name) {
        case 'click': this.tone(700, 0.05, 'square', 0.04); break;
        case 'move': this.tone(420, 0.07, 'triangle', 0.07); break;
        case 'capture': this.tone(300, 0.08, 'sawtooth', 0.06); this.tone(200, 0.12, 'sawtooth', 0.05, 0.06); break;
        case 'hit': this.tone(220, 0.06, 'square', 0.06); break;
        case 'bounce': this.tone(500, 0.04, 'square', 0.04); break;
        case 'score': this.tone(880, 0.1, 'square', 0.05); this.tone(1320, 0.18, 'square', 0.05, 0.1); break;
        case 'tick': this.tone(1000, 0.04, 'sine', 0.05); break;
        case 'go': this.tone(1500, 0.25, 'sine', 0.07); break;
        case 'bad': this.tone(160, 0.25, 'sawtooth', 0.06); break;
        case 'pop': this.tone(900, 0.05, 'sine', 0.06); this.tone(1400, 0.05, 'sine', 0.04, 0.03); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'square', 0.05, i * 0.11)); break;
        case 'draw': [440, 440, 392].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.05, i * 0.16)); break;
        case 'lose': [400, 330, 260].forEach((f, i) => this.tone(f, 0.2, 'sawtooth', 0.04, i * 0.16)); break;
        case 'explode': this.tone(90, 0.4, 'sawtooth', 0.09); this.tone(60, 0.5, 'square', 0.05, 0.05); break;
        case 'coin': this.tone(988, 0.08, 'square', 0.04); this.tone(1319, 0.25, 'square', 0.04, 0.08); break;
        default: this.tone(600, 0.05, 'square', 0.04);
      }
    },
  };

  /* ------------------------------------------------------------------ input */
  const Input = {
    keys: new Set(),
    handlers: { down: [], up: [] },
    installed: false,
    install() {
      if (this.installed) return; this.installed = true;
      const prevent = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
      global.addEventListener('keydown', (e) => {
        const t = e.target;
        const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
        if (typing) return;
        if (prevent.has(e.code)) e.preventDefault();
        const first = !this.keys.has(e.code);
        this.keys.add(e.code);
        this.handlers.down.slice().forEach((hd) => { if ((first || hd.repeat) && (hd.all || hd.codes.has(e.code))) hd.fn(e.code, e); });
      }, { passive: false });
      global.addEventListener('keyup', (e) => {
        this.keys.delete(e.code);
        this.handlers.up.slice().forEach((hd) => { if (hd.all || hd.codes.has(e.code)) hd.fn(e.code, e); });
      });
      global.addEventListener('blur', () => this.keys.clear());
    },
    down(code) { return this.keys.has(code); },
    any(codes) { return codes.some((c) => this.keys.has(c)); },
    /** onKey('KeyA' | ['KeyA','KeyB'] | '*', fn(code, event), {repeat, up}) -> off() */
    onKey(codes, fn, opts) {
      opts = opts || {};
      const list = codes === '*' ? [] : (Array.isArray(codes) ? codes : [codes]);
      const hd = { codes: new Set(list), all: codes === '*', fn, repeat: !!opts.repeat };
      const bucket = opts.up ? this.handlers.up : this.handlers.down;
      bucket.push(hd);
      return () => { const i = bucket.indexOf(hd); if (i >= 0) bucket.splice(i, 1); };
    },
    clearHandlers() { this.handlers.down.length = 0; this.handlers.up.length = 0; },
    simulate(code, isDown) {
      const ev = new KeyboardEvent(isDown ? 'keydown' : 'keyup', { code, key: code, bubbles: true, cancelable: true });
      global.dispatchEvent(ev);
    },
    isTouch() { return ('ontouchstart' in global) || (navigator.maxTouchPoints > 0); },
  };

  /* Touch pad builder. groups: [{side:1|2, dpad:{up,down,left,right}, buttons:[{code,label,wide,huge}], labels:{up:'▲'}}] */
  const KEYLABEL = { KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyE: 'E', KeyQ: 'Q', KeyF: 'F', KeyR: 'R', KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyG: 'G', KeyT: 'T', KeyB: 'B', KeyI: 'I', KeyJ: 'J', KeyK: 'K', KeyL: 'L', KeyO: 'O', KeyP: 'P', KeyU: 'U', KeyM: 'M', KeyN: 'N', KeyH: 'H', KeyY: 'Y', Space: 'Space', Enter: 'Enter', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Period: '.', Comma: ',', Slash: '/', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0', Numpad1: 'Num1', Numpad2: 'Num2', Numpad3: 'Num3', Numpad4: 'Num4', Numpad5: 'Num5', Numpad6: 'Num6', Numpad7: 'Num7', Numpad8: 'Num8', Numpad9: 'Num9', Numpad0: 'Num0', KeyT2: 'T', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'", Backslash: '\\', Minus: '-', Equal: '=', ControlRight: 'R-Ctrl', ControlLeft: 'L-Ctrl', Backspace: 'Bksp', Tab: 'Tab' };
  const keyLabel = (code) => KEYLABEL[code] || code.replace(/^Key|^Digit/, '');

  function buildPad(groups) {
    const root = h('div', { class: 'touchpad' });
    const sides = { 1: h('div', { class: 'pad p1' }), 2: h('div', { class: 'pad p2' }) };
    const mk = (code, label, cls) => {
      const b = h('div', { class: 'tbtn ' + (cls || ''), text: label });
      let active = false;
      const press = (e) => { e.preventDefault(); if (active) return; active = true; b.classList.add('down'); Input.simulate(code, true); };
      const release = (e) => { if (e) e.preventDefault(); if (!active) return; active = false; b.classList.remove('down'); Input.simulate(code, false); };
      b.addEventListener('pointerdown', (e) => { try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } press(e); });
      b.addEventListener('pointerup', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('lostpointercapture', () => release());
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      return b;
    };
    groups.forEach((gp) => {
      const side = sides[gp.side] || sides[1];
      if (gp.dpad) {
        const d = h('div', { class: 'dpad' });
        const L = Object.assign({ up: '▲', down: '▼', left: '◀', right: '▶' }, gp.labels || {});
        if (gp.dpad.up) d.appendChild(mk(gp.dpad.up, L.up, 'u'));
        if (gp.dpad.left) d.appendChild(mk(gp.dpad.left, L.left, 'l'));
        if (gp.dpad.down) d.appendChild(mk(gp.dpad.down, L.down, 'd'));
        if (gp.dpad.right) d.appendChild(mk(gp.dpad.right, L.right, 'r'));
        if (gp.dpad.center) d.appendChild(mk(gp.dpad.center, L.center || '●', 'c act'));
        side.appendChild(d);
      }
      if (gp.buttons && gp.buttons.length) {
        const col = h('div', { class: 'col', style: { gap: '4px' } });
        gp.buttons.forEach((bt) => col.appendChild(mk(bt.code, bt.label || keyLabel(bt.code), 'act ' + (bt.huge ? 'huge' : bt.wide ? 'wide' : ''))));
        side.appendChild(col);
      }
    });
    root.appendChild(sides[1]);
    root.appendChild(sides[2]);
    return root;
  }

  /* --------------------------------------------------------------------- UI */
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const UI = {
    h,
    /** Board grid. opts: {rows, cols, size(px), gap, checker, onClick(r,c,el,ev), cls} */
    grid(opts) {
      const { rows, cols } = opts;
      const size = opts.size || Math.floor(clamp(Math.min((global.innerWidth - 40) / cols, (global.innerHeight - 260) / rows), 26, 72));
      const el = h('div', { class: 'grid ' + (opts.cls || ''), style: { gridTemplateColumns: `repeat(${cols}, ${size}px)`, '--cell': size + 'px', gap: (opts.gap == null ? 4 : opts.gap) + 'px' } });
      const cells = [];
      for (let r = 0; r < rows; r++) {
        cells.push([]);
        for (let c = 0; c < cols; c++) {
          const cell = h('div', { class: 'cell' + (opts.checker ? ((r + c) % 2 ? ' dark' : ' light') : ''), dataset: { r, c } });
          if (opts.onClick) cell.addEventListener('click', (ev) => opts.onClick(r, c, cell, ev));
          cells[r].push(cell);
          el.appendChild(cell);
        }
      }
      return {
        el, cells, size, rows, cols,
        at(r, c) { return cells[r] && cells[r][c]; },
        each(fn) { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) fn(cells[r][c], r, c); },
        clear(cls) { this.each((cell) => { cell.innerHTML = ''; if (cls) cell.className = cls; else cell.classList.remove('p1', 'p2', 'win', 'hl', 'sel', 'dot', 'dis'); }); },
        set(r, c, html, cls) { const cell = cells[r][c]; cell.innerHTML = html == null ? '' : html; if (cls != null) cell.className = 'cell ' + cls; return cell; },
      };
    },
    /** Deck of cards: [{r:'A', s:'♠', v:14, red:false}] */
    deck(opts) {
      const d = [];
      SUITS.forEach((s) => RANKS.forEach((r, i) => d.push({ r, s, v: i + 2, red: s === '♥' || s === '♦' })));
      if (opts && opts.jokers) { d.push({ r: '★', s: '', v: 15, red: true, joker: true }); d.push({ r: '★', s: '', v: 15, red: false, joker: true }); }
      return shuffle(d);
    },
    SUITS, RANKS,
    /** Card element. opts: {back, small, large, sel, onClick} */
    card(c, opts) {
      opts = opts || {};
      const cls = ['card', opts.small && 'sm', opts.large && 'lg', opts.sel && 'sel', opts.onClick && 'clickable'].filter(Boolean);
      if (opts.back || !c) { cls.push('back'); const el = h('div', { class: cls.join(' ') }); if (opts.onClick) el.addEventListener('click', opts.onClick); return el; }
      if (c.red) cls.push('red');
      const el = h('div', { class: cls.join(' ') },
        h('span', { class: 'rk', text: c.r }),
        h('span', { class: 'st', text: c.joker ? '🃏' : c.s }),
        h('span', { class: 'rk b', text: c.r }));
      if (opts.onClick) el.addEventListener('click', opts.onClick);
      return el;
    },
    cardName(c) { return c.r + c.s; },
    /** Die element with pips. */
    die(v, opts) {
      opts = opts || {};
      const el = h('div', { class: 'die ' + (opts.cls || '') + (opts.small ? ' sm' : '') + (opts.onClick ? ' clickable' : '') });
      UI.setDie(el, v);
      if (opts.onClick) el.addEventListener('click', opts.onClick);
      return el;
    },
    setDie(el, v) {
      const map = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
      el.innerHTML = '';
      el.dataset.v = v;
      for (let i = 0; i < 9; i++) el.appendChild(h('span', { class: (map[v] || []).includes(i) ? 'pip' : '' }));
    },
    /** Canvas with logical size w x h, HiDPI aware. Returns {canvas, ctx, w, h}. */
    canvas(w, hgt, opts) {
      opts = opts || {};
      const dpr = Math.min(global.devicePixelRatio || 1, 2);
      const canvas = h('canvas', { class: 'gcanvas ' + (opts.cls || '') });
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(hgt * dpr);
      canvas.style.width = w + 'px';
      canvas.style.aspectRatio = `${w} / ${hgt}`;
      const ctx = canvas.getContext('2d');
      if (ctx && ctx.scale) ctx.scale(dpr, dpr);
      return { canvas, ctx: ctx || UI.nullCtx(), w, h: hgt };
    },
    nullCtx() { return new Proxy({}, { get: (_, k) => (k === 'canvas' ? null : () => 0), set: () => true }); },
    /** Pointer helper for canvas: callbacks get logical coords. */
    pointer(canvas, cbs, w, hgt) {
      const conv = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (w / (r.width || w)), y: (e.clientY - r.top) * (hgt / (r.height || hgt)), id: e.pointerId, e }; };
      let downId = null;
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); downId = e.pointerId; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } cbs.down && cbs.down(conv(e)); });
      canvas.addEventListener('pointermove', (e) => { cbs.move && cbs.move(Object.assign(conv(e), { held: downId === e.pointerId })); });
      const up = (e) => { if (downId === e.pointerId) downId = null; cbs.up && cbs.up(conv(e)); };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    circle(ctx, x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); },
    rect(ctx, x, y, w, hgt, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, hgt); },
    text(ctx, s, x, y, opts) { opts = opts || {}; ctx.fillStyle = opts.color || '#fff'; ctx.font = opts.font || 'bold 16px system-ui, sans-serif'; ctx.textAlign = opts.align || 'center'; ctx.textBaseline = opts.base || 'middle'; ctx.fillText(s, x, y); },
    roundRect(ctx, x, y, w, hgt, r, color) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hgt, r); ctx.arcTo(x + w, y + hgt, x, y + hgt, r); ctx.arcTo(x, y + hgt, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); },
  };

  /* ------------------------------------------------------------------- Game */
  const COLORS = { 1: '#ff6b6b', 2: '#4dabf7' };
  const CAT_NAMES = { board: 'Board & Strategy', arcade: 'Arcade & Action', sports: 'Sports & Reflex', cards: 'Cards & Dice', brain: 'Brain & Puzzle' };

  function findMeta(id) {
    const list = global.GAMES || [];
    return list.find((x) => x.id === id) || { id, title: id, emoji: '🎮', cat: 'board', desc: '' };
  }

  function setFavicon(emoji) {
    try {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;
      let link = document.querySelector('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
    } catch (e) { /* ignore */ }
  }

  /**
   * Game.init(opts)
   *  id        : game id (looked up in GAMES manifest for title/emoji/desc)
   *  rules     : array of strings (HTML allowed)
   *  controls  : { p1: 'WASD', p2: 'Arrows' } or { all: 'Click a cell' }
   *  points    : show round points in the scoreboard
   *  pad       : touch pad groups (see buildPad) or null
   *  onStart() : begin a new round (called after intro and on "Play again")
   *  onStop()  : optional cleanup when a round ends
   */
  function init(opts) {
    Input.install();
    const meta = findMeta(opts.id);
    const state = { over: false, started: false, timers: new Set(), intervals: new Set(), raf: 0, offs: [], overlay: null, padEl: null, padOn: false, turn: 0 };
    let names = Store.players();
    document.title = `${meta.title} — 2PGame`;
    setFavicon(meta.emoji);
    document.body.classList.toggle('has-touch', false);

    /* ---- DOM shell ---- */
    const els = {};
    const backHref = opts.backHref || '../../index.html';
    const top = h('header', { class: 'topbar' },
      h('a', { class: 'btn ghost back', href: backHref, title: 'All games' }, '←', h('span', {}, ' Games')),
      h('h1', { class: 'title' }, h('span', { class: 'emoji', text: meta.emoji }), h('span', { text: meta.title })),
      h('div', { class: 'actions' },
        els.rulesBtn = h('button', { class: 'btn icon', title: 'Rules & controls', text: '?' }),
        els.soundBtn = h('button', { class: 'btn icon', title: 'Sound on/off' }),
        els.padBtn = h('button', { class: 'btn icon', title: 'Touch controls', text: '🎮', hidden: !opts.pad }),
        els.restartBtn = h('button', { class: 'btn icon', title: 'Restart round', text: '↻' })));
    const mkPlayer = (p) => {
      const input = h('input', { class: 'pname', value: names[p - 1], maxlength: 16, 'aria-label': `Player ${p} name`, spellcheck: false });
      input.addEventListener('change', () => { names[p - 1] = input.value.trim() || `Player ${p}`; input.value = names[p - 1]; Store.setPlayers(names); refreshBoard(); if (state.turn) api.turn(state.turn); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); e.stopPropagation(); });
      input.addEventListener('keyup', (e) => e.stopPropagation());
      els['name' + p] = input;
      els['wins' + p] = h('div', { class: 'wins', text: '0' });
      return els['player' + p] = h('div', { class: 'player p' + p }, h('div', { class: 'who' }, h('span', { class: 'label', text: 'Player ' + p }), input), els['wins' + p]);
    };
    const board = h('section', { class: 'scoreboard' },
      mkPlayer(1),
      h('div', { class: 'mid' },
        els.status = h('div', { class: 'status', text: 'Ready' }),
        els.points = h('div', { class: 'points', hidden: !opts.points }, els.pa = h('span', { class: 'a', text: '0' }), h('span', { class: 'muted', text: ':' }), els.pb = h('span', { class: 'b', text: '0' })),
        els.draws = h('div', { class: 'draws', text: '' })),
      mkPlayer(2));
    const stage = h('main', { class: 'stage', id: 'stage' });
    const hintParts = [];
    if (opts.controls) {
      if (opts.controls.all) hintParts.push(h('span', { html: opts.controls.all }));
      if (opts.controls.p1) hintParts.push(h('span', { class: 'c1', html: `<b>${esc(names[0])}</b>: ${opts.controls.p1}` }));
      if (opts.controls.p2) hintParts.push(h('span', { class: 'c2', html: `<b>${esc(names[1])}</b>: ${opts.controls.p2}` }));
    }
    const hint = h('footer', { class: 'hint' }, hintParts);
    document.body.append(top, board, stage, hint);

    /* ---- sound button ---- */
    const refreshSound = () => { els.soundBtn.textContent = Sfx.enabled ? '🔊' : '🔇'; };
    els.soundBtn.addEventListener('click', () => { Sfx.enabled = !Sfx.enabled; refreshSound(); if (Sfx.enabled) Sfx.play('click'); });
    refreshSound();

    /* ---- touch pad ---- */
    const setPad = (on) => {
      state.padOn = on;
      if (!opts.pad) return;
      if (on && !state.padEl) { state.padEl = buildPad(opts.pad); document.body.appendChild(state.padEl); }
      if (state.padEl) state.padEl.hidden = !on;
      document.body.classList.toggle('has-touch', on);
      els.padBtn.classList.toggle('on', on);
    };
    els.padBtn.addEventListener('click', () => { const on = !state.padOn; Store.setSettings({ pad: on ? 'on' : 'off' }); setPad(on); });
    const padPref = Store.settings().pad;
    const qs = new URLSearchParams(location.search);
    if (opts.pad && (qs.get('touch') === '1' || padPref === 'on' || (padPref === 'auto' && Input.isTouch()))) setPad(true);

    /* ---- score board refresh ---- */
    function refreshBoard() {
      const s = Store.score(meta.id);
      els.wins1.textContent = s.w[0];
      els.wins2.textContent = s.w[1];
      els.draws.textContent = `Draws ${s.d} · Games ${s.n}` + (s.streak.n > 1 ? ` · 🔥 ${names[s.streak.p - 1]} ×${s.streak.n}` : '');
      hint.querySelectorAll('.c1 b').forEach((b) => { b.textContent = names[0]; });
      hint.querySelectorAll('.c2 b').forEach((b) => { b.textContent = names[1]; });
    }

    /* ---- overlay helpers ---- */
    function closeOverlay() { if (state.overlay) { state.overlay.remove(); state.overlay = null; } if (state.overlayOff) { state.overlayOff(); state.overlayOff = null; } }
    /** modal({title, html, body(el), buttons:[{label, cls, onClick, primary}], cls, dismiss}) */
    function modal(m) {
      closeOverlay();
      const box = h('div', { class: 'modal ' + (m.cls || '') });
      if (m.title) box.appendChild(h('h2', { html: m.title }));
      const body = h('div', { class: 'body' });
      if (m.html) body.innerHTML = m.html;
      if (m.body) { const r = m.body(body); if (r instanceof Node) body.appendChild(r); }
      box.appendChild(body);
      const btns = h('div', { class: 'buttons' });
      let primary = null;
      (m.buttons || []).forEach((b) => {
        const bt = h('button', { class: 'btn ' + (b.cls || '') + (b.primary ? ' primary' : ''), html: b.label });
        bt.addEventListener('click', () => { Sfx.play('click'); if (b.keep !== true) closeOverlay(); b.onClick && b.onClick(); });
        if (b.primary) primary = bt;
        btns.appendChild(bt);
      });
      if (btns.children.length) box.appendChild(btns);
      if (m.sub) box.appendChild(h('div', { class: 'sub', html: m.sub }));
      const ov = h('div', { class: 'overlay' }, box);
      if (m.dismiss) ov.addEventListener('click', (e) => { if (e.target === ov) { closeOverlay(); m.onDismiss && m.onDismiss(); } });
      document.body.appendChild(ov);
      state.overlay = ov;
      state.overlayOff = Input.onKey('*', (code, e) => {
        if ((code === 'Enter' || code === 'Space') && primary) { e.preventDefault(); e.stopImmediatePropagation && e.stopImmediatePropagation(); primary.click(); }
        else if (code === 'Escape' && m.dismiss) { closeOverlay(); m.onDismiss && m.onDismiss(); }
      });
      // keyboard handler must run before game handlers → move to front
      const hd = Input.handlers.down.pop(); Input.handlers.down.unshift(hd);
      if (primary) setTimeout(() => { try { primary.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 30);
      return closeOverlay;
    }

    function rulesHtml() {
      const r = (opts.rules || []).map((x) => `<p>• ${x}</p>`).join('');
      let ctrl = '';
      if (opts.controls) {
        if (opts.controls.all) ctrl += `<div class="ctrl one"><div>${opts.controls.all}</div></div>`;
        if (opts.controls.p1 || opts.controls.p2) ctrl += `<div class="ctrl"><div class="c1"><b class="pc1">${esc(names[0])}</b><br>${opts.controls.p1 || '—'}</div><div class="c2"><b class="pc2">${esc(names[1])}</b><br>${opts.controls.p2 || '—'}</div></div>`;
      }
      return `<div class="rules">${r}</div>${ctrl}`;
    }

    function seriesHtml() {
      const s = Store.score(meta.id);
      return `<span class="pc1">${esc(names[0])}</span> <b>${s.w[0]}</b> – <b>${s.w[1]}</b> <span class="pc2">${esc(names[1])}</span>${s.d ? ` <span class="muted">(${s.d} draw${s.d > 1 ? 's' : ''})</span>` : ''}`;
    }

    function showRules(fromIntro) {
      modal({
        title: `${meta.emoji} ${esc(meta.title)}`,
        html: `<p>${esc(meta.desc || '')}</p>${rulesHtml()}<p class="muted" style="font-size:.85rem">Series: ${seriesHtml()}</p>`,
        buttons: [
          { label: fromIntro ? '▶ Start' : 'Close', primary: true, onClick: () => { if (fromIntro) begin(); } },
          { label: 'Reset score', cls: 'danger sm', keep: true, onClick: () => { if (confirm(`Reset all recorded results for ${meta.title}?`)) { Store.resetScore(meta.id); refreshBoard(); closeOverlay(); showRules(fromIntro); } } },
        ],
        sub: fromIntro ? 'Press <kbd>Enter</kbd> or <kbd>Space</kbd> to start' : '',
        dismiss: !fromIntro,
      });
    }

    /* ---- lifecycle ---- */
    function clearTimers() {
      state.timers.forEach((t) => clearTimeout(t)); state.timers.clear();
      state.intervals.forEach((t) => clearInterval(t)); state.intervals.clear();
      if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
      state.offs.forEach((f) => f()); state.offs.length = 0;
    }
    function stopRound() {
      if (opts.onStop) { try { opts.onStop(); } catch (e) { console.error(e); } }
      clearTimers();
    }
    function begin() {
      closeOverlay();
      Sfx.init();
      if (state.started) stopRound();
      state.started = true;
      state.over = false;
      state.turn = 0;
      els.player1.classList.remove('active'); els.player2.classList.remove('active');
      api.points(0, 0);
      stage.innerHTML = '';
      refreshBoard();
      opts.onStart(api);
    }

    function finish(winner, detail, extra) {
      if (state.over) return;
      state.over = true;
      stopRound();
      const s = Store.record(meta.id, winner, detail);
      refreshBoard();
      els.player1.classList.remove('active'); els.player2.classList.remove('active');
      state.turn = 0;
      Sfx.play(winner ? 'win' : 'draw');
      const title = winner ? `🏆 ${esc(names[winner - 1])} wins!` : '🤝 Draw!';
      els.status.textContent = winner ? `${names[winner - 1]} wins!` : 'Draw!';
      let html = detail ? `<p>${detail}</p>` : '';
      if (extra) html += extra;
      html += `<p class="muted" style="margin-top:.8rem">Series: ${seriesHtml()}</p>`;
      if (winner && s.streak.n > 1) html += `<p class="muted">🔥 ${esc(names[winner - 1])} is on a ${s.streak.n}-win streak</p>`;
      const delay = opts.resultDelay == null ? 700 : opts.resultDelay;
      const t = setTimeout(() => modal({
        cls: winner ? 'p' + winner : '',
        title,
        html,
        buttons: [
          { label: '▶ Play again', primary: true, onClick: begin },
          { label: '🏠 All games', cls: 'ghost', onClick: () => { location.href = backHref; } },
        ],
        sub: 'Press <kbd>Enter</kbd> or <kbd>Space</kbd> to play again',
      }), delay);
      // do not register in state.timers (those were just cleared and belong to rounds)
      return t;
    }

    /* ---- API ---- */
    const api = {
      meta, stage, els, names,
      get over() { return state.over; },
      name(p) { return names[p - 1]; },
      color(p) { return COLORS[p]; },
      other(p) { return p === 1 ? 2 : 1; },
      turn(p, text) {
        state.turn = p;
        els.player1.classList.toggle('active', p === 1);
        els.player2.classList.toggle('active', p === 2);
        if (p) els.status.innerHTML = text != null ? text : `<span class="pc${p}">${esc(names[p - 1])}</span>'s turn`;
        else if (text != null) els.status.innerHTML = text;
      },
      get current() { return state.turn; },
      status(text) { els.status.innerHTML = text; },
      points(a, b) { els.pa.textContent = a; els.pb.textContent = b; },
      win(p, detail, extra) { return finish(p, detail, extra); },
      draw(detail, extra) { return finish(0, detail, extra); },
      lose(p, detail, extra) { return finish(p === 1 ? 2 : 1, detail, extra); },
      restart: begin,
      modal, closeOverlay, showRules: () => showRules(false),
      toast(text, ms) {
        const t = h('div', { class: 'overlay', style: { background: 'transparent', pointerEvents: 'none', alignItems: 'flex-start', paddingTop: '30vh' } }, h('div', { class: 'modal', style: { padding: '.8rem 1.4rem', width: 'auto' }, html: `<h2>${text}</h2>` }));
        document.body.appendChild(t);
        setTimeout(() => t.remove(), ms || 900);
      },
      after(ms, fn) { const t = setTimeout(() => { state.timers.delete(t); fn(); }, ms); state.timers.add(t); return t; },
      every(ms, fn) { const t = setInterval(fn, ms); state.intervals.add(t); return t; },
      cancel(t) { clearTimeout(t); clearInterval(t); state.timers.delete(t); state.intervals.delete(t); },
      /** rAF loop: fn(dt seconds, elapsed seconds). Auto-stopped at round end. */
      loop(fn) {
        if (state.raf) cancelAnimationFrame(state.raf);
        let last = performance.now(); const t0 = last;
        const step = (now) => {
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          if (!state.over) { try { fn(dt, (now - t0) / 1000); } catch (e) { console.error(e); state.raf = 0; return; } }
          if (!state.over) state.raf = requestAnimationFrame(step);
          else state.raf = 0;
        };
        state.raf = requestAnimationFrame(step);
      },
      stopLoop() { if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; } },
      /** Key handler auto-removed at round end. */
      key(codes, fn, o) { const off = Input.onKey(codes, fn, o); state.offs.push(off); return off; },
      down: (code) => Input.down(code),
      countdown(n, label) {
        return new Promise((resolve) => {
          n = n || 3;
          const num = h('div', { class: 'big-num', text: n });
          modal({ cls: 'cd', body: () => num, sub: label || 'Get ready…' });
          const tick = () => {
            if (state.over) return;
            n -= 1;
            if (n > 0) { num.textContent = n; Sfx.play('tick'); api.after(700, tick); }
            else { num.textContent = 'GO!'; Sfx.play('go'); api.after(400, () => { closeOverlay(); resolve(); }); }
          };
          Sfx.play('tick');
          api.after(700, tick);
        });
      },
      /** Hidden-information hand-off: hides the stage until the next player confirms. */
      pass(p, text) {
        return new Promise((resolve) => {
          document.body.classList.add('passing');
          modal({
            cls: 'p' + p,
            title: `Pass to ${esc(names[p - 1])}`,
            html: `<p>${text || `${esc(names[api.other(p)])}, look away!`}</p>`,
            buttons: [{ label: `I'm ${esc(names[p - 1])} — ready`, primary: true, cls: 'p' + p, onClick: () => { document.body.classList.remove('passing'); resolve(); } }],
          });
        });
      },
      best(key, value, p, lower) { return Store.best(meta.id, key, value, p, lower); },
      getBest(key) { return Store.score(meta.id).best[key]; },
      sfx: (n) => Sfx.play(n),
      showPad: setPad,
      record: () => Store.score(meta.id),
    };

    els.rulesBtn.addEventListener('click', () => showRules(false));
    els.restartBtn.addEventListener('click', () => { if (!state.started) return; if (state.over || confirm('Restart the current round?')) begin(); });
    Input.onKey('KeyR', (c, e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; });

    if (opts.autoStart) begin(); else showRules(true);
    return api;
  }

  /* --------------------------------------------------------------- exports */
  global.Game = { init, findMeta, CAT_NAMES, COLORS };
  global.Store = Store;
  global.Sfx = Sfx;
  global.Input = Input;
  global.UI = UI;
  global.U = { rnd, rndf, pick, shuffle, clamp, lerp, dist, sleep, pad2, fmtTime, range, esc, h, keyLabel };
  Object.assign(global, { h, rnd, rndf, pick, shuffle, clamp, lerp, dist, sleep, pad2, fmtTime, range, esc });
})(window);
