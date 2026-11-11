import { useEffect, useRef, useState } from 'react';

function invalidMessage(data) {
  const reasons = {
    INVALID_CODE: 'This promo code does not exist. Please check the spelling and try again.',
    INACTIVE: 'This promo code is currently inactive.',
    NOT_STARTED: `This promo code is not available yet${data.startsAt ? ` — it starts ${new Date(data.startsAt).toLocaleString('en-MY')}` : ''}.`,
    EXPIRED: 'This promo code has expired.',
    USAGE_LIMIT_REACHED: 'This promo code has reached its usage limit.',
    MINIMUM_SPEND: `Spend another RM ${Number(data.shortfall || 0).toFixed(2)} to use this promo code (minimum RM ${Number(data.minimumSpend || 0).toFixed(2)}).`,
    FIRST_ORDER_ONLY: 'This promo code is for first-time buyers only. Cancelled or rejected orders do not affect your eligibility.',
    FIRST_ORDER_DETAILS_REQUIRED: 'Enter your phone number first so we can check your first-order eligibility.',
  };
  return reasons[data.reason] || 'This promo code cannot be applied. Please check the offer requirements.';
}

export function useCartPromotion({ subtotal, code, phone, email, apiUrl }) {
  const normalizedCode = code.trim().toUpperCase();
  const key = JSON.stringify([subtotal, normalizedCode, phone.trim(), email.trim()]);
  const [appliedCode, setAppliedCode] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [quote, setQuote] = useState(null);
  const [success, setSuccess] = useState(null);
  const showSuccess = useRef(false);

  useEffect(() => {
    if (!subtotal || (normalizedCode && normalizedCode !== appliedCode)) return undefined;
    if (normalizedCode && phone.replace(/\D/g, '').length < 7) {
      setQuote({ key, valid: false, message: 'Enter your phone number first so we can check this promotion.' });
      showSuccess.current = false;
      return undefined;
    }
    let active = true;
    const controller = new AbortController();
    const announceSuccess = showSuccess.current;
    showSuccess.current = false;
    setQuote({ key, pending: true });
    fetch(`${apiUrl}/promotions/validate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ subtotal, code: normalizedCode, phone: phone.trim(), email: email.trim() }),
    }).then(async response => {
      if (!response.ok) throw new Error('Promotion validation failed');
      return response.json();
    }).then(result => {
      if (!active) return;
      const data = result.data || {};
      if (!data.valid) {
        setQuote({ key, valid: false, message: normalizedCode ? invalidMessage(data) : '' });
        return;
      }
      const freeShipping = Boolean(data.promotion.free_shipping);
      setQuote({ key, valid: true, saving: Number(data.discountTotal), freeShipping,
        message: `${normalizedCode || data.promotion.name} applied${normalizedCode ? '' : ' automatically'} — ${Number(data.promotion.discount_value)}% off${freeShipping ? ' + free shipping' : ''}` });
      if (announceSuccess) setSuccess({ key, code: normalizedCode, name: data.promotion.name, percentage: Number(data.promotion.discount_value), saving: Number(data.discountTotal), freeShipping });
    }).catch(() => {
      if (active) setQuote({ key, valid: false, message: 'Unable to validate this promo code. Please try again.' });
    });
    return () => { active = false; controller.abort(); };
  }, [key, appliedCode, attempt, apiUrl]);

  const current = quote?.key === key ? quote : null;
  const canValidate = subtotal > 0 && (!normalizedCode || normalizedCode === appliedCode) && (!normalizedCode || phone.replace(/\D/g, '').length >= 7);
  return {
    discount: current?.valid ? current.saving / subtotal : 0,
    freeShipping: Boolean(current?.valid && current.freeShipping),
    message: current?.message || '',
    valid: Boolean(current?.valid),
    validating: canValidate && (!current || Boolean(current.pending)),
    success: success?.key === key ? success : null,
    setSuccess,
    apply() {
      if (!normalizedCode) { setQuote({ key, valid: false, message: 'Enter a promo code' }); return; }
      showSuccess.current = true;
      setAppliedCode(normalizedCode);
      setAttempt(value => value + 1);
    },
  };
}
