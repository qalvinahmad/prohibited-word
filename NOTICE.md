# Third-party notices

## Base wordlist (must be preserved in all distributions — MIT requirement)

Sourced from **[safe_text](https://github.com/master-wayne7/safe_text)**:

- Copyright (c) 2024 Ronit Rameja, MIT License
- Used as the base of `packages/core/words.json` (v3 schema) and its copies
  in every package (`packages/*/…/words.json`, `packages/dart/lib/src/words.g.dart`).

## Local v3 additions & 130 languages/locales alignment (this repository)

- **130 Languages & Regional Locales** (`scripts/v3_data.py`): Structured coverage with transparent tiers (`curated`, `regional`, and `starter`).
- **Indonesian regional languages**: Javanese (`jv`) is currently the only regional language included; other regional drafts have been removed to avoid false claims and unreliable filtering.
- `sexual` / `sara` / `violence` / `kasar` categories on a subset of id, jv, and en entries.
- Regional overrides and the emoji map: every entry carries a `source`;
  entries not yet natively verified are marked "verify locally".
