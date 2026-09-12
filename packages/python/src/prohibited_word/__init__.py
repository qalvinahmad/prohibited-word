"""Prohibited-word form validation — 124 bahasa, offline + remote update opsional.

Data: safe_text (MIT (c) 2024 Ronit Rameja) + kurasi v3.
Mesin: trie + word-boundary + separator-skip; locale (lang+region);
emoji regional; severity; lihat packages/core/NORMALIZER.md.
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

_HERE = Path(__file__).parent


def _load(name: str):
    try:
        return json.loads((_HERE / name).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return None


DB = _load("words.json") or _load("words-lite.json") or {"version": 0, "meta": {}, "langs": {}, "regions": {}, "emoji": {}}
DICT_ID = f"{DB.get('version', 0)}:{len(DB.get('langs', {}))}"

_LEET = {"@": "a", "4": "a", "8": "b", "(": "c", "3": "e", "1": "i", "!": "i",
        "0": "o", "$": "s", "5": "s", "7": "t", "+": "t", "v": "u", "#": "h"}

_MATURITY_CONF = {"curated": 0.7, "regional": 0.6, "starter": 0.4, "verified": 0.95}


def _conf_of_maturity(m) -> float:
    return _MATURITY_CONF.get(m or "", 0.5)


def _is_emoji(c: str) -> bool:
    return unicodedata.category(c) == "So"


def normalize(text: str | None) -> str:
    s = str(text or "").lower()
    s = "".join(c for c in unicodedata.normalize("NFKD", s) if not 0x300 <= ord(c) <= 0x36F)
    s = "".join(_LEET.get(c, c) for c in s)
    s = "".join(f" {c} " if _is_emoji(c) else c for c in s)
    return re.sub(r"\s+", " ", s).strip()


def emoji_key(e: str) -> str:
    return "".join(c for c in str(e) if unicodedata.category(c) not in ("Mn", "Mc", "Me", "Sk"))


def entry_pattern(word: str) -> str:
    return "".join(c for c in normalize(word) if c.isalnum() or _is_emoji(c))


def display_form(word: str) -> str:
    s = normalize(word)
    i, j = 0, len(s)
    while i < j and not (s[i].isalnum() or _is_emoji(s[i])):
        i += 1
    while j > i and not (s[j - 1].isalnum() or _is_emoji(s[j - 1])):
        j -= 1
    return s[i:j]


def parse_locale(locale: str | None) -> dict:
    if not locale:
        return {}
    parts = re.split(r"[-_]", str(locale))
    out = {}
    if parts and parts[0]:
        out["lang"] = parts[0].lower()
    if len(parts) > 1 and parts[1]:
        out["region"] = parts[1].upper()
    return out


def _build_trie(patterns: list[tuple[str, int]]):
    root: dict = {"next": {}, "out": [], "max": 0}
    for p, idx in patterns:
        chars = list(p)
        root["max"] = max(root["max"], len(chars))
        node = root
        for ch in chars:
            node = node["next"].setdefault(ch, {"next": {}, "out": []})
        node["out"].append(idx)
    return root


def _scan(root, runes: list[str], alnum: list[bool], free: list[bool], hits: list):
    n = len(runes)
    for i in range(n):
        start_ok = i == 0 or not alnum[i - 1]
        node = root
        for j in range(i, min(n, i + root["max"] + 10)):
            if alnum[j]:
                node = node["next"].get(runes[j])
                if node is None:
                    break
                if node["out"] and start_ok and (j + 1 >= n or not alnum[j + 1]):
                    for idx in node["out"]:
                        hits.append((idx, i, j + 1))
            else:
                child = node["next"].get(runes[j])
                if child is None:
                    continue
                node = child
                if node["out"]:
                    for idx in node["out"]:
                        if free[idx] or (start_ok and (j + 1 >= n or not alnum[j + 1])):
                            hits.append((idx, i, j + 1))


_CACHE: dict = {}


def _engine(langs, region, categories, min_sev, min_conf, custom, white):
    key = (DICT_ID, tuple(langs), region, tuple(categories or ()), min_sev, min_conf, tuple(custom), tuple(sorted(white)))
    eng = _CACHE.get(key)
    if eng is not None:
        return eng
    entries: list[tuple[str, str, int, str, float]] = []
    free: list[bool] = []
    seen: set[str] = set()

    def push(word: str, cat: str, sev: int, via: str, lang: str | None, conf: float):
        w = str(word).lower()
        if not w or w in white:
            return
        pat = entry_pattern(w)
        disp = display_form(w)
        if not pat or pat in white or disp in white:
            return
        sig = f"{lang or ''}\0{pat}"
        if sig in seen or sev < min_sev or conf < min_conf:
            return
        seen.add(sig)
        free.append(not any(c.isalnum() for c in pat))
        entries.append((disp, cat, sev, via, conf))

    remove = set()
    reg = (DB.get("regions") or {}).get(region or "", {})
    for r in reg.get("remove", []):
        remove.add((str(r["w"]).lower(), r["lang"]))

    active_langs = []
    if langs:
        for t in langs:
            t_low = str(t).lower()
            active_langs.append(t_low)
            p = (DB.get("langs") or {}).get(t_low, {}).get("parent")
            if p:
                active_langs.append(str(p).lower())

    for lang, spec in (DB.get("langs") or {}).items():
        if active_langs:
            lang_low = str(lang).lower()
            base = lang_low.split("-")[0]
            if not (lang_low in active_langs or base in active_langs):
                continue
        for e in spec.get("words", []):
            cat = e.get("c", "profanity")
            if categories and cat not in categories:
                continue
            if (str(e["w"]).lower(), lang) in remove:
                continue
            push(e["w"], cat, e.get("s", 2), "word", lang,
                 float(e.get("conf", _conf_of_maturity(spec.get("maturity")))))

    for e in reg.get("add", []):
        if langs and e["lang"] not in langs:
            continue
        cat = e.get("c", "profanity")
        if categories and cat not in categories:
            continue
        push(e["w"], cat, e.get("s", 2), "regional", e["lang"], float(e.get("conf", 0.6)))

    for raw, spec in (DB.get("emoji") or {}).items():
        off = spec.get("offensiveIn", [])
        if "*" not in off and (not region or region not in off):
            continue
        push(emoji_key(raw), "gesture", spec.get("severity", 2), "emoji", None, float(spec.get("conf", 0.6)))

    for w in custom:
        push(w, "custom", 2, "custom", None, 1.0)

    patterns = [(entry_pattern(w), i) for i, (w, _, _, _, _) in enumerate(entries)]
    eng = (entries, free, _build_trie(patterns))
    if len(_CACHE) > 32:
        _CACHE.pop(next(iter(_CACHE)))
    _CACHE[key] = eng
    return eng


def validate(text, categories=None, lang=None, locale=None, region=None,
             min_severity: int = 1, min_confidence: float = 0,
             custom_words=None, whitelist=None) -> dict:
    original = str(text or "")
    if not original.strip():
        return {"is_valid": True, "max_severity": 0, "found": []}
    loc = parse_locale(locale)
    full_loc = str(locale).lower().replace("_", "-") if locale else ""
    if lang:
        langs = [str(l).lower() for l in lang]
    elif full_loc and full_loc in (DB.get("langs") or {}):
        langs = [full_loc]
    elif loc.get("lang"):
        langs = [loc["lang"].lower()]
    else:
        langs = []
    region = region or loc.get("region") or ""
    white = {str(w).lower() for w in (whitelist or [])}
    custom = [str(w).lower() for w in (custom_words or [])]
    entries, free, trie = _engine(langs, region, categories, min_severity, min_confidence, custom, white)
    norm = normalize(original)
    runes = list(norm)
    alnum = [c.isalnum() for c in runes]
    hits: list = []
    _scan(trie, runes, alnum, free, hits)
    hits.sort(key=lambda h: (h[1], -h[2], h[0]))
    kept = []
    for h in hits:
        if kept and kept[-1][2] >= h[2]:
            continue
        kept.append(h)
    lo = original.lower()
    found = [{"word": entries[i][0], "category": entries[i][1], "severity": entries[i][2],
              "via": entries[i][3], "confidence": entries[i][4],
              "index": lo.find(entries[i][0])} for i, _, _ in kept]
    if region and DB.get("symbols"):
        tokens = [t for t in re.split(r"[^\w]", lo, flags=re.UNICODE) if t]
        seen_tok = set()
        for tok in tokens:
            spec = DB["symbols"].get(tok)
            if not spec or tok in seen_tok:
                continue
            seen_tok.add(tok)
            if region not in (spec.get("regions") or []):
                continue
            conf = float(spec.get("conf", 0.5))
            if conf < min_confidence:
                continue
            found.append({"word": tok, "category": "symbol", "severity": spec.get("severity", 1),
                          "via": "symbol", "confidence": conf, "index": lo.find(tok)})
    found.sort(key=lambda f: f["index"])
    return {"is_valid": not found, "max_severity": max([f["severity"] for f in found] or [0]), "found": found}


def contains(text, **opts) -> bool:
    return not validate(text, **opts)["is_valid"]


# ---- Remote update (offline-first; panggil eksplisit bila perlu) ----
def dataset_info() -> dict:
    return {"version": DB.get("version"), "released": (DB.get("meta") or {}).get("released"),
            "langs": len(DB.get("langs", {}))}


def load_dataset(db: dict):
    global DB, DICT_ID
    DB = db
    DICT_ID = f"{DB.get('version', 0)}:{len(DB.get('langs', {}))}"
    _CACHE.clear()


def fetch_dataset(url: str) -> dict:
    import urllib.request
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def check_for_updates(url: str) -> dict:
    remote = fetch_dataset(url)
    return {"current": dataset_info(),
            "remote": {"version": remote.get("version"),
                       "released": (remote.get("meta") or {}).get("released"),
                       "langs": len(remote.get("langs", {}))},
            "update_available": (remote.get("version") or 0) > (DB.get("version") or 0),
            "remote_db": remote}
