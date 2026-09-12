# prohibited_word (pub.dev)

Form profanity validation for Dart & Flutter — 130 languages & locales, offline-first.
Part of the [prohibited-word monorepo](https://github.com/qalvinahmad/prohibited-word).

```yaml
dependencies:
  prohibited_word: ^0.1.0
```

```dart
import 'package:prohibited_word/prohibited_word.dart';

validate('piss off').isValid;                 // false
containsProhibited('you are sh1t');           // true (leet)
containsProhibited('f.u.c.k you');            // true (separator evasion)
validate('good 👍', locale: 'en-AU');         // region-aware emoji
validate('call +14155552671', detectors: ['pii']); // PII layer

String? validator(String? v) {
  final r = validate(v, locale: 'en-US');
  if (r.isValid) return null;
  return 'Inappropriate word: ${r.found.map((f) => f.word).join(', ')}';
}

TextFormField(validator: validator);
```

See the [full README](https://github.com/qalvinahmad/prohibited-word#readme)
and [live demo](https://qalvinahmad.github.io/prohibited-word/).
