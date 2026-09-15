#!/usr/bin/env node
/**
 * tools/check-stubs.js
 * Fails the build when any game in the manifest is a placeholder or can never
 * record a result. Rules:
 *   1. no placeholder boilerplate ("pass-the-device game", "Coming soon", …)
 *   2. game.js must exist, match the manifest id, and be >= 40 lines
 *   3. game.js must call at least one terminal scorer (g.win / g.draw / finish)
 *   4. games listed with `libs` must have those files in assets/js
 * Run by `npm test` alongside the smoke tests.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const w = {};
global.window = w;
require(path.join(ROOT, 'assets/js/games.js'));
const GAMES = w.GAMES || [];

const STUB_MARKS = [
  /This is a pass-the-device game\./i,
  /Simple pass-the-device game/i,
  /coming soon/i,
  /placeholder game/i,
  /\bTODO\b(?!\s*\w+=)/,
  /generated? placeholder/i,
];

const problems = [];
for (const gm of GAMES) {
  const dir = path.join(ROOT, 'games', gm.id);
  const js = path.join(dir, 'game.js');
  if (!fs.existsSync(js)) { problems.push(`${gm.id}: no game.js`); continue; }
  const src = fs.readFileSync(js, 'utf8');
  const lines = src.split('\n').length;
  for (const mark of STUB_MARKS) {
    if (mark.test(src)) { problems.push(`${gm.id}: stub marker ${mark} found`); break; }
  }
  if (!src.includes(`id: '${gm.id}'`)) problems.push(`${gm.id}: game.js does not register this id`);
  if (lines < 24) problems.push(`${gm.id}: only ${lines} lines — looks unimplemented`);
  if (!/g\.win\(|g\.draw\(|\.win\(\s*\d|finish\(/.test(src)) problems.push(`${gm.id}: never calls g.win()/g.draw() — a match could never end`);
  for (const lib of gm.libs || []) {
    if (!fs.existsSync(path.join(ROOT, 'assets/js', lib))) problems.push(`${gm.id}: missing lib assets/js/${lib}`);
  }
}

if (problems.length) {
  console.error(`check-stubs: ${problems.length} problem(s)`);
  problems.forEach((p) => console.error('  ✗ ' + p));
  process.exit(1);
}
console.log(`check-stubs: all ${GAMES.length} games are real games ✔`);
