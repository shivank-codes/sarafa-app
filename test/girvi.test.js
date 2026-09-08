import { test } from 'node:test';
import assert from 'node:assert';
import { monthsBetween, interestDue, totalDue, exceedsPrincipal } from '../js/girvi.js';

test('monthsBetween counts completed months and leftover days', () => {
  assert.deepEqual(monthsBetween('2026-01-15', '2026-04-15'), { months: 3, days: 0 });
  assert.deepEqual(monthsBetween('2026-01-15', '2026-04-20'), { months: 3, days: 5 });
  assert.deepEqual(monthsBetween('2026-01-15', '2026-02-10'), { months: 0, days: 26 });
});

test('monthsBetween handles month-end pledges', () => {
  assert.deepEqual(monthsBetween('2026-01-31', '2026-03-31'), { months: 2, days: 0 });
});

test('monthsBetween of the same day is zero', () => {
  assert.deepEqual(monthsBetween('2026-01-15', '2026-01-15'), { months: 0, days: 0 });
});

test('interestDue is a flat percent of principal per completed month', () => {
  // 50,000 at 2% for 3 months = 3,000
  assert.equal(interestDue(5000000, 2, 3), 300000);
});

test('interestDue is zero before the first month completes', () => {
  assert.equal(interestDue(5000000, 2, 0), 0);
});

test('interestDue does not compound', () => {
  // 12 months at 2% flat = 24% of principal, not 26.8%
  assert.equal(interestDue(10000000, 2, 12), 2400000);
});

test('interestDue handles a fractional rate', () => {
  assert.equal(interestDue(10000000, 1.5, 2), 300000);
});

test('totalDue adds interest and subtracts what has been paid', () => {
  const r = totalDue({ principalPaise: 5000000, monthlyRatePercent: 2 },
    3, [{ amountPaise: 100000 }]);
  assert.deepEqual(r, { interestPaise: 300000, paidPaise: 100000, duePaise: 5200000 });
});

test('totalDue with no payments owes principal plus interest', () => {
  const r = totalDue({ principalPaise: 5000000, monthlyRatePercent: 2 }, 1, []);
  assert.equal(r.duePaise, 5100000);
});

test('exceedsPrincipal flags interest that has grown past the principal', () => {
  assert.equal(exceedsPrincipal(5000000, 5100000), true);
  assert.equal(exceedsPrincipal(5000000, 4900000), false);
});

import { receiptText } from '../js/girvi.js';

const PLEDGE = {
  id: 7, pledgerName: 'रामू', itemDesc: 'सोने की चेन',
  weight: 10, principalPaise: 5000000, monthlyRatePercent: 2,
  pledgeDate: '2026-06-08'
};

test('a payment receipt states the true principal and registration number', () => {
  const r = receiptText({
    pledge: PLEDGE, amountPaise: 100000, date: '2026-09-08',
    shopName: 'संकेत कुमार मुकेश कुमार सर्राफ', registrationNo: 'UP/ML/1234'
  });
  assert.match(r, /मूल रकम/);
  assert.match(r, /₹50,000/);
  assert.match(r, /UP\/ML\/1234/);
  assert.match(r, /₹1,000/);
});

test('a receipt carries a witness line, as the Act requires', () => {
  const r = receiptText({
    pledge: PLEDGE, amountPaise: 100000, date: '2026-09-08',
    shopName: 'दुकान', registrationNo: 'X'
  });
  assert.match(r, /गवाह/);
});

test('a receipt simply omits the registration line when none is set', () => {
  const r = receiptText({
    pledge: PLEDGE, amountPaise: 100000, date: '2026-09-08',
    shopName: 'दुकान', registrationNo: ''
  });
  assert.doesNotMatch(r, /रजिस्ट्रेशन नंबर/);
  assert.match(r, /भुगतान रसीद/);
});
