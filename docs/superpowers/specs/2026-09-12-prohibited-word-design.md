# prohibited-word — design spec

Tanggal: 2026-09-12. Pilihan user: Multilingual (id+en awal), normalisasi+leet, API boolean+detail, custom kata + kategori, arsitektur A (JSON source of truth + wrapper tipis).

## Arsitektur

`packages/core/words.json` = source of truth (`{word, lang, category}`). `NORMALIZER.md` = kontrak normalisasi wajib sama di 5 bahasa. `scripts/sync.py` generate list kata per bahasa dari words.json.

## Paket

| Folder | Registry | Nama |
|---|---|---|
| packages/js | npmjs.com | prohibited-word |
| packages/dart | pub.dev | prohibited_word |
| packages/python | pypi.org | prohibited-word |
| packages/go | pkg.go.dev | contoh: github.com/USER/prohibited-word/packages/go |
| packages/swift | SPM + CocoaPods | ProhibitedWord (+ .podspec) |
| Homebrew | brew.sh | formula tap → Go CLI binary `prohibited-word` |

## API seragam

- `contains(text, opts?) -> bool`
- `validate(text, opts?) -> {isValid, found[{word,category,index}]}`
- opts: categories, lang, customWords, whitelist

## Data flow (validasi form)

input form → normalize → token match vs wordlist (filter lang/category) → kurangi whitelist → return found[] → UI tampilkan error di bawah field.

## Error handling

Tidak pernah throw untuk input aneh (null → anggap valid/kosong). words.json invalid → throw sekali saat load dengan pesan jelas.

## Testing

Tiap paket: exact match, leet (`4nj1ng`), separator (`a.n.j.i.n.g`), case (`AnJiNg`), whitelist, kategori filter, customWords. Kata menempel (`kamuAnjing`) harus ketahuan.

## Publish (ringkas)

npm: `npm publish`; pub.dev: `dart pub publish`; PyPI: `python -m build + twine upload`; Go: tag git `go/vX.Y.Z` + pkg.go.dev otomatis; SPM: tag git; CocoaPods: `pod trunk push`; Brew: tap repo + formula rb → `brew install USER/tap/prohibited-word`.
