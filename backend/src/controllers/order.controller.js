import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ensurePaymentSchema, ensurePromotionSchema, pool } from '../config/database.js';
import { AppError } from '../errors/app-error.js';

const checkoutSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2).max(150),
    email: z.string().trim().toLowerCase().email().max(255).optional().or(z.literal('')).default(''),
    phone: z.string().trim().min(7).max(30),
    addressLine1: z.string().trim().min(5).max(255),
    addressLine2: z.string().trim().max(255).optional().default(''),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    postcode: z.string().trim().min(4).max(20),
  }),
  paymentMethod: z.string().trim().min(1).max(120).default('Bank transfer'),
  promoCode: z.string().trim().max(50).optional().default(''),
  items: z.array(z.object({
    variantId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(99),
  })).min(1).max(50),
}).strict();

export async function createOrder(req, res) {
  await ensurePaymentSchema();
  await ensurePromotionSchema();
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'INVALID_CHECKOUT', 'Please complete your contact, delivery and order information.');

  const checkout = parsed.data;
  const combinedItems = [...checkout.items.reduce((items, item) => {
    items.set(item.variantId, (items.get(item.variantId) || 0) + item.quantity);
    return items;
  }, new Map()).entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const variantIds = combinedItems.map((item) => item.variantId);
    const placeholders = variantIds.map(() => '?').join(',');
    const [variants] = await connection.query(`
      SELECT pv.id, pv.sku, pv.variant_name, pv.price, pv.stock_quantity, p.name AS product_name
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id IN (${placeholders}) AND pv.is_active = TRUE AND p.status = 'active'
      FOR UPDATE
    `, variantIds);

    if (variants.length !== variantIds.length) throw new AppError(409, 'PRODUCT_UNAVAILABLE', 'One of the selected pieces is no longer available.');

    const lines = combinedItems.map((item) => {
      const variant = variants.find((candidate) => Number(candidate.id) === item.variantId);
      if (Number(variant.stock_quantity) < item.quantity) throw new AppError(409, 'INSUFFICIENT_STOCK', `${variant.product_name} only has ${variant.stock_quantity} available.`);
      const unitPrice = Number(variant.price);
      return { ...variant, quantity: item.quantity, unitPrice, lineTotal: unitPrice * item.quantity };
    });

    const subtotal = lines.reduce((sum, item) => sum + item.lineTotal, 0);
    const normalizedPhone = checkout.customer.phone.replace(/\D/g, '');
    const customerEmail = checkout.customer.email || `phone.${normalizedPhone}@customer.chrisea.local`;
    const [users] = await connection.query(`
      SELECT id, role FROM users
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ? OR email = ?
      ORDER BY CASE WHEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ? THEN 0 ELSE 1 END
      LIMIT 1 FOR UPDATE
    `, [normalizedPhone, customerEmail, normalizedPhone]);
    let userId = users[0]?.id;
    if (!userId) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      const [userResult] = await connection.query(
        'INSERT INTO users (email, password_hash, full_name, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [customerEmail, passwordHash, checkout.customer.fullName, checkout.customer.phone, 'customer', 'active']
      );
      userId = userResult.insertId;
    }
    const promoCode = checkout.promoCode.toUpperCase();
    const promotionParams = [];
    const promotionCondition = promoCode ? 'UPPER(code) = ?' : 'apply_automatically = TRUE';
    if (promoCode) promotionParams.push(promoCode);
    promotionParams.push(subtotal);
    const [promotionRows] = await connection.query(`
      SELECT id, discount_value, free_shipping, minimum_spend, first_order_only FROM promotions
      WHERE ${promotionCondition} AND is_active = TRUE AND starts_at <= UTC_TIMESTAMP() AND ends_at >= UTC_TIMESTAMP()
        AND (usage_limit IS NULL OR usage_count < usage_limit) AND minimum_spend <= ?
      ORDER BY discount_value DESC, id DESC LIMIT 1 FOR UPDATE
    `, promotionParams);
    const promotion = promotionRows[0];
    if (promoCode && !promotion) throw new AppError(400, 'INVALID_PROMO_CODE', 'This promo code is invalid or no longer active.');
    if (promotion?.first_order_only) {
      const [previousOrders] = await connection.query(`
        SELECT o.id FROM orders o
        WHERE o.status NOT IN ('cancelled', 'payment_rejected')
          AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(o.recipient_phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ?
        LIMIT 1 FOR UPDATE
      `, [normalizedPhone]);
      if (previousOrders.length) throw new AppError(409, 'FIRST_ORDER_PROMO_ALREADY_USED', 'This promotion is available for first orders only.');
    }
    const discountTotal = promotion && subtotal >= Number(promotion.minimum_spend) ? Math.min(subtotal, subtotal * Number(promotion.discount_value) / 100) : 0;
    const [cartContentRows] = await connection.query("SELECT published_content FROM site_content WHERE page_key = 'cart' LIMIT 1");
    let configuredShippingPrice = 15;
    try {
      const cartContent = typeof cartContentRows[0]?.published_content === 'string' ? JSON.parse(cartContentRows[0].published_content) : cartContentRows[0]?.published_content;
      const publishedPrice = Number(cartContent?.shippingPrice);
      if (Number.isFinite(publishedPrice) && publishedPrice >= 0 && publishedPrice <= 10000) configuredShippingPrice = publishedPrice;
    } catch {
      configuredShippingPrice = 15;
    }
    const shippingTotal = promotion?.free_shipping || subtotal - discountTotal >= 200 ? 0 : configuredShippingPrice;
    const grandTotal = subtotal - discountTotal + shippingTotal;

    const orderNumber = `CHR-${Date.now().toString().slice(-10)}-${crypto.randomInt(10, 100)}`;
    const [orderResult] = await connection.query(`
      INSERT INTO orders (
        order_number, user_id, promotion_id, status, payment_method, currency, subtotal, discount_total,
        shipping_total, grand_total, recipient_name, recipient_phone, shipping_address_line_1,
        shipping_address_line_2, shipping_city, shipping_state, shipping_postcode, shipping_country_code
      ) VALUES (?, ?, ?, 'pending_payment', ?, 'MYR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MY')
    `, [
      orderNumber, userId, promotion?.id || null, checkout.paymentMethod, subtotal, discountTotal, shippingTotal, grandTotal,
      checkout.customer.fullName, checkout.customer.phone, checkout.customer.addressLine1,
      checkout.customer.addressLine2 || null, checkout.customer.city, checkout.customer.state, checkout.customer.postcode,
    ]);

    for (const line of lines) {
      await connection.query(`
        INSERT INTO order_items (order_id, variant_id, product_name, variant_name, sku, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderResult.insertId, line.id, line.product_name, line.variant_name, line.sku, line.unitPrice, line.quantity, line.lineTotal]);
      await connection.query('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?', [line.quantity, line.id]);
      await connection.query(
        'INSERT INTO inventory_movements (variant_id, quantity_change, reason, reference) VALUES (?, ?, ?, ?)',
        [line.id, -line.quantity, 'purchase', orderNumber]
      );
    }
    if (promotion && discountTotal > 0) await connection.query('UPDATE promotions SET usage_count = usage_count + 1 WHERE id = ?', [promotion.id]);

    await connection.query(
      'INSERT INTO order_status_history (order_id, from_status, to_status, note) VALUES (?, NULL, ?, ?)',
      [orderResult.insertId, 'pending_payment', 'Order placed through the online boutique']
    );
    await connection.commit();

    res.status(201).json({
      success: true,
      data: {
        order: {
          id: orderResult.insertId,
          orderNumber,
          status: 'pending_payment',
          paymentMethod: checkout.paymentMethod,
          subtotal,
          discount: discountTotal,
          shipping: shippingTotal,
          total: grandTotal,
          customer: checkout.customer,
          items: lines.map((line) => ({
            variantId: line.id,
            name: line.product_name,
            variantName: line.variant_name,
            sku: line.sku,
            price: `RM ${line.unitPrice.toFixed(2)}`,
            quantity: line.quantity,
          })),
        },
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
