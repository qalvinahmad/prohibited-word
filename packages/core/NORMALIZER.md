# Normalizer spec v3 (Wajib sama di semua bahasa)

Semantik inti mengikuti upstream `safe_text` (trie + word-boundary),
ditambah separator-skip, lapisan locale/region/emoji, dan severity.

## Normalisasi teks (kedua sisi: teks & kata)

1. `lowercase`
2. `fold`: NFKD + buang mark Latin U+0300–U+036F saja (aman untuk
   Arab/CJK/Thai/dll). Dart (tanpa NFKD std): fold aksen Latin umum.
3. `leet` (persis upstream): `@,4→a` `8→b` `(→c` `3→e` `1,!→i` `0→o`
   `$,5→s` `7,+→t` `v→u` `#→h`. TIDAK ada `l→i` (demi presisi).
4. `emoji-wrap`: karakter emoji diapit spasi agar jadi token sendiri.
   Deteksi: Extended_Pictographic (JS/Go-unicode/Dart-range/Swift),
   Python: kategori `So`. Keycap/ZWJ-sequence TIDAK didukung penuh.
5. Collapse spasi. Separator lain (titik, `_`, `*`) DIBIARKAN untuk
   boundary check — di-skip saat walk, bukan dihapus.

## Pola entri

`entryPattern = normalize(kata)` lalu buang semua kecuali huruf/angka/emoji:
`*fuck*`→`fuck`, `anak haram`→`anakharam`, `👍🏻`→`👍` (FE0F & skin-tone dibuang).
`displayForm` = potong simbol dekoratif tepi saja (untuk pesan error form).

## Matching (trie)

- Scan tiap posisi `i`: karakter alnum WAJIB melangkah di trie (gagal→stop);
  karakter non-alnum boleh di-skip ATAU dilangkahi bila child cocok
  (mendukung frasa, emoji, dan evasion `a.n.j.i.n.g`).
- Hit valid bila boundary kiri & kanan (tetangga bukan huruf/angka).
  Pola murni-emoji bebas boundary (tidak ada risiko Scunthorpe).
- Contoh: `kamu anjing` ✔, `4nj1ng` ✔, `a.n.j.i.n.g` ✔,
  `anak haram` ✔, `halo apa kabar` ✘, `banget` ✘, `kamuAnjing` ✘.
- Match yang sepenuhnya di dalam span lebih panjang dibuang.

## Locale / region / emoji / severity

- `locale: 'ar-SA'` → `lang=['ar']`, `region='SA'`
  (eksplisit `lang`/`region` menimpa locale).
- `regions[CC].remove` membuang pasangan kata-bahasa dari base;
  `.add` menambah (dibatasi scope `lang` bila ada).
- Emoji `offensiveIn:['*']` selalu aktif; regional hanya bila
  `region` cocok dengan locale.
- Tiap entri punya severity (default 2, slur berat 3);
  `minSeverity` memfilter, hasil membawa `maxSeverity` + `via`
  (`word`|`regional`|`emoji`|`custom`).

## Hasil & error handling

`validate()` → `{ isValid, maxSeverity, found[{word,category,severity,via,index}] }`.
`index` best-effort via `indexOf` (`-1` untuk leet/evasion).
Tidak pernah throw untuk input aneh. Cache trie per kombinasi opts (maks 32).

## Remote update (offline-first)

Dataset bawaan selalu offline. `fetchDataset(url)` + `checkForUpdates(url)` +
`loadDataset(db)` tersedia di 5 bahasa; format remote = words.json v3.
