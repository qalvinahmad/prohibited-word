"""Data v4: kepercayaan + data budaya (riset web) + simbol standalone.

Prinsip reliabilitas (keluhan pengguna: data self-claim tidak reliabel):
- Setiap klaim budaya/regional WAJIB 'source'.
- Setiap entri regional/emoji/simbol WAJIB 'conf' (0..1).
- Entri kata memakai conf default dari maturitas bahasanya,
  kecuali override eksplisit 'conf' pada entrinya.
- Import memvalidasi: remove yang tak cocok DIBUANG + warning;
  entri tanpa source/conf DIBUANG + warning (bukan asumsi diam-diam).

Default confidence per maturitas:
  curated 0.7 | regional 0.6 | starter 0.4 | verified 0.95
"""

MATURITY_CONF = {
    "curated": 0.7, "regional": 0.6, "starter": 0.4, "verified": 0.95,
}

# Region baru/tambahan v4 (note + source wajib; add/remove opsional).
REGIONS_EXTRA = {
    "GB": {"note": "V-sign palm-inward equals middle finger; floor 13 often skipped",
           "source": "web research — verify locally", "add": [], "remove": []},
    "US": {"note": "floor 13 often skipped; V-sign palm-inward offensive",
           "source": "web research — verify locally", "add": [], "remove": []},
    "CA": {"note": "", "source": "variant label only", "add": [], "remove": []},
    "IN": {"note": "cow is sacred in Hinduism; casual cow references can offend",
           "source": "general cultural knowledge — verify locally", "add": [], "remove": []},
    "SG": {"note": "palm-up beckoning reads as death symbol; index pointing rude",
           "source": "web research — verify locally", "add": [], "remove": []},
    "NZ": {"note": "V-sign palm-inward offensive", "source": "web research — verify locally",
           "add": [], "remove": []},
    "IE": {"note": "V-sign palm-inward offensive", "source": "web research — verify locally",
           "add": [], "remove": []},
    "ZA": {"note": "V-sign palm-inward offensive", "source": "web research — verify locally",
           "add": [], "remove": []},
    "PK": {"note": "V-sign palm-inward offensive", "source": "web research — verify locally",
           "add": [], "remove": []},
    "FR": {"note": "OK-hand gesture offensive (means 'zero/loser')",
           "source": "web research — verify locally", "add": [], "remove": []},
    "DE": {"note": "OK-hand gesture offensive (means 'zero/loser')",
           "source": "web research — verify locally", "add": [], "remove": []},
    "BR": {"note": "OK-hand gesture offensive; yellow linked to bad luck by some",
           "source": "web research — verify locally", "add": [], "remove": []},
    "PT": {"note": "", "source": "variant label only", "add": [], "remove": []},
    "ES": {"note": "", "source": "variant label only", "add": [], "remove": []},
    "MX": {"note": "", "source": "variant label only", "add": [], "remove": []},
    "HK": {"note": "4 avoided (tetraphobia)", "source": "general cultural knowledge — verify locally",
           "add": [], "remove": []},
    "TW": {"note": "4 avoided (tetraphobia)", "source": "general cultural knowledge — verify locally",
           "add": [], "remove": []},
    "BE": {"note": "Flemish usage; index pointing strongly avoided",
           "source": "web research — verify locally", "add": [], "remove": []},
    "MY": {"note": "dog/pig terms are strong insults; point with thumb, not index finger",
           "source": "general cultural knowledge — verify locally", "add": [], "remove": []},
    "PH": {"note": "palm-up beckoning is highly offensive (used for calling dogs)",
           "source": "web research — verify locally", "add": [], "remove": []},
    "GR": {"note": "raised index finger considered rude",
           "source": "web research — verify locally", "add": [], "remove": []},
    "RU": {"note": "raised index finger considered rude in parts",
           "source": "web research — verify locally", "add": [], "remove": []},
    "IT": {"note": "17 unlucky (XVII ~ VIXI 'I am dead'); thumbs-up rude in parts",
           "source": "general cultural knowledge — verify locally", "add": [], "remove": []},
    "SA": {"note": "green is sacred (associated with Islam); use carefully",
           "source": "general cultural knowledge — verify locally", "add": [], "remove": []},
}

# Emoji tambahan v4 (conf + source wajib).
EMOJI_EXTRA = {
    "\U0001F44C": {"offensiveIn": ["BR", "FR", "DE"], "severity": 2, "conf": 0.6,
                   "note": "OK-hand: 'zero/loser' in BR/FR/DE; sexual curse in parts of the Middle East",
                   "source": "web research — verify locally"},
    "\u270C\uFE0F": {"offensiveIn": ["AU", "GB", "US", "ZA", "NZ", "IN", "PK", "IE"], "severity": 2, "conf": 0.4,
                   "note": "V-sign palm-INWARD equals middle finger; orientation is unknowable in plain text",
                   "source": "web research — verify locally"},
    "\U0001F449": {"offensiveIn": ["MY"], "severity": 1, "conf": 0.5,
                   "note": "index-finger pointing is rude in Malaysia; thumb preferred",
                   "source": "web research — verify locally"},
    "\U0001F918": {"offensiveIn": ["*"], "severity": 2, "conf": 0.5,
                   "note": "sign-of-the-horns: offensive in parts of the Mediterranean/LatAm",
                   "source": "web research — verify locally"},
}

# Simbol/angka: hanya cocok sebagai TOKEN BERDIRI SENDIRI (bukan substring),
# dicocokkan pra-leet agar '4' tidak hancur oleh peta leet.
SYMBOLS = {
    "4": {"regions": ["CN", "JP", "KR"], "severity": 1, "conf": 0.5,
          "note": "tetraphobia: sounds like 'death' (si/shi/sa)",
          "source": "general cultural knowledge — verify locally"},
    "9": {"regions": ["JP"], "severity": 1, "conf": 0.5,
          "note": "sounds like 'suffering' (ku)",
          "source": "general cultural knowledge — verify locally"},
    "13": {"regions": ["US", "GB", "FR", "DE"], "severity": 1, "conf": 0.4,
           "note": "taboo in much of Western/Christian culture; buildings skip floor 13",
           "source": "general cultural knowledge — verify locally"},
    "17": {"regions": ["IT"], "severity": 1, "conf": 0.5,
           "note": "XVII anagram of VIXI ('I am dead' in Latin)",
           "source": "general cultural knowledge — verify locally"},
    "666": {"regions": ["US", "IT", "ES", "GR", "BR", "MX"], "severity": 1, "conf": 0.4,
            "note": "avoided in Christian culture (association); context-dependent",
            "source": "general cultural knowledge — verify locally"},
}
