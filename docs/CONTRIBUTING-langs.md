# Menambah bahasa / region / emoji

Maturitas bahasa: `curated-upstream` (81, dari safe_text) →
`draft` (butuh review native) → `verified` (sudah direview native).
`seed-loanwords` = hanya loanword, belum ada daftar native.

## Tambah kata ke bahasa yang ada

Edit `scripts/v3_data.py` (untuk 43 bahasa baru) atau kirim PR dengan:

1. Daftar kata + kategori (`profanity` default; `sexual/sara/violence/kasar`
   untuk yang jelas) + severity (default 2, slur berat 3).
2. `source`: dari mana daftar berasal (kamus, penutur asli, URL).
3. Jalankan `python3 scripts/import_safe_text.py` + `python3 scripts/sync.py`,
   pastikan 5 tes paket tetap hijau.

## Bahasa baru

Tambahkan entri ke `EXTRA_LANGS` dengan `maturity: 'draft'` + `source` jujur.
Jangan menandai `verified` tanpa review penutur asli — klaim budaya yang
keliru justru bisa menyinggung. Script menolak data duplikat otomatis.

## Regional override / emoji

`REGIONS[CC]` (ISO country): `add`/`remove` kata + `note` + `source` WAJIB.
`remove` yang tidak cocok dengan data base DIBUANG dengan peringatan
(lihat output import) — ini proteksi anti-asumsi.
`EMOJI`: `offensiveIn: ['*']` (universal) atau country code + `source`.

## Checklist PR budaya/geospasial

- Ada sumber yang bisa dicek (bukan "katanya")?
- Region ditulis sebagai country code + catatan, bukan stereotip?
- Tes `locale: 'xx-YY'` ditambahkan di 5 paket?
