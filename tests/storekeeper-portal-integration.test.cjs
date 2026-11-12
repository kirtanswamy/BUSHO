'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('storekeeper receipt form never pre-fills a cumulative receipt quantity', () => {
  const js = read('storekeeper-portal.js');
  assert.match(js, /Total quantity received<input name="quantity" type="number" required/);
  assert.match(js, /placeholder="Enter cumulative quantity received" value=""/);
  assert.doesNotMatch(js, /value="' \+ esc\(remaining \+ Number\(row\.received_quantity \|\| 0\)\)/);
  assert.match(js, /quantity <= Number\(row\.received_quantity \|\| 0\)/);
  assert.match(js, /quantity > Number\(row\.requested_quantity\)/);
  assert.match(js, /receivedQuantity: quantity/);
});

test('storekeeper receipt form requires a real external goods receipt reference', () => {
  const js = read('storekeeper-portal.js');
  assert.match(js, /Goods receipt reference<input name="reference" required/);
  assert.match(js, /if \(!reference\) \{ error = 'An external reference is required\.'/);
  assert.match(js, /receiptReference: reference/);
});
