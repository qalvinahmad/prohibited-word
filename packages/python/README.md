# prohibited-word (PyPI)

Form profanity validation — 130 languages & locales, offline-first.
Part of the [prohibited-word monorepo](https://github.com/qalvinahmad/prohibited-word).

```bash
pip install prohibited-word
```

```python
from prohibited_word import validate, contains

validate("piss off")["is_valid"]   # False
contains("you are sh1t")           # True (leet)
contains("f.u.c.k you")            # True (separator evasion)
validate("good 👍", locale="en-AU")  # region-aware emoji
validate("call +14155552671", detectors=["pii"])  # PII layer
validate("transfer directly to this account", detectors=["scam"])  # donation fraud
```

See the [full README](https://github.com/qalvinahmad/prohibited-word#readme)
and [live demo](https://qalvinahmad.github.io/prohibited-word/).
