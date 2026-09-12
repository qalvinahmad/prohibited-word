import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

// Data v3: 124 bahasa + regional overrides + emoji + severity.
// Mesin: trie + word-boundary + separator-skip; locale; remote update opsional.

public struct FoundWord: Sendable { public let word: String; public let category: String; public let severity: Int; public let via: String; public let index: Int }
public struct ValidationResult: Sendable { public let isValid: Bool; public let maxSeverity: Int; public let found: [FoundWord] }

private struct WordEntry: Decodable { let w: String; let s: Int?; let c: String? }
private struct LangSpec: Decodable { let maturity: String?; let source: String?; let words: [WordEntry] }
private struct RegionEntry: Decodable { let w: String; let lang: String; let s: Int?; let c: String? }
private struct RegionSpec: Decodable { let note: String?; let source: String?; let add: [RegionEntry]?; let remove: [RegionEntry]? }
private struct EmojiSpec: Decodable { let offensiveIn: [String]?; let severity: Int?; let note: String?; let source: String? }
private struct DB: Decodable { let version: Int?; let langs: [String: LangSpec]; let regions: [String: RegionSpec]?; let emoji: [String: EmojiSpec]? }

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

private final class Node { var next: [Character: Node] = [:]; var out: [Int] = [] }
private struct Hit { let idx: Int; let start: Int; let end: Int }

private struct Entry: Sendable { let word: String; let category: String; let severity: Int; let via: String }

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
    return DB(version: 0, langs: [:], regions: nil, emoji: nil)
  }
  return db
}()

private var dictID: String = "\(wordDB.version ?? 0):\(wordDB.langs.count)"
private var cache: [String: Engine] = [:]
private let cacheLock = NSLock()

/// Ganti dataset aktif (mis. hasil fetchDataset) dan bersihkan cache.
public func loadDataset(data: Data) throws {
  wordDB = try JSONDecoder().decode(DB.self, from: data)
  dictID = "\(wordDB.version ?? 0):\(wordDB.langs.count)"
  cacheLock.lock(); cache = [:]; cacheLock.unlock()
}

private func getEngine(langs: [String], region: String, categories: [String]?, minSeverity: Int, customWords: [String], whitelist: Set<String>) -> Engine {
  let key = "\(dictID)|\(langs.joined(separator: ","))|\(region)|\(categories?.joined(separator: ",") ?? "")|\(minSeverity)|\(customWords.joined(separator: ","))|\(whitelist.sorted().joined(separator: ","))"
  cacheLock.lock(); let hit = cache[key]; cacheLock.unlock()
  if let hit { return hit }
  var entries: [Entry] = []; var free: [Bool] = []; var patterns: [String] = []
  var seen = Set<String>()
  func push(_ word: String, _ cat: String, _ sev: Int, _ via: String, _ lang: String?) {
    let w = word.lowercased()
    if w.isEmpty || whitelist.contains(w) { return }
    let pat = entryPattern(w)
    let disp = displayForm(w)
    if pat.isEmpty || whitelist.contains(pat) || whitelist.contains(disp) { return }
    let sig = "\(lang ?? "")\u{0}\(pat)"
    if seen.contains(sig) || sev < minSeverity { return }
    seen.insert(sig)
    free.append(!pat.contains(where: { $0.isLetter || $0.isNumber }))
    entries.append(Entry(word: disp, category: cat, severity: sev, via: via))
    patterns.append(pat)
  }
  var remove = Set<String>()
  if let rs = wordDB.regions?[region], let rem = rs.remove {
    for r in rem { remove.insert("\(r.w.lowercased())\u{0}\(r.lang)") }
  }
  for (lang, spec) in wordDB.langs {
    if !langs.isEmpty && !langs.contains(lang) { continue }
    for e in spec.words {
      let cat = e.c ?? "profanity"
      if let categories, !categories.contains(cat) { continue }
      if remove.contains("\(e.w.lowercased())\u{0}\(lang)") { continue }
      push(e.w, cat, e.s ?? 2, "word", lang)
    }
  }
  if let rs = wordDB.regions?[region], let adds = rs.add {
    for e in adds {
      if !langs.isEmpty && !langs.contains(e.lang) { continue }
      let cat = e.c ?? "profanity"
      if let categories, !categories.contains(cat) { continue }
      push(e.w, cat, e.s ?? 2, "regional", e.lang)
    }
  }
  if let emoji = wordDB.emoji {
    for (raw, spec) in emoji {
      let off = spec.offensiveIn ?? []
      if !off.contains("*") && (region.isEmpty || !off.contains(region)) { continue }
      push(emojiKey(raw), "gesture", spec.severity ?? 2, "emoji", nil)
    }
  }
  for w in customWords { push(w, "custom", 2, "custom", nil) }
  let eng = Engine(entries: entries, free: free, patterns: patterns)
  cacheLock.lock(); if cache.count > 32 { cache.removeValue(forKey: cache.keys.first!) }; cache[key] = eng; cacheLock.unlock()
  return eng
}

public func validate(_ text: String?, categories: [String]? = nil, lang: [String]? = nil, locale: String? = nil, region: String? = nil, minSeverity: Int = 1, customWords: [String] = [], whitelist: [String] = []) -> ValidationResult {
  let original = text ?? ""
  if original.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return ValidationResult(isValid: true, maxSeverity: 0, found: []) }
  let loc = parseLocale(locale)
  let langs = lang ?? (loc.lang.map { [$0] } ?? [])
  let reg = region ?? loc.region ?? ""
  let white = Set(whitelist.map { $0.lowercased() })
  let eng = getEngine(langs: langs, region: reg, categories: categories, minSeverity: minSeverity, customWords: customWords.map { $0.lowercased() }, whitelist: white)
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
  let found = kept.map { h -> FoundWord in
    let w = eng.entries[h.idx].word
    let r = lo.range(of: w)
    return FoundWord(word: w, category: eng.entries[h.idx].category, severity: eng.entries[h.idx].severity, via: eng.entries[h.idx].via, index: r.location == NSNotFound ? -1 : r.location)
  }.sorted { $0.index < $1.index }
  return ValidationResult(isValid: found.isEmpty, maxSeverity: found.map(\.severity).max() ?? 0, found: found)
}

public func containsProhibited(_ text: String?, categories: [String]? = nil, lang: [String]? = nil, locale: String? = nil, region: String? = nil, minSeverity: Int = 1, customWords: [String] = [], whitelist: [String] = []) -> Bool {
  !validate(text, categories: categories, lang: lang, locale: locale, region: region, minSeverity: minSeverity, customWords: customWords, whitelist: whitelist).isValid
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
