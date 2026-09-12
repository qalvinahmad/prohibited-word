import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
function loadFile(file) {
  try {
    return JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch { return null; }
}
let DB = loadFile('words.json') ?? loadFile('words-lite.json') ?? { version: 0, meta: {}, langs: {}, regions: {}, emoji: {} };
let DICT_ID = `${DB.version}:${Object.keys(DB.langs ?? {}).length}`;

// Leet mengikuti upstream safe_text (tanpa l->i agar presisi)
const LEET = { '@': 'a', 4: 'a', 8: 'b', '(': 'c', 3: 'e', 1: 'i', '!': 'i', 0: 'o', $: 's', 5: 's', 7: 't', '+': 't', v: 'u', '#': 'h' };
const DIA = new RegExp('[̀-ͯ]', 'g');
const ALNUM = /[\p{L}\p{N}]/u;
const EMOJI_WRAP = /(\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)/gu;
const EMOJI_STRIP = /[\uFE0F\p{Emoji_Modifier}]/gu;

const MATURITY_CONF = { curated: 0.7, regional: 0.6, starter: 0.4, verified: 0.95 };
const confOfMaturity = (m) => MATURITY_CONF[m] ?? 0.5;

export function normalize(text) {
  let s = String(text ?? '').toLowerCase();
  s = s.normalize('NFKD').replace(DIA, '');
  s = [...s].map((c) => LEET[c] ?? c).join('');
  s = s.replace(EMOJI_WRAP, ' $1 ');
  return s.replace(/\s+/g, ' ').trim();
}

export function emojiKey(e) {
  return String(e).replace(EMOJI_STRIP, '');
}

const PAT_STRIP = /[^\p{L}\p{N}\p{Extended_Pictographic}]|[\uFE0F\p{Emoji_Modifier}]/gu;
const HAS_ALNUM = /[\p{L}\p{N}]/u;
const EDGE_STRIP = /^[^\p{L}\p{N}\p{Extended_Pictographic}]+|[^\p{L}\p{N}\p{Extended_Pictographic}]+$/gu;

export function entryPattern(word) {
  return normalize(word).replace(PAT_STRIP, '');
}

export function displayForm(word) {
  return normalize(word).replace(EDGE_STRIP, '');
}

export function parseLocale(locale) {
  if (!locale) return {};
  const m = String(locale).split(/[-_]/);
  return { lang: (m[0] ?? '').toLowerCase() || undefined, region: (m[1] ?? '').toUpperCase() || undefined };
}

// ---- v5: deobfuscation stream untuk detector PII/scam ----
const DIGIT_WORDS = {
  nol: '0', kosong: '0', satu: '1', dua: '2', tiga: '3', empat: '4', lima: '5',
  enam: '6', tujuh: '7', delapan: '8', sembilan: '9',
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', oh: '0',
};

export function deobfuscate(text) {
  let s = String(text ?? '').toLowerCase();
  s = s.replace(/[[({]\s*at\s*[\])}]|\sat\s(?=[a-z0-9])/g, '@');
  s = s.replace(/[[({]\s*dots?\s*[\])}]|\sdots?(?=\s|$)|\btitik\b/g, '.');
  s = s.replace(/\b(nol|kosong|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|zero|one|two|three|four|five|six|seven|eight|nine|oh)\b/g, (m) => DIGIT_WORDS[m]);
  // Gabung token 1-huruf yang berderet ('j o h n' -> 'john', '0 8 1 2' -> '0812')
  s = s.replace(/\b[a-z0-9](?: [a-z0-9])+\b/g, (m) => m.replace(/ /g, ''));
  s = s.replace(/\s*([@.])\s*/g, '$1');
  s = s.replace(/(?<=\d)[\s.()\-]+(?=\d)/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

const ID_PROVINCE = new Set(['11','12','13','14','15','16','17','18','19','21','31','32','33','34','35','36','51','52','53','61','62','63','64','65','71','72','73','74','75','76','81','82','91','92','94']);

function validNIK(d) {
  if (!ID_PROVINCE.has(d.slice(0, 2))) return false;
  const dd = parseInt(d.slice(6, 8), 10);
  const mm = parseInt(d.slice(8, 10), 10);
  const dayOk = (dd >= 1 && dd <= 31) || (dd >= 41 && dd <= 71);
  return dayOk && mm >= 1 && mm <= 12;
}

function luhnOk(d) {
  let sum = 0, dbl = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (dbl) { n *= 2; if (n > 9) n -= 9; }
    sum += n; dbl = !dbl;
  }
  return sum % 10 === 0;
}

const PII_RES = [
  { re: /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/g, type: 'email', conf: 0.85 },
  { re: /(?:\+?62|0)8\d{7,11}/g, type: 'phone', conf: 0.85 },
  { re: /\+\d{8,15}/g, type: 'phone', conf: 0.8 },
  { re: /\b\d{3}[- ]\d{2}[- ]\d{4}\b/g, type: 'ssn', conf: 0.7 },
  { re: /\b(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-f0-9]{40})\b/gi, type: 'crypto_wallet', conf: 0.85, scam: true },
  { re: /\b(paypal\.me\/\S+|(bit\.ly|tinyurl\.com|t\.co|s\.id|gg\.gg|lynk\.id|tiny\.cc|is\.gd|cutt\.ly)\/\S+)/gi, type: 'payment_link', conf: 0.6, scam: true },
  { re: /\b[a-z]\d{7}\b/g, type: 'passport', conf: 0.45 },
];

function scanPII(stream, wantPII, wantScam, types, minConf) {
  const hits = [];
  const take = (type) => (!types || types.includes(type));
  const pushSpan = (start, end, word, type, conf, action, detector) => {
    if (conf < minConf || !take(type)) return;
    hits.push({ start, end, word, type, conf, action, detector });
  };
  if (wantPII) {
    for (const { re, type, conf } of PII_RES.filter((r) => !r.scam)) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(stream)) !== null) {
        pushSpan(m.index, m.index + m[0].length, m[0], type, conf, 'block', 'pii');
      }
    }
    // NIK valid didahulukan; kartu Luhn; NIK berpola tapi tak valid terakhir
    for (const m of stream.matchAll(/\d{16}/g)) {
      if (validNIK(m[0])) pushSpan(m.index, m.index + 16, m[0], 'nik', 0.9, 'block', 'pii');
    }
    // Kartu 13-19 digit + Luhn (didahulukan atas NIK bila span sama)
    for (const m of stream.matchAll(/(?:\d[ \-.]*?){13,19}/g)) {
      const d = m[0].replace(/\D/g, '');
      if (d.length < 13 || d.length > 19) continue;
      pushSpan(m.index, m.index + m[0].length, d, 'bank_card', luhnOk(d) ? 0.95 : 0.4, 'block', 'pii');
    }
    for (const m of stream.matchAll(/\d{16}/g)) {
      if (!validNIK(m[0])) pushSpan(m.index, m.index + 16, m[0], 'nik', 0.4, 'block', 'pii');
    }
  }
  if (wantScam) {
    for (const { re, type, conf } of PII_RES.filter((r) => r.scam)) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(stream)) !== null) {
        pushSpan(m.index, m.index + m[0].length, m[0], type, conf, 'block', 'scam');
      }
    }
  }
  // Bank account generik terakhir (10-16 digit, conf rendah, hindari span yang sudah ada)
  if (wantPII && take('bank_account')) {
    for (const m of stream.matchAll(/\b\d{10,16}\b/g)) {
      const s = m.index, e = s + m[0].length;
      const overlap = hits.some((h) => h.detector === 'pii' && h.start < e && s < h.end);
      if (!overlap && 0.3 >= minConf) {
        hits.push({ start: s, end: e, word: m[0], type: 'bank_account', conf: 0.3, action: 'block', detector: 'pii' });
      }
    }
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept = [];
  for (const h of hits) {
    if (kept.length && kept[kept.length - 1].end >= h.end) continue;
    kept.push(h);
  }
  return kept;
}

