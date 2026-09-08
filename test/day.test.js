import { test } from 'node:test';
import assert from 'node:assert';
import { daySummary } from '../js/day.js';

const bills = [
  { date: '2026-09-08', totalPaise: 500000, settlement: 'nakad' },
  { date: '2026-09-08', totalPaise: 300000, settlement: 'udhaar' },
  { date: '2026-09-08', totalPaise: 200000, settlement: 'nakad' },
  { date: '2026-09-07', totalPaise: 900000, settlement: 'nakad' }
];

test('daySummary counts only the given day', () => {
  const s = daySummary(bills, '2026-09-08');
  assert.equal(s.count, 3);
});

test('daySummary splits cash from credit', () => {
  const s = daySummary(bills, '2026-09-08');
  assert.equal(s.nakadPaise, 700000);
  assert.equal(s.udhaarPaise, 300000);
  assert.equal(s.totalPaise, 1000000);
});

test('daySummary of a day with no bills is all zeroes', () => {
  const s = daySummary(bills, '2026-01-01');
  assert.deepEqual(s, { count: 0, nakadPaise: 0, udhaarPaise: 0, totalPaise: 0 });
});

test('daySummary of an earlier day is unaffected by later bills', () => {
  const s = daySummary(bills, '2026-09-07');
  assert.equal(s.count, 1);
  assert.equal(s.totalPaise, 900000);
});
