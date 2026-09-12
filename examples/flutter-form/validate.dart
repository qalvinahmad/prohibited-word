String? validateUsername(String? v) {
  final r = validate(v);
  if (r.isValid) return null;
  return 'Kata tidak pantas: ${r.found.map((f) => f.word).join(', ')}';
}
