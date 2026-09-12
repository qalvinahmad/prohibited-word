import 'dart:convert';
import 'dart:io';

import 'src/words.g.dart';

// Data v3: 124 bahasa + regional overrides + emoji + severity.
// Mesin: trie + word-boundary + separator-skip; locale; remote update opsional.

const _leet = {'@': 'a', '4': 'a', '8': 'b', '(': 'c', '3': 'e', '1': 'i', '!': 'i', '0': 'o', r'$': 's', '5': 's', '7': 't', '+': 't', 'v': 'u', '#': 'h'};

const _fold = {'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ñ': 'n', 'ç': 'c', 'ý': 'y', 'ÿ': 'y'};

final _alnum = RegExp(r'\p{L}|\p{N}', unicode: true);

bool _isEmoji(int rune) {
  if (rune == 0xFE0F || rune == 0x200D || (rune >= 0x1F3FB && rune <= 0x1F3FF)) return false;
  return (rune >= 0x2600 && rune <= 0x27BF) ||
      (rune >= 0x2B00 && rune <= 0x2BFF) ||
      (rune >= 0x1F000 && rune <= 0x1FAFF);
}

String normalize(String? text) {
  final s = (text ?? '').toLowerCase();
  final buf = StringBuffer();
  for (final r in s.runes) {
    final c = String.fromCharCode(r);
    if (_isEmoji(r)) {
      buf.write(' ');
      buf.write(c);
      buf.write(' ');
    } else {
      buf.write(_leet[c] ?? _fold[c] ?? c);
    }
  }
  return buf.toString().replaceAll(RegExp(r'\s+'), ' ').trim();
}

String entryPattern(String word) {
  return normalize(word).runes.where((r) => _alnum.hasMatch(String.fromCharCode(r)) || _isEmoji(r)).map(String.fromCharCode).join();
}

String displayForm(String word) {
  final runes = normalize(word).runes.toList();
  var i = 0, j = runes.length;
  bool keep(int r) => _alnum.hasMatch(String.fromCharCode(r)) || _isEmoji(r);
  while (i < j && !keep(runes[i])) {
    i++;
  }
  while (j > i && !keep(runes[j - 1])) {
    j--;
  }
  return String.fromCharCodes(runes.sublist(i, j));
}

