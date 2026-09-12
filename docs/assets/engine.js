/* prohibited-word browser engine — port of packages/js/src/index.js (same NORMALIZER.md v3).
 * DB injected via ProhibitedWord.loadDataset(db). */
(function (global) {
  var DB = { version: 0, meta: {}, langs: {}, regions: {}, emoji: {} };
  var DICT_ID = '0:0';

  var LEET = { '@': 'a', '4': 'a', '8': 'b', '(': 'c', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '$': 's', '5': 's', '7': 't', '+': 't', 'v': 'u', '#': 'h' };
  var MATURITY_CONF = { curated: 0.7, regional: 0.6, starter: 0.4, verified: 0.95 };
  function confOfMaturity(m) { return MATURITY_CONF[m] || 0.5; }
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

  var DIGIT_WORDS = { nol: '0', kosong: '0', satu: '1', dua: '2', tiga: '3', empat: '4', lima: '5', enam: '6', tujuh: '7', delapan: '8', sembilan: '9', zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', oh: '0' };
  var ID_PROVINCE = { '11': 1, '12': 1, '13': 1, '14': 1, '15': 1, '16': 1, '17': 1, '18': 1, '19': 1, '21': 1, '31': 1, '32': 1, '33': 1, '34': 1, '35': 1, '36': 1, '51': 1, '52': 1, '53': 1, '61': 1, '62': 1, '63': 1, '64': 1, '65': 1, '71': 1, '72': 1, '73': 1, '74': 1, '75': 1, '76': 1, '81': 1, '82': 1, '91': 1, '92': 1, '94': 1 };

  function deobfuscate(text) {
    var s = String(text == null ? '' : text).toLowerCase();
    s = s.replace(/[[({]\s*at\s*[\])}]|\sat\s(?=[a-z0-9])/g, '@');
    s = s.replace(/[[({]\s*dots?\s*[\])}]|\sdots?(?=\s|$)|\btitik\b/g, '.');
    s = s.replace(/\b(nol|kosong|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|zero|one|two|three|four|five|six|seven|eight|nine|oh)\b/g, function (m) { return DIGIT_WORDS[m]; });
    s = s.replace(/\b[a-z0-9](?: [a-z0-9])+\b/g, function (m) { return m.replace(/ /g, ''); });
    s = s.replace(/\s*([@.])\s*/g, '$1');
    s = s.replace(/(?<=\d)[\s.()\-]+(?=\d)/g, '');
    return s.replace(/\s+/g, ' ').trim();
  }

  function validNIK(d) {
    if (!ID_PROVINCE[d.slice(0, 2)]) return false;
    var dd = parseInt(d.slice(6, 8), 10), mm = parseInt(d.slice(8, 10), 10);
    return ((dd >= 1 && dd <= 31) || (dd >= 41 && dd <= 71)) && mm >= 1 && mm <= 12;
  }

  function luhnOk(d) {
    var sum = 0, dbl = false;
    for (var i = d.length - 1; i >= 0; i--) {
      var n = d.charCodeAt(i) - 48;
      if (dbl) { n *= 2; if (n > 9) n -= 9; }
      sum += n; dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  var PII_RES = [
    { re: /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/g, type: 'email', conf: 0.85, scam: false },
    { re: /(?:\+?62|0)8\d{7,11}/g, type: 'phone', conf: 0.85, scam: false },
    { re: /\+\d{8,15}/g, type: 'phone', conf: 0.8, scam: false },
    { re: /\b\d{3}[- ]\d{2}[- ]\d{4}\b/g, type: 'ssn', conf: 0.7, scam: false },
    { re: /\b(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-f0-9]{40})\b/gi, type: 'crypto_wallet', conf: 0.85, scam: true },
    { re: /\b(paypal\.me\/\S+|(bit\.ly|tinyurl\.com|t\.co|s\.id|gg\.gg|lynk\.id|tiny\.cc|is\.gd|cutt\.ly)\/\S+)/gi, type: 'payment_link', conf: 0.6, scam: true },
    { re: /\b[a-z]\d{7}\b/g, type: 'passport', conf: 0.45, scam: false }
  ];

  function scanPII(stream, wantPII, wantScam, types, minConf) {
    var take = function (ty) { return !types || types.indexOf(ty) >= 0; };
    var hits = [];
    function pushSpan(s, e, w, ty, conf, act, det) {
      if (conf < minConf || !take(ty)) return;
      hits.push({ start: s, end: e, word: w, type: ty, conf: conf, action: act, detector: det });
    }
    var m, d, i;
    if (wantPII) {
      PII_RES.filter(function (r) { return !r.scam; }).forEach(function (r) {
        r.re.lastIndex = 0;
        while ((m = r.re.exec(stream)) !== null) pushSpan(m.index, m.index + m[0].length, m[0], r.type, r.conf, 'block', 'pii');
      });
      var nikRe = /\d{16}/g, cardRe = /(?:\d[ \-.]*?){13,19}/g;
      while ((m = nikRe.exec(stream)) !== null) { if (validNIK(m[0])) pushSpan(m.index, m.index + 16, m[0], 'nik', 0.9, 'block', 'pii'); }
      while ((m = cardRe.exec(stream)) !== null) {
        d = m[0].replace(/\D/g, '');
        if (d.length < 13 || d.length > 19) continue;
        pushSpan(m.index, m.index + m[0].length, d, 'bank_card', luhnOk(d) ? 0.95 : 0.4, 'block', 'pii');
      }
      nikRe.lastIndex = 0;
      while ((m = nikRe.exec(stream)) !== null) { if (!validNIK(m[0])) pushSpan(m.index, m.index + 16, m[0], 'nik', 0.4, 'block', 'pii'); }
    }
    if (wantScam) {
      PII_RES.filter(function (r) { return r.scam; }).forEach(function (r) {
        r.re.lastIndex = 0;
        while ((m = r.re.exec(stream)) !== null) pushSpan(m.index, m.index + m[0].length, m[0], r.type, r.conf, 'block', 'scam');
      });
    }
    if (wantPII && (!types || types.indexOf('bank_account') >= 0)) {
      var bankRe = /\b\d{10,16}\b/g;
      while ((m = bankRe.exec(stream)) !== null) {
        var s = m.index, e = s + m[0].length;
        var overlap = hits.some(function (h) { return h.detector === 'pii' && h.start < e && s < h.end; });
        if (!overlap && 0.3 >= minConf) hits.push({ start: s, end: e, word: m[0], type: 'bank_account', conf: 0.3, action: 'block', detector: 'pii' });
      }
    }
    hits.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var kept = [];
    hits.forEach(function (h) {
      if (kept.length && kept[kept.length - 1].end >= h.end) return;
      kept.push(h);
    });
    return kept;
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
    var key = DICT_ID + '|' + o.langs.join(',') + '|' + o.region + '|' + (o.categories || []).join(',') + '|' + o.minSeverity + '|' + o.minConfidence + '|' + o.detectors.join(',') + '|' + (o.types || []).join(',') + '|' + o.customWords.join(',') + '|' + Array.from(o.whitelist).join(',');
    var t = trieCache.get(key);
    if (t) return t;
    var wantProf = o.detectors.indexOf('profanity') >= 0;
    var wantSens = o.detectors.indexOf('sensitive') >= 0;
    var wantScamP = o.detectors.indexOf('scam') >= 0;
    var takeType = function (ty) { return !o.types || o.types.indexOf(ty) >= 0; };
    var entries = [], free = [], seen = {};
    function push(word, category, severity, via, lang, conf, det, typ, act) {
      var w = String(word).toLowerCase();
      if (!w || o.whitelist.has(w)) return;
      var pat = entryPattern(w);
      if (!pat || o.whitelist.has(pat)) return;
      var disp = displayForm(w);
      if (o.whitelist.has(disp)) return;
      var sig = det + '\0' + (lang || '') + '\0' + pat;
      if (seen[sig]) return;
      seen[sig] = true;
      if (severity < o.minSeverity || conf < o.minConfidence || !takeType(typ)) return;
      free.push(!HAS_ALNUM.test(pat));
      entries.push({ word: disp, category: category, severity: severity, via: via, confidence: conf, detector: det, type: typ, action: act });
    }
    var remove = {};
    if (o.region && DB.regions && DB.regions[o.region] && DB.regions[o.region].remove) {
      DB.regions[o.region].remove.forEach(function (r) { remove[String(r.w).toLowerCase() + '\0' + r.lang] = true; });
    }
    var activeLangs = [];
    if (o.langs.length) {
      o.langs.forEach(function (t) {
        var tLow = String(t).toLowerCase();
        activeLangs.push(tLow);
        var p = DB.langs && DB.langs[tLow] && DB.langs[tLow].parent;
        if (p) activeLangs.push(String(p).toLowerCase());
      });
    }
    Object.keys(DB.langs || {}).forEach(function (lang) {
      var spec = DB.langs[lang];
      if (activeLangs.length) {
        var langLow = String(lang).toLowerCase();
        var base = langLow.split('-')[0];
        if (activeLangs.indexOf(langLow) < 0 && activeLangs.indexOf(base) < 0) return;
      }
      (spec.words || []).forEach(function (e) {
        var cat = e.c || 'profanity';
        var sev = e.s || 2;
        var conf = e.conf || confOfMaturity(spec.maturity);
        if (remove[String(e.w).toLowerCase() + '\0' + lang]) return;
        var isHate = cat === 'sara' || sev >= 3;
        if (isHate && wantSens) {
          push(e.w, cat, sev, 'hate-word', lang, conf, 'sensitive', 'hate', 'review');
        } else if (!isHate && wantProf) {
          if (o.categories && o.categories.indexOf(cat) < 0) return;
          push(e.w, cat, sev, 'word', lang, conf, 'profanity', 'profanity', 'block');
        } else if (isHate && wantProf && !wantSens) {
          if (o.categories && o.categories.indexOf(cat) < 0) return;
          push(e.w, cat, sev, 'word', lang, conf, 'profanity', 'profanity', 'block');
        }
      });
    });
    Object.keys(DB.phrases || {}).forEach(function (key) {
      var det = key.indexOf('scam_') === 0 ? 'scam' : 'sensitive';
      if ((det === 'scam' && !wantScamP) || (det === 'sensitive' && !wantSens)) return;
      var typ = key.split('_').slice(1).join('_');
      (DB.phrases[key] || []).forEach(function (p) {
        if (activeLangs.length && activeLangs.indexOf(p.lang) < 0) return;
        push(p.t, 'phrase', 2, 'phrase', p.lang, p.conf || 0.5, det, typ, p.action || 'review');
      });
    });
    if (o.region && DB.regions && DB.regions[o.region] && DB.regions[o.region].add) {
      DB.regions[o.region].add.forEach(function (e) {
        if (o.langs.length && o.langs.indexOf(e.lang) < 0) return;
        var cat = e.c || 'profanity';
        if (o.categories && o.categories.indexOf(cat) < 0) return;
        push(e.w, cat, e.s || 2, 'regional', e.lang, e.conf || 0.6, 'profanity', 'profanity', 'block');
      });
    }
    Object.keys(DB.emoji || {}).forEach(function (raw) {
      var spec = DB.emoji[raw];
      var off = spec.offensiveIn || [];
      var uni = off.indexOf('*') >= 0;
      if (!uni && (!o.region || off.indexOf(o.region) < 0)) return;
      push(emojiKey(raw), 'gesture', spec.severity || 2, 'emoji', undefined, spec.conf || 0.6, 'profanity', 'profanity', 'block');
    });
    o.customWords.forEach(function (w) { push(w, 'custom', 2, 'custom', undefined, 1.0, 'profanity', 'profanity', 'block'); });
    var patterns = entries.map(function (e, idx) { return { p: entryPattern(e.word), idx: idx }; });
    t = { entries: entries, free: free, trie: buildTrie(patterns) };
    if (trieCache.size > 32) trieCache.delete(trieCache.keys().next().value);
    trieCache.set(key, t);
    return t;
  }

  function resolveOpts(opts) {
    opts = opts || {};
    var loc = parseLocale(opts.locale);
    var fullLoc = opts.locale ? String(opts.locale).toLowerCase().replace('_', '-') : '';
    var langOpt = null;
    if (opts.lang) {
      langOpt = (Array.isArray(opts.lang) ? opts.lang : [opts.lang]).map(function (l) { return String(l).toLowerCase(); });
    } else if (fullLoc && DB.langs && DB.langs[fullLoc]) {
      langOpt = [fullLoc];
    } else if (loc.lang) {
      langOpt = [loc.lang.toLowerCase()];
    }
    return {
      langs: langOpt || [],
      region: opts.region || loc.region || '',
      categories: opts.categories || null,
      minSeverity: opts.minSeverity || 1,
      minConfidence: opts.minConfidence || 0,
      detectors: opts.detectors || ['profanity'],
      types: opts.types || null,
      customWords: (opts.customWords || []).map(function (w) { return String(w).toLowerCase(); }),
      whitelist: new Set((opts.whitelist || []).map(function (w) { return String(w).toLowerCase(); }))
    };
  }

  function validate(text, opts) {
    var original = String(text == null ? '' : text);
    if (!original.trim()) return { isValid: true, needsReview: false, needsHelp: false, maxSeverity: 0, found: [] };
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
      return { word: t.entries[h.idx].word, category: t.entries[h.idx].category, severity: t.entries[h.idx].severity, via: t.entries[h.idx].via, confidence: t.entries[h.idx].confidence, detector: t.entries[h.idx].detector, type: t.entries[h.idx].type, action: t.entries[h.idx].action, index: lo.indexOf(t.entries[h.idx].word) };
    });
    var wantPII = o.detectors.indexOf('pii') >= 0, wantScamRx = o.detectors.indexOf('scam') >= 0;
    if (wantPII || wantScamRx) {
      var stream = deobfuscate(original);
      scanPII(stream, wantPII, wantScamRx, o.types, o.minConfidence).forEach(function (h) {
        found.push({ word: h.word, category: h.detector === 'scam' ? 'scam' : 'pii', severity: 2, via: h.detector, confidence: h.conf, detector: h.detector, type: h.type, action: h.action, index: lo.indexOf(h.word) });
      });
    }
    if (o.region && DB.symbols && (!o.types || o.types.indexOf('symbol') >= 0)) {
      var seenTok = {};
      lo.split(/[^\p{L}\p{N}]+/u).filter(Boolean).forEach(function (tok) {
        var spec = DB.symbols[tok];
        if (!spec || seenTok[tok]) return;
        seenTok[tok] = true;
        if ((spec.regions || []).indexOf(o.region) < 0) return;
        var conf = spec.conf || 0.5;
        if (conf < o.minConfidence) return;
        found.push({ word: tok, category: 'symbol', severity: spec.severity || 1, via: 'symbol', confidence: conf, detector: 'culture', type: 'symbol', action: 'review', index: lo.indexOf(tok) });
      });
    }
    found.sort(function (a, b) { return a.index - b.index; });
    var blocked = found.some(function (f) { return f.action === 'block'; });
    return {
      isValid: !blocked,
      needsReview: found.some(function (f) { return f.action === 'review'; }),
      needsHelp: found.some(function (f) { return f.action === 'help'; }),
      maxSeverity: found.reduce(function (m, f) { return Math.max(m, f.severity); }, 0),
      found: found
    };
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
