"""Data v5: detector layers (pii / scam / sensitive) — frasa ID+EN starter.

Setiap frasa WAJIB: t (teks), lang, conf (0..1), src.
Import membuang yang tak lengkap + warning. Semua di sini draft —
butuh review native & domain (donasi/komunitas).
SRC = "v5 curated draft — needs native/domain review".
"""

SRC = "v5 curated draft — needs native/domain review"

# detector -> type -> action
ACTIONS = {
    "scam_direct_transfer": ("scam", "block"),
    "scam_urgency": ("scam", "review"),
    "sensitive_self_harm": ("sensitive", "help"),
    "sensitive_gambling": ("sensitive", "block"),
    "sensitive_grooming": ("sensitive", "review"),
    "sensitive_offplatform": ("sensitive", "review"),
    "sensitive_spam": ("sensitive", "review"),
}

PHRASES = {
    "scam_direct_transfer": [
        ("transfer langsung ke", "id", 0.6), ("kirim ke rekening", "id", 0.6),
        ("transfer ke rekening ini", "id", 0.65), ("donasi langsung ke", "id", 0.6),
        ("kirim donasi ke", "id", 0.55), ("transfer aja ke", "id", 0.6),
        ("bayar langsung ke", "id", 0.55),
        ("transfer directly to", "en-us", 0.6), ("send to my account", "en-us", 0.6),
        ("donate directly to", "en-us", 0.55), ("send money to", "en-us", 0.5),
        ("wire to", "en-us", 0.5),
    ],
    "scam_urgency": [
        ("mendesak", "id", 0.45), ("butuh cepat", "id", 0.5),
        ("segera donasi", "id", 0.5), ("tolong sebarkan", "id", 0.45),
        ("butuh dana cepat", "id", 0.55), ("waktu menipis", "id", 0.5),
        ("kritis butuh", "id", 0.5), ("mohon bantu sebarkan", "id", 0.45),
        ("urgent", "en-us", 0.4), ("act now", "en-us", 0.45),
        ("limited time", "en-us", 0.4), ("desperately need", "en-us", 0.5),
        ("please share", "en-us", 0.4), ("running out of time", "en-us", 0.45),
        ("critical need", "en-us", 0.45),
    ],
    "sensitive_self_harm": [
        ("bunuh diri", "id", 0.7), ("mau mati aja", "id", 0.65),
        ("pengen mati", "id", 0.65), ("mengakhiri hidup", "id", 0.7),
        ("sayat tangan", "id", 0.7), ("minum racun", "id", 0.6),
        ("gantung diri", "id", 0.7), ("tidak ingin hidup", "id", 0.65),
        ("kill myself", "en-us", 0.7), ("want to die", "en-us", 0.65),
        ("end my life", "en-us", 0.7), ("commit suicide", "en-us", 0.7),
        ("self harm", "en-us", 0.65), ("cut myself", "en-us", 0.65),
        ("hang myself", "en-us", 0.7),
    ],
    "sensitive_gambling": [
        ("slot gacor", "id", 0.65), ("situs gacor", "id", 0.6),
        ("link alternatif", "id", 0.5), ("maxwin", "id", 0.6),
        ("togel", "id", 0.6), ("judol", "id", 0.7),
        ("deposit pulsa", "id", 0.55), ("rtp live", "id", 0.6),
        ("pola gacor", "id", 0.6), ("bandar togel", "id", 0.65),
        ("online casino", "en-us", 0.55), ("bet now", "en-us", 0.5),
        ("free spins", "en-us", 0.5), ("deposit bonus", "en-us", 0.5),
    ],
    "sensitive_grooming": [
        ("ketemu langsung", "id", 0.55), ("jangan bilang siapa", "id", 0.6),
        ("rahasia kita", "id", 0.55), ("kirim foto", "id", 0.5),
        ("video call yuk", "id", 0.5), ("ketemuan yuk", "id", 0.55),
        ("alamat rumah kamu", "id", 0.55), ("jemput kamu", "id", 0.55),
        ("meet in person", "en-us", 0.5), ("don't tell anyone", "en-us", 0.55),
        ("our secret", "en-us", 0.5), ("send pics", "en-us", 0.5),
        ("meet up", "en-us", 0.45), ("pick you up", "en-us", 0.5),
    ],
    "sensitive_offplatform": [
        ("chat wa aja", "id", 0.6), ("lanjut wa", "id", 0.6),
        ("hubungi wa", "id", 0.55), ("nomor wa", "id", 0.55),
        ("chat pribadi", "id", 0.5), ("kontak pribadi", "id", 0.55),
        ("chat on whatsapp", "en-us", 0.55), ("dm me", "en-us", 0.5),
        ("contact me privately", "en-us", 0.55), ("whatsapp me", "en-us", 0.55),
        ("message me privately", "en-us", 0.5),
    ],
    "sensitive_spam": [
        ("klik link ini", "id", 0.5), ("cuan cepat", "id", 0.55),
        ("penghasilan pasif", "id", 0.5), ("daftar sekarang dapat bonus", "id", 0.5),
        ("click this link", "en-us", 0.45), ("limited promo", "en-us", 0.45),
        ("earn fast", "en-us", 0.45), ("make money fast", "en-us", 0.45),
    ],
}
