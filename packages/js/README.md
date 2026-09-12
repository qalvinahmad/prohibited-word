# prohibited-word (npm)

Form profanity validation — 124 languages, offline-first, leet-aware.
Part of the [prohibited-word monorepo](https://github.com/qalvinahmad/prohibited-word).

```bash
npm install prohibited-word
```

```js
import { validate, contains, censor } from 'prohibited-word';

validate('kamu anjing');
// { isValid: false, maxSeverity: 2, found: [{ word: 'anjing', category: 'kasar', severity: 2, via: 'word', index: 5 }] }

contains('kamu 4nj1ng');                    // true (leet)
contains('a.n.j.i.n.g');                    // true (separator evasion)
contains('halo apa kabar');                 // false
validate('kamu jancok', { locale: 'jv' });  // 124 languages via locale
validate('good 👍', { locale: 'en-AU' });   // region-aware emoji (clean for en-US)
validate('kamu anjing', { minSeverity: 3 });// severity threshold
censor('kamu anjing');                      // 'kamu ******'
```

See the [full README](https://github.com/qalvinahmad/prohibited-word#readme)
and [live demo](https://qalvinahmad.github.io/prohibited-word/).
Dataset attribution: [NOTICE](https://github.com/qalvinahmad/prohibited-word/blob/main/NOTICE.md).
