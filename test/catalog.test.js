import { test } from 'node:test';
import assert from 'node:assert';
import { validateItem, itemPrice, fitDimensions } from '../js/catalog.js';

test('an item needs a name', () => {
  const r = validateItem({ name: '', metal: 'sona', weight: 5 });
  assert.equal(r.ok, false);
  assert.match(r.error, /नाम/);
});

test('an item needs a positive weight', () => {
  assert.equal(validateItem({ name: 'हार', metal: 'sona', weight: 0 }).ok, false);
  assert.equal(validateItem({ name: 'हार', metal: 'sona', weight: -1 }).ok, false);
});

test('a complete item validates', () => {
  assert.equal(validateItem({ name: 'हार', metal: 'sona', weight: 12.5 }).ok, true);
});

test('itemPrice applies the live rate plus making', () => {
  // 10 g at ₹7,250/g + ₹1,500 making
  assert.equal(itemPrice({ weight: 10, makingPaise: 150000 }, 725000), 7400000);
});

test('itemPrice with no rate set yet returns null', () => {
  assert.equal(itemPrice({ weight: 10, makingPaise: 0 }, null), null);
});

test('fitDimensions shrinks a large photo to the long edge', () => {
  assert.deepEqual(fitDimensions(4000, 3000, 1000), { width: 1000, height: 750 });
  assert.deepEqual(fitDimensions(3000, 4000, 1000), { width: 750, height: 1000 });
});

test('fitDimensions leaves a small photo alone', () => {
  assert.deepEqual(fitDimensions(800, 600, 1000), { width: 800, height: 600 });
});
