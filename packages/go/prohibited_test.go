package prohibitedword

import "testing"

func TestExact(t *testing.T) {
	if !Contains("kamu anjing", Options{}) {
		t.Fatal("exact tidak ketahuan")
	}
}

func TestLeet(t *testing.T) {
	if !Contains("kamu 4nj1ng", Options{}) {
		t.Fatal("leet tidak ketahuan")
	}
}

func TestSeparator(t *testing.T) {
	if !Contains("a.n.j.i.n.g", Options{}) {
		t.Fatal("separator tidak ketahuan")
	}
}

func TestClean(t *testing.T) {
	if Contains("halo apa kabar", Options{}) {
		t.Fatal("false positive")
	}
}

func TestScunthorpe(t *testing.T) {
	if Contains("banget", Options{}) {
		t.Fatal("banget ke-flag")
	}
}

func TestLocale124(t *testing.T) {
	if !Contains("kamu jancok", Options{Locale: "jv"}) {
		t.Fatal("locale jv tidak ketahuan")
	}
}

func TestRegionalRemove(t *testing.T) {
	if Contains("anak yatim piatu", Options{Locale: "id-ID"}) {
		t.Fatal("seharusnya dihapus oleh regional ID")
	}
	if !Contains("anak yatim piatu", Options{Lang: []string{"id"}}) {
		t.Fatal("tanpa region seharusnya ketahuan")
	}
}

func TestEmojiRegion(t *testing.T) {
	if !Contains("good 👍", Options{Locale: "en-AU"}) {
		t.Fatal("emoji AU tidak ketahuan")
	}
	if Contains("good 👍", Options{Locale: "en-US"}) {
		t.Fatal("emoji US seharusnya bersih")
	}
}

func TestSeverity(t *testing.T) {
	if !Validate("kamu anjing", Options{MinSeverity: 3}).IsValid {
		t.Fatal("minSeverity 3 seharusnya bersih")
	}
	if Validate("kamu anjing", Options{}).MaxSeverity != 2 {
		t.Fatal("maxSeverity seharusnya 2")
	}
}

func TestSymbolStandalone(t *testing.T) {
	r := Validate("floor 13", Options{Locale: "en-US"})
	if !r.IsValid || !r.NeedsReview || r.Found[0].Type != "symbol" {
		t.Fatal("simbol 13 US harus review, bukan block")
	}
	if Contains("room 136", Options{Locale: "en-US"}) {
		t.Fatal("136 bukan token utuh")
	}
	if !Validate("nomor 4", Options{Locale: "zh-CN"}).NeedsReview {
		t.Fatal("simbol 4 CN harus review")
	}
	if Contains("nomor 4", Options{Locale: "id-ID"}) {
		t.Fatal("simbol 4 ID seharusnya bersih")
	}
}

func TestConfidence(t *testing.T) {
	if !Validate("kamu anjing", Options{MinConfidence: 0.8}).IsValid {
		t.Fatal("minConfidence 0.8 seharusnya menyaring anjing (0.7)")
	}
	if Validate("kamu anjing", Options{}).Found[0].Confidence != 0.7 {
		t.Fatal("confidence anjing seharusnya 0.7 (curated)")
	}
}

func TestPIIOptIn(t *testing.T) {
	if !Contains("hubungi 081234567890", Options{Detectors: []string{"pii"}}) {
		t.Fatal("telepon tidak ketahuan")
	}
	if Contains("hubungi 081234567890", Options{}) {
		t.Fatal("default seharusnya profanity saja")
	}
	if got := Validate("email saya j o h n [at] gmail [dot] com", Options{Detectors: []string{"pii"}}); len(got.Found) == 0 || got.Found[0].Type != "email" {
		t.Fatal("email tersamar tidak ketahuan")
	}
	if got := Validate("NIK 3174051209900001", Options{Detectors: []string{"pii"}}); len(got.Found) == 0 || got.Found[0].Type != "nik" {
		t.Fatal("NIK tidak ketahuan")
	}
}

func TestScamLayer(t *testing.T) {
	r := Validate("transfer langsung ke rekening ini ya", Options{Detectors: []string{"scam"}})
	if r.IsValid || r.Found[0].Type != "direct_transfer" {
		t.Fatal("direct_transfer tidak ketahuan")
	}
}

func TestSensitiveLayer(t *testing.T) {
	r := Validate("aku mau bunuh diri", Options{Detectors: []string{"sensitive"}})
	if !r.NeedsHelp || r.Found[0].Action != "help" {
		t.Fatal("self_harm harus trigger help")
	}
	if !Contains("main slot gacor", Options{Detectors: []string{"sensitive"}}) {
		t.Fatal("gambling tidak ketahuan")
	}
	if !Validate("chat wa aja ya", Options{Detectors: []string{"sensitive"}}).NeedsReview {
		t.Fatal("offplatform harus review")
	}
}
