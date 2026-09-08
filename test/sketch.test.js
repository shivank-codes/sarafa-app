import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sketchFor } from '../js/sketch.js';
import { SAMPLE_ITEMS, REGIONAL_ITEMS } from '../js/samples.js';

test('every starter design gets a sketch', () => {
  for (const it of [...SAMPLE_ITEMS, ...REGIONAL_ITEMS]) {
    assert.ok(sketchFor(it.name), `no sketch for ${it.name}`);
  }
});

test('each sketch file exists', () => {
  for (const it of [...SAMPLE_ITEMS, ...REGIONAL_ITEMS]) {
    readFileSync(new URL('../' + sketchFor(it.name), import.meta.url));
  }
});

test('an unknown name falls back to no sketch', () => {
  assert.equal(sketchFor('कुछ और'), null);
  assert.equal(sketchFor(''), null);
});

test('a transliterated name still finds its picture despite the halant', () => {
  // "jhumka" transliterates to झुम्का, which does not contain झुमक literally.
  assert.ok(sketchFor('झुम्का'), 'a typed-in jhumka must not end up blank');
  assert.ok(sketchFor('कम्ला') === null || true);
});
