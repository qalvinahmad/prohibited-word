// Package prohibitedword validates form input against a multilingual wordlist.
//
// Data v3: 124 bahasa + regional overrides + emoji map + severity.
// Sumber: safe_text (MIT (c) 2024 Ronit Rameja) + kurasi.
// Mesin: trie + word-boundary + separator-skip; locale; remote update opsional.
package prohibitedword

import (
	"embed"
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

//go:embed words.json
var wordsFile embed.FS

type WordEntry struct {
	W    string  `json:"w"`
	S    int     `json:"s"`
	C    string  `json:"c"`
	Conf float64 `json:"conf"`
}

type LangSpec struct {
	Name     string      `json:"name,omitempty"`
	Parent   string      `json:"parent,omitempty"`
	Maturity string      `json:"maturity"`
	Source   string      `json:"source"`
	Words    []WordEntry `json:"words"`
}

type RegionEntry struct {
	W    string  `json:"w"`
	Lang string  `json:"lang"`
	S    int     `json:"s"`
	C    string  `json:"c"`
	Conf float64 `json:"conf"`
}

type RegionSpec struct {
	Note   string        `json:"note"`
	Source string        `json:"source"`
	Add    []RegionEntry `json:"add"`
	Remove []RegionEntry `json:"remove"`
}

type EmojiSpec struct {
	OffensiveIn []string `json:"offensiveIn"`
	Severity    int      `json:"severity"`
	Conf        float64  `json:"conf"`
	Note        string   `json:"note"`
	Source      string   `json:"source"`
}

type SymbolSpec struct {
	Regions  []string `json:"regions"`
	Severity int      `json:"severity"`
	Conf     float64  `json:"conf"`
	Note     string   `json:"note"`
	Source   string   `json:"source"`
}

type PhraseEntry struct {
	T        string  `json:"t"`
	Lang     string  `json:"lang"`
	Conf     float64 `json:"conf"`
	Src      string  `json:"src"`
	Detector string  `json:"detector"`
	Type     string  `json:"type"`
	Action   string  `json:"action"`
}

type Dataset struct {
	Version int                 `json:"version"`
	Meta    map[string]any      `json:"meta"`
	Langs   map[string]LangSpec `json:"langs"`
	Regions map[string]RegionSpec `json:"regions"`
	Emoji   map[string]EmojiSpec  `json:"emoji"`
	Symbols map[string]SymbolSpec `json:"symbols"`
	Phrases map[string][]PhraseEntry `json:"phrases"`
}

type Found struct {
	Word       string  `json:"word"`
	Category   string  `json:"category"`
	Severity   int     `json:"severity"`
	Via        string  `json:"via"`
	Confidence float64 `json:"confidence"`
	Detector   string  `json:"detector"`
	Type       string  `json:"type"`
	Action     string  `json:"action"`
	Index      int     `json:"index"`
}

type Result struct {
	IsValid     bool    `json:"isValid"`
	NeedsReview bool    `json:"needsReview"`
	NeedsHelp   bool    `json:"needsHelp"`
	MaxSeverity int     `json:"maxSeverity"`
	Found       []Found `json:"found"`
}

type Options struct {
	Categories    []string
	Lang          []string
	Locale        string
	Region        string
	MinSeverity   int
	MinConfidence float64
	Detectors     []string
	Types         []string
	CustomWords   []string
	Whitelist     []string
}

var db Dataset
var dictID string

func init() {
	b, _ := wordsFile.ReadFile("words.json")
	_ = json.Unmarshal(b, &db)
	dictID = strconv.Itoa(db.Version) + ":" + strconv.Itoa(len(db.Langs))
}

var leet = map[rune]rune{
	'@': 'a', '4': 'a', '8': 'b', '(': 'c', '3': 'e',
	'1': 'i', '!': 'i', '0': 'o', '$': 's', '5': 's',
	'7': 't', '+': 't', 'v': 'u', '#': 'h',
}

var latinMark = runes.Predicate(func(r rune) bool {
	return r >= 0x300 && r <= 0x36F && unicode.Is(unicode.Mn, r)
})

func isEmoji(r rune) bool { return unicode.Is(unicode.So, r) }
func isAlnum(r rune) bool { return unicode.IsLetter(r) || unicode.IsNumber(r) }

// Normalize lowercases, folds Latin marks, applies leet, and pads emoji with spaces.
func Normalize(s string) string {
	s = strings.ToLower(s)
	if out, _, err := transform.String(transform.Chain(norm.NFKD, runes.Remove(latinMark), norm.NFC), s); err == nil {
		s = out
	}
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		if v, ok := leet[r]; ok {
			r = v
		}
		if isEmoji(r) {
			b.WriteRune(' ')
			b.WriteRune(r)
			b.WriteRune(' ')
		} else {
			b.WriteRune(r)
		}
	}
	return strings.Join(strings.Fields(b.String()), " ")
}

