import { z } from 'zod';
import { ensurePromotionSchema, pool } from '../config/database.js';

const validationSchema = z.object({
  code: z.string().trim().max(50).optional().default(''),
  subtotal: z.coerce.number().min(0).max(999999),
  email: z.string().trim().toLowerCase().email().max(255).optional().or(z.literal('')),
  phone: z.string().trim().min(7).max(30)
});

const phoneDigits = (value) => String(value || '').replace(/\D/g, '');

export async function validatePromotion(req, res) {
  await ensurePromotionSchema();
  const parsed = validationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { message: 'Invalid promotion request.' } });
  const { code, subtotal } = parsed.data;
  const [rows] = code
    ? await pool.query(`
        SELECT id, code, name, discount_value, free_shipping, minimum_spend, apply_automatically, first_order_only,
          is_active, starts_at, ends_at, usage_limit, usage_count,
          starts_at > UTC_TIMESTAMP() AS not_started,
          ends_at < UTC_TIMESTAMP() AS expired
        FROM promotions WHERE UPPER(code) = ? ORDER BY id DESC LIMIT 1
      `, [code.toUpperCase()])
    : await pool.query(`
        SELECT id, code, name, discount_value, free_shipping, minimum_spend, apply_automatically, first_order_only,
          is_active, starts_at, ends_at, usage_limit, usage_count, 0 AS not_started, 0 AS expired
        FROM promotions
        WHERE apply_automatically = TRUE AND is_active = TRUE
          AND starts_at <= UTC_TIMESTAMP() AND ends_at >= UTC_TIMESTAMP()
          AND (usage_limit IS NULL OR usage_count < usage_limit) AND minimum_spend <= ?
        ORDER BY discount_value DESC, id DESC LIMIT 1
      `, [subtotal]);
  const promotion = rows[0];
  const invalid = (reason, details = {}) => res.json({ success: true, data: { valid: false, reason, promotion: null, discountTotal: 0, ...details } });
  if (!promotion) return invalid(code ? 'INVALID_CODE' : 'NO_AUTOMATIC_PROMOTION');
  if (!promotion.is_active) return invalid('INACTIVE');
  if (promotion.not_started) return invalid('NOT_STARTED', { startsAt: promotion.starts_at });
  if (promotion.expired) return invalid('EXPIRED');
  if (promotion.usage_limit !== null && Number(promotion.usage_count) >= Number(promotion.usage_limit)) return invalid('USAGE_LIMIT_REACHED');
  if (subtotal < Number(promotion.minimum_spend)) return invalid('MINIMUM_SPEND', { minimumSpend: Number(promotion.minimum_spend), shortfall: Number(promotion.minimum_spend) - subtotal });
  if (promotion.first_order_only) {
    const phone = phoneDigits(parsed.data.phone);
    const [previousOrders] = await pool.query(`
      SELECT o.id FROM orders o
      WHERE o.status NOT IN ('cancelled', 'payment_rejected')
        AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(o.recipient_phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ?
      LIMIT 1
    `, [phone]);
    if (previousOrders.length) {
      return res.json({ success: true, data: { valid: false, reason: 'FIRST_ORDER_ONLY', promotion: null, discountTotal: 0 } });
    }
  }
  const discountTotal = Math.min(subtotal, subtotal * Number(promotion.discount_value) / 100);
  res.json({ success: true, data: { valid: true, promotion, discountTotal } });
}
