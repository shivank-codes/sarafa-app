import { test } from 'node:test';
import assert from 'node:assert';
import { TROY_OUNCE_GRAMS, perGramPaise, trendOf } from '../js/market.js';

test('a troy ounce is 31.1034768 grams, not 28', () => {
  assert.equal(TROY_OUNCE_GRAMS, 31.1034768);
});

test('perGramPaise converts USD per troy ounce to paise per gram', () => {
  // $4403.90/oz at 94.49 INR/USD
  // = 4403.90 / 31.1034768 = $141.5893/g -> x 94.49 = Rs 13,378.71/g
  assert.equal(perGramPaise(4403.899902, 94.49), 1337871);
});

test('perGramPaise handles silver', () => {
  // $66.323/oz -> $2.13232/g -> x 94.49 = Rs 201.48/g
  assert.equal(perGramPaise(66.322998, 94.49), 20148);
});

test('perGramPaise with a missing rate returns null rather than NaN', () => {
  assert.equal(perGramPaise(null, 94.49), null);
  assert.equal(perGramPaise(4403.9, null), null);
  assert.equal(perGramPaise(4403.9, 0), null);
});

test('trendOf reports direction and change against the oldest reading', () => {
  const hist = [
    { at: '2026-09-01', goldPaise: 1300000 },
    { at: '2026-09-05', goldPaise: 1320000 },
    { at: '2026-09-08', goldPaise: 1337871 }
  ];
  const t = trendOf(hist, 'goldPaise');
  assert.equal(t.direction, 'up');
  assert.equal(t.deltaPaise, 37871);
  assert.equal(t.readings, 3);
});

test('trendOf reports a fall', () => {
  const t = trendOf([{ at: 'a', goldPaise: 200 }, { at: 'b', goldPaise: 150 }], 'goldPaise');
  assert.equal(t.direction, 'down');
  assert.equal(t.deltaPaise, 50);
});

test('trendOf needs at least two readings', () => {
  assert.equal(trendOf([{ at: 'a', goldPaise: 200 }], 'goldPaise'), null);
  assert.equal(trendOf([], 'goldPaise'), null);
});
