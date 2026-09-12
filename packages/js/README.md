# prohibited-word (npm)

Form profanity validation — 130 languages & locales, offline-first, leet-aware.
Part of the [prohibited-word monorepo](https://github.com/qalvinahmad/prohibited-word).

```bash
npm install prohibited-word
```

```js
import { validate, contains, censor } from 'prohibited-word';

validate('piss off');
// { isValid: false, maxSeverity: 2, found: [{ word: 'piss off', ... }] }

contains('you are sh1t');                   // true (leet)
contains('f.u.c.k you');                    // true (separator evasion)
contains('hello how are you');              // false
validate('good 👍', { locale: 'en-AU' }); // region-aware emoji
validate('shut up bitch', { minSeverity: 3 }); // severity threshold
censor('shut up bitch');                    // '**** up *****'

// Opt-in layers for donation & community apps:
validate('call +14155552671', { detectors: ['pii'] });
validate('transfer directly to this account', { detectors: ['scam'] });
validate('i want to kill myself', { detectors: ['sensitive'] }); // -> needsHelp
```

See the [full README](https://github.com/qalvinahmad/prohibited-word#readme)
and [live demo](https://qalvinahmad.github.io/prohibited-word/).
Dataset attribution: [NOTICE](https://github.com/qalvinahmad/prohibited-word/blob/main/NOTICE.md).
