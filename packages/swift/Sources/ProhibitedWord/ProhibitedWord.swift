import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

// Data v3: 124 bahasa + regional overrides + emoji + severity.
// Mesin: trie + word-boundary + separator-skip; locale; remote update opsional.

public struct FoundWord: Sendable { public let word: String; public let category: String; public let severity: Int; public let via: String; public let confidence: Double; public let detector: String; public let type: String; public let action: String; public let index: Int }
public struct ValidationResult: Sendable { public let isValid: Bool; public let needsReview: Bool; public let needsHelp: Bool; public let maxSeverity: Int; public let found: [FoundWord] }

private struct WordEntry: Decodable { let w: String; let s: Int?; let c: String?; let conf: Double? }
private struct LangSpec: Decodable { let name: String?; let parent: String?; let maturity: String?; let source: String?; let words: [WordEntry] }
private struct RegionEntry: Decodable { let w: String; let lang: String; let s: Int?; let c: String?; let conf: Double? }
private struct RegionSpec: Decodable { let note: String?; let source: String?; let add: [RegionEntry]?; let remove: [RegionEntry]? }
private struct EmojiSpec: Decodable { let offensiveIn: [String]?; let severity: Int?; let conf: Double?; let note: String?; let source: String? }
private struct SymbolSpec: Decodable { let regions: [String]?; let severity: Int?; let conf: Double?; let note: String?; let source: String? }
private struct PhraseEntry: Decodable { let t: String; let lang: String; let conf: Double?; let src: String?; let detector: String; let type: String; let action: String }
private struct DB: Decodable { let version: Int?; let langs: [String: LangSpec]; let regions: [String: RegionSpec]?; let emoji: [String: EmojiSpec]?; let symbols: [String: SymbolSpec]?; let phrases: [String: [PhraseEntry]]? }

private let leet: [Character: Character] = ["@": "a", "4": "a", "8": "b", "(": "c", "3": "e", "1": "i", "!": "i", "0": "o", "$": "s", "5": "s", "7": "t", "+": "t", "v": "u", "#": "h"]

private func isEmojiScalar(_ s: Unicode.Scalar) -> Bool {
  if s.value == 0xFE0F || s == "\u{200D}" || (s.value >= 0x1F3FB && s.value <= 0x1F3FF) { return false }
  return s.properties.isEmojiPresentation
}

private func isEmojiChar(_ c: Character) -> Bool { c.unicodeScalars.contains(where: isEmojiScalar) }

public func normalize(_ text: String?) -> String {
  var s = (text ?? "").lowercased().decomposedStringWithCompatibilityMapping
  s = String(s.unicodeScalars.filter { !($0.value >= 0x300 && $0.value <= 0x36F) })
  var out = ""
  out.reserveCapacity(s.count + 8)
  for ch in s {
    if ch.unicodeScalars.count == 1, let sc = ch.unicodeScalars.first, isEmojiScalar(sc) {
      out += " \(ch) "
    } else {
      out.append(leet[ch] ?? ch)
    }
  }
  return out.split(separator: " ").joined(separator: " ")
}

public func emojiKey(_ e: String) -> String {
  String(e.unicodeScalars.filter { !($0.value == 0xFE0F || $0.value == 0x200D || ($0.value >= 0x1F3FB && $0.value <= 0x1F3FF)) })
}

public func entryPattern(_ word: String) -> String {
  String(normalize(word).filter { $0.isLetter || $0.isNumber || isEmojiChar($0) })
}

public func displayForm(_ word: String) -> String {
  let n = normalize(word)
  let start = n.firstIndex(where: { $0.isLetter || $0.isNumber || isEmojiChar($0) }) ?? n.endIndex
  let end = n.lastIndex(where: { $0.isLetter || $0.isNumber || isEmojiChar($0) }).map { n.index(after: $0) } ?? n.endIndex
  return start <= end ? String(n[start..<end]) : ""
}

public func parseLocale(_ locale: String?) -> (lang: String?, region: String?) {
  guard let locale, !locale.isEmpty else { return (nil, nil) }
  let parts = locale.split(whereSeparator: { $0 == "-" || $0 == "_" }).map(String.init)
  let lang = parts.first.map { $0.lowercased() }
  let region = parts.count > 1 ? parts[1].uppercased() : nil
  return (lang, region)
}

