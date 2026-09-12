"""Sync words.json (source of truth) ke semua paket."""
import json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "packages" / "core" / "words.json"
LITE = ROOT / "packages" / "core" / "words-lite.json"
DESTS = [
    "packages/js/src/words.json",
    "packages/js/words.json",
    "packages/python/src/prohibited_word/words.json",
    "packages/go/words.json",
    "packages/swift/Sources/ProhibitedWord/words.json",
    "docs/data/words.json",
]
LITE_DESTS = [
    "packages/js/src/words-lite.json",
    "packages/python/src/prohibited_word/words-lite.json",
    "packages/go/words-lite.json",
    "packages/swift/Sources/ProhibitedWord/words-lite.json",
]

def _copy(src: Path, dest: str):
    p = ROOT / dest
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")

def main():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    assert "langs" in data, "words.json v3 harus punya key 'langs'"
    total = sum(len(v["words"]) for v in data["langs"].values())
    for d in DESTS:
        _copy(SRC, d)
        print("synced", d)
    for d in LITE_DESTS:
        _copy(LITE, d)
        print("synced", d)
    print(f"({total} kata, {len(data['langs'])} bahasa)")

if __name__ == "__main__":
    main()
