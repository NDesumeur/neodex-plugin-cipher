// Cipher : essayer et comprendre les méthodes de chiffrement, des plus anciennes (César, Vigenère) aux vraies d'aujourd'hui (AES, SHA-256),
// avec pour chacune : chiffrer, déchiffrer, ce qui se passe lettre par lettre, et comment on la casse.
const CSS = `
.ciGrid{display:grid;grid-template-columns:220px minmax(0,1fr);gap:14px}
@media (max-width:860px){.ciGrid{grid-template-columns:minmax(0,1fr)}.ciList{flex-direction:row;flex-wrap:wrap}.ciList small{display:none}}
.ciList{display:flex;flex-direction:column;gap:4px}
.ciList .btn{text-align:left}
.ciList small{display:block;font-size:10px;color:var(--muted);margin-top:2px}
.ciIo{width:100%;min-height:90px;box-sizing:border-box;font:15px monospace}
.ciRow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}
.ciRow .f{font:15px monospace}
.ciOut{font:15px monospace;white-space:pre-wrap;word-break:break-all;background:var(--bg0);border:2px solid var(--line);padding:10px;min-height:40px;color:#fff}
.ciMap{font:14px monospace;overflow-x:auto;white-space:pre;line-height:1.5;background:var(--bg0);border:2px solid var(--line);padding:8px;color:var(--lilac)}
.ciMap b{color:#ffd34f;font-weight:normal}
.ciMap i{color:#7fe0ff;font-style:normal}
.ciHelp{font-size:13px;line-height:1.55;color:var(--lilac)}
.ciHelp b{color:#fff}
.ciFreq{display:flex;align-items:flex-end;gap:2px;height:110px;margin-top:8px}
.ciFreq div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font:10px monospace;color:var(--muted);height:100%}
.ciFreq span{display:block;width:100%}
.ciFreq .a{background:#ff4fb0}.ciFreq .b{background:#7fe0ff;opacity:.6}
.ciBrute{font:13px monospace;max-height:260px;overflow:auto;background:var(--bg0);border:2px solid var(--line);padding:6px}
.ciBrute div{padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:var(--cp,pointer)}
.ciBrute div.best{background:rgba(var(--pkr),.3);color:#fff}
.ciBrute div:hover{outline:1px solid var(--magenta)}
.ciMode .btn.main{pointer-events:none}
`;
const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const FR = [7.6, .9, 3.3, 3.7, 14.7, 1.1, .9, .7, 7.5, .6, .1, 5.5, 3, 7.1, 5.8, 2.5, 1.4, 6.6, 7.9, 7.2, 6.3, 1.8, .1, .4, .3, .1];  // fréquences des lettres en français (%)
const MORSE = {A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '"': '.-..-.', '@': '.--.-.'};
const plain = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae');  // é -> e : les chiffres anciens ne connaissent que 26 lettres
const shiftChar = (c, k) => { const u = c >= 'a' && c <= 'z', U = c >= 'A' && c <= 'Z'; if (!u && !U) return c; const b = u ? 97 : 65; return String.fromCharCode(b + ((c.charCodeAt(0) - b + k) % 26 + 26) % 26); };
const caesar = (s, k) => [...plain(s)].map(c => shiftChar(c, k)).join('');
function vigenere(s, key, dir) {
  const ks = plain(key).toUpperCase().replace(/[^A-Z]/g, ''); if (!ks) return {out: plain(s), steps: []};
  let j = 0; const steps = [];
  const out = [...plain(s)].map(c => { if (!/[a-z]/i.test(c)) return c; const k = ks.charCodeAt(j % ks.length) - 65, r = shiftChar(c, dir * k); if (steps.length < 40) steps.push([c, ks[j % ks.length], k, r]); j++; return r; }).join('');
  return {out, steps};
}
const atbash = s => [...plain(s)].map(c => /[a-z]/.test(c) ? String.fromCharCode(219 - c.charCodeAt(0)) : /[A-Z]/.test(c) ? String.fromCharCode(155 - c.charCodeAt(0)) : c).join('');
function subst(s, alpha, dir) {  // alpha : les 26 lettres dans le désordre (la clé)
  const A = alpha.toUpperCase(); return [...plain(s)].map(c => { const up = c.toUpperCase(), i = (dir > 0 ? AZ : A).indexOf(up); if (i < 0 || !/[A-Z]/.test(up)) return c; const r = (dir > 0 ? A : AZ)[i]; return c === up ? r : r.toLowerCase(); }).join('');
}
function rail(s, n, dir) {  // la clôture : le texte écrit en zigzag sur n lignes, lu ligne par ligne
  n = Math.max(2, Math.min(10, n | 0)); const L = [...s], pos = L.map((_, i) => { const c = 2 * (n - 1), m = i % c; return m < n ? m : c - m; });
  const order = L.map((_, i) => i).sort((a, b) => pos[a] - pos[b] || a - b);
  if (dir > 0) return {out: order.map(i => L[i]).join(''), pos};
  const res = []; order.forEach((i, k) => res[i] = L[k]); return {out: res.join(''), pos};
}
const xorBytes = (bytes, key) => bytes.map((b, i) => b ^ key[i % key.length]);
const toHex = a => [...a].map(b => b.toString(16).padStart(2, '0')).join(' ');
const fromHex = s => { const h = s.replace(/[^\da-f]/gi, ''); if (h.length % 2) return null; return Uint8Array.from(h.match(/../g) || [], x => parseInt(x, 16)); };
const b64 = a => btoa(String.fromCharCode(...a)), unb64 = s => Uint8Array.from(atob(s.trim()), c => c.charCodeAt(0));
function freq(s) { const n = Array(26).fill(0); let t = 0; for (const c of plain(s).toUpperCase()) { const i = c.charCodeAt(0) - 65; if (i >= 0 && i < 26) { n[i]++; t++; } } return {n, t, p: n.map(x => t ? x * 100 / t : 0)}; }
const score = s => { const {p, t} = freq(s); return t ? p.reduce((a, x, i) => a + (x - FR[i]) ** 2 / FR[i], 0) : 1e9; };  // khi-deux : plus c'est bas, plus ça ressemble à du français
function vigKeyLen(s) {  // la longueur de clé la plus probable : celle dont les colonnes ont l'indice de coïncidence le plus proche du français (~0,078) ; un diviseur presque aussi bon gagne (12 = 6 × 2)
  const L = plain(s).toUpperCase().replace(/[^A-Z]/g, ''), ic = [0];
  for (let k = 1; k <= Math.min(16, Math.floor(L.length / 20)); k++) {  // au moins 20 lettres par colonne, sinon l'indice ne veut rien dire
    let sum = 0; for (let c = 0; c < k; c++) { const n = Array(26).fill(0); let N = 0; for (let i = c; i < L.length; i += k) { n[L.charCodeAt(i) - 65]++; N++; } sum += N > 1 ? n.reduce((a, x) => a + x * (x - 1), 0) / (N * (N - 1)) : 0; }
    ic.push(sum / k);
  }
  let best = 1; for (let k = 2; k < ic.length; k++) if (ic[k] > ic[best]) best = k;
  for (let d = 1; d < best; d++) if (best % d === 0 && ic[d] >= ic[best] * .93) return d;
  return best;
}
function vigCrack(s) {  // pour chaque colonne, le décalage qui donne les fréquences les plus françaises
  const k = vigKeyLen(s), L = plain(s).toUpperCase().replace(/[^A-Z]/g, ''); let key = '';
  for (let c = 0; c < k; c++) { const col = [...L].filter((_, i) => i % k === c).join(''); let bs = 0, bv = 1e18; for (let sft = 0; sft < 26; sft++) { const v = score(caesar(col, -sft)); if (v < bv) { bv = v; bs = sft; } } key += AZ[bs]; }
  return key;
}
const METHODS = [
  ['caesar', 'César', 'décaler chaque lettre'], ['vigenere', 'Vigenère', 'un décalage par lettre de la clé'], ['atbash', 'Atbash', 'l\'alphabet à l\'envers'],
  ['subst', 'Substitution', 'un alphabet mélangé'], ['rail', 'Clôture', 'écrire en zigzag'], ['morse', 'Morse', 'points et traits'],
  ['xor', 'XOR', 'les octets mêlés à une clé'], ['aes', 'AES-256', 'le vrai chiffrement d\'aujourd\'hui'], ['sha', 'SHA-256', 'une empreinte, sans retour'],
];
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const { el, toast } = ctx.host;
  ctx.host.addStyle(CSS);
  let data = null; try { data = await ctx.folder.read('cipher'); } catch {}
  const st = Object.assign({m: 'caesar', dir: 1, text: 'Rendez-vous au vieux phare à minuit, apporte la carte.', k: 3, key: 'LUNE', alpha: 'AZERTYUIOPQSDFGHJKLMWXCVBN', rails: 3, xkey: 'neo', pass: ''}, data || {});
  delete st.pass;  // un mot de passe n'est jamais gardé
  let pass = '', saveT = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { const {pass: _, ...rest} = st; ctx.folder.write('cipher', rest).catch(() => {}); }, 400); };
  // vérification : chaque méthode revient au texte de départ
  { const t = 'Bonjour le Monde 2026';
    console.assert(caesar(caesar(t, 3), -3) === t && vigenere(vigenere(t, 'CLE', 1).out, 'CLE', -1).out === t && atbash(atbash(t)) === t && subst(subst(t, 'QWERTYUIOPASDFGHJKLZXCVBNM', 1), 'QWERTYUIOPASDFGHJKLZXCVBNM', -1) === t
      && rail(rail(t, 4, 1).out, 4, -1).out === t && caesar('Zz', 1) === 'Aa' && vigenere('attack at dawn', 'LEMON', 1).out === 'lxfopv ef rnhr', 'cipher : allers-retours'); }

  view.innerHTML = '';
  const wrap = el('div', 'appWrap'), head = el('div', 'agHead'), grid = el('div', 'ciGrid'), list = el('div', 'ciList'), main = el('div');
  head.append(el('span', 'label', 'Cipher · tester et comprendre le chiffrement')); grid.append(list, main); wrap.append(head, grid); view.append(wrap);
  function drawList() {
    list.replaceChildren(...METHODS.map(([k, n, d]) => { const b = el('button', 'btn px' + (st.m === k ? ' main' : '')); b.dataset.m = k; b.append(n, el('small', '', d)); b.onclick = () => { st.m = k; save(); drawList(); draw(); }; return b; }));
  }
  const io = el('textarea', 'f ciIo'), out = el('div', 'ciOut'), opts = el('div', 'ciRow'), extra = el('div'), help = el('div', 'ciHelp'), mode = el('div', 'ciRow ciMode');
  io.id = 'ci_in'; out.id = 'ci_out'; out.translate = false;  // ton texte, jamais traduit io.value = st.text; io.spellcheck = false;
  io.oninput = () => { st.text = io.value; save(); run(); };
  const copy = el('button', 'btn px', 'Copier'), swap = el('button', 'btn px', '⇅ Le résultat devient l\'entrée');
  copy.onclick = () => navigator.clipboard.writeText(out.textContent).then(() => toast('Copié'), () => {});
  swap.onclick = () => { io.value = st.text = out.textContent; st.dir = -st.dir; save(); draw(); };
  const tools = el('div', 'ciRow'); tools.append(copy, swap);
  main.append(el('div', 'sysCard px'));
  main.firstChild.append(mode, opts, el('span', 'label', 'Entrée'), io, el('span', 'label', 'Résultat'), out, tools, extra);
  main.append(el('div', 'sysCard px')); main.lastChild.append(help);
  const field = (label, val, on, w = 120, type = 'text') => { const f = el('input', 'f'); f.type = type; f.value = val; f.style.width = w + 'px'; f.spellcheck = false; f.oninput = () => { on(f.value); save(); run(); }; opts.append(el('span', 'hint', label), f); return f; };
  const H = {
    caesar: '<b>César</b> (Ier siècle av. J.-C.) décale chaque lettre du même nombre de places : avec 3, A devient D, B devient E… Il n\'y a que 25 clés possibles, donc on le casse en les essayant toutes : la bonne est celle qui donne du français. La liste de droite les classe par ressemblance avec les fréquences du français.',
    vigenere: '<b>Vigenère</b> (XVIe siècle) utilise un décalage différent pour chaque lettre, donné par une clé qui se répète : avec LUNE, la 1re lettre est décalée de 11 (L), la 2e de 20 (U)… Réputé « indéchiffrable » pendant 300 ans, il tombe en trouvant la longueur de la clé (l\'indice de coïncidence), puis en cassant chaque colonne comme un César. Essaie <b>Casser</b> sur un texte assez long.',
    atbash: '<b>Atbash</b> (Antiquité, en hébreu) remplace A par Z, B par Y, C par X… Il n\'y a pas de clé : le même geste chiffre et déchiffre. C\'est une curiosité, pas une protection.',
    subst: '<b>La substitution</b> remplace chaque lettre par une autre selon un alphabet mélangé : 26! clés, plus de 400 millions de milliards de milliards. Pourtant on la casse à la main : en français, E est la lettre la plus fréquente, puis A, S, I… Compare les deux histogrammes : les pics trahissent les lettres.',
    rail: '<b>La clôture</b> (rail fence) ne change aucune lettre : elle les déplace. Le texte est écrit en zigzag sur plusieurs lignes, puis lu ligne par ligne. C\'est une <b>transposition</b> : les fréquences des lettres restent celles du français, ce qui la trahit.',
    morse: '<b>Le Morse</b> (1838) n\'est pas un chiffrement : c\'est un <b>codage</b>, connu de tous, pour envoyer des lettres avec des sons ou des lumières. Les lettres fréquentes ont les codes les plus courts (E = un point). Les lettres sont séparées par un espace, les mots par /.',
    xor: '<b>XOR</b> mêle chaque octet du message à un octet de la clé (bit à bit : 1 si les deux bits diffèrent). Refaire XOR avec la même clé rend le message. Avec une clé aléatoire aussi longue que le message et jamais réutilisée, c\'est le <b>masque jetable</b>, le seul chiffrement prouvé incassable ; avec une clé courte qui se répète, il se casse comme Vigenère.',
    aes: '<b>AES-256-GCM</b> est le chiffrement qu\'utilisent les banques, le Wi-Fi et HTTPS. Ton mot de passe est transformé en clé de 256 bits (PBKDF2, 200 000 tours, avec un sel aléatoire), puis le message est chiffré avec un vecteur aléatoire : le même texte donne un résultat différent à chaque fois. GCM ajoute une signature : un seul caractère modifié et le déchiffrement échoue. Le mot de passe n\'est jamais enregistré.',
    sha: '<b>SHA-256</b> calcule une <b>empreinte</b> de 256 bits : impossible de revenir au texte, et changer une seule lettre change toute l\'empreinte (l\'effet avalanche). Les sites gardent l\'empreinte de ton mot de passe, pas le mot de passe. Ce n\'est donc pas un chiffrement : il n\'y a pas de déchiffrement.',
  };
  function draw() {
    const m = st.m, twoWay = m !== 'sha';
    mode.replaceChildren(); opts.replaceChildren(); extra.replaceChildren();
    if (twoWay) for (const [d, t] of [[1, m === 'morse' ? 'Coder' : 'Chiffrer'], [-1, m === 'morse' ? 'Décoder' : 'Déchiffrer']]) { const b = el('button', 'btn px' + (st.dir === d ? ' main' : ''), t); b.dataset.dir = d; b.onclick = () => { st.dir = d; save(); draw(); }; mode.append(b); }
    if (m === 'caesar') { const f = field('Décalage', st.k, v => st.k = +v || 0, 70, 'number'); f.min = -25; f.max = 25; }
    if (m === 'vigenere') field('Clé', st.key, v => st.key = v, 160).id = 'ci_key';
    if (m === 'subst') { field('Alphabet', st.alpha, v => st.alpha = v, 300); const r = el('button', 'btn px', 'Mélanger'); r.onclick = () => { const a = [...AZ]; for (let i = 25; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } st.alpha = a.join(''); save(); draw(); }; opts.append(r); }
    if (m === 'rail') { const f = field('Lignes', st.rails, v => st.rails = +v || 3, 70, 'number'); f.min = 2; f.max = 10; }
    if (m === 'xor') field('Clé', st.xkey, v => st.xkey = v, 160);
    if (m === 'aes') { const f = el('input', 'f'); f.type = 'password'; f.value = pass; f.id = 'ci_pass'; f.placeholder = 'mot de passe'; f.autocomplete = 'off'; f.oninput = () => { pass = f.value; run(); }; opts.append(el('span', 'hint', 'Mot de passe'), f); }
    help.innerHTML = H[m];
    run();
  }
  let runId = 0;
  async function run() {
    const m = st.m, d = st.dir, s = io.value, id = ++runId; let r = '', map = null;
    const subAlpha = /^[A-Z]{26}$/i.test(st.alpha) && new Set(st.alpha.toUpperCase()).size === 26;
    try {
      if (m === 'caesar') { r = caesar(s, d * st.k); map = mapRows(i => AZ[((i + d * st.k) % 26 + 26) % 26]); }
      else if (m === 'vigenere') { const v = vigenere(s, st.key, d); r = v.out; map = vigSteps(v.steps); }
      else if (m === 'atbash') { r = atbash(s); map = mapRows(i => AZ[25 - i]); }
      else if (m === 'subst') { r = subAlpha ? subst(s, st.alpha, d) : 'L\'alphabet doit contenir les 26 lettres, chacune une seule fois.'; if (subAlpha) map = mapRows(i => st.alpha.toUpperCase()[i]); }
      else if (m === 'rail') { const v = rail(s, st.rails, d); r = v.out; map = railMap(d > 0 ? s : v.out, Math.max(2, Math.min(10, st.rails | 0))); }
      else if (m === 'morse') r = d > 0 ? plain(s).toUpperCase().split(/\s+/).filter(Boolean).map(w => [...w].map(c => MORSE[c] || '').filter(Boolean).join(' ')).join(' / ')
        : s.trim().split(/\s*\/\s*/).map(w => w.split(/\s+/).map(c => Object.keys(MORSE).find(k => MORSE[k] === c) || (c ? '?' : '')).join('')).join(' ');
      else if (m === 'xor') {
        const key = new TextEncoder().encode(st.xkey); if (!key.length) r = 'Il faut une clé.';
        else if (d > 0) r = toHex(xorBytes([...new TextEncoder().encode(s)], key));
        else { const b = fromHex(s); r = b ? new TextDecoder().decode(Uint8Array.from(xorBytes([...b], key))) : 'Colle les octets en hexadécimal (comme ceux donnés par Chiffrer).'; }
      }
      else if (m === 'aes') r = !pass ? 'Choisis un mot de passe.' : d > 0 ? await aesEnc(s, pass) : await aesDec(s, pass);
      else if (m === 'sha') { const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); r = toHex(h).replace(/ /g, ''); }
    } catch (e) { r = m === 'aes' && d < 0 ? 'Déchiffrement impossible : mauvais mot de passe, ou texte modifié.' : 'Erreur : ' + e.message; }
    if (id !== runId) return;
    out.textContent = r;
    extra.replaceChildren();
    if (map) extra.append(el('span', 'label', 'Ce qui se passe'), map);
    if (['caesar', 'subst', 'vigenere', 'rail', 'atbash'].includes(m)) extra.append(freqChart(d > 0 ? r : s));
    if (m === 'caesar' || m === 'vigenere') extra.append(crack(m, d > 0 ? r : s));
    if (m === 'sha') { const h2 = toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s + '.')))).replace(/ /g, ''); if (id !== runId) return; const diff = [...h2].filter((c, i) => c !== r[i]).length;
      extra.append(el('span', 'label', 'Effet avalanche'), el('p', 'hint', 'En ajoutant juste un point au texte, ' + diff + ' caractères sur 64 de l\'empreinte changent :'), (() => { const o = el('div', 'ciOut', h2); o.translate = false; return o; })()); }
  }
  const mapRows = f => { const m = el('div', 'ciMap'); m.translate = false; m.innerHTML = 'clair    ' + [...AZ].join(' ') + '\nchiffré  ' + [...AZ].map((_, i) => '<b>' + f(i) + '</b>').join(' '); return m; };
  const vigSteps = steps => { const m = el('div', 'ciMap'); m.translate = false; if (!steps.length) { m.textContent = 'Entre une clé faite de lettres.'; return m; }
    m.innerHTML = 'lettre   ' + steps.map(s => s[0].padStart(3)).join('') + '\nclé      ' + steps.map(s => ('<i>' + s[1] + '</i>').padStart(10)).join('') + '\ndécalage ' + steps.map(s => String(s[2]).padStart(3)).join('') + '\nrésultat ' + steps.map(s => ('<b>' + s[3] + '</b>').padStart(10)).join(''); return m; };
  const railMap = (s, n) => { const L = [...s].slice(0, 80), g = Array.from({length: n}, () => Array(L.length).fill(' ')), c = 2 * (n - 1); L.forEach((ch, i) => { const k = i % c; g[k < n ? k : c - k][i] = ch === ' ' ? '·' : ch; }); const m = el('div', 'ciMap'); m.translate = false; m.textContent = g.map(r => r.join('')).join('\n'); return m; };
  function freqChart(s) {
    const {p, t} = freq(s), box = el('div'), ch = el('div', 'ciFreq'), max = Math.max(15, ...p);
    for (let i = 0; i < 26; i++) { const col = el('div'), a = el('span', 'a'), b = el('span', 'b'); a.style.height = p[i] / max * 85 + '%'; b.style.height = FR[i] / max * 85 + '%'; const bars = el('div'); bars.style.cssText = 'display:flex;gap:1px;align-items:flex-end;width:100%;height:100%'; bars.append(a, b); col.append(bars, AZ[i]); col.title = AZ[i] + ' : ' + p[i].toFixed(1) + ' % ici, ' + FR[i] + ' % en français'; ch.append(col); }
    box.append(el('span', 'label', 'Fréquences des lettres (' + t + ' lettres)'), ch, el('p', 'hint', 'Rose : le texte chiffré. Bleu : le français moyen.'));
    return box;
  }
  function crack(m, s) {
    const box = el('div');
    if (m === 'caesar') {
      const rows = Array.from({length: 26}, (_, k) => [k, caesar(s, -k), score(caesar(s, -k))]).sort((a, b) => a[2] - b[2]), l = el('div', 'ciBrute'); l.translate = false;
      rows.forEach(([k, txt], i) => { const r = el('div', i === 0 ? 'best' : '', 'décalage ' + String(k).padStart(2) + ' : ' + txt.slice(0, 90)); r.onclick = () => { st.k = k; st.dir = -1; io.value = st.text = s; save(); draw(); }; l.append(r); });
      box.append(el('span', 'label', 'Casser : les 26 décalages, du plus français au moins français'), l);
    } else {
      const b = el('button', 'btn px', 'Casser (trouver la clé)'), res = el('p', 'hint'); b.id = 'ci_crack';
      b.onclick = () => { const L = plain(s).replace(/[^a-z]/gi, '').length; if (L < 60) { res.textContent = 'Il faut un texte chiffré d\'au moins 60 lettres pour deviner la clé.'; return; } const k = vigCrack(s); res.textContent = 'Clé probable : ' + k + ' (longueur ' + k.length + ').'; st.key = k; st.dir = -1; io.value = st.text = s; save(); draw(); };
      box.append(el('span', 'label', 'Casser Vigenère'), el('div', 'ciRow'), res); box.children[1].append(b);
    }
    return box;
  }
  const enc = new TextEncoder();
  async function keyFrom(pw, salt) { const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256'}, base, {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']); }
  async function aesEnc(s, pw) { const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), c = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, await keyFrom(pw, salt), enc.encode(s))); return b64(Uint8Array.from([...salt, ...iv, ...c])); }
  async function aesDec(s, pw) { const all = unb64(s); if (all.length < 29) throw new Error('trop court'); const p = await crypto.subtle.decrypt({name: 'AES-GCM', iv: all.slice(16, 28)}, await keyFrom(pw, all.slice(0, 16)), all.slice(28)); return new TextDecoder().decode(p); }
  drawList(); draw();
}
