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
  assert(validate('floor 13', locale: 'en-US').needsReview == true);
  assert(validate('floor 13', locale: 'en-US').found.first.type == 'symbol');
  assert(containsProhibited('room 136', locale: 'en-US') == false);
  assert(validate('nomor 4', locale: 'zh-CN').needsReview == true);
  assert(containsProhibited('nomor 4', locale: 'id-ID') == false);
  assert(validate('kamu anjing', minConfidence: 0.8).isValid == true);
  assert(validate('kamu anjing').found.first.confidence == 0.7);
  assert(containsProhibited('hubungi 081234567890', detectors: ['pii']) == true);
  assert(containsProhibited('hubungi 081234567890') == false);
  assert(validate('transfer langsung ke rekening ini ya', detectors: ['scam']).found.first.type == 'direct_transfer');
  assert(validate('aku mau bunuh diri', detectors: ['sensitive']).needsHelp == true);
  assert(containsProhibited('main slot gacor', detectors: ['sensitive']) == true);
}
