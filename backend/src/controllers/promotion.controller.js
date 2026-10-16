import { z } from 'zod';
import { pool } from '../config/database.js';

const validationSchema = z.object({
  code: z.string().trim().max(50).optional().default(''),
  subtotal: z.coerce.number().min(0).max(999999),
  email: z.string().trim().toLowerCase().email().max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().default('')
});

const phoneDigits = (value) => String(value || '').replace(/\D/g, '');

export async function validatePromotion(req, res) {
  const parsed = validationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { message: 'Invalid promotion request.' } });
  const { code, subtotal } = parsed.data;
  const params = [];
  const condition = code ? 'UPPER(code) = ?' : 'apply_automatically = TRUE';
  if (code) params.push(code.toUpperCase());
  params.push(subtotal);
  const [rows] = await pool.query(`
    SELECT id, code, name, discount_value, minimum_spend, apply_automatically, first_order_only
    FROM promotions
    WHERE ${condition} AND is_active = TRUE AND starts_at <= UTC_TIMESTAMP() AND ends_at >= UTC_TIMESTAMP()
      AND (usage_limit IS NULL OR usage_count < usage_limit) AND minimum_spend <= ?
    ORDER BY discount_value DESC, id DESC LIMIT 1
  `, params);
  const promotion = rows[0];
  if (!promotion || subtotal < Number(promotion.minimum_spend)) {
    return res.json({ success: true, data: { valid: false, promotion: null, discountTotal: 0 } });
  }
  if (promotion.first_order_only) {
    const email = parsed.data.email || '';
    const phone = phoneDigits(parsed.data.phone);
    if (!email && !phone) {
      return res.json({ success: true, data: { valid: false, reason: 'FIRST_ORDER_DETAILS_REQUIRED', promotion: null, discountTotal: 0 } });
    }
    const [previousOrders] = await pool.query(`
      SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id
      WHERE o.status NOT IN ('cancelled', 'payment_rejected')
        AND (u.email = ? OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(o.recipient_phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ?)
      LIMIT 1
    `, [email, phone]);
    if (previousOrders.length) {
      return res.json({ success: true, data: { valid: false, reason: 'FIRST_ORDER_ONLY', promotion: null, discountTotal: 0 } });
    }
  }
  const discountTotal = Math.min(subtotal, subtotal * Number(promotion.discount_value) / 100);
  res.json({ success: true, data: { valid: true, promotion, discountTotal } });
}