const _digitWords = {'nol': '0', 'kosong': '0', 'satu': '1', 'dua': '2', 'tiga': '3', 'empat': '4', 'lima': '5', 'enam': '6', 'tujuh': '7', 'delapan': '8', 'sembilan': '9', 'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'oh': '0'};

String deobfuscate(String? text) {
  var s = (text ?? '').toLowerCase();
  s = s.replaceAll(RegExp(r'[{\[(]\s*at\s*[\])}]|\sat\s'), '@');
  s = s.replaceAll(RegExp(r'[{\[(]\s*dots?\s*[\])}]|\sdots?\s|\btitik\b'), '.');
  s = s.replaceAllMapped(RegExp(r'\b(nol|kosong|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|zero|one|two|three|four|five|six|seven|eight|nine|oh)\b'), (m) => _digitWords[m.group(1)]!);
  s = s.replaceAllMapped(RegExp(r'\b[a-z0-9](?: [a-z0-9])+\b'), (m) => m.group(0)!.replaceAll(' ', ''));
  s = s.replaceAllMapped(RegExp(r'\s*([@.])\s*'), (m) => m.group(1)!);
  final runes = s.runes.toList();
  final buf = StringBuffer();
  bool isDig(int r) => r >= 48 && r <= 57;
  bool isSep(int r) => r == 32 || r == 46 || r == 40 || r == 41 || r == 45;
  for (var i = 0; i < runes.length; i++) {
    final r = runes[i];
    if (isSep(r)) {
      var prevDig = false, nextDig = false;
      for (var k = i - 1; k >= 0; k--) {
        if (isSep(runes[k])) continue;
        prevDig = isDig(runes[k]);
        break;
      }
      for (var k = i + 1; k < runes.length; k++) {
        if (isSep(runes[k])) continue;
        nextDig = isDig(runes[k]);
        break;
      }
      if (prevDig && nextDig) continue;
    }
    buf.writeCharCode(r);
  }
  return buf.toString().replaceAll(RegExp(r'\s+'), ' ').trim();
}

const _idProvince = {'11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '31', '32', '33', '34', '35', '36', '51', '52', '53', '61', '62', '63', '64', '65', '71', '72', '73', '74', '75', '76', '81', '82', '91', '92', '94'};

bool _validNIK(String d) {
  if (!_idProvince.contains(d.substring(0, 2))) return false;
  final dd = int.tryParse(d.substring(6, 8)) ?? 0;
  final mm = int.tryParse(d.substring(8, 10)) ?? 0;
  return ((dd >= 1 && dd <= 31) || (dd >= 41 && dd <= 71)) && mm >= 1 && mm <= 12;
}

bool _luhnOk(String d) {
  var sum = 0, dbl = false;
  for (var i = d.length - 1; i >= 0; i--) {
    var n = d.codeUnitAt(i) - 48;
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 == 0;
}

class _PiiRule {
  final String type;
  final RegExp re;
  final double conf;
  final bool scam;
  const _PiiRule(this.type, this.re, this.conf, this.scam);
}

final _piiRules = [
  _PiiRule('email', RegExp(r'[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}'), 0.85, false),
  _PiiRule('phone', RegExp(r'(?:\+?62|0)8\d{7,11}'), 0.85, false),
  _PiiRule('phone', RegExp(r'\+\d{8,15}'), 0.8, false),
  _PiiRule('ssn', RegExp(r'\b\d{3}[- ]\d{2}[- ]\d{4}\b'), 0.7, false),
  _PiiRule('crypto_wallet', RegExp(r'\b(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-f0-9]{40})\b'), 0.85, true),
  _PiiRule('payment_link', RegExp(r'\b(paypal\.me/\S+|(bit\.ly|tinyurl\.com|t\.co|s\.id|gg\.gg|lynk\.id|tiny\.cc|is\.gd|cutt\.ly)/\S+)'), 0.6, true),
  _PiiRule('passport', RegExp(r'\b[a-z]\d{7}\b'), 0.45, false),
];

class _PiiHit {
  final int start, end;
  final String word, type, action, detector;
  final double conf;
  _PiiHit(this.start, this.end, this.word, this.type, this.conf, this.action, this.detector);
}

List<_PiiHit> _scanPII(String stream, bool wantPII, bool wantScam, List<String>? types, double minConf) {
  bool take(String ty) => types == null || types.contains(ty);
  final hits = <_PiiHit>[];
  void pushSpan(int s, int e, String w, String ty, double conf, String action, String det) {
    if (conf < minConf || !take(ty)) return;
    hits.add(_PiiHit(s, e, w, ty, conf, action, det));
  }

  if (wantPII) {
    for (final r in _piiRules.where((r) => !r.scam)) {
      for (final m in r.re.allMatches(stream)) {
        pushSpan(m.start, m.end, m.group(0)!, r.type, r.conf, 'block', 'pii');
      }
    }
    for (final m in RegExp(r'\d{16}').allMatches(stream)) {
      if (_validNIK(m.group(0)!)) pushSpan(m.start, m.end, m.group(0)!, 'nik', 0.9, 'block', 'pii');
    }
    for (final m in RegExp(r'(?:\d[ \-.]*?){13,19}').allMatches(stream)) {
      final d = m.group(0)!.replaceAll(RegExp(r'\D'), '');
      if (d.length < 13 || d.length > 19) continue;
      pushSpan(m.start, m.end, d, 'bank_card', _luhnOk(d) ? 0.95 : 0.4, 'block', 'pii');
    }
    for (final m in RegExp(r'\d{16}').allMatches(stream)) {
      if (!_validNIK(m.group(0)!)) pushSpan(m.start, m.end, m.group(0)!, 'nik', 0.4, 'block', 'pii');
    }
  }
  if (wantScam) {
    for (final r in _piiRules.where((r) => r.scam)) {
      for (final m in r.re.allMatches(stream)) {
        pushSpan(m.start, m.end, m.group(0)!, r.type, r.conf, 'block', 'scam');
      }
    }
  }
  if (wantPII && (types == null || types.contains('bank_account'))) {
    for (final m in RegExp(r'\b\d{10,16}\b').allMatches(stream)) {
      final overlap = hits.any((h) => h.detector == 'pii' && h.start < m.end && m.start < h.end);
      if (!overlap && 0.3 >= minConf) {
        hits.add(_PiiHit(m.start, m.end, m.group(0)!, 'bank_account', 0.3, 'block', 'pii'));
      }
    }
  }
  hits.sort((a, b) => a.start != b.start ? a.start - b.start : b.end - a.end);
  final kept = <_PiiHit>[];
  for (final h in hits) {
    if (kept.isNotEmpty && kept.last.end >= h.end) continue;
    kept.add(h);
  }
  return kept;
}

const _phraseAction = {
  'scam_direct_transfer': 'block', 'scam_urgency': 'review',
  'sensitive_self_harm': 'help', 'sensitive_gambling': 'block',
  'sensitive_grooming': 'review', 'sensitive_offplatform': 'review',
  'sensitive_spam': 'review',
};

Map<String, String> parseLocale(String? locale) {
  if (locale == null || locale.isEmpty) return {};
  final parts = locale.split(RegExp(r'[-_]'));
  final out = <String, String>{};
  if (parts[0].isNotEmpty) out['lang'] = parts[0].toLowerCase();
  if (parts.length > 1 && parts[1].isNotEmpty) out['region'] = parts[1].toUpperCase();
  return out;
}

class _Node {
  final next = <String, _Node>{};
  final out = <int>[];
}

class _Hit {
  final int idx, start, end;
  _Hit(this.idx, this.start, this.end);
}

class _Engine {
  final List<String> words;
  final List<String> categories;
  final List<int> severities;
  final List<String> vias;
  final List<double> confs;
  final List<String> detectors;
  final List<String> types;
  final List<String> actions;
  final List<bool> free;
  final _Node root = _Node();
  int maxLen = 0;
  _Engine(this.words, this.categories, this.severities, this.vias, this.confs, this.detectors, this.types, this.actions, List<String> patterns, this.free) {
    for (var i = 0; i < patterns.length; i++) {
      final p = patterns[i].split('');
      if (p.length > maxLen) maxLen = p.length;
      var node = root;
      for (final ch in p) {
        node = node.next.putIfAbsent(ch, () => _Node());
      }
      node.out.add(i);
    }
  }
}

Map<String, dynamic>? _remoteDb;

void loadDataset(Map<String, dynamic> db) {
  _remoteDb = db;
  _cache.clear();
}

List<String> _dbLangs() => _remoteDb != null
    ? (_remoteDb!['langs'] as Map).keys.cast<String>().toList()
    : kWordsByLang.keys.toList();

List<String> _dbLangWords(String lang) {
  if (_remoteDb != null) {
    final spec = (_remoteDb!['langs'] as Map)[lang];
    if (spec == null) return [];
    return (spec['words'] as List).map((e) => (e as Map)['w'].toString()).toList();
  }
  return kWordsByLang[lang] ?? [];
}

String _dbCategory(String lang, String word) {
  if (_remoteDb != null) {
    final spec = (_remoteDb!['langs'] as Map)[lang];
    for (final e in (spec['words'] as List)) {
      if ((e as Map)['w'] == word) return (e['c'] as String?) ?? 'profanity';
    }
    return 'profanity';
  }
  return kCategoryOverride['$lang\x00$word'] ?? 'profanity';
}

int _dbSeverity(String lang, String word) {
  if (_remoteDb != null) {
    final spec = (_remoteDb!['langs'] as Map)[lang];
    for (final e in (spec['words'] as List)) {
      if ((e as Map)['w'] == word) return ((e as Map)['s'] as int?) ?? 2;
    }
    return 2;
  }
  return kSeverityOverride['$lang\x00$word'] ?? 2;
}

String _dbMaturity(String lang) {
  if (_remoteDb != null) {
    return ((_remoteDb!['langs'] as Map)[lang]?['maturity'] as String?) ?? '';
  }
  return kLangMaturity[lang] ?? '';
}

double _confOfMaturity(String m) => kMaturityConf[m] ?? 0.5;

final _cache = <String, _Engine>{};

_Engine _getEngine(List<String> langs, String region, List<String>? categories, int minSeverity, double minConfidence, List<String> detectors, List<String>? types, List<String> customWords, Set<String> whitelist) {
  final key = '${_dbLangs().length}|${langs.join(',')}|$region|${categories?.join(',')}|$minSeverity|$minConfidence|${detectors.join(',')}|${types?.join(',')}|${customWords.join(',')}|${whitelist.join(',')}';
  final hit = _cache[key];
  if (hit != null) return hit;
  final wantProf = detectors.contains('profanity');
  final wantSens = detectors.contains('sensitive');
  bool takeType(String ty) => types == null || types.contains(ty);
  final words = <String>[];
  final cats = <String>[];
  final sevs = <int>[];
  final vias = <String>[];
  final confs = <double>[];
  final dets = <String>[];
  final typs = <String>[];
  final acts = <String>[];
  final pats = <String>[];
  final free = <bool>[];
  final seen = <String>{};
  void push(String word, String cat, int sev, String via, String? lang, double conf, String det, String typ, String act) {
    final w = word.toLowerCase();
    if (w.isEmpty || whitelist.contains(w)) return;
    final pat = entryPattern(w);
    final disp = displayForm(w);
    if (pat.isEmpty || whitelist.contains(pat) || whitelist.contains(disp)) return;
    final sig = '$det\x00${lang ?? ''}\x00$pat';
    if (!seen.add(sig) || sev < minSeverity || conf < minConfidence || !takeType(typ)) return;
    free.add(!_alnum.hasMatch(pat));
    words.add(disp);
    cats.add(cat);
    sevs.add(sev);
    vias.add(via);
    confs.add(conf);
    dets.add(det);
    typs.add(typ);
    acts.add(act);
    pats.add(pat);
  }

  final removes = _remoteDb != null
      ? <String>{}
      : (kRegionRemove[region] ?? []).toSet();
  final activeLangs = <String>{};
  if (langs.isNotEmpty) {
    for (final t in langs) {
      final tLow = t.toLowerCase();
      activeLangs.add(tLow);
      final p = _remoteDb != null
          ? (_remoteDb!['langs']?[tLow]?['parent'] as String?)
          : kLangParents[tLow];
      if (p != null && p.isNotEmpty) activeLangs.add(p.toLowerCase());
    }
  }
  for (final l in _dbLangs()) {
    if (activeLangs.isNotEmpty) {
      final lLow = l.toLowerCase();
      final base = lLow.split('-')[0];
      if (!activeLangs.contains(lLow) && !activeLangs.contains(base)) continue;
    }
    for (final w in _dbLangWords(l)) {
      if (_remoteDb == null && removes.contains('$l\x00$w')) continue;
      final c = _dbCategory(l, w);
      final sev = _dbSeverity(l, w);
      final conf = _confOfMaturity(_dbMaturity(l));
      final isHate = c == 'sara' || sev >= 3;
      if (isHate && wantSens) {
        push(w, c, sev, 'hate-word', l, conf, 'sensitive', 'hate', 'review');
      } else if (!isHate && wantProf) {
        if (categories != null && !categories.contains(c)) continue;
        push(w, c, sev, 'word', l, conf, 'profanity', 'profanity', 'block');
      } else if (isHate && wantProf && !wantSens) {
        if (categories != null && !categories.contains(c)) continue;
        push(w, c, sev, 'word', l, conf, 'profanity', 'profanity', 'block');
      }
    }
  }
  void pushPhrases(String key, List<Map<String, Object>> items) {
    final det = key.startsWith('scam_') ? 'scam' : 'sensitive';
    if (!detectors.contains(det)) return;
    final typ = key.split('_').sublist(1).join('_');
    final act = _phraseAction[key] ?? 'review';
    for (final p in items) {
      final pl = (p['lang'] as String?) ?? '';
      if (activeLangs.isNotEmpty && !activeLangs.contains(pl)) continue;
      push((p['t'] as String?) ?? '', 'phrase', 2, 'phrase', pl, ((p['conf'] as num?) ?? 0.5).toDouble(), det, typ, act);
    }
  }

  if (_remoteDb != null) {
    ((_remoteDb!['phrases'] as Map?) ?? {}).forEach((key, items) {
      final det = (key as String).startsWith('scam_') ? 'scam' : 'sensitive';
      if (!detectors.contains(det)) return;
      final typ = (key as String).split('_').sublist(1).join('_');
      for (final p in (items as List)) {
        final m = p as Map;
        final pl = (m['lang'] as String?) ?? '';
        if (activeLangs.isNotEmpty && !activeLangs.contains(pl)) continue;
        push((m['t'] as String?) ?? '', 'phrase', 2, 'phrase', pl,
            ((m['conf'] as num?) ?? 0.5).toDouble(), det, typ, (m['action'] as String?) ?? 'review');
      }
    });
  } else {
    kPhrases.forEach(pushPhrases);
  }
  for (final e in kEmojiUniversal) {
    push(e, 'gesture', 2, 'emoji', null, kEmojiConf[e] ?? 0.6, 'profanity', 'profanity', 'block');
  }
  kEmojiRegional.forEach((e, regs) {
    if (region.isNotEmpty && regs.contains(region)) push(e, 'gesture', 2, 'emoji', null, kEmojiConf[e] ?? 0.6, 'profanity', 'profanity', 'block');
  });
  for (final w in customWords) {
    push(w, 'custom', 2, 'custom', null, 1.0, 'profanity', 'profanity', 'block');
  }
  final eng = _Engine(words, cats, sevs, vias, confs, dets, typs, acts, pats, free);
  if (_cache.length > 32) _cache.remove(_cache.keys.first);
  _cache[key] = eng;
  return eng;
}

class Found {
  final String word;
  final String category;
  final int severity;
  final String via;
  final double confidence;
  final String detector;
  final String type;
  final String action;
  final int index;
  Found(this.word, this.category, this.severity, this.via, this.confidence, this.detector, this.type, this.action, this.index);
}

class ValidationResult {
  final bool isValid;
  final bool needsReview;
  final bool needsHelp;
  final int maxSeverity;
  final List<Found> found;
  ValidationResult(this.isValid, this.needsReview, this.needsHelp, this.maxSeverity, this.found);
}

ValidationResult validate(String? text, {List<String>? categories, List<String>? lang, String? locale, String? region, int minSeverity = 1, double minConfidence = 0, List<String>? detectors, List<String>? types, List<String> customWords = const [], List<String> whitelist = const []}) {
  final original = text ?? '';
  if (original.trim().isEmpty) return ValidationResult(true, false, false, 0, []);
  final dets = detectors ?? ['profanity'];
  final loc = parseLocale(locale);
  final fullLoc = (locale ?? '').toLowerCase().replaceAll('_', '-');
  final langs = lang?.map((l) => l.toLowerCase()).toList() ??
      (fullLoc.isNotEmpty && _dbLangs().contains(fullLoc)
          ? [fullLoc]
          : (loc['lang'] != null ? [loc['lang']!.toLowerCase()] : <String>[]));
  final reg = region ?? loc['region'] ?? '';
  final white = whitelist.map((w) => w.toLowerCase()).toSet();
  final eng = _getEngine(langs, reg, categories, minSeverity, minConfidence, dets, types, customWords.map((w) => w.toLowerCase()).toList(), white);
  final runes = normalize(original).split('');
  final alnum = runes.map((c) => _alnum.hasMatch(c)).toList();
  final free = eng.free;
  final hits = <_Hit>[];
  for (var i = 0; i < runes.length; i++) {
    final startOk = i == 0 || !alnum[i - 1];
    _Node? node = eng.root;
    for (var j = i; j < runes.length && j < i + eng.maxLen + 10; j++) {
      if (alnum[j]) {
        node = node?.next[runes[j]];
        if (node == null) break;
        if (node.out.isNotEmpty && startOk && (j + 1 >= runes.length || !alnum[j + 1])) {
          for (final idx in node.out) {
            hits.add(_Hit(idx, i, j + 1));
          }
        }
      } else {
        final child = node?.next[runes[j]];
        if (child == null) continue;
        node = child;
        if (node.out.isNotEmpty) {
          for (final idx in node.out) {
            if (free[idx] || (startOk && (j + 1 >= runes.length || !alnum[j + 1]))) {
              hits.add(_Hit(idx, i, j + 1));
            }
          }
        }
      }
    }
  }
  hits.sort((a, b) => a.start != b.start ? a.start - b.start : (b.end != a.end ? b.end - a.end : a.idx - b.idx));
  final kept = <_Hit>[];
  for (final h in hits) {
    if (kept.isNotEmpty && kept.last.end >= h.end) continue;
    kept.add(h);
  }
  final lo = original.toLowerCase();
  final found = kept.map((h) => Found(eng.words[h.idx], eng.categories[h.idx], eng.severities[h.idx], eng.vias[h.idx], eng.confs[h.idx], eng.detectors[h.idx], eng.types[h.idx], eng.actions[h.idx], lo.indexOf(eng.words[h.idx]))).toList();
  if (dets.contains('pii') || dets.contains('scam')) {
    final stream = deobfuscate(original);
    for (final h in _scanPII(stream, dets.contains('pii'), dets.contains('scam'), types, minConfidence)) {
      found.add(Found(h.word, h.detector == 'scam' ? 'scam' : 'pii', 2, h.detector, h.conf, h.detector, h.type, h.action, lo.indexOf(h.word)));
    }
  }
  if (reg.isNotEmpty && kSymbols.isNotEmpty && (types == null || types.contains('symbol'))) {
    final seenTok = <String>{};
    for (final tok in lo.split(RegExp(r'[^\p{L}\p{N}]', unicode: true)).where((t) => t.isNotEmpty)) {
      final spec = kSymbols[tok];
      if (spec == null || !seenTok.add(tok)) continue;
      if (!(spec['regions'] as List).contains(reg)) continue;
      final conf = (spec['conf'] as num).toDouble();
      if (conf < minConfidence) continue;
      found.add(Found(tok, 'symbol', (spec['severity'] as num).toInt(), 'symbol', conf, 'culture', 'symbol', 'review', lo.indexOf(tok)));
    }
  }
  found.sort((a, b) => a.index.compareTo(b.index));
  final maxSev = found.map((f) => f.severity).fold(0, (a, b) => a > b ? a : b);
  final blocked = found.any((f) => f.action == 'block');
  return ValidationResult(!blocked, found.any((f) => f.action == 'review'), found.any((f) => f.action == 'help'), maxSev, found);
}

bool containsProhibited(String? text, {List<String>? categories, List<String>? lang, String? locale, String? region, int minSeverity = 1, double minConfidence = 0, List<String>? detectors, List<String>? types, List<String> customWords = const [], List<String> whitelist = const []}) =>
    !validate(text, categories: categories, lang: lang, locale: locale, region: region, minSeverity: minSeverity, minConfidence: minConfidence, detectors: detectors, types: types, customWords: customWords, whitelist: whitelist).isValid;

// Remote update (offline-first; panggil eksplisit bila perlu).
Future<Map<String, dynamic>> fetchDataset(String url) async {
  final client = HttpClient();
  try {
    final req = await client.getUrl(Uri.parse(url));
    final res = await req.close();
    if (res.statusCode != 200) throw HttpException('fetch dataset gagal: ${res.statusCode}');
    return jsonDecode(await res.transform(utf8.decoder).join()) as Map<String, dynamic>;
  } finally {
    client.close();
  }
}

Future<Map<String, dynamic>> checkForUpdates(String url) async {
  final remote = await fetchDataset(url);
  final remoteLangs = (remote['langs'] as Map).keys.length;
  return {
    'current': {'version': 4, 'langs': kWordsByLang.length},
    'remote': {'version': remote['version'], 'langs': remoteLangs},
    'updateAvailable': (remote['version'] as int? ?? 0) > 4,
    'remoteDb': remote,
  };
}
