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

| # | Language / Locale | Code | Coverage Tier | Words | Detail |
|---|---|---|---|---|---|
| 1 | Afrikaans | `af` | Tier 1 (Curated) | 256 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-af) |
| 2 | Albanian | `sq` | Tier 1 (Curated) | 179 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-sq) |
| 3 | Amharic | `am` | Tier 1 (Curated) | 50 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-am) |
| 4 | Arabic | `ar` | Tier 1 (Curated) | 1.271 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ar) |
| 5 | Armenian | `hy` | Tier 1 (Curated) | 267 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-hy) |
| 6 | Assamese | `as` | Tier 3 (Starter) | 6 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-as) |
| 7 | Azerbaijani | `az` | Tier 1 (Curated) | 37 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-az) |
| 8 | Basque | `eu` | Tier 1 (Curated) | 48 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-eu) |
| 9 | Belarusian | `be` | Tier 1 (Curated) | 118 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-be) |
| 10 | Bengali | `bn` | Tier 1 (Curated) | 11 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-bn) |
| 11 | Bosnian | `bs` | Tier 3 (Starter) | 7 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-bs) |
| 12 | Breton | `br` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-br) |
| 13 | Bulgarian | `bg` | Tier 1 (Curated) | 336 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-bg) |
| 14 | Burmese | `my` | Tier 1 (Curated) | 81 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-my) |
| 15 | Catalan | `ca` | Tier 1 (Curated) | 136 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ca) |
| 16 | Cebuano | `ceb` | Tier 1 (Curated) | 18 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ceb) |
| 17 | Corsican | `co` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-co) |
| 18 | Croatian | `hr` | Tier 1 (Curated) | 242 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-hr) |
| 19 | Czech | `cs` | Tier 1 (Curated) | 224 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-cs) |
| 20 | Danish | `da` | Tier 1 (Curated) | 185 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-da) |
| 21 | Dutch | `nl` | Tier 1 (Curated) | 1.224 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-nl) |
| 22 | Dutch (Belgium) | `nl-be` | Tier 2 (Regional) | 1.229 (5 + 1.224 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-nl-be) |
| 23 | English (UK) | `en-gb` | Tier 2 (Regional) | 12.674 (9 + 12.665 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-en-gb) |
| 24 | English (US) | `en-us` | Tier 1 (Curated) | 12.665 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-en-us) |
| 25 | English (Australia) | `en-au` | Tier 2 (Regional) | 12.671 (6 + 12.665 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-en-au) |
| 26 | English (Canada) | `en-ca` | Tier 2 (Regional) | 12.669 (4 + 12.665 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-en-ca) |
| 27 | English (India) | `en-in` | Tier 2 (Regional) | 12.671 (6 + 12.665 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-en-in) |
| 28 | English (Singapore) | `en-sg` | Tier 2 (Regional) | 12.672 (7 + 12.665 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-en-sg) |
| 29 | English (New Zealand) | `en-nz` | Tier 2 (Regional) | 12.669 (4 + 12.665 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-en-nz) |
| 30 | English (Ireland) | `en-ie` | Tier 2 (Regional) | 12.671 (6 + 12.665 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-en-ie) |
| 31 | English (South Africa) | `en-za` | Tier 2 (Regional) | 12.672 (7 + 12.665 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-en-za) |
| 32 | Esperanto | `eo` | Tier 1 (Curated) | 50 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-eo) |
| 33 | Estonian | `et` | Tier 1 (Curated) | 174 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-et) |
| 34 | Faroese | `fo` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-fo) |
| 35 | Filipino | `fil` | Tier 1 (Curated) | 165 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-fil) |
| 36 | Finnish | `fi` | Tier 1 (Curated) | 317 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-fi) |
| 37 | French (Canada) | `fr-ca` | Tier 2 (Regional) | 3.716 (8 + 3.708 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-fr-ca) |
| 38 | French (France) | `fr-fr` | Tier 1 (Curated) | 3.708 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-fr-fr) |
| 39 | Frisian | `fy` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-fy) |
| 40 | Fula | `ff` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ff) |
| 41 | Galician | `gl` | Tier 1 (Curated) | 74 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-gl) |
| 42 | Georgian | `ka` | Tier 3 (Starter) | 4 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ka) |
| 43 | German | `de` | Tier 1 (Curated) | 621 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-de) |
| 44 | Greek | `el` | Tier 1 (Curated) | 247 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-el) |
| 45 | Guarani | `gn` | Tier 3 (Starter) | 4 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-gn) |
| 46 | Gujarati | `gu` | Tier 1 (Curated) | 11 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-gu) |
| 47 | Haitian Creole | `ht` | Tier 3 (Starter) | 6 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ht) |
| 48 | Hausa | `ha` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ha) |
| 49 | Hebrew | `he` | Tier 3 (Starter) | 6 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-he) |
| 50 | Hindi | `hi` | Tier 1 (Curated) | 755 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-hi) |
| 51 | Hungarian | `hu` | Tier 1 (Curated) | 296 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-hu) |
| 52 | Icelandic | `is` | Tier 1 (Curated) | 137 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-is) |
| 53 | Indonesian | `id` | Tier 1 (Curated) | 582 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-id) |
| 54 | Irish | `ga` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ga) |
| 55 | Italian | `it` | Tier 1 (Curated) | 1.749 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-it) |
| 56 | Japanese | `ja` | Tier 1 (Curated) | 420 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ja) |
| 57 | Japanese (Kansai) | `ja-kansai` | Tier 2 (Regional) | 425 (5 + 420 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ja-kansai) |
| 58 | Javanese | `jv` | Tier 3 (Starter) | 21 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-jv) |
| 59 | Kannada | `kn` | Tier 1 (Curated) | 132 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-kn) |
| 60 | Kazakh | `kk` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-kk) |
| 61 | Khmer | `km` | Tier 1 (Curated) | 15 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-km) |
| 62 | Kinyarwanda | `rw` | Tier 3 (Starter) | 4 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-rw) |
| 63 | Korean | `ko` | Tier 1 (Curated) | 3.071 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ko) |
| 64 | Kurdish (Kurmanji) | `ku` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ku) |
| 65 | Kurdish (Sorani) | `ckb` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ckb) |
| 66 | Kyrgyz | `ky` | Tier 3 (Starter) | 4 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ky) |
| 67 | Lao | `lo` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-lo) |
| 68 | Latvian | `lv` | Tier 1 (Curated) | 198 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-lv) |
| 69 | Lithuanian | `lt` | Tier 1 (Curated) | 158 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-lt) |
| 70 | Macedonian | `mk` | Tier 1 (Curated) | 192 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-mk) |
| 71 | Malagasy | `mg` | Tier 3 (Starter) | 4 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-mg) |
| 72 | Malay | `ms` | Tier 1 (Curated) | 201 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ms) |
| 73 | Malayalam | `ml` | Tier 1 (Curated) | 388 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ml) |
| 74 | Maltese | `mt` | Tier 1 (Curated) | 132 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-mt) |
| 75 | Marathi | `mr` | Tier 1 (Curated) | 238 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-mr) |
| 76 | Mongolian | `mn` | Tier 1 (Curated) | 101 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-mn) |
| 77 | Nepali | `ne` | Tier 3 (Starter) | 6 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ne) |
| 78 | Norwegian (Bokmål) | `no` | Tier 1 (Curated) | 171 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-no) |
| 79 | Norwegian (Nynorsk) | `nn` | Tier 3 (Starter) | 178 (7 + 171 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-nn) |
| 80 | Odia | `or` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-or) |
| 81 | Pashto | `ps` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ps) |
| 82 | Persian | `fa` | Tier 1 (Curated) | 619 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-fa) |
| 83 | Polish | `pl` | Tier 1 (Curated) | 8.971 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-pl) |
| 84 | Portuguese (Brazil) | `pt-br` | Tier 2 (Regional) | 583 (8 + 575 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-pt-br) |
| 85 | Portuguese (Portugal) | `pt-pt` | Tier 1 (Curated) | 575 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-pt-pt) |
| 86 | Punjabi | `pa` | Tier 1 (Curated) | 16 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-pa) |
| 87 | Romanian | `ro` | Tier 1 (Curated) | 290 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ro) |
| 88 | Russian | `ru` | Tier 1 (Curated) | 4.948 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ru) |
| 89 | Sardinian | `sc` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-sc) |
| 90 | Serbian | `sr` | Tier 1 (Curated) | 459 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-sr) |
| 91 | Shona | `sn` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-sn) |
| 92 | Silesian | `szl` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-szl) |
| 93 | Simplified Chinese (China) | `zh-cn` | Tier 1 (Curated) | 1.554 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-zh-cn) |
| 94 | Sinhala | `si` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-si) |
| 95 | Slovak | `sk` | Tier 1 (Curated) | 586 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-sk) |
| 96 | Slovenian | `sl` | Tier 1 (Curated) | 167 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-sl) |
| 97 | Somali | `so` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-so) |
| 98 | Spanish | `es` | Tier 1 (Curated) | 1.651 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-es) |
| 99 | Spanish (Spain) | `es-es` | Tier 2 (Regional) | 1.658 (7 + 1.651 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-es-es) |
| 100 | Spanish (Latin America) | `es-419` | Tier 2 (Regional) | 1.658 (7 + 1.651 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-es-419) |
| 101 | Spanish (Mexico) | `es-mx` | Tier 2 (Regional) | 1.660 (9 + 1.651 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-es-mx) |
| 102 | Swahili | `sw` | Tier 1 (Curated) | 21 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-sw) |
| 103 | Swedish | `sv` | Tier 1 (Curated) | 245 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-sv) |
| 104 | Syriac | `syr` | Tier 3 (Starter) | 4 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-syr) |
| 105 | Tajik | `tg` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-tg) |
| 106 | Tamazight | `zgh` | Tier 3 (Starter) | 4 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-zgh) |
| 107 | Tamil | `ta` | Tier 1 (Curated) | 119 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ta) |
| 108 | Tatar | `tt` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-tt) |
| 109 | Telugu | `te` | Tier 1 (Curated) | 317 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-te) |
| 110 | Tetun | `tet` | Tier 1 (Curated) | 11 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-tet) |
| 111 | Thai | `th` | Tier 1 (Curated) | 1.715 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-th) |
| 112 | Traditional Chinese (Hong Kong) | `zh-hk` | Tier 2 (Regional) | 1.563 (9 + 1.554 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-zh-hk) |
| 113 | Traditional Chinese (Taiwan) | `zh-tw` | Tier 2 (Regional) | 1.563 (9 + 1.554 base) | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-zh-tw) |
| 114 | Turkish | `tr` | Tier 1 (Curated) | 370 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-tr) |
| 115 | Ukrainian | `uk` | Tier 1 (Curated) | 205 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-uk) |
| 116 | Urdu | `ur` | Tier 1 (Curated) | 19 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ur) |
| 117 | Uzbek | `uz` | Tier 1 (Curated) | 102 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-uz) |
| 118 | Vietnamese | `vi` | Tier 1 (Curated) | 790 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-vi) |
| 119 | Welsh | `cy` | Tier 1 (Curated) | 169 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-cy) |
| 120 | Zaza | `zza` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-zza) |
| 121 | Ainu | `ain` | Tier 3 (Starter) | 4 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ain) |
| 122 | Akan | `ak` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ak) |
| 123 | Aragonese | `an` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-an) |
| 124 | Aymara | `ay` | Tier 3 (Starter) | 3 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ay) |
| 125 | Balochi | `bal` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-bal) |
| 126 | Bambara | `bm` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-bm) |
| 127 | Bhojpuri | `bho` | Tier 3 (Starter) | 6 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-bho) |
| 128 | Dzongkha | `dz` | Tier 1 (Curated) | 86 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-dz) |
| 129 | Igbo | `ig` | Tier 3 (Starter) | 5 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-ig) |
| 130 | Yoruba | `yo` | Tier 3 (Starter) | 6 | [Detail](https://qalvinahmad.github.io/prohibited-word/#words-yo) |
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
