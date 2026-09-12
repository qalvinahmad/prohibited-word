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
