import test from 'node:test';
import assert from 'node:assert/strict';
import { receiptPaymentStatus, receiptSummaryRows } from '../src/receipt-summary.js';

test('receipt status distinguishes unpaid orders from reported and confirmed payments', () => {
  assert.equal(receiptPaymentStatus({ status: 'pending_payment' }), 'Pending payment');
  assert.equal(receiptPaymentStatus({ status: 'pending_verification' }), 'Awaiting verification');
  assert.equal(receiptPaymentStatus({ status: 'payment_confirmed' }), 'Payment confirmed');
});

test('shared receipt summary includes discounts and paid shipping', () => {
  assert.deepEqual(receiptSummaryRows({ subtotal: 300, discount: .1, shipping: 15 }), [
    { label: 'Subtotal', value: 'RM 300.00' },
    { label: 'Discount', value: '− RM 30.00' },
    { label: 'Shipping', value: 'RM 15.00' },
  ]);
  assert.deepEqual(receiptSummaryRows({ subtotal: 200, discount: 0, shipping: 0 }), [
    { label: 'Subtotal', value: 'RM 200.00' }, { label: 'Shipping', value: 'Complimentary' },
  ]);
});
