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

  let names = Store.players();
  let filter = Store.get('hub:filter', 'all');
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
    const mk = (id, label, n) => {
      const c = h('button', { class: 'chip' + (filter === id ? ' on' : ''), html: `${label} <span class="n">${n}</span>` });
      c.addEventListener('click', () => { filter = id; Store.set('hub:filter', id); renderCats(); renderGames(); });
      catsEl.appendChild(c);
    };
    mk('all', '🎮 All', GAMES.length);
    mk('fav', '★ Favourites', favs.size);
    mk('played', '🕹️ Played', Object.values(Store.allScores()).filter((s) => s.n).length);
    CATS.forEach((c) => mk(c.id, `${c.emoji} ${c.name}`, GAMES.filter((g) => g.cat === c.id).length));
  }

  function card(g, all) {
    const s = all[g.id];
    const a = h('a', { class: 'gcard' + (s && s.n ? '' : ' new'), href: `games/${g.id}/index.html` },
      h('span', { class: 'mode', text: MODE[g.mode] || g.mode }),
      h('div', { class: 'em', text: g.emoji }),
      h('div', { class: 'nm', text: g.title }),
      h('div', { class: 'ds', text: g.desc }));
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
      if (q && !(g.title + ' ' + g.desc + ' ' + g.cat + ' ' + (MODE[g.mode] || '')).toLowerCase().includes(q)) return false;
      return true;
    });
    listEl.innerHTML = '';
    if (!games.length) { listEl.appendChild(h('div', { class: 'empty' }, 'No games match. Try another search or category.')); return; }
    const groups = filter === 'all' || filter === 'fav' || filter === 'played' ? CATS : CATS.filter((c) => c.id === filter);
    groups.forEach((c) => {
      const gs = games.filter((g) => g.cat === c.id);
      if (!gs.length) return;
      const sec = h('section', { class: 'section' }, h('h2', {}, `${c.emoji} ${c.name}`, h('span', { class: 'n', text: `${gs.length} game${gs.length > 1 ? 's' : ''}` })));
      const grid = h('div', { class: 'games' });
      gs.forEach((g) => grid.appendChild(card(g, all)));
      sec.appendChild(grid);
      listEl.appendChild(sec);
    });
  }

  /* ---- search ---- */
  const search = $('#search');
  search.addEventListener('input', () => { query = search.value; renderGames(); });
  window.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== search && !/INPUT/.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); } });

  /* ---- random game ---- */
  $('#random').addEventListener('click', () => { const g = GAMES[Math.floor(Math.random() * GAMES.length)]; location.href = `games/${g.id}/index.html`; });

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
  renderSummary(); renderCats(); renderGames();
  window.addEventListener('pageshow', () => { renderSummary(); renderCats(); renderGames(); });
})();
