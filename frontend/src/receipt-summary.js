export function receiptPaymentStatus(receipt) {
  return ({
    pending_payment: 'Pending payment', pending_verification: 'Awaiting verification',
    payment_exception: 'Manual payment review', payment_confirmed: 'Payment confirmed',
    payment_rejected: 'Payment rejected', processing: 'Processing', shipped: 'Shipped',
    completed: 'Completed', cancelled: 'Cancelled',
  })[receipt.status] || 'Pending payment';
}

export function receiptSummaryRows(receipt) {
  const money = value => `RM ${Number(value).toFixed(2)}`;
  const rows = [{ label: 'Subtotal', value: money(receipt.subtotal) }];
  if (receipt.discount > 0) rows.push({ label: 'Discount', value: `− ${money(receipt.subtotal * receipt.discount)}` });
  rows.push({ label: 'Shipping', value: Number(receipt.shipping) > 0 ? money(receipt.shipping) : 'Complimentary' });
  return rows;
}
