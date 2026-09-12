import { readFileSync, writeFileSync } from 'node:fs';
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

// Pola entri: normalisasi + buang semua kecuali huruf/angka/emoji
// ('*fuck*' -> 'fuck', 'anak haram' -> 'anakharam', '👍🏻' -> '👍').
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
        if (!child) continue; // skip separator
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
  const key = `${DICT_ID}|${o.langs.join(',')}|${o.region}|${(o.categories ?? []).join(',')}|${o.minSeverity}|${o.customWords.join(',')}|${[...o.whitelist].join(',')}`;
  let t = trieCache.get(key);
  if (t) return t;
  const entries = [];
  const free = [];
  const seen = new Set();
  const push = (word, category, severity, via, lang) => {
    const w = String(word).toLowerCase();
    if (!w || o.whitelist.has(w)) return;
    const pat = entryPattern(w);
    if (!pat || o.whitelist.has(pat)) return;
    const disp = displayForm(w);
    if (o.whitelist.has(disp)) return;
    const sig = `${lang ?? ''}\0${pat}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    if (severity < o.minSeverity) return;
    free.push(!HAS_ALNUM.test(pat));
    entries.push({ word: disp, category, severity, via });
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

  for (const [lang, spec] of Object.entries(DB.langs ?? {})) {
    if (activeLangs.length) {
      const langLow = String(lang).toLowerCase();
      const base = langLow.split('-')[0];
      if (!activeLangs.includes(langLow) && !activeLangs.includes(base)) continue;
    }
    for (const e of spec.words ?? []) {
      if (o.categories && !o.categories.includes(e.c ?? 'profanity')) continue;
      if (remove.has(`${lang}\0${String(e.w).toLowerCase()}`)) continue;
      push(e.w, e.c ?? 'profanity', e.s ?? 2, 'word', lang);
    }
  }
  if (o.region && DB.regions?.[o.region]?.add) {
    for (const e of DB.regions[o.region].add) {
      if (o.langs.length && !o.langs.includes(e.lang)) continue;
      if (o.categories && !o.categories.includes(e.c ?? 'profanity')) continue;
      push(e.w, e.c ?? 'profanity', e.s ?? 2, 'regional', e.lang);
    }
  }
  for (const [raw, spec] of Object.entries(DB.emoji ?? {})) {
    const uni = (spec.offensiveIn ?? []).includes('*');
    if (!uni && (!o.region || !(spec.offensiveIn ?? []).includes(o.region))) continue;
    push(emojiKey(raw), 'gesture', spec.severity ?? 2, 'emoji', undefined);
  }
  for (const w of o.customWords) push(w, 'custom', 2, 'custom', undefined);
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
    customWords: (opts.customWords ?? []).map((w) => String(w).toLowerCase()),
    whitelist: new Set((opts.whitelist ?? []).map((w) => String(w).toLowerCase())),
  };
}

export function validate(text, opts) {
  const original = String(text ?? '');
  if (!original.trim()) return { isValid: true, maxSeverity: 0, found: [] };
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
    index: lo.indexOf(t.entries[h.idx].word),
  }));
  found.sort((a, b) => a.index - b.index);
  return { isValid: found.length === 0, maxSeverity: found.reduce((m, f) => Math.max(m, f.severity), 0), found };
}

export function contains(text, opts) {
  return !validate(text, opts).isValid;
}

export function censor(text, mask = '*') {
  const r = validate(text);
  let out = String(text ?? '');
  const done = new Set();
  for (const f of r.found) {
    if (f.index >= 0 && !done.has(f.index)) {
      done.add(f.index);
      out = out.slice(0, f.index) + mask.repeat(f.word.length) + out.slice(f.index + f.word.length);
    }
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
