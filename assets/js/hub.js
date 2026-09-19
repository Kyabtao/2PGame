/* ==========================================================================
   2PGame — hub logic: game catalogue, search/filter, favourites,
   player names, and the localStorage score summary.
   ========================================================================== */
(function () {
  'use strict';
  const GAMES = window.GAMES;
  const CATS = window.GAME_CATEGORIES;
  const $ = (s) => document.querySelector(s);
  const MODE = { turn: 'Turn based', live: 'Real time', pass: 'Pass device', race: 'Side by side' };
  const MODE_EMOJI = { turn: '🔄', pass: '📱', race: '🏁', live: '⚡' };
  const MODE_ORDER = { turn: 0, pass: 1, race: 2, live: 3 };
  const MODE_SECTIONS = [
    { mode: 'turn', title: '🔄 Turn-Based Games', desc: 'Perfect for mobile — tap to play' },
    { mode: 'pass', title: '📱 Pass-the-Device', desc: 'Great for mobile — hide and pass' },
    { mode: 'race', title: '🏁 Side-by-Side', desc: 'Split screen — touch friendly' },
    { mode: 'live', title: '⚡ Real-Time Games', desc: 'Best with a keyboard — fast reflexes needed' },
  ];

  let names = Store.players();
  let filter = Store.get('hub:filter', 'all');
  let modeFilter = Store.get('hub:mode', 'all');
  let query = '';
  let favs = new Set(Store.get('hub:favs', []));

  /* ---- player names ---- */
  const n1 = $('#name1'); const n2 = $('#name2');
  n1.value = names[0]; n2.value = names[1];
  const saveNames = () => {
    names = [n1.value.trim() || 'Player 1', n2.value.trim() || 'Player 2'];
    n1.value = names[0]; n2.value = names[1];
    Store.setPlayers(names);
    renderSummary(); renderGames();
  };
  n1.addEventListener('change', saveNames); n2.addEventListener('change', saveNames);
  [n1, n2].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') i.blur(); }));

  /* ---- summary ---- */
  function totals() {
    const all = Store.allScores();
    const t = { w: [0, 0], d: 0, n: 0, played: 0 };
    Object.values(all).forEach((s) => { t.w[0] += s.w[0]; t.w[1] += s.w[1]; t.d += s.d; t.n += s.n; if (s.n) t.played++; });
    return { t, all };
  }
  function renderSummary() {
    const { t } = totals();
    $('#sum1').textContent = t.w[0]; $('#sum1l').textContent = names[0] + ' wins';
    $('#sum2').textContent = t.w[1]; $('#sum2l').textContent = names[1] + ' wins';
    $('#sumD').textContent = t.d;
    $('#sumN').textContent = t.n;
    $('#sumP').textContent = `${t.played} / ${GAMES.length}`;
    const lead = t.w[0] === t.w[1] ? 'All square!' : `${t.w[0] > t.w[1] ? names[0] : names[1]} leads by ${Math.abs(t.w[0] - t.w[1])}`;
    $('#sumLead').textContent = t.n ? lead : 'No games played yet';
  }

  /* ---- catalogue ---- */
  const catsEl = $('#cats');
  function renderCats() {
    catsEl.innerHTML = '';
    const mk = (id, label, n, isMode) => {
      const active = isMode ? modeFilter === id : filter === id;
      const c = h('button', { class: 'chip' + (active ? ' on' : ''), html: `${label} <span class="n">${n}</span>` });
      c.addEventListener('click', () => {
        if (isMode) {
          modeFilter = id;
          Store.set('hub:mode', id);
        } else {
          filter = id;
          Store.set('hub:filter', id);
        }
        renderCats(); renderGames();
      });
      catsEl.appendChild(c);
    };
    mk('all', '🎮 All', GAMES.length);
    mk('fav', '★ Favourites', favs.size);
    mk('played', '🕹️ Played', Object.values(Store.allScores()).filter((s) => s.n).length);
    CATS.forEach((c) => mk(c.id, `${c.emoji} ${c.name}`, GAMES.filter((g) => g.cat === c.id).length));
    // Mode filter chips (divider + mode buttons)
    catsEl.appendChild(h('span', { class: 'mode-sep', text: '│' }));
    ['turn', 'pass', 'race', 'live'].forEach((m) => {
      const count = GAMES.filter((g) => g.mode === m).length;
      mk(m, `${MODE_EMOJI[m]} ${MODE[m]}`, count, true);
    });
  }

  function card(g, all) {
    const s = all[g.id];
    const isMobile = g.mobile !== false;
    const cls = `gcard cat-${g.cat}` + (s && s.n ? '' : ' new') + (!isMobile ? ' needs-kb' : '');
    const a = h('a', { class: cls, href: `games/${g.id}/index.html` },
      h('span', { class: 'mode' + (!isMobile ? ' mode-kb' : ''), text: isMobile ? (MODE[g.mode] || g.mode) : '⌨️ Keyboard' }),
      h('div', { class: 'em', text: g.emoji }),
      h('div', { class: 'nm', text: g.title }),
      h('div', { class: 'ds', text: g.desc }));
    if (isMobile) {
      a.appendChild(h('span', { class: 'mobile-badge', text: '📱 Mobile OK' }));
    } else {
      a.appendChild(h('span', { class: 'mobile-badge kb-badge', text: '⌨️ Needs keyboard' }));
    }
    if (s && s.n) {
      a.appendChild(h('div', { class: 'sc' }, h('b', { class: 'a', text: s.w[0] }), h('span', { class: 'muted', text: '–' }), h('b', { class: 'b', text: s.w[1] }), s.d ? h('span', { class: 'muted', text: `(${s.d} draw${s.d > 1 ? 's' : ''})` }) : null, h('span', { class: 'g', text: `${s.n} played` })));
    }
    const fav = h('button', { class: 'fav' + (favs.has(g.id) ? ' on' : ''), text: favs.has(g.id) ? '★' : '☆', title: 'Favourite' });
    fav.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (favs.has(g.id)) favs.delete(g.id); else favs.add(g.id);
      Store.set('hub:favs', [...favs]);
      renderCats(); renderGames();
    });
    a.appendChild(fav);
    return a;
  }

  const listEl = $('#list');
  function renderGames() {
    const { all } = totals();
    const q = query.trim().toLowerCase();
    let games = GAMES.filter((g) => {
      if (filter === 'fav' && !favs.has(g.id)) return false;
      if (filter === 'played' && !(all[g.id] && all[g.id].n)) return false;
      if (filter !== 'all' && filter !== 'fav' && filter !== 'played' && g.cat !== filter) return false;
      if (modeFilter !== 'all' && g.mode !== modeFilter) return false;
      if (q && !(g.title + ' ' + g.desc + ' ' + g.cat + ' ' + (MODE[g.mode] || '')).toLowerCase().includes(q)) return false;
      return true;
    });
    listEl.innerHTML = '';
    if (!games.length) { listEl.appendChild(h('div', { class: 'empty' }, 'No games match. Try another search or category.')); return; }

    // If a specific mode is selected, group by mode (turn first, live last)
    if (modeFilter !== 'all') {
      const ms = MODE_SECTIONS.find((m) => m.mode === modeFilter);
      const gs = games.sort((a, b) => {
        if (a.cat !== b.cat) return CATS.findIndex((c) => c.id === a.cat) - CATS.findIndex((c) => c.id === b.cat);
        return a.title.localeCompare(b.title);
      });
      const sec = h('section', { class: 'section' }, h('h2', {}, ms.title, h('span', { class: 'n', text: `· ${ms.desc}` })));
      const grid = h('div', { class: 'games' });
      gs.forEach((g) => grid.appendChild(card(g, all)));
      sec.appendChild(grid);
      listEl.appendChild(sec);
      return;
    }

    // For "all" view: group by mode (turn → pass → race → live), then by category within each mode
    const groups = filter === 'all' || filter === 'fav' || filter === 'played' ? MODE_SECTIONS : MODE_SECTIONS;
    groups.forEach((ms) => {
      let gs = games.filter((g) => g.mode === ms.mode);
      if (!gs.length) return;
      // Within the mode, sort by category then title
      gs.sort((a, b) => {
        const ci = CATS.findIndex((c) => c.id === a.cat) - CATS.findIndex((c) => c.id === b.cat);
        return ci !== 0 ? ci : a.title.localeCompare(b.title);
      });
      const sec = h('section', { class: 'section' },
        h('h2', {}, ms.title, h('span', { class: 'n', text: `· ${ms.desc} · ${gs.length} game${gs.length > 1 ? 's' : ''}` })));
      const grid = h('div', { class: 'games' });
      gs.forEach((g) => grid.appendChild(card(g, all)));
      sec.appendChild(grid);
      listEl.appendChild(sec);
    });
  }

  /* ---- search ---- */
  const search = $('#search');
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    search.placeholder = 'Search games…';
    const hint = $('.mobile-hint');
    if (hint) hint.hidden = false;
  } else {
    const hint = $('.mobile-hint');
    if (hint) hint.hidden = true;
  }
  search.addEventListener('input', () => { query = search.value; renderGames(); });
  window.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== search && !/INPUT/.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); } });

  /* ---- tiny toast ---- */
  let toastEl = null;
  function toast(text) {
    if (toastEl) toastEl.remove();
    toastEl = h('div', { class: 'toast', text });
    document.body.appendChild(toastEl);
    setTimeout(() => { if (toastEl) { toastEl.remove(); toastEl = null; } }, 2200);
  }

  /* ---- fullscreen switch ----
     Turned on, every game page asks for fullscreen on its first tap and
     shrinks its chrome to one slim row, so the whole screen is the board. */
  const fsBtn = $('#fullscreen');
  const syncFsBtn = () => {
    const on = Store.settings().fullscreen === 'on';
    fsBtn.classList.toggle('on', on);
    fsBtn.title = on ? 'Games start fullscreen — click to turn off' : 'Start every game in fullscreen';
    fsBtn.innerHTML = '⛶<span class="hide-sm"> Fullscreen</span>' + (on ? ' <b>ON</b>' : '');
  };
  fsBtn.addEventListener('click', () => {
    const on = Store.settings().fullscreen !== 'on';
    Store.setSettings({ fullscreen: on ? 'on' : 'off' });
    syncFsBtn();
    toast(on ? '⛶ Fullscreen on — games now fill the screen' : '⛶ Fullscreen off');
  });
  syncFsBtn();

  /* ---- random game ---- */
  $('#random').addEventListener('click', () => {
    // Prefer turn-based games for random pick on mobile
    const pool = window.matchMedia('(pointer: coarse)').matches
      ? GAMES.filter((g) => g.mobile !== false)
      : GAMES;
    const g = pool[Math.floor(Math.random() * pool.length)];
    location.href = `games/${g.id}/index.html`;
  });

  /* ---- history / reset ---- */
  function modal(title, bodyEl, buttons) {
    const box = h('div', { class: 'modal' }, h('h2', { html: title }), h('div', { class: 'body' }, bodyEl));
    const ov = h('div', { class: 'overlay' }, box);
    const close = () => ov.remove();
    const row = h('div', { class: 'buttons' });
    (buttons || []).forEach((b) => { const bt = h('button', { class: 'btn ' + (b.cls || ''), text: b.label }); bt.addEventListener('click', () => { if (b.onClick) b.onClick(); close(); }); row.appendChild(bt); });
    row.appendChild(h('button', { class: 'btn primary', text: 'Close', onclick: close }));
    box.appendChild(row);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    document.body.appendChild(ov);
  }
  $('#history').addEventListener('click', () => {
    const { all } = totals();
    const rows = GAMES.filter((g) => all[g.id] && all[g.id].n).sort((a, b) => all[b.id].n - all[a.id].n);
    const wrap = h('div', { class: 'history' });
    if (!rows.length) wrap.appendChild(h('p', { class: 'center muted' }, 'Nothing recorded yet. Play a game!'));
    else {
      const tbl = h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Game'), h('th', {}, names[0]), h('th', {}, names[1]), h('th', {}, 'Draws'), h('th', {}, 'Played'), h('th', {}, 'Last'))));
      const tb = h('tbody');
      rows.forEach((g) => {
        const s = all[g.id];
        const last = s.last[0];
        const lastTxt = last ? (last.w ? names[last.w - 1] : 'draw') + ' · ' + new Date(last.t).toLocaleDateString() : '';
        tb.appendChild(h('tr', {}, h('td', {}, h('a', { href: `games/${g.id}/index.html` }, `${g.emoji} ${g.title}`)), h('td', { class: 'num pc1' }, s.w[0]), h('td', { class: 'num pc2' }, s.w[1]), h('td', { class: 'num' }, s.d), h('td', { class: 'num' }, s.n), h('td', { class: 'muted' }, lastTxt)));
      });
      tbl.appendChild(tb); wrap.appendChild(tbl);
    }
    modal('📜 Score history', wrap, [{ label: 'Export JSON', cls: 'ghost', onClick: exportJson }]);
  });
  function exportJson() {
    const data = { players: names, exported: new Date().toISOString(), scores: Store.allScores() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: '2pgame-scores.json' });
    document.body.appendChild(a); a.click(); a.remove();
  }
  $('#reset').addEventListener('click', () => {
    if (confirm('Reset ALL scores for every game? This cannot be undone.')) { Store.resetAll(); renderSummary(); renderCats(); renderGames(); }
  });

  /* ---- boot ---- */
  $('#count').textContent = GAMES.length;
  listEl.classList.add('boot'); // entrance animation on first paint only
  renderSummary(); renderCats(); renderGames();
  setTimeout(() => listEl.classList.remove('boot'), 1000);
  window.addEventListener('pageshow', () => { renderSummary(); renderCats(); renderGames(); });
})();
