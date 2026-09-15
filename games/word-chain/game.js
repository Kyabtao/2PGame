/* Word Chain — shiritori with a long-word law: every fifth link must have six letters. */
(function () {
  const BANK = 'ace act add age ago aid aim air ant arc arm ask axe bad bag ban bar bat bay bed bid big bin bit bog bow box boy bus but buy cab can cap car cat cob cod cog cop cot cow cry cub cup cut dab dag dam den dew dig dim dip doc doe dog dot dry dub dud due dug dun ear eat eel egg ego elf elk end era eve eye fan far fat fax fed fee few fig fin fir fit fix fly foal foam foe fog fond for fox frog fun fur gal gap gas gel gem get gig gin git goad goal god gold golf gone gong goo got gum gun gut guy gym had ham has hat hay hen hid him hip his hit hob hoe hog hop hot how hub hue hug hum hut ice ick ilk inn ion jab jam jar jaw jay jet jig job jot joy jug keg ken key kid kin lad lag lap law lay lea led leg let lid lie lip lit lob log lop lot low mad man map mar mat maw may men met mid mil mix moan moat mob mod mom mop mud mum nag nap net new nib nil nip nit nod nor not now nun nut oak oar oat odd ode off oil old one our out owe owl own pad pal pan pap par pat paw pea peg pen pew pig pin pit ply pod pop pot pry pub pug pun pup put rag ram ran rap rat ray red rid rim rip rob rod rot row rub rue rug rum rye sack safe sage said sake sale salt sand seal seam seat sect seed seek seem seen self sell send sent shad sham shat shy sick side sigh sign silk sill sing sink sip sir six skim skin sky sled slot slow slug smog snag snap snip snob snot snow snug soak soap soar sock soda sofa soft soil sold sole some song soon sort soul sown span spar spat spin spot spun stab star stay stem step stew stir stow stub stud stun such suck suit sum sung sunk sup swap swat sway swig swim tabs tach tack tail take tale talk tall tame tank tap tape taps tar tat tea teal team tear teem tell temp tent term test text than that thaw them then they thin this tie till tilt time tins tiny tips toad toe told toll tomb tone tong took tool toot top torn toss tost tout town toy trap tray tree trek trim trod true tube tuck tug tun tuna tune tuns turf turn tusk twin twit type ugly undo unit upon urn use vain vane veal veer vent verb very vest vibe vice view vile vine visa void vole volt wade wage wait wake walk wall wand wane want ward ware warm warn wart wash wasp watt wave way weak wean wear weed week weep well went wept were west wet whet whim whip whiz whoa wide wife wild will wilt wind wine wing wink wipe wire wise wish with wolf wont wood wool word wore work worm worn wort wrap wren writ yarn yaw yawn yeah year yell yew yoga yok yolk your zeal zero zest zig zip zone zoo anchor animal avatar banana bridge bubble cactus camera castle cookie danger doctor donkey engine eraser falcon finger flower forest garage garden ginger gopher hamlet hazard hollow hunter iguana impact impala insect island jacket jungle kangaroo kettle kidney kitten ladder lagoon lantern letter lizard magnet market moment monkey muffin nectar needle normal number object ocular office orange orchid oyster packet paddle pardon pepper pigeon planet pocket potato purple quartz quince quiver quokka rabbit racket random render ribbon rocket rubber saddle sample sandal savage secret simple sizzle socket solemn sphere spider spirit syringe temple tendon tennis ticket tomato tongue tunnel turkey turtle tuxedo ukulele umbrella upward utmost valley vanity velvet victor violet violin voodoo voyage waffle weapon weasel winter wombat wonder xylophone yellow yonder zenith zigzag zipper zombie'.split(' ');(' ');
  const LONG = BANK.filter((w) => w.length >= 6);
  const ROUNDS = 20;
  let starter = 1;
  Game.init({
    id: 'word-chain',
    rules: [
      'Classic shiritori: every word must begin with the last letter of the one before it, no word may be used twice, and the chain runs until someone cannot answer — the silent player loses the link and the round.',
      'The long-word law: by your fifth successful turn you must have landed at least one word of six letters or more; by your tenth, two. Ignore the law and the word you flash is struck out (counted as a pass).',
      'Twenty links maximum; if the chain outlives the cap, the longer legal-chain wins it.',
    ],
    controls: { all: 'Tap a legal word to extend the chain' },
    points: true,
    onStart(g) {
      const used = new Set();
      const links = { 1: 0, 2: 0 };
      const longs = { 1: 0, 2: 0 };
      let letter = '', turn = starter, n = 0, over = false, passed = 0;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const chain = h('div', { class: 'row wrap', style: { maxWidth: 560 } });
      const wordRow = h('div', { class: 'row wrap', style: { maxWidth: 620, justifyContent: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'l', label: 'link', val: 0 }]);
      wrap.append(info, chain, wordRow, stat.el);
      const legalFor = (p, L) => {
        const needLong = Math.floor(links[p] / 5) > longs[p];
        const pool = BANK.filter((w) => w[0].toLowerCase() === L.toLowerCase() && !used.has(w));
        const ok = needLong ? pool.filter((w) => w.length >= 6) : pool;
        return { pool: ok.slice(0, 14), needLong };
      };
      function start() {
        const seed = BANK[Math.floor(Math.random() * BANK.length)];
        used.add(seed);
        letter = seed[seed.length - 1];
        chain.appendChild(h('span', { class: 'tag', text: seed, style: { opacity: .6 } }));
        g.toast(`chain opens with ${seed} — answer to ${letter.toUpperCase()}`, 1600);
        draw();
      }
      function draw() {
        if (over) return;
        n++;
        if (n > ROUNDS) return end();
        const { pool, needLong } = legalFor(turn, letter);
        info.innerHTML = `link ${n}/${ROUNDS} · chain ends in <b>${letter.toUpperCase()}</b>${needLong ? ' · <b>long word due</b>' : ''} · <b class="pc${turn}">${esc(g.name(turn))}</b>`;
        wordRow.innerHTML = '';
        if (!pool.length) { g.sfx('explode'); return loseRound(3 - turn, `${esc(g.name(turn))} has no word for ${letter.toUpperCase()}`); }
        pool.forEach((w) => {
          const b = h('button', { class: 'btn', text: w, style: { minWidth: '86px' } });
          b.addEventListener('click', () => play(w));
          wordRow.appendChild(b);
        });
        if (needLong && pool.length && pool.some((w) => w.length < 6)) void 0;
        wordRow.appendChild(h('button', { class: 'chip', text: '🏳 I cannot answer', onclick: () => loseRound(3 - turn, `${esc(g.name(turn))} concedes the chain`) }));
        stat.set('a', links[1]); stat.set('b', links[2]); stat.set('l', `${links[1] + links[2]}`);
        g.points(links[1], links[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${needLong ? 'a six-plus word is required' : 'extend the chain'}`);
      }
      function play(w) {
        used.add(w);
        links[turn]++;
        if (w.length >= 6) longs[turn]++;
        if (Math.floor(links[turn] / 5) > longs[turn] && w.length < 6 && links[turn] % 5 === 0) {
          links[turn]--;
          g.sfx('bad'); g.toast('the long-word law strikes it out — treated as a pass', 1400);
          return loseRound(3 - turn, `${esc(g.name(turn))} broke the long-word law`);
        }
        chain.appendChild(h('span', { class: 'tag', text: w }));
        letter = w[w.length - 1];
        g.sfx('coin');
        turn = 3 - turn;
        draw();
      }
      function loseRound(w, why) {
        over = true;
        starter = 3 - starter;
        g.turn();
        g.win(w, `${why}. ${esc(g.name(w))} keeps the chain (${links[1]}–${links[2]} links).`);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (links[1] === links[2]) return g.draw(`Twenty links, an even split of vocabulary.`);
        g.win(links[1] > links[2] ? 1 : 2, `The chain survives the cap: ${links[1]}–${links[2]} links.`);
      }
      start();
    },
    onStop() { starter = 3 - starter; },
  });
})();
