import { test } from 'node:test';
import assert from 'node:assert';
import { lineTotal, billTotal } from '../js/calc.js';

test('lineTotal multiplies weight by rate and adds making', () => {
  assert.equal(lineTotal({ weight: 10, ratePerGram: 700000, makingPaise: 50000 }), 7050000);
});

test('lineTotal handles fractional weights without float drift', () => {
  assert.equal(lineTotal({ weight: 12.345, ratePerGram: 685000, makingPaise: 0 }), 8456325);
});

test('lineTotal rounds to the nearest paisa', () => {
  assert.equal(lineTotal({ weight: 0.333, ratePerGram: 100, makingPaise: 0 }), 33);
});

test('lineTotal with zero weight is just the making charge', () => {
  assert.equal(lineTotal({ weight: 0, ratePerGram: 700000, makingPaise: 20000 }), 20000);
});

test('billTotal sums every line', () => {
  const lines = [
    { weight: 10, ratePerGram: 700000, makingPaise: 50000 },
    { weight: 5, ratePerGram: 700000, makingPaise: 0 }
  ];
  assert.equal(billTotal(lines), 7050000 + 3500000);
});

test('billTotal of no lines is zero', () => {
  assert.equal(billTotal([]), 0);
});
