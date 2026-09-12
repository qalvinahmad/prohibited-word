/* prohibited-word browser engine — port of packages/js/src/index.js (same NORMALIZER.md v3).
 * DB injected via ProhibitedWord.loadDataset(db). */
(function (global) {
  var DB = { version: 0, meta: {}, langs: {}, regions: {}, emoji: {} };
  var DICT_ID = '0:0';

  var LEET = { '@': 'a', '4': 'a', '8': 'b', '(': 'c', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '$': 's', '5': 's', '7': 't', '+': 't', 'v': 'u', '#': 'h' };
  var DIA = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  var ALNUM = /[\p{L}\p{N}]/u;
  var EMOJI_WRAP = /(\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)/gu;
  var EMOJI_STRIP = /[\uFE0F\p{Emoji_Modifier}]/gu;
  var PAT_STRIP = /[^\p{L}\p{N}\p{Extended_Pictographic}]|[\uFE0F\p{Emoji_Modifier}]/gu;
  var HAS_ALNUM = /[\p{L}\p{N}]/u;
  var EDGE_STRIP = /^[^\p{L}\p{N}\p{Extended_Pictographic}]+|[^\p{L}\p{N}\p{Extended_Pictographic}]+$/gu;

  function normalize(text) {
    var s = String(text == null ? '' : text).toLowerCase();
    s = s.normalize('NFKD').replace(DIA, '');
    s = Array.from(s).map(function (c) { return LEET[c] || c; }).join('');
    s = s.replace(EMOJI_WRAP, ' $1 ');
    return s.replace(/\s+/g, ' ').trim();
  }

  function emojiKey(e) { return String(e).replace(EMOJI_STRIP, ''); }
  function entryPattern(word) { return normalize(word).replace(PAT_STRIP, ''); }
  function displayForm(word) { return normalize(word).replace(EDGE_STRIP, ''); }

  function parseLocale(locale) {
    if (!locale) return {};
    var m = String(locale).split(/[-_]/);
    return { lang: (m[0] || '').toLowerCase() || undefined, region: (m[1] || '').toUpperCase() || undefined };
  }

  function buildTrie(patterns) {
    var root = { next: new Map(), out: [], max: 0 };
    patterns.forEach(function (it) {
      var len = Array.from(it.p).length;
      root.max = Math.max(root.max, len);
      var node = root;
      Array.from(it.p).forEach(function (ch) {
        var m = node.next.get(ch);
        if (!m) { m = { next: new Map(), out: [] }; node.next.set(ch, m); }
        node = m;
      });
      node.out.push(it.idx);
    });
    return root;
  }

  function scanTrie(root, runes, isAlnum, free, hits) {
    var n = runes.length;
    for (var i = 0; i < n; i++) {
      var startBoundary = i === 0 || !isAlnum[i - 1];
      var node = root;
      for (var j = i; j < n && j < i + root.max + 10; j++) {
        if (isAlnum[j]) {
          node = node.next.get(runes[j]);
          if (!node) break;
          if (node.out.length && startBoundary && (j + 1 >= n || !isAlnum[j + 1])) {
            node.out.forEach(function (idx) { hits.push({ idx: idx, start: i, end: j + 1 }); });
          }
        } else {
          var child = node.next.get(runes[j]);
          if (!child) continue;
          node = child;
          if (node.out.length) {
            node.out.forEach(function (idx) {
              if (free[idx] || (startBoundary && (j + 1 >= n || !isAlnum[j + 1]))) {
                hits.push({ idx: idx, start: i, end: j + 1 });
              }
            });
          }
        }
      }
    }
  }

  var trieCache = new Map();

  function getEngine(o) {
    var key = DICT_ID + '|' + o.langs.join(',') + '|' + o.region + '|' + (o.categories || []).join(',') + '|' + o.minSeverity + '|' + o.customWords.join(',') + '|' + Array.from(o.whitelist).join(',');
    var t = trieCache.get(key);
    if (t) return t;
    var entries = [], free = [], seen = {};
    function push(word, category, severity, via, lang) {
      var w = String(word).toLowerCase();
      if (!w || o.whitelist.has(w)) return;
      var pat = entryPattern(w);
      if (!pat || o.whitelist.has(pat)) return;
      var disp = displayForm(w);
      if (o.whitelist.has(disp)) return;
      var sig = (lang || '') + '\0' + pat;
      if (seen[sig]) return;
      seen[sig] = true;
      if (severity < o.minSeverity) return;
      free.push(!HAS_ALNUM.test(pat));
      entries.push({ word: disp, category: category, severity: severity, via: via });
    }
    var remove = {};
    if (o.region && DB.regions && DB.regions[o.region] && DB.regions[o.region].remove) {
      DB.regions[o.region].remove.forEach(function (r) { remove[String(r.w).toLowerCase() + '\0' + r.lang] = true; });
    }
    Object.keys(DB.langs || {}).forEach(function (lang) {
      if (o.langs.length && o.langs.indexOf(lang) < 0) return;
      (DB.langs[lang].words || []).forEach(function (e) {
        var cat = e.c || 'profanity';
        if (o.categories && o.categories.indexOf(cat) < 0) return;
        if (remove[String(e.w).toLowerCase() + '\0' + lang]) return;
        push(e.w, cat, e.s || 2, 'word', lang);
      });
    });
    if (o.region && DB.regions && DB.regions[o.region] && DB.regions[o.region].add) {
      DB.regions[o.region].add.forEach(function (e) {
        if (o.langs.length && o.langs.indexOf(e.lang) < 0) return;
        var cat = e.c || 'profanity';
        if (o.categories && o.categories.indexOf(cat) < 0) return;
        push(e.w, cat, e.s || 2, 'regional', e.lang);
      });
    }
    Object.keys(DB.emoji || {}).forEach(function (raw) {
      var spec = DB.emoji[raw];
      var off = spec.offensiveIn || [];
      var uni = off.indexOf('*') >= 0;
      if (!uni && (!o.region || off.indexOf(o.region) < 0)) return;
      push(emojiKey(raw), 'gesture', spec.severity || 2, 'emoji', undefined);
    });
    o.customWords.forEach(function (w) { push(w, 'custom', 2, 'custom', undefined); });
    var patterns = entries.map(function (e, idx) { return { p: entryPattern(e.word), idx: idx }; });
    t = { entries: entries, free: free, trie: buildTrie(patterns) };
    if (trieCache.size > 32) trieCache.delete(trieCache.keys().next().value);
    trieCache.set(key, t);
    return t;
  }

  function resolveOpts(opts) {
    opts = opts || {};
    var loc = parseLocale(opts.locale);
    var langOpt = opts.lang || (loc.lang ? [loc.lang] : null);
    return {
      langs: langOpt || [],
      region: opts.region || loc.region || '',
      categories: opts.categories || null,
      minSeverity: opts.minSeverity || 1,
      customWords: (opts.customWords || []).map(function (w) { return String(w).toLowerCase(); }),
      whitelist: new Set((opts.whitelist || []).map(function (w) { return String(w).toLowerCase(); }))
    };
  }

  function validate(text, opts) {
    var original = String(text == null ? '' : text);
    if (!original.trim()) return { isValid: true, maxSeverity: 0, found: [] };
    var o = resolveOpts(opts);
    var t = getEngine(o);
    var norm = normalize(original);
    var runes = Array.from(norm);
    var isAlnum = runes.map(function (c) { return ALNUM.test(c); });
    var hits = [];
    scanTrie(t.trie, runes, isAlnum, t.free, hits);
    hits.sort(function (a, b) { return a.start - b.start || b.end - a.end || a.idx - b.idx; });
    var kept = [];
    hits.forEach(function (h) {
      if (kept.length && kept[kept.length - 1].end >= h.end) return;
      kept.push(h);
    });
    var lo = original.toLowerCase();
    var found = kept.map(function (h) {
      return { word: t.entries[h.idx].word, category: t.entries[h.idx].category, severity: t.entries[h.idx].severity, via: t.entries[h.idx].via, index: lo.indexOf(t.entries[h.idx].word) };
    });
    found.sort(function (a, b) { return a.index - b.index; });
    return { isValid: found.length === 0, maxSeverity: found.reduce(function (m, f) { return Math.max(m, f.severity); }, 0), found: found };
  }

  global.ProhibitedWord = {
    loadDataset: function (db) { DB = db; DICT_ID = DB.version + ':' + Object.keys(DB.langs || {}).length; trieCache.clear(); },
    datasetInfo: function () { return { version: DB.version, released: DB.meta && DB.meta.released, langs: Object.keys(DB.langs || {}).length }; },
    validate: validate,
    contains: function (text, opts) { return !validate(text, opts).isValid; },
    normalize: normalize,
    parseLocale: parseLocale
  };
})(window);
