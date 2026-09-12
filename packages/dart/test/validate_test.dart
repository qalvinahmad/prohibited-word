import '../lib/prohibited_word.dart';

void main() {
  assert(containsProhibited('kamu anjing') == true);
  assert(containsProhibited('kamu 4nj1ng') == true);
  assert(containsProhibited('a.n.j.i.n.g') == true);
  assert(containsProhibited('halo apa kabar') == false);
  assert(containsProhibited('banget') == false);
  assert(containsProhibited('kamu jancok', locale: 'jv') == true);
  assert(containsProhibited('anak yatim piatu', locale: 'id-ID') == false);
  assert(containsProhibited('anak yatim piatu', lang: ['id']) == true);
  assert(containsProhibited('good 👍', locale: 'en-AU') == true);
  assert(containsProhibited('good 👍', locale: 'en-US') == false);
  assert(validate('kamu anjing', minSeverity: 3).isValid == true);
  assert(validate('kamu anjing').maxSeverity == 2);
}
