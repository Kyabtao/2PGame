#!/usr/bin/env node
/**
 * tools/build.js
 * Generates games/<id>/index.html for every entry in assets/js/games.js
 * (only when the file is missing or --force is passed). Each page is a thin
 * shell that loads the shared CSS/JS and the game's own game.js.
 * Also verifies that every game folder has a game.js.
 *
 *   node tools/build.js          # create missing pages, report problems
 *   node tools/build.js --force  # regenerate all pages
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const w = {};
global.window = w;
require(path.join(ROOT, 'assets/js/games.js'));
const GAMES = w.GAMES;
const force = process.argv.includes('--force');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function page(g) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${esc(g.desc)} — a local 2-player game from 2PGame.">
<meta name="theme-color" content="#0e1020">
<title>${esc(g.title)} — 2PGame</title>
<link rel="stylesheet" href="../../assets/css/base.css">
</head>
<body>
<script src="../../assets/js/games.js"></script>
<script src="../../assets/js/core.js"></script>
<script src="game.js"></script>
</body>
</html>
`;
}

let created = 0; let missing = []; const syntax = [];
for (const g of GAMES) {
  const dir = path.join(ROOT, 'games', g.id);
  fs.mkdirSync(dir, { recursive: true });
  const idx = path.join(dir, 'index.html');
  if (force || !fs.existsSync(idx)) { fs.writeFileSync(idx, page(g)); created++; }
  const js = path.join(dir, 'game.js');
  if (!fs.existsSync(js)) missing.push(g.id);
  else { try { new vm.Script(fs.readFileSync(js, 'utf8'), { filename: js }); } catch (e) { syntax.push(`${g.id}: ${e.message}`); } }
}
// orphan folders
const orphans = fs.readdirSync(path.join(ROOT, 'games')).filter((d) => !GAMES.find((g) => g.id === d));

console.log(`games in manifest: ${GAMES.length}`);
console.log(`index.html written: ${created}`);
if (missing.length) console.log(`missing game.js (${missing.length}): ${missing.join(', ')}`);
if (orphans.length) console.log(`orphan folders: ${orphans.join(', ')}`);
if (syntax.length) { console.log('syntax errors:'); syntax.forEach((x) => console.log('  ' + x)); process.exitCode = 1; }
if (!missing.length) console.log('all games have a game.js ✔');
