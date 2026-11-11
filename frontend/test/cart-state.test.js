import test from 'node:test';
import assert from 'node:assert/strict';
import { checkedCartQuantity, clampCartToCatalogue, parseCart } from '../src/cart-state.js';

test('invalid persisted cart shapes cannot crash the storefront', () => {
  assert.deepEqual(parseCart('{bad json'), []);
  assert.deepEqual(parseCart('{"quantity":19}'), []);
  assert.deepEqual(parseCart('null'), []);
});

test('invalid lines and quantities are rejected', () => {
  const cart = parseCart(JSON.stringify([
    { slug: 'ring', name: 'Ring', variantId: 7, quantity: -1 },
    { slug: 'ring', name: 'Ring', variantId: 'bad', quantity: 1 },
    { slug: 'ring', name: 'Ring', variantId: 7, quantity: 2 },
  ]));
  assert.deepEqual(cart, [{ key: 'ring:7', slug: 'ring', name: 'Ring', variantId: 7, quantity: 2 }]);
});

test('duplicate lines are merged and constrained to the checkout limit', () => {
  const cart = parseCart([{ slug: 'earrings', name: 'Earrings', variantId: 9, quantity: 80 }, { slug: 'earrings', name: 'Earrings', variantId: 9, quantity: 80 }]);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 99);
});

test('persisted quantity is clamped to current catalogue stock', () => {
  const cart = clampCartToCatalogue([{ slug: 'earrings', name: 'Earrings', variantId: 9, quantity: 99 }], [{ slug: 'earrings', name: 'Earrings', stock: 19 }]);
  assert.equal(cart[0].quantity, 19);
});

test('sold out and removed products are removed during hydration', () => {
  assert.deepEqual(clampCartToCatalogue([{ slug: 'ring', name: 'Ring', quantity: 2 }], [{ slug: 'ring', name: 'Ring', stock: 0 }]), []);
  assert.deepEqual(clampCartToCatalogue([{ slug: 'ring', name: 'Ring', quantity: 2 }], [{ slug: 'other', name: 'Other', stock: 2 }]), []);
});

test('add to cart cannot exceed live stock', () => {
  assert.deepEqual(checkedCartQuantity(18, 1, 19), { ok: true, quantity: 19, existing: 18, stock: 19 });
  assert.deepEqual(checkedCartQuantity(19, 1, 19), { ok: false, reason: 'INSUFFICIENT_STOCK', existing: 19, stock: 19 });
  assert.deepEqual(checkedCartQuantity(18, 2, 19), { ok: false, reason: 'INSUFFICIENT_STOCK', existing: 18, stock: 19 });
});

test('cart quantities use the saved variant rather than another variant or aggregate stock', () => {
  const products = [{ slug: 'ring', name: 'Ring', stock: 7, variants: [{ id: 1, stock_quantity: 2 }, { id: 2, stock_quantity: 7 }] }];
  const cart = clampCartToCatalogue([{ slug: 'ring', variantId: 1, quantity: 5 }], products);
  assert.equal(cart[0].quantity, 2);
  assert.deepEqual(clampCartToCatalogue([{ slug: 'ring', variantId: 3, quantity: 1 }], products), []);
});
