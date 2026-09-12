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
locale + region + emoji + symbols + severity + **confidence** layers.
Offline-first, one monorepo,
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

validate('piss off');
// { isValid: false, maxSeverity: 2,
//   found: [{ word: 'piss off', category: 'profanity', severity: 2, via: 'word', confidence: 0.7, index: 0 }] }

contains('you are sh1t');                   // true  (leet-speak)
contains('f.u.c.k you');                    // true  (separator evasion)
contains('hello how are you');              // false
contains('Scunthorpe');                     // false (no Scunthorpe false-positives)
validate('good 👍', { locale: 'en-AU' }); // flagged — clean for en-US (region-aware emoji)
validate('you are a bastard', { minSeverity: 3 });    // clean (severity threshold)
validate('shut up bitch', { minConfidence: 0.8 });    // clean (confidence threshold 0..1 per hit)
validate('meeting room 13', { locale: 'en-US' }); // needsReview (standalone symbols 4/9/13/17/666 by region)
censor('shut up bitch');                    // '**** up *****'
```

## Detector layers (donation & community apps)

Default is profanity-only. Opt in per layer:

```js
validate('call +14155552671', { detectors: ['pii'] }); // phone/email/SSN/passport/bank/card
validate('contact j o h n [at] gmail [dot] com', { detectors: ['pii'] }); // obfuscation-aware
validate('transfer directly to this account', { detectors: ['scam'] }); // +crypto wallets, payment links
validate('i want to kill myself', { detectors: ['sensitive'] }); // -> needsHelp (not just block)
validate('claim your online casino bonus', { detectors: ['sensitive'] }); // gambling -> block
// { isValid, needsReview, needsHelp, maxSeverity, found: [{detector, type, action, confidence, ...}] }
```

Actions: `block` (isValid=false), `review` (needsReview, e.g. urgency/fraud language,
grooming, off-platform contact, cultural symbols), `help` (needsHelp — self-harm
triggers a help response, never just a sensor). Filter granularity with
`types: ['phone', 'self_harm']`. PII patterns use checksum validation where
possible (Luhn for cards, province+date for Indonesian NIK).

Scope for precision: `{ lang: ['en', 'es'] }` or `{ locale: 'en-US' }`.
Customize: `{ customWords: [...] }`, `{ whitelist: [...] }` (built-in lists are aggressive by design).

Flutter:

```dart
String? validator(String? v) {
  final r = validate(v, locale: 'en-US');
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

| # | Language / Locale | Code | Coverage Tier | Words |
|---|---|---|---|---|
| 1 | Afrikaans | `af` | Tier 1 (Curated) | 256 |
| 2 | Albanian | `sq` | Tier 1 (Curated) | 179 |
| 3 | Amharic | `am` | Tier 1 (Curated) | 50 |
| 4 | Arabic | `ar` | Tier 1 (Curated) | 1.271 |
| 5 | Armenian | `hy` | Tier 1 (Curated) | 267 |
| 6 | Assamese | `as` | Tier 3 (Starter) | 6 |
| 7 | Azerbaijani | `az` | Tier 1 (Curated) | 37 |
| 8 | Basque | `eu` | Tier 1 (Curated) | 48 |
| 9 | Belarusian | `be` | Tier 1 (Curated) | 118 |
| 10 | Bengali | `bn` | Tier 1 (Curated) | 11 |
| 11 | Bosnian | `bs` | Tier 3 (Starter) | 7 |
| 12 | Breton | `br` | Tier 3 (Starter) | 5 |
| 13 | Bulgarian | `bg` | Tier 1 (Curated) | 336 |
| 14 | Burmese | `my` | Tier 1 (Curated) | 81 |
| 15 | Catalan | `ca` | Tier 1 (Curated) | 136 |
| 16 | Cebuano | `ceb` | Tier 1 (Curated) | 18 |
| 17 | Corsican | `co` | Tier 3 (Starter) | 5 |
| 18 | Croatian | `hr` | Tier 1 (Curated) | 242 |
| 19 | Czech | `cs` | Tier 1 (Curated) | 224 |
| 20 | Danish | `da` | Tier 1 (Curated) | 185 |
| 21 | Dutch | `nl` | Tier 1 (Curated) | 1.224 |
| 22 | Dutch (Belgium) | `nl-be` | Tier 2 (Regional) | 1.229 (5 + 1.224 base) |
| 23 | English (UK) | `en-gb` | Tier 2 (Regional) | 12.674 (9 + 12.665 base) |
| 24 | English (US) | `en-us` | Tier 1 (Curated) | 12.665 |
| 25 | English (Australia) | `en-au` | Tier 2 (Regional) | 12.671 (6 + 12.665 base) |
| 26 | English (Canada) | `en-ca` | Tier 2 (Regional) | 12.669 (4 + 12.665 base) |
| 27 | English (India) | `en-in` | Tier 2 (Regional) | 12.671 (6 + 12.665 base) |
| 28 | English (Singapore) | `en-sg` | Tier 2 (Regional) | 12.672 (7 + 12.665 base) |
| 29 | English (New Zealand) | `en-nz` | Tier 2 (Regional) | 12.669 (4 + 12.665 base) |
| 30 | English (Ireland) | `en-ie` | Tier 2 (Regional) | 12.671 (6 + 12.665 base) |
| 31 | English (South Africa) | `en-za` | Tier 2 (Regional) | 12.672 (7 + 12.665 base) |
| 32 | Esperanto | `eo` | Tier 1 (Curated) | 50 |
| 33 | Estonian | `et` | Tier 1 (Curated) | 174 |
| 34 | Faroese | `fo` | Tier 3 (Starter) | 5 |
| 35 | Filipino | `fil` | Tier 1 (Curated) | 165 |
| 36 | Finnish | `fi` | Tier 1 (Curated) | 317 |
| 37 | French (Canada) | `fr-ca` | Tier 2 (Regional) | 3.716 (8 + 3.708 base) |
| 38 | French (France) | `fr-fr` | Tier 1 (Curated) | 3.708 |
| 39 | Frisian | `fy` | Tier 3 (Starter) | 5 |
| 40 | Fula | `ff` | Tier 3 (Starter) | 5 |
| 41 | Galician | `gl` | Tier 1 (Curated) | 74 |
| 42 | Georgian | `ka` | Tier 3 (Starter) | 4 |
| 43 | German | `de` | Tier 1 (Curated) | 621 |
| 44 | Greek | `el` | Tier 1 (Curated) | 247 |
| 45 | Guarani | `gn` | Tier 3 (Starter) | 4 |
| 46 | Gujarati | `gu` | Tier 1 (Curated) | 11 |
| 47 | Haitian Creole | `ht` | Tier 3 (Starter) | 6 |
| 48 | Hausa | `ha` | Tier 3 (Starter) | 5 |
| 49 | Hebrew | `he` | Tier 3 (Starter) | 6 |
| 50 | Hindi | `hi` | Tier 1 (Curated) | 755 |
| 51 | Hungarian | `hu` | Tier 1 (Curated) | 296 |
| 52 | Icelandic | `is` | Tier 1 (Curated) | 137 |
| 53 | Indonesian | `id` | Tier 1 (Curated) | 582 |
| 54 | Irish | `ga` | Tier 3 (Starter) | 5 |
| 55 | Italian | `it` | Tier 1 (Curated) | 1.749 |
| 56 | Japanese | `ja` | Tier 1 (Curated) | 420 |
| 57 | Japanese (Kansai) | `ja-kansai` | Tier 2 (Regional) | 425 (5 + 420 base) |
| 58 | Javanese | `jv` | Tier 3 (Starter) | 21 |
| 59 | Kannada | `kn` | Tier 1 (Curated) | 132 |
| 60 | Kazakh | `kk` | Tier 3 (Starter) | 5 |
| 61 | Khmer | `km` | Tier 1 (Curated) | 15 |
| 62 | Kinyarwanda | `rw` | Tier 3 (Starter) | 4 |
| 63 | Korean | `ko` | Tier 1 (Curated) | 3.071 |
| 64 | Kurdish (Kurmanji) | `ku` | Tier 3 (Starter) | 5 |
| 65 | Kurdish (Sorani) | `ckb` | Tier 3 (Starter) | 5 |
| 66 | Kyrgyz | `ky` | Tier 3 (Starter) | 4 |
| 67 | Lao | `lo` | Tier 3 (Starter) | 5 |
| 68 | Latvian | `lv` | Tier 1 (Curated) | 198 |
| 69 | Lithuanian | `lt` | Tier 1 (Curated) | 158 |
| 70 | Macedonian | `mk` | Tier 1 (Curated) | 192 |
| 71 | Malagasy | `mg` | Tier 3 (Starter) | 4 |
| 72 | Malay | `ms` | Tier 1 (Curated) | 201 |
| 73 | Malayalam | `ml` | Tier 1 (Curated) | 388 |
| 74 | Maltese | `mt` | Tier 1 (Curated) | 132 |
| 75 | Marathi | `mr` | Tier 1 (Curated) | 238 |
| 76 | Mongolian | `mn` | Tier 1 (Curated) | 101 |
| 77 | Nepali | `ne` | Tier 3 (Starter) | 6 |
| 78 | Norwegian (Bokmål) | `no` | Tier 1 (Curated) | 171 |
| 79 | Norwegian (Nynorsk) | `nn` | Tier 3 (Starter) | 178 (7 + 171 base) |
| 80 | Odia | `or` | Tier 3 (Starter) | 5 |
| 81 | Pashto | `ps` | Tier 3 (Starter) | 5 |
| 82 | Persian | `fa` | Tier 1 (Curated) | 619 |
| 83 | Polish | `pl` | Tier 1 (Curated) | 8.971 |
| 84 | Portuguese (Brazil) | `pt-br` | Tier 2 (Regional) | 583 (8 + 575 base) |
| 85 | Portuguese (Portugal) | `pt-pt` | Tier 1 (Curated) | 575 |
| 86 | Punjabi | `pa` | Tier 1 (Curated) | 16 |
| 87 | Romanian | `ro` | Tier 1 (Curated) | 290 |
| 88 | Russian | `ru` | Tier 1 (Curated) | 4.948 |
| 89 | Sardinian | `sc` | Tier 3 (Starter) | 5 |
| 90 | Serbian | `sr` | Tier 1 (Curated) | 459 |
| 91 | Shona | `sn` | Tier 3 (Starter) | 5 |
| 92 | Silesian | `szl` | Tier 3 (Starter) | 5 |
| 93 | Simplified Chinese (China) | `zh-cn` | Tier 1 (Curated) | 1.554 |
| 94 | Sinhala | `si` | Tier 3 (Starter) | 5 |
| 95 | Slovak | `sk` | Tier 1 (Curated) | 586 |
| 96 | Slovenian | `sl` | Tier 1 (Curated) | 167 |
| 97 | Somali | `so` | Tier 3 (Starter) | 5 |
| 98 | Spanish | `es` | Tier 1 (Curated) | 1.651 |
| 99 | Spanish (Spain) | `es-es` | Tier 2 (Regional) | 1.658 (7 + 1.651 base) |
| 100 | Spanish (Latin America) | `es-419` | Tier 2 (Regional) | 1.658 (7 + 1.651 base) |
| 101 | Spanish (Mexico) | `es-mx` | Tier 2 (Regional) | 1.660 (9 + 1.651 base) |
| 102 | Swahili | `sw` | Tier 1 (Curated) | 21 |
| 103 | Swedish | `sv` | Tier 1 (Curated) | 245 |
| 104 | Syriac | `syr` | Tier 3 (Starter) | 4 |
| 105 | Tajik | `tg` | Tier 3 (Starter) | 5 |
| 106 | Tamazight | `zgh` | Tier 3 (Starter) | 4 |
| 107 | Tamil | `ta` | Tier 1 (Curated) | 119 |
| 108 | Tatar | `tt` | Tier 3 (Starter) | 5 |
| 109 | Telugu | `te` | Tier 1 (Curated) | 317 |
| 110 | Tetun | `tet` | Tier 1 (Curated) | 11 |
| 111 | Thai | `th` | Tier 1 (Curated) | 1.715 |
| 112 | Traditional Chinese (Hong Kong) | `zh-hk` | Tier 2 (Regional) | 1.563 (9 + 1.554 base) |
| 113 | Traditional Chinese (Taiwan) | `zh-tw` | Tier 2 (Regional) | 1.563 (9 + 1.554 base) |
| 114 | Turkish | `tr` | Tier 1 (Curated) | 370 |
| 115 | Ukrainian | `uk` | Tier 1 (Curated) | 205 |
| 116 | Urdu | `ur` | Tier 1 (Curated) | 19 |
| 117 | Uzbek | `uz` | Tier 1 (Curated) | 102 |
| 118 | Vietnamese | `vi` | Tier 1 (Curated) | 790 |
| 119 | Welsh | `cy` | Tier 1 (Curated) | 169 |
| 120 | Zaza | `zza` | Tier 3 (Starter) | 5 |
| 121 | Ainu | `ain` | Tier 3 (Starter) | 4 |
| 122 | Akan | `ak` | Tier 3 (Starter) | 5 |
| 123 | Aragonese | `an` | Tier 3 (Starter) | 5 |
| 124 | Aymara | `ay` | Tier 3 (Starter) | 3 |
| 125 | Balochi | `bal` | Tier 3 (Starter) | 5 |
| 126 | Bambara | `bm` | Tier 3 (Starter) | 5 |
| 127 | Bhojpuri | `bho` | Tier 3 (Starter) | 6 |
| 128 | Dzongkha | `dz` | Tier 1 (Curated) | 86 |
| 129 | Igbo | `ig` | Tier 3 (Starter) | 5 |
| 130 | Yoruba | `yo` | Tier 3 (Starter) | 6 |
</details>

> Words = effective entries per locale. Regional rows show `own (+ base inherited)`,
> e.g. `en-au` ships 6 Australian terms on top of the 12,665-word `en-us` base.
> Regenerate this table with `scripts/lang_table.py` after dataset changes.

## How it works

Single source of truth: `packages/core/words.json` (v4 schema) + `words-lite.json`
(id+en-us). Every language implements the same contract in
[`packages/core/NORMALIZER.md`](packages/core/NORMALIZER.md): trie matching with
word boundaries (upstream `safe_text` semantics) plus separator-skipping, so
evasion like `f.u.c.k` is caught without flagging innocent words like `Scunthorpe`.
Every hit carries `confidence` (tier-based defaults, per-entry overrides);
standalone number/symbol tokens (`4`, `13`, `666`) only match whole tokens in
matching regions, never substrings.

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
- Cultural and regional claims carry a per-entry `source` **and** `confidence`;
  unverified entries are marked "verify locally". Filter by `minConfidence`
  to tune strictness instead of trusting booleans blindly.
- Keycap / ZWJ emoji sequences are not fully supported yet.
- Rule-based profanity filters should be complemented by contextual review for critical moderation workflows.

## License

MIT — see [LICENSE](LICENSE). Third-party wordlist attribution in [NOTICE.md](NOTICE.md).
