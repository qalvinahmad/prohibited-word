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
