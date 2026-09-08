import { test } from 'node:test';
import assert from 'node:assert';
import { demoCustomers, demoBills, demoPayments, demoPledges,
         demoPledgePayments } from '../js/demo.js';

test('every demo record is tagged so removal cannot touch real data', () => {
  const ids = Array.from({ length: 12 }, (_, i) => i + 1);
  const all = [
    ...demoCustomers(),
    ...demoBills(ids, 725000, 9200),
    ...demoPayments(ids),
    ...demoPledges(),
    ...demoPledgePayments([1, 2, 3, 4])
  ];
  assert.ok(all.length > 30);
  assert.ok(all.every((r) => r.demo === true));
});

test('demo customers carry a village in the name', () => {
  const cs = demoCustomers();
  assert.ok(cs.every((c) => /\(.+\)/.test(c.name)));
  assert.ok(cs.some((c) => c.name.includes('अवागढ़')));
});

test('demo bill totals are consistent with weight, rate and making', () => {
  const bills = demoBills(Array.from({ length: 12 }, (_, i) => i + 1), 725000, 9200);
  for (const b of bills) {
    assert.equal(b.totalPaise, Math.round(b.weight * b.ratePerGram) + b.makingPaise);
  }
});

test('demo bills use the correct rate for their metal', () => {
  const bills = demoBills(Array.from({ length: 12 }, (_, i) => i + 1), 725000, 9200);
  assert.ok(bills.filter(b => b.metal === 'sona').every(b => b.ratePerGram === 725000));
  assert.ok(bills.filter(b => b.metal === 'chandi').every(b => b.ratePerGram === 9200));
});

test('credit bills name a customer and cash bills do not', () => {
  const bills = demoBills(Array.from({ length: 12 }, (_, i) => i + 1), 725000, 9200);
  assert.ok(bills.filter(b => b.settlement === 'udhaar').every(b => b.customerId != null));
  assert.ok(bills.filter(b => b.settlement === 'nakad').every(b => b.customerId === null));
});

test('demo pledges include an already-redeemed one', () => {
  const ps = demoPledges();
  assert.ok(ps.some((p) => p.status === 'redeemed' && p.redeemedDate));
  assert.ok(ps.some((p) => p.status === 'active'));
});

test('no demo pledge stores a full ID number', () => {
  assert.ok(demoPledges().every((p) => (p.idLast4 || '').length <= 4));
});
