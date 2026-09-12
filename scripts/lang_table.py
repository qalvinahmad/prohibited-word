"""Regenerate the README language table (with Words + Detail columns) from words.json.

Usage: python3 scripts/lang_table.py  (prints markdown rows to stdout)
Detail links point at the Pages word-list browser: #words-<code>.
"""
import json
from pathlib import Path

MONO = Path(__file__).resolve().parents[1]
TIER = {"curated": "Tier 1 (Curated)", "regional": "Tier 2 (Regional)", "starter": "Tier 3 (Starter)"}
SITE = "https://qalvinahmad.github.io/prohibited-word"


def fmt(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def main():
    d = json.loads((MONO / "packages" / "core" / "words.json").read_text(encoding="utf-8"))
    langs = d["langs"]
    for code, s in sorted(langs.items(), key=lambda kv: kv[1].get("order", 999)):
        own = len(s.get("words", []))
        p = s.get("parent")
        if p and p in langs:
            base = len(langs[p].get("words", []))
            cell = f"{fmt(own + base)} ({fmt(own)} + {fmt(base)} base)"
        else:
            cell = fmt(own)
        print(f"| {s.get('order')} | {s.get('name')} | `{code}` | {TIER.get(s.get('maturity'), s.get('maturity'))} | {cell} | [Detail]({SITE}/#words-{code}) |")


if __name__ == "__main__":
    main()
