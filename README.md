# prohibited-word

[![npm](https://img.shields.io/npm/v/prohibited-word?logo=npm)](https://www.npmjs.com/package/prohibited-word)
[![pub package](https://img.shields.io/pub/v/prohibited_word?logo=dart)](https://pub.dev/packages/prohibited_word)
[![pub points](https://img.shields.io/pub/points/prohibited_word)](https://pub.dev/packages/prohibited_word/score)
[![PyPI](https://img.shields.io/pypi/v/prohibited-word?logo=pypi)](https://pypi.org/project/prohibited-word/)
[![Go Reference](https://pkg.go.dev/badge/github.com/qalvinahmad/prohibited-word/packages/go.svg)](https://pkg.go.dev/github.com/qalvinahmad/prohibited-word/packages/go)
[![CocoaPods](https://img.shields.io/cocoapods/v/ProhibitedWord?logo=cocoapods)](https://cocoapods.org/pods/ProhibitedWord)
[![SPM](https://img.shields.io/github/v/tag/qalvinahmad/prohibited-word?label=SPM&logo=swift)](https://github.com/qalvinahmad/prohibited-word/tags)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING-langs.md)
[![Stars](https://img.shields.io/github/stars/qalvinahmad/prohibited-word?style=social)](https://github.com/qalvinahmad/prohibited-word/stargazers)
[![Live Demo](https://img.shields.io/badge/demo-GitHub_Pages-blue?logo=github)](https://qalvinahmad.github.io/prohibited-word/)

Form profanity validation — **124 languages, ~56,700 words/phrases**,
locale + region + emoji + severity layers. Offline-first, one monorepo,
seven registries. **[Try the live demo](https://qalvinahmad.github.io/prohibited-word/)**.

| Package | Registry | Install |
|---|---|---|
| `packages/js` | [npm](https://www.npmjs.com/package/prohibited-word) | `npm install prohibited-word` |
| `packages/dart` | [pub.dev](https://pub.dev/packages/prohibited_word) | `dart pub add prohibited_word` |
| `packages/python` | [PyPI](https://pypi.org/project/prohibited-word/) | `pip install prohibited-word` |
| `packages/go` | [pkg.go.dev](https://pkg.go.dev/github.com/qalvinahmad/prohibited-word/packages/go) | `go get github.com/qalvinahmad/prohibited-word/packages/go` |
| `packages/go/cmd` | Homebrew (via tap) | `brew install qalvinahmad/tap/prohibited-word` |
| `packages/swift` | [SPM](https://github.com/qalvinahmad/prohibited-word/tags) + [CocoaPods](https://cocoapods.org/pods/ProhibitedWord) | `.package(url: ..., from: "0.1.0")` / `pod 'ProhibitedWord'` |

## Quick start

```js
import { validate, contains, censor } from 'prohibited-word';

validate('kamu anjing');
// { isValid: false, maxSeverity: 2,
//   found: [{ word: 'anjing', category: 'kasar', severity: 2, via: 'word', index: 5 }] }

contains('kamu 4nj1ng');                  // true  (leet-speak)
contains('a.n.j.i.n.g');                  // true  (separator evasion)
contains('halo apa kabar');               // false
contains('banget');                       // false (no Scunthorpe false-positives)
validate('kamu jancok', { locale: 'jv' });// 124 languages via locale
validate('good 👍', { locale: 'en-AU' }); // flagged — clean for en-US (region-aware emoji)
validate('anak yatim piatu', { locale: 'id-ID' }); // clean (regional override)
validate('kamu anjing', { minSeverity: 3 });       // severity threshold
censor('kamu anjing');                    // 'kamu ******'
```

Scope for precision: `{ lang: ['id', 'en'] }` or `{ locale: 'id-ID' }`.
Customize: `{ customWords: [...] }`, `{ whitelist: ['alay'] }` (built-in lists are aggressive by design).

Flutter:

```dart
String? validator(String? v) {
  final r = validate(v, locale: 'id-ID');
  if (r.isValid) return null;
  return 'Inappropriate word: ${r.found.map((f) => f.word).join(', ')}';
}
TextFormField(validator: validator);
```

## How it works

Single source of truth: `packages/core/words.json` (v3 schema) + `words-lite.json`
(id+en). Every language implements the same contract in
[`packages/core/NORMALIZER.md`](packages/core/NORMALIZER.md): trie matching with
word boundaries (upstream `safe_text` semantics) plus separator-skipping, so
evasion like `a.n.j.i.n.g` is caught without flagging innocent words like `banget`.

Regenerate data and sync all packages:

```bash
python3 scripts/import_safe_text.py
python3 scripts/sync.py
```

## Optional remote dataset updates

Bundled data works fully offline. To self-host updates:

```js
const u = await checkForUpdates('https://example.com/words.json');
if (u.updateAvailable) loadDataset(u.remoteDb);
```

Available in all five languages (`fetchDataset` / `checkForUpdates` / `loadDataset`).

## Contributing

PRs welcome — especially native-speaker reviews. Please read
[`docs/CONTRIBUTING-langs.md`](docs/CONTRIBUTING-langs.md) before adding words,
and keep [`NOTICE.md`](NOTICE.md) attribution intact (MIT requirement).

## Honest limitations

- 43 languages are `draft` / `seed-loanwords` and need native-speaker review.
- Cultural/regional claims carry per-entry `source`; unverified ones are marked
  "verify locally". Don't use this as your only moderation layer.
- Keycap / ZWJ emoji sequences are not fully supported yet.

## License

MIT — see [LICENSE](LICENSE). Third-party wordlist attribution in [NOTICE.md](NOTICE.md).