function buildTrie(patterns) {
  const root = { next: new Map(), out: [], max: 0 };
  for (const { p, idx } of patterns) {
    const len = [...p].length;
    root.max = Math.max(root.max, len);
    let node = root;
    for (const ch of p) {
      let m = node.next.get(ch);
      if (!m) { m = { next: new Map(), out: [] }; node.next.set(ch, m); }
      node = m;
    }
    node.out.push(idx);
  }
  return root;
}

function scanTrie(root, runes, isAlnum, free, hits) {
  const n = runes.length;
  for (let i = 0; i < n; i++) {
    const startBoundary = i === 0 || !isAlnum[i - 1];
    let node = root;
    for (let j = i; j < n && j < i + root.max + 10; j++) {
      if (isAlnum[j]) {
        node = node.next.get(runes[j]);
        if (!node) break;
        if (node.out.length && startBoundary && (j + 1 >= n || !isAlnum[j + 1])) {
          for (const idx of node.out) hits.push({ idx, start: i, end: j + 1 });
        }
      } else {
        const child = node.next.get(runes[j]);
        if (!child) continue;
        node = child;
        if (node.out.length) {
          for (const idx of node.out) {
            if (free[idx] || (startBoundary && (j + 1 >= n || !isAlnum[j + 1]))) {
              hits.push({ idx, start: i, end: j + 1 });
            }
          }
        }
      }
    }
  }
}

