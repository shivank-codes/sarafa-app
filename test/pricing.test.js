import { test } from 'node:test';
import assert from 'node:assert';
import { PURITY, rateForPurity, makingCharge, saleTotal } from '../js/pricing.js';

test('purity factors match the Indian standards', () => {
  assert.equal(PURITY['24'], 0.999);
  assert.equal(PURITY['22'], 0.916);
  assert.equal(PURITY['18'], 0.750);
  assert.equal(PURITY['14'], 0.585);
});

test('rateForPurity derives the 22K rate from the 999 bhav', () => {
  // 999 bhav Rs 7,250/g -> 22K = 7250 * 0.916 / 0.999 = Rs 6,647.65
  assert.equal(rateForPurity(725000, '22'), 664765);
});

test('rateForPurity at 24K is essentially the quoted bhav', () => {
  assert.equal(rateForPurity(725000, '24'), 725000);
});

test('rateForPurity at 18K is three quarters of fine gold', () => {
  assert.equal(rateForPurity(725000, '18'), 544294);
});

test('making charge: flat rupees', () => {
  assert.equal(makingCharge({ mode: 'flat', value: 1500 }, 10, 7250000), 150000);
});

test('making charge: per gram', () => {
  // Rs 500/g on 10 g = Rs 5,000
  assert.equal(makingCharge({ mode: 'per_gram', value: 500 }, 10, 7250000), 500000);
});

test('making charge: percentage of metal value', () => {
  // 12% of Rs 72,500 = Rs 8,700
  assert.equal(makingCharge({ mode: 'percent', value: 12 }, 10, 7250000), 870000);
});

test('saleTotal: 22K chain with per-gram making', () => {
  // 10 g 22K at 999 bhav 7250 -> rate 6647.65/g -> metal 66,476.50
  // making 500/g = 5,000 -> total 71,476.50
  const r = saleTotal({
    weight: 10, base999Paise: 725000, karat: '22',
    making: { mode: 'per_gram', value: 500 }
  });
  assert.equal(r.ratePerGram, 664765);
  assert.equal(r.metalPaise, 6647650);
  assert.equal(r.makingPaise, 500000);
  assert.equal(r.totalPaise, 7147650);
});

test('saleTotal subtracts old gold given in exchange', () => {
  const r = saleTotal({
    weight: 10, base999Paise: 725000, karat: '22',
    making: { mode: 'flat', value: 0 },
    oldGoldPaise: 2000000
  });
  assert.equal(r.oldGoldPaise, 2000000);
  assert.equal(r.totalPaise, 6647650 - 2000000);
});

test('saleTotal applies GST after making and before old gold', () => {
  // metal+making 66,476.50 ; GST 3% = 1,994.30 ; total 68,470.80
  const r = saleTotal({
    weight: 10, base999Paise: 725000, karat: '22',
    making: { mode: 'flat', value: 0 }, gstPercent: 3
  });
  assert.equal(r.gstPaise, 199430);
  assert.equal(r.totalPaise, 6647650 + 199430);
});

test('saleTotal never returns a negative total', () => {
  const r = saleTotal({
    weight: 1, base999Paise: 725000, karat: '22',
    making: { mode: 'flat', value: 0 }, oldGoldPaise: 99999999
  });
  assert.equal(r.totalPaise, 0);
});

test('silver is priced straight off its own rate, no karat', () => {
  const r = saleTotal({
    weight: 100, base999Paise: 9200, karat: null,
    making: { mode: 'percent', value: 10 }
  });
  assert.equal(r.ratePerGram, 9200);
  assert.equal(r.metalPaise, 920000);
  assert.equal(r.makingPaise, 92000);
});
