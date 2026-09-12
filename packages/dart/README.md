# prohibited_word (pub.dev)

Form profanity validation for Dart & Flutter — 124 languages, offline-first.
Part of the [prohibited-word monorepo](https://github.com/qalvinahmad/prohibited-word).

```yaml
dependencies:
  prohibited_word: ^0.1.0
```

```dart
import 'package:prohibited_word/prohibited_word.dart';

validate('kamu anjing').isValid;              // false
containsProhibited('kamu 4nj1ng');            // true (leet)
containsProhibited('a.n.j.i.n.g');            // true (separator evasion)
validate('kamu jancok', locale: 'jv');        // 124 languages via locale
validate('good 👍', locale: 'en-AU');         // region-aware emoji

String? validator(String? v) {
  final r = validate(v, locale: 'id-ID');
  if (r.isValid) return null;
  return 'Inappropriate word: ${r.found.map((f) => f.word).join(', ')}';
}

TextFormField(validator: validator);
```

See the [full README](https://github.com/qalvinahmad/prohibited-word#readme)
and [live demo](https://qalvinahmad.github.io/prohibited-word/).
