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

Form profanity validation — **130 languages & locales, ~56,000 words/phrases**,
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
validate('kamu jancok', { locale: 'jv' });// Javanese regional support
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

## Supported languages & locales (130)

To avoid overclaiming and ensure reliability, dataset coverage is categorized into three transparent tiers:

* **Tier 1 — Curated High Coverage**: Core international languages with hundreds to thousands of verified words and phrases (e.g. English, Indonesian, Spanish, French, Arabic, Chinese, German, Russian, Japanese, Korean).
* **Tier 2 — Regional Locales & Dialects**: Regional variations (e.g. English UK/US/AU/CA/IN/SG/NZ/IE/ZA, Spanish Spain/Mexico/Latin America, Traditional Chinese HK/TW, Portuguese Brazil/Portugal, Dutch Belgium, Japanese Kansai) that inherit base vocabularies with dialect-specific terms and regional rules.
* **Tier 3 — Community Starter**: Curated starter wordlists for lower-resource and regional languages (including Javanese, Bhojpuri, Hausa, Kurdish Sorani, etc.), clearly disclosed and open for native-speaker refinement.

> [!NOTE]
> **Indonesian regional languages**: For Indonesian regional languages, this library currently **only supports Javanese (`jv`)**. Other regional drafts have been removed to ensure accuracy and prevent false confidence.

<details>
<summary><b>Click to expand full list of 130 supported languages & locales</b></summary>

