import { test } from 'node:test';
import assert from 'node:assert';
import { transliterate } from '../js/hindi.js';

test('an inherent a between consonants writes nothing', () => {
  // Not a listed name, so this exercises the phonetic rules themselves.
  assert.equal(transliterate('kamal'), 'कमल');
  assert.equal(transliterate('sagar'), 'सगर');
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

test('a name ending in "a" keeps its ा — it is not the silent schwa', () => {
  // These were सित, पूज, गीत and अनित before: a different word to a reader,
  // and common enough in his book to matter.
  assert.equal(transliterate('pooja'), 'पूजा');
  assert.equal(transliterate('geeta'), 'गीता');
  assert.equal(transliterate('savita'), 'सविता');
  assert.equal(transliterate('seema'), 'सीमा');
});

test('a schwa inside a word is still silent', () => {
  assert.equal(transliterate('kamal'), 'कमल');
  assert.equal(transliterate('mohan'), 'मोहन');
  assert.equal(transliterate('suresh'), 'सुरेश');
});

test('vowel length comes from knowing the name, not from a rule', () => {
  // No rule can separate these: both are consonant + u at the end.
  assert.equal(transliterate('ramu'), 'रामू');
  assert.equal(transliterate('raghu'), 'रघु');
  assert.equal(transliterate('raju'), 'राजू');
  assert.equal(transliterate('sita'), 'सीता');
  assert.equal(transliterate('shyam'), 'श्याम');
  assert.equal(transliterate('rakesh'), 'राकेश');
});

test('spelling variants land on one name', () => {
  assert.equal(transliterate('geeta'), transliterate('gita'));
  assert.equal(transliterate('sunita'), transliterate('suneeta'));
  assert.equal(transliterate('laxmi'), transliterate('lakshmi'));
});

test('each word of a full name is looked up on its own', () => {
  assert.equal(transliterate('munni devi'), 'मुन्नी देवी');
  assert.equal(transliterate('ramwati devi'), 'रामवती देवी');
});

test('a name not in the list still transliterates phonetically', () => {
  assert.equal(transliterate('mohan'), 'मोहन');
  assert.ok(transliterate('bhagwandas').length > 0);
});
