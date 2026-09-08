import { test } from 'node:test';
import assert from 'node:assert';
import { transliterate } from '../js/hindi.js';

test('simple name with inherent a', () => {
  assert.equal(transliterate('ramu'), 'रमु');
});

test('long vowels use doubled letters', () => {
  assert.equal(transliterate('raamuu'), 'रामू');
});

test('consonant clusters get a halant', () => {
  assert.equal(transliterate('shyaam'), 'श्याम');
});

test('o and e matras', () => {
  assert.equal(transliterate('mohan'), 'मोहन');
});

test('word-initial vowel uses the full letter', () => {
  assert.equal(transliterate('anil'), 'अनिल');
});

test('two-letter consonants are matched before single', () => {
  assert.equal(transliterate('bharat'), 'भरत');
});

test('already-Devanagari text passes through untouched', () => {
  assert.equal(transliterate('रामू'), 'रामू');
});

test('spaces separate words', () => {
  assert.equal(transliterate('raam kumaar'), 'राम कुमार');
});

test('empty input gives empty output', () => {
  assert.equal(transliterate(''), '');
});
