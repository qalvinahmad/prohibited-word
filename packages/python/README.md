# prohibited-word (PyPI)

Form profanity validation — 124 languages, offline-first.
Part of the [prohibited-word monorepo](https://github.com/qalvinahmad/prohibited-word).

```bash
pip install prohibited-word
```

```python
from prohibited_word import validate, contains

validate("kamu anjing")["is_valid"]   # False
contains("kamu 4nj1ng")               # True (leet)
contains("a.n.j.i.n.g")               # True (separator evasion)
validate("kamu jancok", locale="jv")  # 124 languages via locale
validate("good 👍", locale="en-AU")   # region-aware emoji
validate("kamu anjing", min_severity=3)  # severity threshold
```

See the [full README](https://github.com/qalvinahmad/prohibited-word#readme)
and [live demo](https://qalvinahmad.github.io/prohibited-word/).
