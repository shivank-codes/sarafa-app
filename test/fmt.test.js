import { test } from 'node:test';
import assert from 'node:assert';
import { rupees, grams, hindiDate } from '../js/fmt.js';

test('rupees groups in the Indian style', () => {
  assert.equal(rupees(12050000), '₹1,20,500');
  assert.equal(rupees(100000), '₹1,000');
  assert.equal(rupees(0), '₹0');
});

test('rupees shows paise only when non-zero', () => {
  assert.equal(rupees(50050), '₹500.50');
  assert.equal(rupees(50000), '₹500');
});

test('grams always shows three decimals', () => {
  assert.equal(grams(12.5), '12.500 ग्राम');
  assert.equal(grams(0), '0.000 ग्राम');
});

test('hindiDate renders the month in Devanagari', () => {
  assert.equal(hindiDate('2026-09-07'), '7 सितंबर 2026');
  assert.equal(hindiDate('2026-01-31'), '31 जनवरी 2026');
});
