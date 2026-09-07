import { test } from 'node:test';
import assert from 'node:assert';
import { balance, outstanding } from '../js/ledger.js';

test('balance counts credit bills and subtracts payments', () => {
  const bills = [
    { totalPaise: 500000, settlement: 'udhaar' },
    { totalPaise: 300000, settlement: 'udhaar' }
  ];
  const payments = [{ amountPaise: 200000 }];
  assert.equal(balance({ bills, payments }), 600000);
});

test('balance ignores cash bills', () => {
  const bills = [
    { totalPaise: 500000, settlement: 'nakad' },
    { totalPaise: 100000, settlement: 'udhaar' }
  ];
  assert.equal(balance({ bills, payments: [] }), 100000);
});

test('balance of a fully paid customer is zero', () => {
  const bills = [{ totalPaise: 500000, settlement: 'udhaar' }];
  const payments = [{ amountPaise: 500000 }];
  assert.equal(balance({ bills, payments }), 0);
});

test('balance goes negative when a customer overpays', () => {
  const bills = [{ totalPaise: 100000, settlement: 'udhaar' }];
  const payments = [{ amountPaise: 150000 }];
  assert.equal(balance({ bills, payments }), -50000);
});

test('outstanding ranks by balance and drops the settled', () => {
  const customers = [
    { id: 1, name: 'रामू' },
    { id: 2, name: 'श्याम' },
    { id: 3, name: 'मोहन' }
  ];
  const billsBy = {
    1: [{ totalPaise: 100000, settlement: 'udhaar' }],
    2: [{ totalPaise: 900000, settlement: 'udhaar' }],
    3: [{ totalPaise: 400000, settlement: 'udhaar' }]
  };
  const paymentsBy = { 3: [{ amountPaise: 400000 }] };
  const result = outstanding(customers, billsBy, paymentsBy);
  assert.deepEqual(result.map((r) => r.customer.name), ['श्याम', 'रामू']);
  assert.equal(result[0].balancePaise, 900000);
});
