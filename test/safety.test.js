import { test } from 'node:test';
import assert from 'node:assert';
import { validateBackup } from '../js/backup-validate.js';
import { rateChange } from '../js/day.js';

test('a good backup validates', () => {
  const r = validateBackup({ version: '1', exportedAt: '2026-09-08T00:00:00Z',
    rates: [], bills: [], customers: [], payments: [] });
  assert.equal(r.ok, true);
});

test('a missing store is rejected', () => {
  const r = validateBackup({ version: '1', rates: [], bills: [], customers: [] });
  assert.equal(r.ok, false);
  assert.match(r.error, /payments/);
});

test('a non-object is rejected rather than throwing', () => {
  assert.equal(validateBackup(null).ok, false);
  assert.equal(validateBackup('hello').ok, false);
  assert.equal(validateBackup([]).ok, false);
});

test('a store that is not an array is rejected', () => {
  const r = validateBackup({ version: '1', rates: {}, bills: [], customers: [], payments: [] });
  assert.equal(r.ok, false);
});

test('validateBackup counts the records it would restore', () => {
  const r = validateBackup({ version: '1', rates: [1], bills: [1, 2],
    customers: [1, 2, 3], payments: [] });
  assert.deepEqual(r.counts, { rates: 1, bills: 2, customers: 3, payments: 0 });
});

test('rateChange reports the rise since the previous rate', () => {
  assert.deepEqual(rateChange(725000, 720000), { deltaPaise: 5000, direction: 'up' });
});

test('rateChange reports a fall', () => {
  assert.deepEqual(rateChange(715000, 720000), { deltaPaise: 5000, direction: 'down' });
});

test('rateChange reports no change', () => {
  assert.deepEqual(rateChange(720000, 720000), { deltaPaise: 0, direction: 'same' });
});

test('rateChange with no previous rate has nothing to compare', () => {
  assert.equal(rateChange(720000, null), null);
});
