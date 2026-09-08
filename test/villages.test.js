import { test } from 'node:test';
import assert from 'node:assert';
import { VILLAGES, villageOf, displayName, filterCustomers,
         villagesInUse } from '../js/villages.js';

test('the village list includes Awagarh and its neighbours', () => {
  assert.ok(VILLAGES.includes('अवागढ़'));
  assert.ok(VILLAGES.includes('मारहरा'));
  assert.ok(VILLAGES.includes('जलेसर'));
  assert.ok(VILLAGES.includes('कासगंज'));
  // The whole of Etah plus Kasganj, not just the handful of towns
  assert.ok(VILLAGES.length >= 300, `only ${VILLAGES.length} villages`);
}); 

test('the village list has no duplicates and nothing blank', () => {
  assert.equal(new Set(VILLAGES).size, VILLAGES.length);
  for (const v of VILLAGES) assert.ok(v.trim().length > 1, `bad name: ${v}`);
});

test('villageOf reads a stored village field', () => {
  assert.equal(villageOf({ name: 'रामू', village: 'अवागढ़' }), 'अवागढ़');
});

test('villageOf falls back to a village in brackets in the name', () => {
  assert.equal(villageOf({ name: 'श्यामलाल (मारहरा)' }), 'मारहरा');
});

test('villageOf is empty when there is no village at all', () => {
  assert.equal(villageOf({ name: 'रामू' }), '');
});

test('displayName does not duplicate a village already in the name', () => {
  assert.equal(displayName({ name: 'श्यामलाल (मारहरा)', village: 'मारहरा' }),
    'श्यामलाल (मारहरा)');
  assert.equal(displayName({ name: 'रामू', village: 'अवागढ़' }), 'रामू (अवागढ़)');
});

const CUSTOMERS = [
  { id: 1, name: 'रामू', village: 'अवागढ़', phone: '9876543210' },
  { id: 2, name: 'श्यामलाल (मारहरा)', phone: '9451122334' },
  { id: 3, name: 'मुन्नी देवी', village: 'जलेसर', phone: '9838011223' },
  { id: 4, name: 'ओमप्रकाश', village: 'अवागढ़', phone: '9917445566' }
];

test('filtering by village includes bracket-style records', () => {
  assert.deepEqual(filterCustomers(CUSTOMERS, { village: 'मारहरा' }).map(c => c.id), [2]);
  assert.deepEqual(filterCustomers(CUSTOMERS, { village: 'अवागढ़' }).map(c => c.id), [1, 4]);
});

test('searching matches name, phone or village', () => {
  assert.deepEqual(filterCustomers(CUSTOMERS, { query: 'मुन्नी' }).map(c => c.id), [3]);
  assert.deepEqual(filterCustomers(CUSTOMERS, { query: '9917' }).map(c => c.id), [4]);
  assert.deepEqual(filterCustomers(CUSTOMERS, { query: 'जलेसर' }).map(c => c.id), [3]);
});

test('village and search combine', () => {
  assert.deepEqual(
    filterCustomers(CUSTOMERS, { village: 'अवागढ़', query: 'ओम' }).map(c => c.id), [4]);
});

test('no filter returns everyone', () => {
  assert.equal(filterCustomers(CUSTOMERS, {}).length, 4);
});

test('villagesInUse lists only places he actually deals with', () => {
  assert.deepEqual(villagesInUse(CUSTOMERS), ['अवागढ़', 'जलेसर', 'मारहरा']);
});