const trieCache = new Map();

function getEngine(o) {
  const key = `${DICT_ID}|${o.langs.join(',')}|${o.region}|${(o.categories ?? []).join(',')}|${o.minSeverity}|${o.minConfidence}|${(o.detectors ?? []).join(',')}|${(o.types ?? []).join(',')}|${o.customWords.join(',')}|${[...o.whitelist].join(',')}`;
  let t = trieCache.get(key);
  if (t) return t;
  const wantProf = o.detectors.includes('profanity');
  const wantSens = o.detectors.includes('sensitive');
  const wantScamP = o.detectors.includes('scam');
  const takeType = (ty) => !o.types || o.types.includes(ty);
  const entries = [];
  const free = [];
  const seen = new Set();
  const push = (word, category, severity, via, lang, conf, detector, type, action) => {
    const w = String(word).toLowerCase();
    if (!w || o.whitelist.has(w)) return;
    const pat = entryPattern(w);
    if (!pat || o.whitelist.has(pat)) return;
    const disp = displayForm(w);
    if (o.whitelist.has(disp)) return;
    const sig = `${detector}\0${lang ?? ''}\0${pat}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    if (severity < o.minSeverity || conf < o.minConfidence || !takeType(type)) return;
    free.push(!HAS_ALNUM.test(pat));
    entries.push({ word: disp, category, severity, via, confidence: conf, detector, type, action });
  };
  const remove = new Set();
  if (o.region && DB.regions?.[o.region]?.remove) {
    for (const r of DB.regions[o.region].remove) remove.add(`${r.lang}\0${String(r.w).toLowerCase()}`);
  }
  const activeLangs = [];
  if (o.langs.length) {
    for (const t of o.langs) {
      const tLow = String(t).toLowerCase();
      activeLangs.push(tLow);
      const p = DB.langs?.[tLow]?.parent;
      if (p) activeLangs.push(String(p).toLowerCase());
    }
  }
  if (wantProf || wantSens) {
    for (const [lang, spec] of Object.entries(DB.langs ?? {})) {
      if (activeLangs.length) {
        const langLow = String(lang).toLowerCase();
        const base = langLow.split('-')[0];
        if (!activeLangs.includes(langLow) && !activeLangs.includes(base)) continue;
      }
      for (const e of spec.words ?? []) {
        const cat = e.c ?? 'profanity';
        const sev = e.s ?? 2;
        const conf = e.conf ?? confOfMaturity(spec.maturity);
        if (remove.has(`${lang}\0${String(e.w).toLowerCase()}`)) continue;
        const isHate = cat === 'sara' || sev >= 3;
        if (isHate && wantSens) {
          push(e.w, cat, sev, 'hate-word', lang, conf, 'sensitive', 'hate', 'review');
        } else if (!isHate && wantProf) {
          if (o.categories && !o.categories.includes(cat)) continue;
          push(e.w, cat, sev, 'word', lang, conf, 'profanity', 'profanity', 'block');
        } else if (isHate && wantProf && !wantSens) {
          if (o.categories && !o.categories.includes(cat)) continue;
          push(e.w, cat, sev, 'word', lang, conf, 'profanity', 'profanity', 'block');
        }
      }
    }
  }
  const pushPhrases = (key, detector) => {
    const want = detector === 'scam' ? wantScamP : wantSens;
    if (!want) return;
    for (const p of DB.phrases?.[key] ?? []) {
      if (activeLangs.length && !activeLangs.includes(p.lang)) continue;
      push(p.t, 'phrase', 2, 'phrase', p.lang, p.conf ?? 0.5, detector, key.split('_').slice(1).join('_'), p.action ?? (detector === 'sensitive' && key.endsWith('self_harm') ? 'help' : 'review'));
    }
  };
  for (const k of Object.keys(DB.phrases ?? {})) {
    pushPhrases(k, k.startsWith('scam_') ? 'scam' : 'sensitive');
  }
  if (o.region && DB.regions?.[o.region]?.add) {
    for (const e of DB.regions[o.region].add) {
      if (o.langs.length && !o.langs.includes(e.lang)) continue;
      if (o.categories && !o.categories.includes(e.c ?? 'profanity')) continue;
      push(e.w, e.c ?? 'profanity', e.s ?? 2, 'regional', e.lang, e.conf ?? 0.6, 'profanity', 'profanity', 'block');
    }
  }
  for (const [raw, spec] of Object.entries(DB.emoji ?? {})) {
    const uni = (spec.offensiveIn ?? []).includes('*');
    if (!uni && (!o.region || !(spec.offensiveIn ?? []).includes(o.region))) continue;
    push(emojiKey(raw), 'gesture', spec.severity ?? 2, 'emoji', undefined, spec.conf ?? 0.6, 'profanity', 'profanity', 'block');
  }
  for (const w of o.customWords) push(w, 'custom', 2, 'custom', undefined, 1.0, 'profanity', 'profanity', 'block');
  const patterns = entries.map((e, idx) => ({ p: entryPattern(e.word), idx }));
  t = { entries, free, trie: buildTrie(patterns) };
  if (trieCache.size > 32) trieCache.delete(trieCache.keys().next().value);
  trieCache.set(key, t);
  return t;
}

function resolveOpts(opts = {}) {
  const loc = parseLocale(opts.locale);
  const fullLoc = opts.locale ? String(opts.locale).toLowerCase().replace('_', '-') : '';
  let langOpt = opts.lang ? (Array.isArray(opts.lang) ? opts.lang.map((l) => String(l).toLowerCase()) : [String(opts.lang).toLowerCase()]) : null;
  if (!langOpt) {
    if (fullLoc && DB.langs?.[fullLoc]) {
      langOpt = [fullLoc];
    } else if (loc.lang) {
      langOpt = [loc.lang.toLowerCase()];
    }
  }
  return {
    langs: langOpt ?? [],
    region: opts.region ?? loc.region ?? '',
    categories: opts.categories ?? null,
    minSeverity: opts.minSeverity ?? 1,
    minConfidence: opts.minConfidence ?? 0,
    detectors: opts.detectors ?? ['profanity'],
    types: opts.types ?? null,
    customWords: (opts.customWords ?? []).map((w) => String(w).toLowerCase()),
    whitelist: new Set((opts.whitelist ?? []).map((w) => String(w).toLowerCase())),
  };
}

export function validate(text, opts) {
  const original = String(text ?? '');
  if (!original.trim()) return { isValid: true, needsReview: false, needsHelp: false, maxSeverity: 0, found: [] };
  const o = resolveOpts(opts);
  const t = getEngine(o);
  const norm = normalize(original);
  const runes = Array.from(norm);
  const isAlnum = runes.map((c) => ALNUM.test(c));
  const hits = [];
  scanTrie(t.trie, runes, isAlnum, t.free, hits);
  hits.sort((a, b) => a.start - b.start || b.end - a.end || a.idx - b.idx);
  const kept = [];
  for (const h of hits) {
    if (kept.length && kept[kept.length - 1].end >= h.end) continue;
    kept.push(h);
  }
  const lo = original.toLowerCase();
  const found = kept.map((h) => ({
    word: t.entries[h.idx].word,
    category: t.entries[h.idx].category,
    severity: t.entries[h.idx].severity,
    via: t.entries[h.idx].via,
    confidence: t.entries[h.idx].confidence,
    detector: t.entries[h.idx].detector,
    type: t.entries[h.idx].type,
    action: t.entries[h.idx].action,
    index: lo.indexOf(t.entries[h.idx].word),
  }));
  // Simbol standalone (pra-leet, region-gated): token utuh saja, bukan substring.
  if (o.region && DB.symbols) {
    const seenTok = new Set();
    for (const tok of lo.split(/[^\p{L}\p{N}]+/u).filter(Boolean)) {
      const spec = DB.symbols[tok];
      if (!spec || seenTok.has(tok)) continue;
      seenTok.add(tok);
      if (!(spec.regions ?? []).includes(o.region)) continue;
      const conf = spec.conf ?? 0.5;
      if (conf < o.minConfidence) continue;
      if (o.types && !o.types.includes('symbol')) continue;
      found.push({ word: tok, category: 'symbol', severity: spec.severity ?? 1, via: 'symbol', confidence: conf, detector: 'culture', type: 'symbol', action: 'review', index: lo.indexOf(tok) });
    }
  }
  const wantPII = o.detectors.includes('pii');
  const wantScamRx = o.detectors.includes('scam');
  if (wantPII || wantScamRx) {
    const stream = deobfuscate(original);
    for (const h of scanPII(stream, wantPII, wantScamRx, o.types, o.minConfidence)) {
      found.push({
        word: h.word, category: h.detector === 'scam' ? 'scam' : 'pii',
        severity: 2, via: h.detector, confidence: h.conf,
        detector: h.detector, type: h.type, action: h.action,
        index: lo.indexOf(h.word),
      });
    }
  }
  found.sort((a, b) => a.index - b.index);
  const blocked = found.some((f) => f.action === 'block');
  return {
    isValid: !blocked,
    needsReview: found.some((f) => f.action === 'review'),
    needsHelp: found.some((f) => f.action === 'help'),
    maxSeverity: found.reduce((m, f) => Math.max(m, f.severity), 0),
    found,
  };
}

export function contains(text, opts) {
  return !validate(text, opts).isValid;
}

export function censor(text, mask = '*') {
  const r = validate(text);
  let out = String(text ?? '');
  const done = new Set();
  for (const f of r.found) {
    if (f.action !== 'block' || f.index < 0 || done.has(f.index)) continue;
    done.add(f.index);
    out = out.slice(0, f.index) + mask.repeat(f.word.length) + out.slice(f.index + f.word.length);
  }
  return out;
}

// ---- Remote update (offline-first; panggil eksplisit bila perlu) ----
export function datasetInfo() {
  return { version: DB.version, released: DB.meta?.released, langs: Object.keys(DB.langs ?? {}).length };
}

export function loadDataset(db) {
  DB = db;
  DICT_ID = `${DB.version}:${Object.keys(DB.langs ?? {}).length}`;
  trieCache.clear();
}

export async function fetchDataset(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch dataset gagal: ${r.status}`);
  return await r.json();
}

export async function checkForUpdates(url) {
  const remote = await fetchDataset(url);
  return {
    current: datasetInfo(),
    remote: { version: remote.version, released: remote.meta?.released, langs: Object.keys(remote.langs ?? {}).length },
    updateAvailable: (remote.version ?? 0) > (DB.version ?? 0),
    remoteDb: remote,
  };
}
