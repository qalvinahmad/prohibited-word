import Testing
@testable import ProhibitedWord

@Test func exact() { #expect(containsProhibited("kamu anjing")) }
@Test func leet() { #expect(containsProhibited("kamu 4nj1ng")) }
@Test func clean() { #expect(!containsProhibited("halo apa kabar")) }
@Test func separator() { #expect(containsProhibited("a.n.j.i.n.g")) }
@Test func scunthorpe() { #expect(!containsProhibited("banget")) }
@Test func locale124() { #expect(containsProhibited("kamu jancok", locale: "jv")) }
@Test func regionalRemove() {
  #expect(!containsProhibited("anak yatim piatu", locale: "id-ID"))
  #expect(containsProhibited("anak yatim piatu", lang: ["id"]))
}
@Test func emojiRegion() {
  #expect(containsProhibited("good 👍", locale: "en-AU"))
  #expect(!containsProhibited("good 👍", locale: "en-US"))
}
@Test func severity() {
  #expect(validate("kamu anjing", minSeverity: 3).isValid)
  #expect(validate("kamu anjing").maxSeverity == 2)
}
@Test func symbolStandalone() {
  let r = validate("floor 13", locale: "en-US")
  #expect(r.isValid && r.needsReview && r.found.first?.type == "symbol")
  #expect(!containsProhibited("room 136", locale: "en-US"))
  #expect(validate("nomor 4", locale: "zh-CN").needsReview)
  #expect(!containsProhibited("nomor 4", locale: "id-ID"))
}
@Test func piiOptIn() {
  #expect(containsProhibited("hubungi 081234567890", detectors: ["pii"]))
  #expect(!containsProhibited("hubungi 081234567890"))
  #expect(validate("email saya j o h n [at] gmail [dot] com", detectors: ["pii"]).found.first?.type == "email")
  #expect(validate("NIK 3174051209900001", detectors: ["pii"]).found.first?.type == "nik")
}
@Test func scamLayer() {
  let r = validate("transfer langsung ke rekening ini ya", detectors: ["scam"])
  #expect(!r.isValid && r.found.first?.type == "direct_transfer")
}
@Test func sensitiveLayer() {
  let r = validate("aku mau bunuh diri", detectors: ["sensitive"])
  #expect(r.needsHelp && r.found.first?.action == "help")
  #expect(containsProhibited("main slot gacor", detectors: ["sensitive"]))
  #expect(validate("chat wa aja ya", detectors: ["sensitive"]).needsReview)
}