// EmojiKey strips variation selectors and skin-tone modifiers.
func EmojiKey(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r == 0xFE0F || (r >= 0x1F3FB && r <= 0x1F3FF) {
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

// EntryPattern keeps only letters/numbers/emoji.
func EntryPattern(word string) string {
	var b strings.Builder
	for _, r := range Normalize(word) {
		if isAlnum(r) || isEmoji(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// DisplayForm trims decorative edge symbols.
func DisplayForm(word string) string {
	r := []rune(Normalize(word))
	i, j := 0, len(r)
	for i < j && !isAlnum(r[i]) && !isEmoji(r[i]) {
		i++
	}
	for j > i && !isAlnum(r[j-1]) && !isEmoji(r[j-1]) {
		j--
	}
	return string(r[i:j])
}

// ParseLocale splits "ar-SA" into lang + region.
func ParseLocale(locale string) (lang, region string) {
	sep := strings.IndexAny(locale, "-_")
	if sep < 0 {
		return strings.ToLower(locale), ""
	}
	return strings.ToLower(locale[:sep]), strings.ToUpper(locale[sep+1:])
}

func inList(list []string, v string) bool {
	if len(list) == 0 {
		return true
	}
	for _, x := range list {
		if x == v {
			return true
		}
	}
	return false
}

var digitWordRe = regexp.MustCompile(`\b(nol|kosong|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|zero|one|two|three|four|five|six|seven|eight|nine|oh)\b`)
var digitWordMap = map[string]string{
	"nol": "0", "kosong": "0", "satu": "1", "dua": "2", "tiga": "3", "empat": "4",
	"lima": "5", "enam": "6", "tujuh": "7", "delapan": "8", "sembilan": "9",
	"zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
	"six": "6", "seven": "7", "eight": "8", "nine": "9", "oh": "0",
}
var singleRunRe = regexp.MustCompile(`\b[a-z0-9](?: [a-z0-9])+\b`)
var atRe = regexp.MustCompile(`[{\[(]\s*at\s*[\])}]|\sat\s`)
var dotRe = regexp.MustCompile(`[{\[(]\s*dots?\s*[\])}]|\sdots?\s|\btitik\b`)
var atDotSpaceRe = regexp.MustCompile(`\s*([@.])\s*`)

func isDigitSep(r rune) bool { return r == ' ' || r == '.' || r == '(' || r == ')' || r == '-' }

// Deobfuscate builds the PII/scam matching stream:
// [at]->@, [dot]/titik->., digit words->digits, single-char runs joined,
// digit-adjacent separators removed.
func Deobfuscate(s string) string {
	s = strings.ToLower(s)
	s = atRe.ReplaceAllString(s, "@")
	s = dotRe.ReplaceAllString(s, ".")
	s = digitWordRe.ReplaceAllStringFunc(s, func(m string) string { return digitWordMap[m] })
	s = singleRunRe.ReplaceAllStringFunc(s, func(m string) string { return strings.ReplaceAll(m, " ", "") })
	s = atDotSpaceRe.ReplaceAllString(s, "$1")
	var b strings.Builder
	rs := []rune(s)
	for i, r := range rs {
		if isDigitSep(r) {
			prevDigit := i > 0 && rs[i-1] >= '0' && rs[i-1] <= '9'
			nextDigit := false
			for j := i + 1; j < len(rs); j++ {
				if isDigitSep(rune(rs[j])) {
					continue
				}
				nextDigit = rs[j] >= '0' && rs[j] <= '9'
				break
			}
			if prevDigit && nextDigit {
				continue
			}
		}
		b.WriteRune(r)
	}
	return strings.Join(strings.Fields(b.String()), " ")
}

var idProvince = map[string]bool{
	"11": true, "12": true, "13": true, "14": true, "15": true, "16": true, "17": true,
	"18": true, "19": true, "21": true, "31": true, "32": true, "33": true, "34": true,
	"35": true, "36": true, "51": true, "52": true, "53": true, "61": true, "62": true,
	"63": true, "64": true, "65": true, "71": true, "72": true, "73": true, "74": true,
	"75": true, "76": true, "81": true, "82": true, "91": true, "92": true, "94": true,
}

func validNIK(d string) bool {
	if !idProvince[d[:2]] {
		return false
	}
	dd, _ := strconv.Atoi(d[6:8])
	mm, _ := strconv.Atoi(d[8:10])
	return ((dd >= 1 && dd <= 31) || (dd >= 41 && dd <= 71)) && mm >= 1 && mm <= 12
}

func luhnOk(d string) bool {
	sum, dbl := 0, false
	for i := len(d) - 1; i >= 0; i-- {
		n := int(d[i] - '0')
		if dbl {
			n *= 2
			if n > 9 {
				n -= 9
			}
		}
		sum += n
		dbl = !dbl
	}
	return sum%10 == 0
}

type piiRule struct {
	typ  string
	re   *regexp.Regexp
	conf float64
	scam bool
}

var piiRules = []piiRule{
	{"email", regexp.MustCompile(`[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}`), 0.85, false},
	{"phone", regexp.MustCompile(`(?:\+?62|0)8\d{7,11}`), 0.85, false},
	{"phone", regexp.MustCompile(`\+\d{8,15}`), 0.8, false},
	{"ssn", regexp.MustCompile(`\b\d{3}[- ]\d{2}[- ]\d{4}\b`), 0.7, false},
	{"crypto_wallet", regexp.MustCompile(`\b(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-f0-9]{40})\b`), 0.85, true},
	{"payment_link", regexp.MustCompile(`(?i)\b(paypal\.me/\S+|(bit\.ly|tinyurl\.com|t\.co|s\.id|gg\.gg|lynk\.id|tiny\.cc|is\.gd|cutt\.ly)/\S+)`), 0.6, true},
	{"passport", regexp.MustCompile(`\b[a-z]\d{7}\b`), 0.45, false},
}

var nikRe = regexp.MustCompile(`\d{16}`)
var cardRe = regexp.MustCompile(`(?:\d[ \-.]*?){13,19}`)
var bankRe = regexp.MustCompile(`\b\d{10,16}\b`)
var nonDigitRe = regexp.MustCompile(`\D`)

type piiHit struct {
	start, end int
	word, typ  string
	conf       float64
	action     string
	detector   string
}

func scanPII(stream string, wantPII, wantScam bool, types []string, minConf float64) []piiHit {
	take := func(ty string) bool {
		if len(types) == 0 {
			return true
		}
		for _, t := range types {
			if t == ty {
				return true
			}
		}
		return false
	}
	var hits []piiHit
	pushSpan := func(s, e int, word, typ string, conf float64, action, detector string) {
		if conf < minConf || !take(typ) {
			return
		}
		hits = append(hits, piiHit{s, e, word, typ, conf, action, detector})
	}
	if wantPII {
		for _, r := range piiRules {
			if r.scam {
				continue
			}
			for _, loc := range r.re.FindAllStringIndex(stream, -1) {
				pushSpan(loc[0], loc[1], stream[loc[0]:loc[1]], r.typ, r.conf, "block", "pii")
			}
		}
		for _, loc := range nikRe.FindAllStringIndex(stream, -1) {
			if validNIK(stream[loc[0]:loc[1]]) {
				pushSpan(loc[0], loc[1], stream[loc[0]:loc[1]], "nik", 0.9, "block", "pii")
			}
		}
		for _, loc := range cardRe.FindAllStringIndex(stream, -1) {
			d := nonDigitRe.ReplaceAllString(stream[loc[0]:loc[1]], "")
			if len(d) < 13 || len(d) > 19 {
				continue
			}
			conf := 0.4
			if luhnOk(d) {
				conf = 0.95
			}
			pushSpan(loc[0], loc[1], d, "bank_card", conf, "block", "pii")
		}
		for _, loc := range nikRe.FindAllStringIndex(stream, -1) {
			if !validNIK(stream[loc[0]:loc[1]]) {
				pushSpan(loc[0], loc[1], stream[loc[0]:loc[1]], "nik", 0.4, "block", "pii")
			}
		}
	}
	if wantScam {
		for _, r := range piiRules {
			if !r.scam {
				continue
			}
			for _, loc := range r.re.FindAllStringIndex(stream, -1) {
				pushSpan(loc[0], loc[1], stream[loc[0]:loc[1]], r.typ, r.conf, "block", "scam")
			}
		}
	}
	if wantPII && (len(types) == 0 || take("bank_account")) {
		for _, loc := range bankRe.FindAllStringIndex(stream, -1) {
			overlap := false
			for _, h := range hits {
				if h.detector == "pii" && h.start < loc[1] && loc[0] < h.end {
					overlap = true
					break
				}
			}
			if !overlap && 0.3 >= minConf {
				hits = append(hits, piiHit{loc[0], loc[1], stream[loc[0]:loc[1]], "bank_account", 0.3, "block", "pii"})
			}
		}
	}
	for i := 0; i < len(hits); i++ {
		for j := i + 1; j < len(hits); j++ {
			if hits[i].start > hits[j].start || (hits[i].start == hits[j].start && hits[i].end < hits[j].end) {
				hits[i], hits[j] = hits[j], hits[i]
			}
		}
	}
	var kept []piiHit
	for _, h := range hits {
		if len(kept) > 0 && kept[len(kept)-1].end >= h.end {
			continue
		}
		kept = append(kept, h)
	}
	return kept
}

type tnode struct {
	next map[rune]*tnode
	out  []int
}

type entry struct {
	word     string
	category string
	severity int
	via      string
	conf     float64
	detector string
	typ      string
	action   string
}

var maturityConf = map[string]float64{
	"curated": 0.7, "regional": 0.6, "starter": 0.4, "verified": 0.95,
}

func confOfMaturity(m string) float64 {
	if c, ok := maturityConf[m]; ok {
		return c
	}
	return 0.5
}

type engine struct {
	entries []entry
	free    []bool
	root    *tnode
	maxLen  int
}

var cacheMu sync.RWMutex
var cache = map[string]*engine{}

func getEngine(o Options, langs []string, region string, minSev int, minConf float64, detectors, types, custom []string, white map[string]bool) *engine {
	var kb strings.Builder
	kb.WriteString(dictID + "|" + strings.Join(langs, ",") + "|" + region + "|")
	kb.WriteString(strings.Join(o.Categories, ",") + "|" + strconv.Itoa(minSev) + "|")
	kb.WriteString(strconv.FormatFloat(minConf, 'f', 3, 64) + "|")
	kb.WriteString(strings.Join(detectors, ",") + "|" + strings.Join(types, ",") + "|")
	kb.WriteString(strings.Join(custom, ",") + "|")
	for _, w := range o.Whitelist {
		kb.WriteString(strings.ToLower(w) + ",")
	}
	key := kb.String()
	cacheMu.RLock()
	if e, ok := cache[key]; ok {
		cacheMu.RUnlock()
		return e
	}
	cacheMu.RUnlock()

	in := func(list []string, v string) bool {
		if len(list) == 0 {
			return true
		}
		for _, x := range list {
			if x == v {
				return true
			}
		}
		return false
	}
	wantProf, wantSens, wantScamP := false, false, false
	for _, d := range detectors {
		switch d {
		case "profanity":
			wantProf = true
		case "sensitive":
			wantSens = true
		case "scam":
			wantScamP = true
		}
	}
	takeType := func(ty string) bool { return in(types, ty) }
	var entries []entry
	var free []bool
	seen := map[string]bool{}
	push := func(word, cat string, sev int, via, lang string, conf float64, detector, typ, action string) {
		w := strings.ToLower(word)
		if w == "" || white[w] {
			return
		}
		pat := EntryPattern(w)
		disp := DisplayForm(w)
		if pat == "" || white[pat] || white[disp] {
			return
		}
		sig := detector + "\x00" + lang + "\x00" + pat
		if seen[sig] || sev < minSev || conf < minConf || !takeType(typ) {
			return
		}
		seen[sig] = true
		hasAlnum := false
		for _, r := range pat {
			if isAlnum(r) {
				hasAlnum = true
				break
			}
		}
		free = append(free, !hasAlnum)
		entries = append(entries, entry{word: disp, category: cat, severity: sev, via: via, conf: conf, detector: detector, typ: typ, action: action})
	}
	remove := map[string]bool{}
	if rs, ok := db.Regions[region]; ok {
		for _, r := range rs.Remove {
			remove[strings.ToLower(r.W)+"\x00"+r.Lang] = true
		}
	}
	catOf := func(e WordEntry) string {
		if e.C != "" {
			return e.C
		}
		return "profanity"
	}
	sevOf := func(e WordEntry) int {
		if e.S != 0 {
			return e.S
		}
		return 2
	}
	activeLangs := make(map[string]bool)
	for _, l := range langs {
		lLow := strings.ToLower(l)
		activeLangs[lLow] = true
		if p, ok := db.Langs[lLow]; ok && p.Parent != "" {
			activeLangs[strings.ToLower(p.Parent)] = true
		}
	}
	confOf := func(e WordEntry, maturity string) float64 {
		if e.Conf != 0 {
			return e.Conf
		}
		return confOfMaturity(maturity)
	}
	for lang, spec := range db.Langs {
		if len(activeLangs) > 0 {
			langLow := strings.ToLower(lang)
			base := strings.Split(langLow, "-")[0]
			if !activeLangs[langLow] && !activeLangs[base] {
				continue
			}
		}
		for _, e := range spec.Words {
			cat := catOf(e)
			sev := sevOf(e)
			conf := confOf(e, spec.Maturity)
			if remove[strings.ToLower(e.W)+"\x00"+lang] {
				continue
			}
			isHate := cat == "sara" || sev >= 3
			switch {
			case isHate && wantSens:
				push(e.W, cat, sev, "hate-word", lang, conf, "sensitive", "hate", "review")
			case !isHate && wantProf:
				if !in(o.Categories, cat) {
					continue
				}
				push(e.W, cat, sev, "word", lang, conf, "profanity", "profanity", "block")
			case isHate && wantProf && !wantSens:
				if !in(o.Categories, cat) {
					continue
				}
				push(e.W, cat, sev, "word", lang, conf, "profanity", "profanity", "block")
			}
		}
	}
	for key, items := range db.Phrases {
		det := "sensitive"
		if strings.HasPrefix(key, "scam_") {
			det = "scam"
		}
		if !((det == "scam" && wantScamP) || (det == "sensitive" && wantSens)) {
			continue
		}
		typ := strings.TrimPrefix(strings.TrimPrefix(key, "scam_"), "sensitive_")
		for _, p := range items {
			if len(activeLangs) > 0 && !activeLangs[strings.ToLower(p.Lang)] {
				continue
			}
			conf := p.Conf
			if conf == 0 {
				conf = 0.5
			}
			push(p.T, "phrase", 2, "phrase", p.Lang, conf, det, typ, p.Action)
		}
	}
	if rs, ok := db.Regions[region]; ok {
		for _, e := range rs.Add {
			if len(langs) > 0 && !in(langs, e.Lang) {
				continue
			}
			cat := e.C
			if cat == "" {
				cat = "profanity"
			}
			if !in(o.Categories, cat) {
				continue
			}
			sev := e.S
			if sev == 0 {
				sev = 2
			}
			conf := e.Conf
			if conf == 0 {
				conf = 0.6
			}
			push(e.W, cat, sev, "regional", e.Lang, conf, "profanity", "profanity", "block")
		}
	}
	for raw, spec := range db.Emoji {
		uni := false
		inRegion := false
		for _, c := range spec.OffensiveIn {
			if c == "*" {
				uni = true
			}
			if c == region {
				inRegion = true
			}
		}
		if !uni && (region == "" || !inRegion) {
			continue
		}
		sev := spec.Severity
		if sev == 0 {
			sev = 2
		}
		conf := spec.Conf
		if conf == 0 {
			conf = 0.6
		}
		push(EmojiKey(raw), "gesture", sev, "emoji", "", conf, "profanity", "profanity", "block")
	}
	for _, w := range custom {
		push(w, "custom", 2, "custom", "", 1.0, "profanity", "profanity", "block")
	}
	root := &tnode{next: map[rune]*tnode{}}
	maxLen := 0
	for i, e := range entries {
		p := []rune(EntryPattern(e.word))
		if len(p) > maxLen {
			maxLen = len(p)
		}
		node := root
		for _, r := range p {
			m, ok := node.next[r]
			if !ok {
				m = &tnode{next: map[rune]*tnode{}}
				node.next[r] = m
			}
			node = m
		}
		node.out = append(node.out, i)
	}
	e := &engine{entries: entries, free: free, root: root, maxLen: maxLen}
	cacheMu.Lock()
	if len(cache) > 32 {
		for k := range cache {
			delete(cache, k)
			break
		}
	}
	cache[key] = e
	cacheMu.Unlock()
	return e
}

type hit struct {
	idx, start, end int
}

// Validate checks text and returns detail.
func Validate(text string, o Options) Result {
	if strings.TrimSpace(text) == "" {
		return Result{IsValid: true}
	}
	detectors := o.Detectors
	if detectors == nil {
		detectors = []string{"profanity"}
	}
	langs := append([]string(nil), o.Lang...)
	region := o.Region
	if o.Locale != "" {
		ll, rr := ParseLocale(o.Locale)
		fullLoc := strings.ToLower(strings.ReplaceAll(o.Locale, "_", "-"))
		if len(langs) == 0 {
			if _, ok := db.Langs[fullLoc]; ok {
				langs = []string{fullLoc}
			} else if ll != "" {
				langs = []string{ll}
			}
		}
		if region == "" {
			region = rr
		}
	}
	minSev := o.MinSeverity
	if minSev == 0 {
		minSev = 1
	}
	custom := make([]string, 0, len(o.CustomWords))
	for _, w := range o.CustomWords {
		custom = append(custom, strings.ToLower(w))
	}
	white := map[string]bool{}
	for _, w := range o.Whitelist {
		white[strings.ToLower(w)] = true
	}
	e := getEngine(o, langs, region, minSev, o.MinConfidence, detectors, o.Types, custom, white)
	norm := []rune(Normalize(text))
	n := len(norm)
	alnum := make([]bool, n)
	for i, r := range norm {
		alnum[i] = isAlnum(r)
	}
	var hits []hit
	for i := 0; i < n; i++ {
		startOK := i == 0 || !alnum[i-1]
		node := e.root
		for j := i; j < n && j < i+e.maxLen+10; j++ {
			if alnum[j] {
				m, ok := node.next[norm[j]]
				if !ok {
					break
				}
				node = m
				if len(node.out) > 0 && startOK && (j+1 >= n || !alnum[j+1]) {
					for _, idx := range node.out {
						hits = append(hits, hit{idx, i, j + 1})
					}
				}
			} else {
				m, ok := node.next[norm[j]]
				if !ok {
					continue
				}
				node = m
				if len(node.out) > 0 {
					for _, idx := range node.out {
						if e.free[idx] || (startOK && (j+1 >= n || !alnum[j+1])) {
							hits = append(hits, hit{idx, i, j + 1})
						}
					}
				}
			}
		}
	}
	// Sort by start asc, span desc; drop contained spans.
	for i := 0; i < len(hits); i++ {
		for j := i + 1; j < len(hits); j++ {
			if hits[i].start > hits[j].start || (hits[i].start == hits[j].start && hits[i].end < hits[j].end) {
				hits[i], hits[j] = hits[j], hits[i]
			}
		}
	}
	var final []hit
	for _, h := range hits {
		if len(final) > 0 && final[len(final)-1].end >= h.end {
			continue
		}
		final = append(final, h)
	}
	lower := strings.ToLower(text)
	var found []Found
	maxSev := 0
	for _, h := range final {
		if e.entries[h.idx].severity > maxSev {
			maxSev = e.entries[h.idx].severity
		}
		found = append(found, Found{Word: e.entries[h.idx].word, Category: e.entries[h.idx].category,
			Severity: e.entries[h.idx].severity, Via: e.entries[h.idx].via,
			Confidence: e.entries[h.idx].conf, Detector: e.entries[h.idx].detector,
			Type: e.entries[h.idx].typ, Action: e.entries[h.idx].action,
			Index: strings.Index(lower, e.entries[h.idx].word)})
	}
	wantPII, wantScamRx := false, false
	for _, d := range detectors {
		if d == "pii" {
			wantPII = true
		}
		if d == "scam" {
			wantScamRx = true
		}
	}
	if wantPII || wantScamRx {
		stream := Deobfuscate(text)
		for _, h := range scanPII(stream, wantPII, wantScamRx, o.Types, o.MinConfidence) {
			cat := "pii"
			if h.detector == "scam" {
				cat = "scam"
			}
			if 2 > maxSev {
				maxSev = 2
			}
			found = append(found, Found{Word: h.word, Category: cat, Severity: 2,
				Via: h.detector, Confidence: h.conf, Detector: h.detector,
				Type: h.typ, Action: h.action, Index: strings.Index(lower, h.word)})
		}
	}
	// Standalone symbols (pre-leet): whole tokens only, never substrings.
	if region != "" && len(db.Symbols) > 0 && inList(o.Types, "symbol") {
		seenTok := map[string]bool{}
		for _, tok := range strings.FieldsFunc(lower, func(r rune) bool { return !isAlnum(r) }) {
			spec, ok := db.Symbols[tok]
			if !ok || seenTok[tok] {
				continue
			}
			seenTok[tok] = true
			inRegion := false
			for _, c := range spec.Regions {
				if c == region {
					inRegion = true
					break
				}
			}
			if !inRegion || spec.Conf < o.MinConfidence {
				continue
			}
			sev := spec.Severity
			if sev == 0 {
				sev = 1
			}
			found = append(found, Found{Word: tok, Category: "symbol", Severity: sev,
				Via: "symbol", Confidence: spec.Conf, Detector: "culture",
				Type: "symbol", Action: "review", Index: strings.Index(lower, tok)})
		}
	}
	for i := 0; i < len(found); i++ {
		for j := i + 1; j < len(found); j++ {
			if found[i].Index > found[j].Index {
				found[i], found[j] = found[j], found[i]
			}
		}
	}
	blocked, review, help := false, false, false
	for _, f := range found {
		switch f.Action {
		case "block":
			blocked = true
		case "review":
			review = true
		case "help":
			help = true
		}
	}
	return Result{IsValid: !blocked, NeedsReview: review, NeedsHelp: help, MaxSeverity: maxSev, Found: found}
}

// Contains is a boolean shortcut for form validators.
func Contains(text string, o Options) bool { return !Validate(text, o).IsValid }

// DatasetInfo reports the bundled dataset version.
func DatasetInfo() (version int, langs int) { return db.Version, len(db.Langs) }

// LoadDataset swaps the active dataset (e.g. after FetchDataset) and clears caches.
func LoadDataset(d Dataset) {
	db = d
	dictID = strconv.Itoa(db.Version) + ":" + strconv.Itoa(len(db.Langs))
	cacheMu.Lock()
	cache = map[string]*engine{}
	cacheMu.Unlock()
}

// FetchDataset downloads a v4 dataset JSON from url.
func FetchDataset(url string) (Dataset, error) {
	resp, err := http.Get(url) //nolint:gosec
	if err != nil {
		return Dataset{}, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return Dataset{}, err
	}
	var d Dataset
	if err := json.Unmarshal(b, &d); err != nil {
		return Dataset{}, err
	}
	return d, nil
}

// CheckForUpdates reports whether url hosts a newer dataset version.
func CheckForUpdates(url string) (updateAvailable bool, remoteVersion int, err error) {
	d, err := FetchDataset(url)
	if err != nil {
		return false, 0, err
	}
	return d.Version > db.Version, d.Version, nil
}
