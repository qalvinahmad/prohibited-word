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
	W string `json:"w"`
	S int    `json:"s"`
	C string `json:"c"`
}

type LangSpec struct {
	Maturity string      `json:"maturity"`
	Source   string      `json:"source"`
	Words    []WordEntry `json:"words"`
}

type RegionEntry struct {
	W    string `json:"w"`
	Lang string `json:"lang"`
	S    int    `json:"s"`
	C    string `json:"c"`
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
	Note        string   `json:"note"`
	Source      string   `json:"source"`
}

type Dataset struct {
	Version int                 `json:"version"`
	Meta    map[string]any      `json:"meta"`
	Langs   map[string]LangSpec `json:"langs"`
	Regions map[string]RegionSpec `json:"regions"`
	Emoji   map[string]EmojiSpec  `json:"emoji"`
}

type Found struct {
	Word     string `json:"word"`
	Category string `json:"category"`
	Severity int    `json:"severity"`
	Via      string `json:"via"`
	Index    int    `json:"index"`
}

type Result struct {
	IsValid     bool    `json:"isValid"`
	MaxSeverity int     `json:"maxSeverity"`
	Found       []Found `json:"found"`
}

type Options struct {
	Categories  []string
	Lang        []string
	Locale      string
	Region      string
	MinSeverity int
	CustomWords []string
	Whitelist   []string
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

type tnode struct {
	next map[rune]*tnode
	out  []int
}

type entry struct {
	word     string
	category string
	severity int
	via      string
}

type engine struct {
	entries []entry
	free    []bool
	root    *tnode
	maxLen  int
}

var cacheMu sync.RWMutex
var cache = map[string]*engine{}

func getEngine(o Options, langs []string, region string, minSev int, custom []string, white map[string]bool) *engine {
	var kb strings.Builder
	kb.WriteString(dictID + "|" + strings.Join(langs, ",") + "|" + region + "|")
	kb.WriteString(strings.Join(o.Categories, ",") + "|" + strconv.Itoa(minSev) + "|")
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
	var entries []entry
	var free []bool
	seen := map[string]bool{}
	push := func(word, cat string, sev int, via, lang string) {
		w := strings.ToLower(word)
		if w == "" || white[w] {
			return
		}
		pat := EntryPattern(w)
		disp := DisplayForm(w)
		if pat == "" || white[pat] || white[disp] {
			return
		}
		sig := lang + "\x00" + pat
		if seen[sig] || sev < minSev {
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
		entries = append(entries, entry{word: disp, category: cat, severity: sev, via: via})
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
	for lang, spec := range db.Langs {
		if !in(langs, lang) {
			// in() returns true for empty list; explicit check:
			if len(langs) > 0 {
				continue
			}
		}
		for _, e := range spec.Words {
			cat := catOf(e)
			if !in(o.Categories, cat) {
				continue
			}
			if remove[strings.ToLower(e.W)+"\x00"+lang] {
				continue
			}
			push(e.W, cat, sevOf(e), "word", lang)
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
			push(e.W, cat, sev, "regional", e.Lang)
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
		push(EmojiKey(raw), "gesture", sev, "emoji", "")
	}
	for _, w := range custom {
		push(w, "custom", 2, "custom", "")
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
	langs := append([]string(nil), o.Lang...)
	region := o.Region
	if o.Locale != "" {
		ll, rr := ParseLocale(o.Locale)
		if len(langs) == 0 && ll != "" {
			langs = []string{ll}
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
	e := getEngine(o, langs, region, minSev, custom, white)
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
			Index: strings.Index(lower, e.entries[h.idx].word)})
	}
	for i := 0; i < len(found); i++ {
		for j := i + 1; j < len(found); j++ {
			if found[i].Index > found[j].Index {
				found[i], found[j] = found[j], found[i]
			}
		}
	}
	return Result{IsValid: len(found) == 0, MaxSeverity: maxSev, Found: found}
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

// FetchDataset downloads a v3 dataset JSON from url.
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
