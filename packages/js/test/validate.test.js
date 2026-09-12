import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validate, contains } from '../src/index.js';

describe('prohibited-word', () => {
  it('exact', () => assert.equal(contains('kamu anjing'), true));
  it('leet', () => assert.equal(contains('kamu 4nj1ng'), true));
  it('separator', () => assert.equal(contains('a.n.j.i.n.g'), true));
  it('clean', () => assert.equal(contains('halo apa kabar'), false));
  it('scunthorpe', () => assert.equal(contains('banget'), false));
  it('detail', () => {
    const r = validate('kamu anjing', { categories: ['kasar'] });
    assert.equal(r.isValid, false);
    assert.equal(r.found[0].word, 'anjing');
  });
  it('whitelist', () => assert.equal(contains('kamu anjing', { whitelist: ['anjing'] }), false));
  it('locale124', () => assert.equal(contains('kamu jancok', { locale: 'jv' }), true));
  it('regional-remove', () => {
    assert.equal(contains('anak yatim piatu', { locale: 'id-ID' }), false);
    assert.equal(contains('anak yatim piatu', { lang: ['id'] }), true);
  });
  it('emoji-region', () => {
    assert.equal(contains('good 👍', { locale: 'en-AU' }), true);
    assert.equal(contains('good 👍', { locale: 'en-US' }), false);
  });
  it('severity', () => {
    assert.equal(validate('kamu anjing', { minSeverity: 3 }).isValid, true);
    assert.equal(validate('kamu anjing').maxSeverity, 2);
  });
  it('symbol-standalone', () => {
    const r = validate('floor 13', { locale: 'en-US' });
    assert.equal(r.isValid, true); // cultural advisory -> review, not block
    assert.equal(r.needsReview, true);
    assert.equal(r.found[0].type, 'symbol');
    assert.equal(contains('room 136', { locale: 'en-US' }), false);
    assert.equal(validate('nomor 4', { locale: 'zh-CN' }).needsReview, true);
    assert.equal(contains('nomor 4', { locale: 'id-ID' }), false);
  });
  it('confidence', () => {
    assert.equal(validate('kamu anjing', { minConfidence: 0.8 }).isValid, true);
    assert.equal(validate('kamu anjing').found[0].confidence, 0.7);
    assert.equal(validate('good 👍', { locale: 'en-AU' }).found[0].confidence, 0.6);
  });
  it('pii-opt-in', () => {
    assert.equal(contains('hubungi 081234567890', { detectors: ['pii'] }), true);
    assert.equal(contains('hubungi 081234567890'), false); // default profanity saja
    const r = validate('email saya j o h n [at] gmail [dot] com', { detectors: ['pii'] });
    assert.equal(r.found[0].type, 'email');
    assert.equal(validate('NIK 3174051209900001', { detectors: ['pii'] }).found[0].type, 'nik');
    assert.equal(validate('kartu 4532015112830366', { detectors: ['pii'] }).found[0].type, 'bank_card');
  });
  it('scam-layer', () => {
    const r = validate('transfer langsung ke rekening ini ya', { detectors: ['scam'] });
    assert.equal(r.isValid, false);
    assert.equal(r.found[0].type, 'direct_transfer');
    assert.equal(contains('donasi ke bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', { detectors: ['scam'] }), true);
  });
  it('sensitive-layer', () => {
    const r = validate('aku mau bunuh diri', { detectors: ['sensitive'] });
    assert.equal(r.needsHelp, true);
    assert.equal(r.found[0].action, 'help');
    assert.equal(contains('main slot gacor', { detectors: ['sensitive'] }), true);
    assert.equal(validate('chat wa aja ya', { detectors: ['sensitive'] }).needsReview, true);
  });
});
