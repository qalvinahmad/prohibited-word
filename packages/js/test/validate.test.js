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
});