private func isAlnum(_ c: Character) -> Bool { c.isLetter || c.isNumber }

// MARK: - v5 detector layer (PII / scam regex + deobfuscation)

private let digitWords: [String: String] = [
  "nol": "0", "kosong": "0", "satu": "1", "dua": "2", "tiga": "3", "empat": "4",
  "lima": "5", "enam": "6", "tujuh": "7", "delapan": "8", "sembilan": "9",
  "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
  "six": "6", "seven": "7", "eight": "8", "nine": "9", "oh": "0",
]

public func deobfuscate(_ text: String?) -> String {
  var s = (text ?? "").lowercased()
  s = s.replacingOccurrences(of: #"[{\[(]\s*at\s*[\])}]|\sat\s"#, with: "@", options: .regularExpression)
  s = s.replacingOccurrences(of: #"[{\[(]\s*dots?\s*[\])}]|\sdots?\s|\btitik\b"#, with: ".", options: .regularExpression)
  for (w, d) in digitWords {
    s = s.replacingOccurrences(of: "\\b\(w)\\b", with: d, options: .regularExpression)
  }
  // Gabung token 1-huruf berderet ('j o h n' -> 'john', '0 8 1 2' -> '0812').
  let toks = s.split(separator: " ", omittingEmptySubsequences: false).map(String.init)
  var merged: [String] = []
  var ti = toks.startIndex
  func isWC(_ t: String) -> Bool { t.count == 1 && (t.first!.isLetter || t.first!.isNumber) }
  while ti < toks.endIndex {
    if isWC(toks[ti]) {
      var run = toks[ti]
      var tj = toks.index(after: ti)
      while tj < toks.endIndex && isWC(toks[tj]) { run += toks[tj]; tj = toks.index(after: tj) }
      if tj > toks.index(after: ti) { merged.append(run); ti = tj; continue }
    }
    merged.append(toks[ti]); ti = toks.index(after: ti)
  }
  s = merged.joined(separator: " ")
  s = s.replacingOccurrences(of: #"\s*([@.])\s*"#, with: "$1", options: .regularExpression)
  // Hapus separator di antara digit (tanpa lookbehind agar portabel).
  var out = ""
  let rs = Array(s)
  func isDig(_ c: Character) -> Bool { c >= "0" && c <= "9" }
  func isSep(_ c: Character) -> Bool { c == " " || c == "." || c == "(" || c == ")" || c == "-" }
  for i in rs.indices {
    let r = rs[i]
    if isSep(r) {
      var pd = false, nd = false
      var k = i - 1
      while k >= 0 { if isSep(rs[k]) { k -= 1; continue }; pd = isDig(rs[k]); break }
      k = i + 1
      while k < rs.count { if isSep(rs[k]) { k += 1; continue }; nd = isDig(rs[k]); break }
      if pd && nd { continue }
    }
    out.append(r)
  }
  return out.split(separator: " ").joined(separator: " ")
}

private let idProvinces: Set<String> = ["11","12","13","14","15","16","17","18","19","21","31","32","33","34","35","36","51","52","53","61","62","63","64","65","71","72","73","74","75","76","81","82","91","92","94"]

private func validNIK(_ d: String) -> Bool {
  guard idProvinces.contains(String(d.prefix(2))) else { return false }
  let dd = Int(d.dropFirst(6).prefix(2)) ?? 0
  let mm = Int(d.dropFirst(8).prefix(2)) ?? 0
  return ((dd >= 1 && dd <= 31) || (dd >= 41 && dd <= 71)) && mm >= 1 && mm <= 12
}

private func luhnOk(_ d: String) -> Bool {
  var sum = 0, dbl = false
  for ch in d.reversed() {
    var n = ch.wholeNumberValue ?? 0
    if dbl { n *= 2; if n > 9 { n -= 9 } }
    sum += n; dbl = !dbl
  }
  return sum % 10 == 0
}

private struct PiiRule { let type: String; let pattern: String; let conf: Double; let scam: Bool }
private let piiRules: [PiiRule] = [
  PiiRule(type: "email", pattern: #"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}"#, conf: 0.85, scam: false),
  PiiRule(type: "phone", pattern: #"(?:\+?62|0)8\d{7,11}"#, conf: 0.85, scam: false),
  PiiRule(type: "phone", pattern: #"\+\d{8,15}"#, conf: 0.8, scam: false),
  PiiRule(type: "ssn", pattern: #"\b\d{3}[- ]\d{2}[- ]\d{4}\b"#, conf: 0.7, scam: false),
  PiiRule(type: "crypto_wallet", pattern: #"\b(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-f0-9]{40})\b"#, conf: 0.85, scam: true),
  PiiRule(type: "payment_link", pattern: #"\b(paypal\.me/\S+|(bit\.ly|tinyurl\.com|t\.co|s\.id|gg\.gg|lynk\.id|tiny\.cc|is\.gd|cutt\.ly)/\S+)"#, conf: 0.6, scam: true),
  PiiRule(type: "passport", pattern: #"\b[a-z]\d{7}\b"#, conf: 0.45, scam: false),
]

private struct PiiHit { let start: Int; let end: Int; let word: String; let type: String; let conf: Double; let action: String; let detector: String }

private func rxMatches(_ pattern: String, _ s: String) -> [(Int, Int, String)] {
  guard let re = try? NSRegularExpression(pattern: pattern) else { return [] }
  let ns = s as NSString
  return re.matches(in: s, range: NSRange(location: 0, length: ns.length)).map {
    ($0.range.location, $0.range.location + $0.range.length, ns.substring(with: $0.range))
  }
}

private func scanPII(_ stream: String, wantPII: Bool, wantScam: Bool, types: [String]?, minConf: Double) -> [PiiHit] {
  func take(_ ty: String) -> Bool { types == nil || types!.contains(ty) }
  var hits: [PiiHit] = []
  func pushSpan(_ s: Int, _ e: Int, _ w: String, _ ty: String, _ conf: Double, _ act: String, _ det: String) {
    if conf < minConf || !take(ty) { return }
    hits.append(PiiHit(start: s, end: e, word: w, type: ty, conf: conf, action: act, detector: det))
  }
  if wantPII {
    for r in piiRules where !r.scam {
      for (s, e, w) in rxMatches(r.pattern, stream) { pushSpan(s, e, w, r.type, r.conf, "block", "pii") }
    }
    for (s, e, w) in rxMatches(#"\d{16}"#, stream) where validNIK(w) {
      pushSpan(s, e, w, "nik", 0.9, "block", "pii")
    }
    for (s, e, w) in rxMatches(#"(?:\d[ \-.]*?){13,19}"#, stream) {
      let d = w.filter { $0.isNumber }
      if d.count < 13 || d.count > 19 { continue }
      pushSpan(s, e, d, "bank_card", luhnOk(d) ? 0.95 : 0.4, "block", "pii")
    }
    for (s, e, w) in rxMatches(#"\d{16}"#, stream) where !validNIK(w) {
      pushSpan(s, e, w, "nik", 0.4, "block", "pii")
    }
  }
  if wantScam {
    for r in piiRules where r.scam {
      for (s, e, w) in rxMatches(r.pattern, stream) { pushSpan(s, e, w, r.type, r.conf, "block", "scam") }
    }
  }
  if wantPII && (types == nil || types!.contains("bank_account")) {
    for (s, e, w) in rxMatches(#"\b\d{10,16}\b"#, stream) {
      if hits.contains(where: { $0.detector == "pii" && $0.start < e && s < $0.end }) { continue }
      if 0.3 >= minConf { hits.append(PiiHit(start: s, end: e, word: w, type: "bank_account", conf: 0.3, action: "block", detector: "pii")) }
    }
  }
  hits.sort { a, b in a.start != b.start ? a.start < b.start : a.end > b.end }
  var kept: [PiiHit] = []
  for h in hits { if let last = kept.last, last.end >= h.end { continue }; kept.append(h) }
  return kept
}
private final class Node { var next: [Character: Node] = [:]; var out: [Int] = [] }
private struct Hit { let idx: Int; let start: Int; let end: Int }

private struct Entry: Sendable { let word: String; let category: String; let severity: Int; let via: String; let confidence: Double; let detector: String; let type: String; let action: String }

private let maturityConf: [String: Double] = ["curated": 0.7, "regional": 0.6, "starter": 0.4, "verified": 0.95]
private func confOfMaturity(_ m: String?) -> Double { maturityConf[m ?? ""] ?? 0.5 }

private final class Engine: @unchecked Sendable {
  let entries: [Entry]; let free: [Bool]
  let root = Node(); var maxLen = 0
  init(entries: [Entry], free: [Bool], patterns: [String]) {
    self.entries = entries; self.free = free
    for (i, p) in patterns.enumerated() {
      let a = Array(p); maxLen = max(maxLen, a.count)
      var node = root
      for ch in a { if node.next[ch] == nil { node.next[ch] = Node() }; node = node.next[ch]! }
      node.out.append(i)
    }
  }
}

private var wordDB: DB = {
  guard let url = Bundle.module.url(forResource: "words", withExtension: "json"),
        let data = try? Data(contentsOf: url),
        let db = try? JSONDecoder().decode(DB.self, from: data) else {
    return DB(version: 0, langs: [:], regions: nil, emoji: nil, symbols: nil, phrases: nil)
  }
  return db
}()

private var dictID: String = "\(wordDB.version ?? 0):\(wordDB.langs.count)"
private var cache: [String: Engine] = [:]
private let cacheLock = NSLock()

/// Ganti dataset aktif (mis. hasil fetchDataset) dan bersihkan cache.
public func loadDataset(_ dbData: [String: Any]) {
  guard let data = try? JSONSerialization.data(withJSONObject: dbData),
        let db = try? JSONDecoder().decode(DB.self, from: data) else { return }
  cacheLock.lock()
  wordDB = db
  dictID = "\(db.version ?? 0):\(db.langs.count)"
  cache.removeAll()
  cacheLock.unlock()
}


private func getEngine(langs: [String], region: String, categories: [String]?, minSeverity: Int, minConfidence: Double, detectors: [String], types: [String]?, customWords: [String], whitelist: Set<String>) -> Engine {
  let key = "\(dictID)|\(langs.joined(separator: ","))|\(region)|\(categories?.joined(separator: ",") ?? "")|\(minSeverity)|\(minConfidence)|\(detectors.joined(separator: ","))|\(types?.joined(separator: ",") ?? "")|\(customWords.joined(separator: ","))|\(whitelist.sorted().joined(separator: ","))"
  cacheLock.lock()
  if let hit = cache[key] { cacheLock.unlock(); return hit }
  cacheLock.unlock()
  var entries: [Entry] = []; var free: [Bool] = []; var patterns: [String] = []; var seen = Set<String>()
  let wantProf = detectors.contains("profanity")
  let wantSens = detectors.contains("sensitive")
  func takeType(_ ty: String) -> Bool { types == nil || types!.contains(ty) }
  func push(_ word: String, _ cat: String, _ sev: Int, _ via: String, _ lang: String?, _ conf: Double, _ det: String, _ typ: String, _ act: String) {
    let w = word.lowercased()
    if w.isEmpty || whitelist.contains(w) { return }
    let pat = entryPattern(w)
    let disp = displayForm(w)
    if pat.isEmpty || whitelist.contains(pat) || whitelist.contains(disp) { return }
    let sig = "\(det)\u{0}\(lang ?? "")\u{0}\(pat)"
    if seen.contains(sig) || sev < minSeverity || conf < minConfidence || !takeType(typ) { return }
    seen.insert(sig)
    free.append(!pat.contains(where: { $0.isLetter || $0.isNumber }))
    entries.append(Entry(word: disp, category: cat, severity: sev, via: via, confidence: conf, detector: det, type: typ, action: act))
    patterns.append(pat)
  }
  var remove = Set<String>()
  if let rs = wordDB.regions?[region], let rem = rs.remove {
    for r in rem { remove.insert("\(r.w.lowercased())\u{0}\(r.lang)") }
  }
  var activeLangs = Set<String>()
  if !langs.isEmpty {
    for t in langs {
      let tLow = t.lowercased()
      activeLangs.insert(tLow)
      if let p = wordDB.langs[tLow]?.parent {
        activeLangs.insert(p.lowercased())
      }
    }
  }
  for (lang, spec) in wordDB.langs {
    if !activeLangs.isEmpty {
      let langLow = lang.lowercased()
      let base = String(langLow.split(separator: "-").first ?? "")
      if !activeLangs.contains(langLow) && !activeLangs.contains(base) { continue }
    }
    for e in spec.words {
      let cat = e.c ?? "profanity"
      let sev = e.s ?? 2
      let conf = e.conf ?? confOfMaturity(spec.maturity)
      if remove.contains("\(e.w.lowercased())\u{0}\(lang)") { continue }
      let isHate = cat == "sara" || sev >= 3
      if isHate && wantSens {
        push(e.w, cat, sev, "hate-word", lang, conf, "sensitive", "hate", "review")
      } else if !isHate && wantProf {
        if let categories, !categories.contains(cat) { continue }
        push(e.w, cat, sev, "word", lang, conf, "profanity", "profanity", "block")
      } else if isHate && wantProf && !wantSens {
        if let categories, !categories.contains(cat) { continue }
        push(e.w, cat, sev, "word", lang, conf, "profanity", "profanity", "block")
      }
    }
  }
  if let phrases = wordDB.phrases {
    for (key, items) in phrases {
      let det = key.hasPrefix("scam_") ? "scam" : "sensitive"
      if !detectors.contains(det) { continue }
      let typ = key.split(separator: "_").dropFirst().joined(separator: "_")
      for p in items {
        if !activeLangs.isEmpty && !activeLangs.contains(p.lang) { continue }
        push(p.t, "phrase", 2, "phrase", p.lang, p.conf ?? 0.5, det, typ, p.action.isEmpty ? "review" : p.action)
      }
    }
  }
  if let rs = wordDB.regions?[region], let adds = rs.add {
    for e in adds {
      if !langs.isEmpty && !langs.contains(e.lang) { continue }
      let cat = e.c ?? "profanity"
      if let categories, !categories.contains(cat) { continue }
      push(e.w, cat, e.s ?? 2, "regional", e.lang, e.conf ?? 0.6, "profanity", "profanity", "block")
    }
  }
  if let emoji = wordDB.emoji {
    for (raw, spec) in emoji {
      let off = spec.offensiveIn ?? []
      if !off.contains("*") && (region.isEmpty || !off.contains(region)) { continue }
      push(emojiKey(raw), "gesture", spec.severity ?? 2, "emoji", nil, spec.conf ?? 0.6, "profanity", "profanity", "block")
    }
  }
  for w in customWords { push(w, "custom", 2, "custom", nil, 1.0, "profanity", "profanity", "block") }
  let eng = Engine(entries: entries, free: free, patterns: patterns)
  cacheLock.lock(); if cache.count > 32 { cache.removeValue(forKey: cache.keys.first!) }; cache[key] = eng; cacheLock.unlock()
  return eng
}

public func validate(_ text: String?, categories: [String]? = nil, lang: [String]? = nil, locale: String? = nil, region: String? = nil, minSeverity: Int = 1, minConfidence: Double = 0, detectors: [String]? = nil, types: [String]? = nil, customWords: [String] = [], whitelist: [String] = []) -> ValidationResult {
  let original = text ?? ""
  if original.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return ValidationResult(isValid: true, needsReview: false, needsHelp: false, maxSeverity: 0, found: []) }
  let dets = detectors ?? ["profanity"]
  let loc = parseLocale(locale)
  let fullLoc = (locale ?? "").lowercased().replacingOccurrences(of: "_", with: "-")
  let langs: [String]
  if let lang = lang {
    langs = lang.map { $0.lowercased() }
  } else if !fullLoc.isEmpty && wordDB.langs[fullLoc] != nil {
    langs = [fullLoc]
  } else if let l = loc.lang {
    langs = [l]
  } else {
    langs = []
  }
  let reg = region ?? loc.region ?? ""
  let white = Set(whitelist.map { $0.lowercased() })
  let eng = getEngine(langs: langs, region: reg, categories: categories, minSeverity: minSeverity, minConfidence: minConfidence, detectors: dets, types: types, customWords: customWords.map { $0.lowercased() }, whitelist: white)
  let runes = Array(normalize(original))
  let alnum = runes.map(isAlnum)
  var hits: [Hit] = []
  for i in runes.indices {
    let startOK = i == 0 || !alnum[i - 1]
    var node: Node? = eng.root
    for j in i..<min(runes.count, i + eng.maxLen + 10) {
      if alnum[j] {
        node = node?.next[runes[j]]
        if node == nil { break }
        if !(node!.out.isEmpty) && startOK && (j + 1 >= runes.count || !alnum[j + 1]) {
          for idx in node!.out { hits.append(Hit(idx: idx, start: i, end: j + 1)) }
        }
      } else {
        if let child = node?.next[runes[j]] {
          node = child
          if !(node!.out.isEmpty) {
            for idx in node!.out {
              if eng.free[idx] || (startOK && (j + 1 >= runes.count || !alnum[j + 1])) {
                hits.append(Hit(idx: idx, start: i, end: j + 1))
              }
            }
          }
        }
        // Tanpa child: skip separator, node tetap (mendukung evasion).
      }
    }
  }
  hits.sort { a, b in a.start != b.start ? a.start < b.start : (a.end != b.end ? a.end > b.end : a.idx < b.idx) }
  var kept: [Hit] = []
  for h in hits { if let last = kept.last, last.end >= h.end { continue }; kept.append(h) }
  let lo = original.lowercased() as NSString
  var found = kept.map { h -> FoundWord in
    let w = eng.entries[h.idx].word
    let r = lo.range(of: w)
    return FoundWord(word: w, category: eng.entries[h.idx].category, severity: eng.entries[h.idx].severity, via: eng.entries[h.idx].via, confidence: eng.entries[h.idx].confidence, detector: eng.entries[h.idx].detector, type: eng.entries[h.idx].type, action: eng.entries[h.idx].action, index: r.location == NSNotFound ? -1 : r.location)
  }
  if dets.contains("pii") || dets.contains("scam") {
    let stream = deobfuscate(original)
    for h in scanPII(stream, wantPII: dets.contains("pii"), wantScam: dets.contains("scam"), types: types, minConf: minConfidence) {
      let r = lo.range(of: h.word)
      found.append(FoundWord(word: h.word, category: h.detector == "scam" ? "scam" : "pii", severity: 2, via: h.detector, confidence: h.conf, detector: h.detector, type: h.type, action: h.action, index: r.location == NSNotFound ? -1 : r.location))
    }
  }
  // Simbol standalone (pra-leet): token utuh saja, bukan substring.
  if !reg.isEmpty, let syms = wordDB.symbols, (types == nil || types!.contains("symbol")) {
    let tokens = lo.lowercased.split(whereSeparator: { !$0.isLetter && !$0.isNumber }).map(String.init)
    var seenTok = Set<String>()
    for tok in tokens {
      guard let spec = syms[tok], seenTok.insert(tok).inserted else { continue }
      guard (spec.regions ?? []).contains(reg) else { continue }
      let conf = spec.conf ?? 0.5
      guard conf >= minConfidence else { continue }
      let r = lo.range(of: tok)
      found.append(FoundWord(word: tok, category: "symbol", severity: spec.severity ?? 1, via: "symbol", confidence: conf, detector: "culture", type: "symbol", action: "review", index: r.location == NSNotFound ? -1 : r.location))
    }
  }
  found.sort { $0.index < $1.index }
  let blocked = found.contains { $0.action == "block" }
  return ValidationResult(isValid: !blocked, needsReview: found.contains { $0.action == "review" }, needsHelp: found.contains { $0.action == "help" }, maxSeverity: found.map { $0.severity }.max() ?? 0, found: found)
}

public func containsProhibited(_ text: String?, categories: [String]? = nil, lang: [String]? = nil, locale: String? = nil, region: String? = nil, minSeverity: Int = 1, minConfidence: Double = 0, detectors: [String]? = nil, types: [String]? = nil, customWords: [String] = [], whitelist: [String] = []) -> Bool {
  !validate(text, categories: categories, lang: lang, locale: locale, region: region, minSeverity: minSeverity, minConfidence: minConfidence, detectors: detectors, types: types, customWords: customWords, whitelist: whitelist).isValid
}

// MARK: - Remote update (offline-first; panggil eksplisit bila perlu)

public func datasetInfo() -> (version: Int, langs: Int) { (wordDB.version ?? 0, wordDB.langs.count) }

public func fetchDataset(from url: URL) async throws -> Data {
  let (data, response) = try await URLSession.shared.data(from: url)
  if let http = response as? HTTPURLResponse, http.statusCode != 200 {
    throw URLError(.badServerResponse)
  }
  // Validasi bentuk v3 sebelum dipakai.
  _ = try JSONDecoder().decode(DB.self, from: data)
  return data
}

public func checkForUpdates(url: URL) async throws -> (updateAvailable: Bool, remoteVersion: Int) {
  let data = try await fetchDataset(from: url)
  let remote = try JSONDecoder().decode(DB.self, from: data)
  return ((remote.version ?? 0) > (wordDB.version ?? 0), remote.version ?? 0)
}