| # | Language / Locale | Code | Coverage Tier |
|---|---|---|---|
| 1 | Afrikaans | `af` | Tier 1 (Curated) |
| 2 | Albanian | `sq` | Tier 1 (Curated) |
| 3 | Amharic | `am` | Tier 1 (Curated) |
| 4 | Arabic | `ar` | Tier 1 (Curated) |
| 5 | Armenian | `hy` | Tier 1 (Curated) |
| 6 | Assamese | `as` | Tier 3 (Starter) |
| 7 | Azerbaijani | `az` | Tier 1 (Curated) |
| 8 | Basque | `eu` | Tier 1 (Curated) |
| 9 | Belarusian | `be` | Tier 1 (Curated) |
| 10 | Bengali | `bn` | Tier 1 (Curated) |
| 11 | Bosnian | `bs` | Tier 3 (Starter) |
| 12 | Breton | `br` | Tier 3 (Starter) |
| 13 | Bulgarian | `bg` | Tier 1 (Curated) |
| 14 | Burmese | `my` | Tier 1 (Curated) |
| 15 | Catalan | `ca` | Tier 1 (Curated) |
| 16 | Cebuano | `ceb` | Tier 1 (Curated) |
| 17 | Corsican | `co` | Tier 3 (Starter) |
| 18 | Croatian | `hr` | Tier 1 (Curated) |
| 19 | Czech | `cs` | Tier 1 (Curated) |
| 20 | Danish | `da` | Tier 1 (Curated) |
| 21 | Dutch | `nl` | Tier 1 (Curated) |
| 22 | Dutch (Belgium) | `nl-be` | Tier 2 (Regional) |
| 23 | English (UK) | `en-gb` | Tier 2 (Regional) |
| 24 | English (US) | `en-us` | Tier 1 (Curated) |
| 25 | English (Australia) | `en-au` | Tier 2 (Regional) |
| 26 | English (Canada) | `en-ca` | Tier 2 (Regional) |
| 27 | English (India) | `en-in` | Tier 2 (Regional) |
| 28 | English (Singapore) | `en-sg` | Tier 2 (Regional) |
| 29 | English (New Zealand) | `en-nz` | Tier 2 (Regional) |
| 30 | English (Ireland) | `en-ie` | Tier 2 (Regional) |
| 31 | English (South Africa) | `en-za` | Tier 2 (Regional) |
| 32 | Esperanto | `eo` | Tier 1 (Curated) |
| 33 | Estonian | `et` | Tier 1 (Curated) |
| 34 | Faroese | `fo` | Tier 3 (Starter) |
| 35 | Filipino | `fil` | Tier 1 (Curated) |
| 36 | Finnish | `fi` | Tier 1 (Curated) |
| 37 | French (Canada) | `fr-ca` | Tier 2 (Regional) |
| 38 | French (France) | `fr-fr` | Tier 1 (Curated) |
| 39 | Frisian | `fy` | Tier 3 (Starter) |
| 40 | Fula | `ff` | Tier 3 (Starter) |
| 41 | Galician | `gl` | Tier 1 (Curated) |
| 42 | Georgian | `ka` | Tier 3 (Starter) |
| 43 | German | `de` | Tier 1 (Curated) |
| 44 | Greek | `el` | Tier 1 (Curated) |
| 45 | Guarani | `gn` | Tier 3 (Starter) |
| 46 | Gujarati | `gu` | Tier 1 (Curated) |
| 47 | Haitian Creole | `ht` | Tier 3 (Starter) |
| 48 | Hausa | `ha` | Tier 3 (Starter) |
| 49 | Hebrew | `he` | Tier 3 (Starter) |
| 50 | Hindi | `hi` | Tier 1 (Curated) |
| 51 | Hungarian | `hu` | Tier 1 (Curated) |
| 52 | Icelandic | `is` | Tier 1 (Curated) |
| 53 | Indonesian | `id` | Tier 1 (Curated) |
| 54 | Irish | `ga` | Tier 3 (Starter) |
| 55 | Italian | `it` | Tier 1 (Curated) |
| 56 | Japanese | `ja` | Tier 1 (Curated) |
| 57 | Japanese (Kansai) | `ja-kansai` | Tier 2 (Regional) |
| 58 | Javanese | `jv` | Tier 3 (Starter) |
| 59 | Kannada | `kn` | Tier 1 (Curated) |
| 60 | Kazakh | `kk` | Tier 3 (Starter) |
| 61 | Khmer | `km` | Tier 1 (Curated) |
| 62 | Kinyarwanda | `rw` | Tier 3 (Starter) |
| 63 | Korean | `ko` | Tier 1 (Curated) |
| 64 | Kurdish (Kurmanji) | `ku` | Tier 3 (Starter) |
| 65 | Kurdish (Sorani) | `ckb` | Tier 3 (Starter) |
| 66 | Kyrgyz | `ky` | Tier 3 (Starter) |
| 67 | Lao | `lo` | Tier 3 (Starter) |
| 68 | Latvian | `lv` | Tier 1 (Curated) |
| 69 | Lithuanian | `lt` | Tier 1 (Curated) |
| 70 | Macedonian | `mk` | Tier 1 (Curated) |
| 71 | Malagasy | `mg` | Tier 3 (Starter) |
| 72 | Malay | `ms` | Tier 1 (Curated) |
| 73 | Malayalam | `ml` | Tier 1 (Curated) |
| 74 | Maltese | `mt` | Tier 1 (Curated) |
| 75 | Marathi | `mr` | Tier 1 (Curated) |
| 76 | Mongolian | `mn` | Tier 1 (Curated) |
| 77 | Nepali | `ne` | Tier 3 (Starter) |
| 78 | Norwegian (Bokmål) | `no` | Tier 1 (Curated) |
| 79 | Norwegian (Nynorsk) | `nn` | Tier 3 (Starter) |
| 80 | Odia | `or` | Tier 3 (Starter) |
| 81 | Pashto | `ps` | Tier 3 (Starter) |
| 82 | Persian | `fa` | Tier 1 (Curated) |
| 83 | Polish | `pl` | Tier 1 (Curated) |
| 84 | Portuguese (Brazil) | `pt-br` | Tier 2 (Regional) |
| 85 | Portuguese (Portugal) | `pt-pt` | Tier 1 (Curated) |
| 86 | Punjabi | `pa` | Tier 1 (Curated) |
| 87 | Romanian | `ro` | Tier 1 (Curated) |
| 88 | Russian | `ru` | Tier 1 (Curated) |
| 89 | Sardinian | `sc` | Tier 3 (Starter) |
| 90 | Serbian | `sr` | Tier 1 (Curated) |
| 91 | Shona | `sn` | Tier 3 (Starter) |
| 92 | Silesian | `szl` | Tier 3 (Starter) |
| 93 | Simplified Chinese (China) | `zh-cn` | Tier 1 (Curated) |
| 94 | Sinhala | `si` | Tier 3 (Starter) |
| 95 | Slovak | `sk` | Tier 1 (Curated) |
| 96 | Slovenian | `sl` | Tier 1 (Curated) |
| 97 | Somali | `so` | Tier 3 (Starter) |
| 98 | Spanish | `es` | Tier 1 (Curated) |
| 99 | Spanish (Spain) | `es-es` | Tier 2 (Regional) |
| 100 | Spanish (Latin America) | `es-419` | Tier 2 (Regional) |
| 101 | Spanish (Mexico) | `es-mx` | Tier 2 (Regional) |
| 102 | Swahili | `sw` | Tier 1 (Curated) |
| 103 | Swedish | `sv` | Tier 1 (Curated) |
| 104 | Syriac | `syr` | Tier 3 (Starter) |
| 105 | Tajik | `tg` | Tier 3 (Starter) |
| 106 | Tamazight | `zgh` | Tier 3 (Starter) |
| 107 | Tamil | `ta` | Tier 1 (Curated) |
| 108 | Tatar | `tt` | Tier 3 (Starter) |
| 109 | Telugu | `te` | Tier 1 (Curated) |
| 110 | Tetun | `tet` | Tier 1 (Curated) |
| 111 | Thai | `th` | Tier 1 (Curated) |
| 112 | Traditional Chinese (Hong Kong) | `zh-hk` | Tier 2 (Regional) |
| 113 | Traditional Chinese (Taiwan) | `zh-tw` | Tier 2 (Regional) |
| 114 | Turkish | `tr` | Tier 1 (Curated) |
| 115 | Ukrainian | `uk` | Tier 1 (Curated) |
| 116 | Urdu | `ur` | Tier 1 (Curated) |
| 117 | Uzbek | `uz` | Tier 1 (Curated) |
| 118 | Vietnamese | `vi` | Tier 1 (Curated) |
| 119 | Welsh | `cy` | Tier 1 (Curated) |
| 120 | Zaza | `zza` | Tier 3 (Starter) |
| 121 | Ainu | `ain` | Tier 3 (Starter) |
| 122 | Akan | `ak` | Tier 3 (Starter) |
| 123 | Aragonese | `an` | Tier 3 (Starter) |
| 124 | Aymara | `ay` | Tier 3 (Starter) |
| 125 | Balochi | `bal` | Tier 3 (Starter) |
| 126 | Bambara | `bm` | Tier 3 (Starter) |
| 127 | Bhojpuri | `bho` | Tier 3 (Starter) |
| 128 | Dzongkha | `dz` | Tier 1 (Curated) |
| 129 | Igbo | `ig` | Tier 3 (Starter) |
| 130 | Yoruba | `yo` | Tier 3 (Starter) |

</details>

## How it works

Single source of truth: `packages/core/words.json` (v3 schema) + `words-lite.json`
(id+en-us). Every language implements the same contract in
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

- **Tier 3 languages** have starter vocabularies and need native-speaker contributions.
- Cultural and regional claims carry a per-entry `source`; unverified entries are marked "verify locally".
- Keycap / ZWJ emoji sequences are not fully supported yet.
- Rule-based profanity filters should be complemented by contextual review for critical moderation workflows.

## License

MIT — see [LICENSE](LICENSE). Third-party wordlist attribution in [NOTICE.md](NOTICE.md).
