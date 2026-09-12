# Menambah bahasa / region / emoji / simbol

Maturitas bahasa: `curated` (dari safe_text) → `regional` (varian + parent) →
`starter` (butuh review native) → `verified` (sudah direview native).

## Tambah kata ke bahasa yang ada

Edit `scripts/v3_data.py` + `scripts/v4_data.py`, atau kirim PR dengan:

1. Daftar kata + kategori (`profanity` default; `sexual/sara/violence/kasar`
   untuk yang jelas) + severity (default 2, slur berat 3) + opsional `conf`.
2. `source`: dari mana daftar berasal (kamus, penutur asli, URL).
3. Jalankan `python3 scripts/import_safe_text.py` + `python3 scripts/sync.py`,
   pastikan 5 tes paket tetap hijau.

## Bahasa baru

Jangan menandai `verified` tanpa review penutur asli — klaim budaya yang
keliru justru bisa menyinggung. Daftar self-claim tanpa sumber DITOLAK.

## Regional override / emoji / simbol

`REGIONS[CC]` (ISO country): `add`/`remove` kata + `note` + `source` WAJIB.
`remove` yang tidak cocok dengan data base DIBUANG dengan peringatan
(lihat output import) — ini proteksi anti-asumsi.
`EMOJI` dan `SYMBOLS`: `offensiveIn`/`regions` + `conf` (0..1) + `source`
WAJIB; entri yang tidak lengkap DIBUANG dengan peringatan.
Simbol hanya cocok sebagai token utuh (tidak pernah substring).
Default confidence: curated 0.7, regional 0.6, starter 0.4, verified 0.95.

## Checklist PR budaya/geospasial

- Ada sumber yang bisa dicek (bukan "katanya")? Confidence jujur (0.3-0.5
  untuk riset web, bukan 0.9)?
- Region ditulis sebagai country code + catatan, bukan stereotip?
- Tes `locale: 'xx-YY'` ditambahkan di 5 paket?
