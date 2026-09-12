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
  final List<bool> free;
  final _Node root = _Node();
  int maxLen = 0;
  _Engine(this.words, this.categories, this.severities, this.vias, this.confs, List<String> patterns, this.free) {
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

_Engine _getEngine(List<String> langs, String region, List<String>? categories, int minSeverity, double minConfidence, List<String> customWords, Set<String> whitelist) {
  final key = '${_dbLangs().length}|${langs.join(',')}|$region|${categories?.join(',')}|$minSeverity|$minConfidence|${customWords.join(',')}|${whitelist.join(',')}';
  final hit = _cache[key];
  if (hit != null) return hit;
  final words = <String>[];
  final cats = <String>[];
  final sevs = <int>[];
  final vias = <String>[];
  final confs = <double>[];
  final pats = <String>[];
  final free = <bool>[];
  final seen = <String>{};
  void push(String word, String cat, int sev, String via, String? lang, double conf) {
    final w = word.toLowerCase();
    if (w.isEmpty || whitelist.contains(w)) return;
    final pat = entryPattern(w);
    final disp = displayForm(w);
    if (pat.isEmpty || whitelist.contains(pat) || whitelist.contains(disp)) return;
    final sig = '${lang ?? ''}\x00$pat';
    if (!seen.add(sig) || sev < minSeverity || conf < minConfidence) return;
    free.add(!_alnum.hasMatch(pat));
    words.add(disp);
    cats.add(cat);
    sevs.add(sev);
    vias.add(via);
    confs.add(conf);
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
      if (categories != null && !categories.contains(c)) continue;
      push(w, c, _dbSeverity(l, w), 'word', l, _confOfMaturity(_dbMaturity(l)));
    }
  }
  for (final e in kEmojiUniversal) {
    push(e, 'gesture', 2, 'emoji', null, kEmojiConf[e] ?? 0.6);
  }
  kEmojiRegional.forEach((e, regs) {
    if (region.isNotEmpty && regs.contains(region)) push(e, 'gesture', 2, 'emoji', null, kEmojiConf[e] ?? 0.6);
  });
  for (final w in customWords) {
    push(w, 'custom', 2, 'custom', null, 1.0);
  }
  final eng = _Engine(words, cats, sevs, vias, confs, pats, free);
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
  final int index;
  Found(this.word, this.category, this.severity, this.via, this.confidence, this.index);
}

class ValidationResult {
  final bool isValid;
  final int maxSeverity;
  final List<Found> found;
  ValidationResult(this.isValid, this.maxSeverity, this.found);
}

ValidationResult validate(String? text, {List<String>? categories, List<String>? lang, String? locale, String? region, int minSeverity = 1, double minConfidence = 0, List<String> customWords = const [], List<String> whitelist = const []}) {
  final original = text ?? '';
  if (original.trim().isEmpty) return ValidationResult(true, 0, []);
  final loc = parseLocale(locale);
  final fullLoc = (locale ?? '').toLowerCase().replaceAll('_', '-');
  final langs = lang?.map((l) => l.toLowerCase()).toList() ??
      (fullLoc.isNotEmpty && _dbLangs().contains(fullLoc)
          ? [fullLoc]
          : (loc['lang'] != null ? [loc['lang']!.toLowerCase()] : <String>[]));
  final reg = region ?? loc['region'] ?? '';
  final white = whitelist.map((w) => w.toLowerCase()).toSet();
  final eng = _getEngine(langs, reg, categories, minSeverity, minConfidence, customWords.map((w) => w.toLowerCase()).toList(), white);
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
  final found = kept.map((h) => Found(eng.words[h.idx], eng.categories[h.idx], eng.severities[h.idx], eng.vias[h.idx], eng.confs[h.idx], lo.indexOf(eng.words[h.idx]))).toList();
  if (reg.isNotEmpty && kSymbols.isNotEmpty) {
    final seenTok = <String>{};
    for (final tok in lo.split(RegExp(r'[^\p{L}\p{N}]', unicode: true)).where((t) => t.isNotEmpty)) {
      final spec = kSymbols[tok];
      if (spec == null || !seenTok.add(tok)) continue;
      if (!(spec['regions'] as List).contains(reg)) continue;
      final conf = (spec['conf'] as num).toDouble();
      if (conf < minConfidence) continue;
      found.add(Found(tok, 'symbol', (spec['severity'] as num).toInt(), 'symbol', conf, lo.indexOf(tok)));
    }
  }
  found.sort((a, b) => a.index.compareTo(b.index));
  final maxSev = found.map((f) => f.severity).fold(0, (a, b) => a > b ? a : b);
  return ValidationResult(found.isEmpty, maxSev, found);
}

bool containsProhibited(String? text, {List<String>? categories, List<String>? lang, String? locale, String? region, int minSeverity = 1, double minConfidence = 0, List<String> customWords = const [], List<String> whitelist = const []}) =>
    !validate(text, categories: categories, lang: lang, locale: locale, region: region, minSeverity: minSeverity, minConfidence: minConfidence, customWords: customWords, whitelist: whitelist).isValid;

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
