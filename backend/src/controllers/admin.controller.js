import { pool } from '../config/database.js';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import { uploadImageAsWebp } from '../services/cloudinary.service.js';

const productVariantSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  sku: z.string().trim().min(3).max(100).transform((value) => value.toUpperCase()),
  variantName: z.string().trim().min(2).max(150).default('Default'),
  price: z.coerce.number().min(0).max(999999),
  stockQuantity: z.coerce.number().int().min(0).max(999999),
  isActive: z.boolean().optional().default(true)
});

const createProductSchema = z.object({
  name: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(100),
  price: z.coerce.number().min(0).max(999999),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
  sku: z.string().trim().min(3).max(100).transform((value) => value.toUpperCase()),
  variantName: z.string().trim().min(2).max(150).default('Default'),
  stockQuantity: z.coerce.number().int().min(0).max(999999),
  status: z.enum(['draft', 'active']).default('draft'),
  imageUrl: z.string().trim().max(1000).optional().default(''),
  imageUrls: z.array(z.string().trim().max(1000)).max(10).optional().default([]),
  shortDescription: z.string().trim().max(500).optional().default(''),
  description: z.string().trim().max(10000).optional().default(''),
  material: z.string().trim().max(255).optional().default(''),
  color: z.string().trim().max(150).optional().default(''),
  size: z.string().trim().max(255).optional().default(''),
  variants: z.array(productVariantSchema).min(1).max(50).optional()
});

const updateProductSchema = createProductSchema.omit({ imageUrl: true }).extend({
  status: z.enum(['draft', 'active', 'archived']),
  variants: z.array(productVariantSchema.extend({ id: z.coerce.number().int().positive() })).min(1).max(50)
});

const slugify = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional().default('')
});

const orderStatusSchema = z.object({
  status: z.enum(['pending_payment', 'payment_confirmed', 'shipped', 'cancelled'])
});

const stockAdjustmentSchema = z.object({ delta: z.coerce.number().int().min(-1).max(1).refine((value) => value !== 0) });
const promotionSchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: z.string().trim().max(50).optional().default(''),
  discountValue: z.coerce.number().gt(0).max(100),
  minimumSpend: z.coerce.number().min(0).default(0),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  applyAutomatically: z.boolean().default(false),
  firstOrderOnly: z.boolean().default(false),
  usageLimit: z.preprocess((value) => value === '' || value === null || value === undefined ? null : value, z.coerce.number().int().positive().max(1000000).nullable()).default(null),
  isActive: z.boolean().default(true)
});

async function adjustOrderInventory(connection, orderId, direction, reason, reference, userId) {
  const [items] = await connection.query('SELECT variant_id, quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL', [orderId]);
  for (const item of items) {
    const [variants] = await connection.query('SELECT stock_quantity FROM product_variants WHERE id = ? FOR UPDATE', [item.variant_id]);
    if (!variants.length) continue;
    const change = direction * Number(item.quantity);
    if (change < 0 && Number(variants[0].stock_quantity) < Math.abs(change)) {
      throw new AppError(409, 'INSUFFICIENT_STOCK', 'This order cannot be restored because one of its pieces no longer has enough stock.');
    }
    await connection.query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?', [change, item.variant_id]);
    await connection.query('INSERT INTO inventory_movements (variant_id, quantity_change, reason, reference, created_by) VALUES (?, ?, ?, ?, ?)', [item.variant_id, change, reason, reference, userId]);
  }
}

export async function listCategories(_req, res) {
  const [rows] = await pool.query(`
    SELECT c.id, c.name, c.slug, c.description, COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    WHERE c.is_active = TRUE
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `);
  res.json({ success: true, data: { categories: rows } });
}

export async function createCategory(req, res) {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'INVALID_CATEGORY', 'Enter a category name between 2 and 100 characters.');
  const category = parsed.data;
  const slug = slugify(category.name);
  if (!slug) throw new AppError(400, 'INVALID_CATEGORY', 'The category name must contain letters or numbers.');

  const [existing] = await pool.query('SELECT id, is_active FROM categories WHERE slug = ? LIMIT 1', [slug]);
  if (existing.length) {
    if (existing[0].is_active) throw new AppError(409, 'DUPLICATE_CATEGORY', 'This category already exists.');
    await pool.query('UPDATE categories SET name = ?, description = ?, is_active = TRUE WHERE id = ?', [category.name, category.description || null, existing[0].id]);
    return res.status(201).json({ success: true, data: { category: { id: existing[0].id, name: category.name, slug, description: category.description, product_count: 0 } } });
  }

  const [[orderRow]] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM categories');
  const [result] = await pool.query('INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, TRUE)', [category.name, slug, category.description || null, orderRow.next_order]);
  res.status(201).json({ success: true, data: { category: { id: result.insertId, name: category.name, slug, description: category.description, product_count: 0 } } });
}

export async function deleteCategory(req, res) {
  const categoryId = Number(req.params.id);
  if (!Number.isInteger(categoryId) || categoryId < 1) throw new AppError(400, 'INVALID_CATEGORY_ID', 'The category ID is invalid.');
  const [[categoryRows], [countRows]] = await Promise.all([
    pool.query('SELECT id FROM categories WHERE id = ? AND is_active = TRUE LIMIT 1', [categoryId]),
    pool.query('SELECT COUNT(*) AS active_count FROM categories WHERE is_active = TRUE')
  ]);
  if (!categoryRows.length) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'This category could not be found.');
  if (Number(countRows[0].active_count) <= 1) throw new AppError(409, 'LAST_CATEGORY', 'At least one active category is required.');
  await pool.query('UPDATE categories SET is_active = FALSE WHERE id = ?', [categoryId]);
  res.status(204).send();
}

export async function dashboard(_req, res) {
  const [[summaryRows], [stockRows], [recentOrders], [salesDaily], [salesWeekly], [salesMonthly], [topProducts], [categorySales], [paymentSales], [periodSales]] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM product_variants WHERE is_active = TRUE) AS variants,
        (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE is_active = TRUE) AS stock,
        (SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL AND status <> 'cancelled') AS orders,
        (SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL AND status = 'pending_payment') AS payments_to_review,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
        (SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE deleted_at IS NULL AND status <> 'cancelled') AS total_sales,
        (SELECT COALESCE(AVG(grand_total), 0) FROM orders WHERE deleted_at IS NULL AND status <> 'cancelled') AS average_order_value
    `),
    pool.query(`
      SELECT p.id, p.name, pv.sku, pv.variant_name, pv.stock_quantity, pv.low_stock_threshold,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image_url
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.is_active = TRUE AND pv.stock_quantity <= pv.low_stock_threshold
      ORDER BY pv.stock_quantity ASC, p.name ASC
      LIMIT 6
    `),
    pool.query(`
      SELECT o.id, o.order_number, o.status, o.grand_total, o.currency, o.created_at, u.full_name
      FROM orders o JOIN users u ON u.id = o.user_id
      WHERE o.deleted_at IS NULL
      ORDER BY o.created_at DESC LIMIT 6
    `),
    pool.query(`
      SELECT DATE(created_at) AS sale_date, COUNT(*) AS orders, COALESCE(SUM(grand_total), 0) AS revenue
      FROM orders
      WHERE created_at >= UTC_DATE() - INTERVAL 29 DAY AND deleted_at IS NULL
        AND status <> 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY sale_date ASC
    `),
    pool.query(`
      SELECT DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY) AS sale_date, COUNT(*) AS orders, COALESCE(SUM(grand_total), 0) AS revenue
      FROM orders WHERE created_at >= UTC_DATE() - INTERVAL 83 DAY AND deleted_at IS NULL AND status <> 'cancelled'
      GROUP BY DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY) ORDER BY sale_date ASC
    `),
    pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m-01') AS sale_date, COUNT(*) AS orders, COALESCE(SUM(grand_total), 0) AS revenue
      FROM orders WHERE created_at >= DATE_SUB(DATE_FORMAT(UTC_DATE(), '%Y-%m-01'), INTERVAL 11 MONTH) AND deleted_at IS NULL AND status <> 'cancelled'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-01') ORDER BY sale_date ASC
    `),
    pool.query(`
      SELECT oi.product_name AS name, SUM(oi.quantity) AS units,
        (SELECT pi.image_url FROM product_images pi JOIN products p ON p.id = pi.product_id WHERE p.name = oi.product_name ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image_url
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status <> 'cancelled' AND o.deleted_at IS NULL
        AND o.created_at >= UTC_DATE() - INTERVAL 29 DAY
      GROUP BY oi.product_name
      ORDER BY units DESC, oi.product_name ASC
      LIMIT 5
    `),
    pool.query(`
      SELECT c.name, COALESCE(SUM(oi.line_total), 0) AS revenue, SUM(oi.quantity) AS units
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN product_variants pv ON pv.id = oi.variant_id
      LEFT JOIN products p ON p.id = pv.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o.deleted_at IS NULL AND o.status <> 'cancelled' AND o.created_at >= UTC_DATE() - INTERVAL 29 DAY
      GROUP BY c.name ORDER BY revenue DESC
    `),
    pool.query(`
      SELECT payment_method, COUNT(*) AS orders, COALESCE(SUM(grand_total), 0) AS revenue
      FROM orders WHERE deleted_at IS NULL AND status <> 'cancelled' AND created_at >= UTC_DATE() - INTERVAL 29 DAY
      GROUP BY payment_method ORDER BY revenue DESC
    `),
    pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN created_at >= UTC_DATE() - INTERVAL 29 DAY THEN grand_total ELSE 0 END), 0) AS current_sales,
        COALESCE(SUM(CASE WHEN created_at >= UTC_DATE() - INTERVAL 59 DAY AND created_at < UTC_DATE() - INTERVAL 29 DAY THEN grand_total ELSE 0 END), 0) AS previous_sales
      FROM orders WHERE deleted_at IS NULL AND status <> 'cancelled' AND created_at >= UTC_DATE() - INTERVAL 59 DAY
    `)
  ]);

  const currentSales = Number(periodSales[0]?.current_sales || 0);
  const previousSales = Number(periodSales[0]?.previous_sales || 0);
  const salesGrowth = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : currentSales > 0 ? 100 : 0;

  res.json({
    success: true,
    data: { summary: { ...summaryRows[0], sales_growth: salesGrowth, current_period_sales: currentSales, previous_period_sales: previousSales }, lowStock: stockRows, recentOrders, sales: { daily: salesDaily, weekly: salesWeekly, monthly: salesMonthly }, topProducts, categorySales, paymentSales }
  });
}

export async function listProducts(_req, res) {
  const [rows] = await pool.query(`
    SELECT
      p.id, p.name, p.slug, p.base_price, p.discount_percent, p.status, p.featured,
      c.name AS category,
      (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image_url,
      COUNT(pv.id) AS variant_count,
      COALESCE(SUM(pv.stock_quantity), 0) AS stock_quantity
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.status <> 'archived'
    GROUP BY p.id, c.name
    ORDER BY p.created_at DESC, p.id DESC
  `);
  res.json({ success: true, data: { products: rows } });
}

export async function getProduct(req, res) {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) throw new AppError(400, 'INVALID_PRODUCT_ID', 'The product ID is invalid.');

  const [[productRows], [variants], [images]] = await Promise.all([
    pool.query(`
      SELECT p.id, p.name, p.slug, p.short_description, p.description, p.material, p.color, p.size, p.base_price, p.discount_percent,
        p.status, p.featured, p.created_at, p.updated_at, c.name AS category
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.id = ? LIMIT 1
    `, [productId]),
    pool.query(`
      SELECT id, sku, variant_name, price, stock_quantity, low_stock_threshold, is_active
      FROM product_variants WHERE product_id = ? ORDER BY id ASC
    `, [productId]),
    pool.query(`
      SELECT id, image_url, alt_text, sort_order, is_primary
      FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC
    `, [productId])
  ]);

  if (!productRows.length) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'This product could not be found.');
  res.json({ success: true, data: { product: { ...productRows[0], variants, images } } });
}

export async function createProduct(req, res) {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'INVALID_PRODUCT', 'Please check the product details and try again.', parsed.error.flatten().fieldErrors);
  }

  const product = parsed.data;
  const slug = slugify(product.name);
  if (!slug) throw new AppError(400, 'INVALID_PRODUCT_NAME', 'The product name must contain letters or numbers.');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [categoryRows] = await connection.query('SELECT id FROM categories WHERE name = ? AND is_active = TRUE LIMIT 1', [product.category]);
    if (!categoryRows.length) throw new AppError(400, 'INVALID_CATEGORY', 'Please select an available category.');

    const [result] = await connection.query(`
      INSERT INTO products (category_id, name, slug, short_description, description, material, color, size, base_price, discount_percent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [categoryRows[0].id, product.name, slug, product.shortDescription || null, product.description || null, product.material || null, product.color || null, product.size || null, product.price, product.discountPercent, product.status]);

    const salePrice = Number((product.price * (1 - product.discountPercent / 100)).toFixed(2));
    const variants = product.variants?.length ? product.variants.map((variant) => ({ ...variant, price: salePrice })) : [{ sku: product.sku, variantName: product.variantName, price: salePrice, stockQuantity: product.stockQuantity, isActive: true }];
    for (const variant of variants) {
      await connection.query(`
        INSERT INTO product_variants (product_id, sku, variant_name, price, stock_quantity, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [result.insertId, variant.sku, variant.variantName, variant.price, variant.stockQuantity, variant.isActive]);
    }

    const imageUrls = product.imageUrls.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
    for (const [index, imageUrl] of imageUrls.entries()) {
      await connection.query(`
          INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
          VALUES (?, ?, ?, ?, ?)
        `, [result.insertId, imageUrl, `${product.name} view ${index + 1}`, index + 1, index === 0]);
    }

    await connection.commit();
    res.status(201).json({ success: true, data: { id: result.insertId, slug } });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') throw new AppError(409, 'DUPLICATE_PRODUCT', 'A product with this name or SKU already exists.');
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateProduct(req, res) {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) throw new AppError(400, 'INVALID_PRODUCT_ID', 'The product ID is invalid.');
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'INVALID_PRODUCT', 'Please check the product details and try again.', parsed.error.flatten().fieldErrors);

  const product = parsed.data;
  const slug = slugify(product.name);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [productRows] = await connection.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (!productRows.length) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'This product could not be found.');
    const [categoryRows] = await connection.query('SELECT id FROM categories WHERE name = ? AND is_active = TRUE LIMIT 1', [product.category]);
    if (!categoryRows.length) throw new AppError(400, 'INVALID_CATEGORY', 'Please select an available category.');

    await connection.query(`
      UPDATE products SET category_id = ?, name = ?, slug = ?, short_description = ?, description = ?, material = ?, color = ?, size = ?, base_price = ?, discount_percent = ?, status = ?
      WHERE id = ?
    `, [categoryRows[0].id, product.name, slug, product.shortDescription || null, product.description || null, product.material || null, product.color || null, product.size || null, product.price, product.discountPercent, product.status, productId]);

    const [existingVariants] = await connection.query('SELECT id FROM product_variants WHERE product_id = ?', [productId]);
    const allowedVariantIds = new Set(existingVariants.map((variant) => Number(variant.id)));
    const salePrice = Number((product.price * (1 - product.discountPercent / 100)).toFixed(2));
    for (const variant of product.variants) {
      if (!allowedVariantIds.has(Number(variant.id))) throw new AppError(400, 'INVALID_VARIANT', 'One of the product variants is invalid.');
      await connection.query(`
        UPDATE product_variants SET sku = ?, variant_name = ?, price = ?, stock_quantity = ?, is_active = ?
        WHERE id = ? AND product_id = ?
      `, [variant.sku, variant.variantName, salePrice, variant.stockQuantity, variant.isActive, variant.id, productId]);
    }

    await connection.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    for (const [index, imageUrl] of product.imageUrls.entries()) {
      await connection.query(`
        INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
        VALUES (?, ?, ?, ?, ?)
      `, [productId, imageUrl, `${product.name} view ${index + 1}`, index + 1, index === 0]);
    }

    await connection.commit();
    res.json({ success: true, data: { id: productId, slug } });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') throw new AppError(409, 'DUPLICATE_PRODUCT', 'A product with this name or SKU already exists.');
    throw error;
  } finally {
    connection.release();
  }
}

const uploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  dataUrl: z.string().min(20)
});

export async function uploadProductImage(req, res) {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'INVALID_IMAGE', 'Please select a valid product image.');

  const match = parsed.data.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new AppError(400, 'INVALID_IMAGE_TYPE', 'Only JPG, PNG and WebP images are supported.');

  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new AppError(400, 'IMAGE_TOO_LARGE', 'Each image must be 5 MB or smaller.');

  const folder = req.path.includes('content-images') ? 'content' : 'products';
  const uploaded = await uploadImageAsWebp({ dataUrl: parsed.data.dataUrl, filename: parsed.data.filename, folder });

  res.status(201).json({ success: true, data: uploaded });
}

export async function listOrders(_req, res) {
  const [rows] = await pool.query(`
    SELECT o.id, o.order_number, o.status, o.grand_total, o.currency,
      o.payment_method, o.created_at, o.recipient_phone, u.full_name,
      CASE WHEN u.email LIKE '%@customer.chrisea.local' THEN o.recipient_phone ELSE u.email END AS email,
      COUNT(oi.id) AS item_count
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.deleted_at IS NULL
    GROUP BY o.id, o.recipient_phone, u.full_name, u.email
    ORDER BY o.created_at DESC
    LIMIT 100
  `);
  res.json({ success: true, data: { orders: rows } });
}

export async function getOrder(req, res) {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) throw new AppError(400, 'INVALID_ORDER_ID', 'The order ID is invalid.');

  const [[orderRows], [items], [proofs]] = await Promise.all([
    pool.query(`
      SELECT o.*, u.full_name, u.email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.id = ? LIMIT 1
    `, [orderId]),
    pool.query(`
      SELECT oi.id, oi.product_name, oi.variant_name, oi.sku, oi.unit_price, oi.quantity, oi.line_total,
        p.short_description,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image_url
      FROM order_items oi
      LEFT JOIN product_variants pv ON pv.id = oi.variant_id
      LEFT JOIN products p ON p.id = pv.product_id
      WHERE oi.order_id = ? ORDER BY oi.id ASC
    `, [orderId]),
    pool.query(`
      SELECT id, storage_key, original_filename, mime_type, file_size_bytes,
        payment_reference, status, review_note, created_at
      FROM payment_proofs WHERE order_id = ? ORDER BY created_at DESC
    `, [orderId])
  ]);

  if (!orderRows.length) throw new AppError(404, 'ORDER_NOT_FOUND', 'This order could not be found.');
  res.json({ success: true, data: { order: { ...orderRows[0], items, payment_proofs: proofs } } });
}

export async function updateOrderStatus(req, res) {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) throw new AppError(400, 'INVALID_ORDER_ID', 'The order ID is invalid.');
  const parsed = orderStatusSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'INVALID_ORDER_STATUS', 'Please select a valid payment status.');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT status, order_number, deleted_at FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (!rows.length) throw new AppError(404, 'ORDER_NOT_FOUND', 'This order could not be found.');
    const previousStatus = rows[0].status;
    const nextStatus = parsed.data.status;
    if (previousStatus !== nextStatus) {
      if (nextStatus === 'cancelled' && previousStatus !== 'cancelled') await adjustOrderInventory(connection, orderId, 1, 'cancellation', rows[0].order_number, req.user.id);
      if (previousStatus === 'cancelled' && nextStatus !== 'cancelled') await adjustOrderInventory(connection, orderId, -1, 'purchase', rows[0].order_number, req.user.id);
      await connection.query('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, orderId]);
      await connection.query(`
        INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `, [orderId, previousStatus, nextStatus, 'Updated from the administrator order ledger.', req.user.id]);
    }
    await connection.commit();
    res.json({ success: true, data: { order: { id: orderId, status: nextStatus } } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listDeletedOrders(_req, res) {
  const [rows] = await pool.query(`
      SELECT o.id, o.order_number, o.grand_total, o.status, o.payment_method, o.created_at, o.deleted_at, o.recipient_phone, u.full_name,
        CASE WHEN u.email LIKE '%@customer.chrisea.local' THEN o.recipient_phone ELSE u.email END AS email,
      (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
    FROM orders o JOIN users u ON u.id = o.user_id
    WHERE o.deleted_at IS NOT NULL ORDER BY o.deleted_at DESC LIMIT 100
  `);
  res.json({ success: true, data: { orders: rows } });
}

export async function deleteOrder(req, res) {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) throw new AppError(400, 'INVALID_ORDER_ID', 'The order ID is invalid.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT status, order_number FROM orders WHERE id = ? AND deleted_at IS NULL FOR UPDATE', [orderId]);
    if (!rows.length) throw new AppError(404, 'ORDER_NOT_FOUND', 'This order could not be found.');
    if (rows[0].status !== 'cancelled') await adjustOrderInventory(connection, orderId, 1, 'cancellation', rows[0].order_number, req.user.id);
    await connection.query('UPDATE orders SET deleted_at = UTC_TIMESTAMP() WHERE id = ?', [orderId]);
    await connection.commit();
    res.status(204).send();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function restoreOrder(req, res) {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) throw new AppError(400, 'INVALID_ORDER_ID', 'The order ID is invalid.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT status, order_number FROM orders WHERE id = ? AND deleted_at IS NOT NULL FOR UPDATE', [orderId]);
    if (!rows.length) throw new AppError(404, 'ORDER_NOT_FOUND', 'This deleted order could not be found.');
    if (rows[0].status !== 'cancelled') await adjustOrderInventory(connection, orderId, -1, 'purchase', rows[0].order_number, req.user.id);
    await connection.query('UPDATE orders SET deleted_at = NULL WHERE id = ?', [orderId]);
    await connection.commit();
    res.json({ success: true, data: { restored: true } });
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function permanentlyDeleteOrder(req, res) {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) throw new AppError(400, 'INVALID_ORDER_ID', 'The order ID is invalid.');
  const [result] = await pool.query('DELETE FROM orders WHERE id = ? AND deleted_at IS NOT NULL', [orderId]);
  if (!result.affectedRows) throw new AppError(404, 'ORDER_NOT_FOUND', 'This order is not in the recycle bin.');
  res.status(204).send();
}

export async function adjustProductStock(req, res) {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) throw new AppError(400, 'INVALID_PRODUCT_ID', 'The product ID is invalid.');
  const parsed = stockAdjustmentSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'INVALID_STOCK_ADJUSTMENT', 'Stock can only be adjusted by one at a time.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [variants] = await connection.query('SELECT id, stock_quantity FROM product_variants WHERE product_id = ? AND is_active = TRUE ORDER BY id ASC LIMIT 1 FOR UPDATE', [productId]);
    if (!variants.length) throw new AppError(404, 'VARIANT_NOT_FOUND', 'This product has no active inventory record.');
    const nextStock = Number(variants[0].stock_quantity) + parsed.data.delta;
    if (nextStock < 0) throw new AppError(409, 'INSUFFICIENT_STOCK', 'Stock cannot be lower than zero.');
    await connection.query('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [nextStock, variants[0].id]);
    await connection.query('INSERT INTO inventory_movements (variant_id, quantity_change, reason, reference, created_by) VALUES (?, ?, ?, ?, ?)', [variants[0].id, parsed.data.delta, 'adjustment', 'Admin product list', req.user.id]);
    await connection.commit();
    res.json({ success: true, data: { stockQuantity: nextStock } });
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function listDeletedProducts(_req, res) {
  const [rows] = await pool.query(`
    SELECT p.id, p.name, p.slug, p.base_price, p.updated_at,
      (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image_url
    FROM products p WHERE p.status = 'archived' ORDER BY p.updated_at DESC
  `);
  res.json({ success: true, data: { products: rows } });
}

export async function deleteProduct(req, res) {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) throw new AppError(400, 'INVALID_PRODUCT_ID', 'The product ID is invalid.');
  const [result] = await pool.query("UPDATE products SET status = 'archived' WHERE id = ? AND status <> 'archived'", [productId]);
  if (!result.affectedRows) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'This product could not be found.');
  res.status(204).send();
}

export async function restoreProduct(req, res) {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) throw new AppError(400, 'INVALID_PRODUCT_ID', 'The product ID is invalid.');
  const [result] = await pool.query("UPDATE products SET status = 'active' WHERE id = ? AND status = 'archived'", [productId]);
  if (!result.affectedRows) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'This deleted product could not be found.');
  res.json({ success: true, data: { restored: true } });
}

export async function permanentlyDeleteProduct(req, res) {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) throw new AppError(400, 'INVALID_PRODUCT_ID', 'The product ID is invalid.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [products] = await connection.query("SELECT id FROM products WHERE id = ? AND status = 'archived' FOR UPDATE", [productId]);
    if (!products.length) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'This product is not in the recycle bin.');
    const [variants] = await connection.query('SELECT id FROM product_variants WHERE product_id = ?', [productId]);
    const variantIds = variants.map((variant) => variant.id);
    if (variantIds.length) {
      const placeholders = variantIds.map(() => '?').join(',');
      await connection.query(`DELETE FROM cart_items WHERE variant_id IN (${placeholders})`, variantIds);
      await connection.query(`DELETE FROM inventory_movements WHERE variant_id IN (${placeholders})`, variantIds);
    }
    await connection.query('DELETE FROM products WHERE id = ?', [productId]);
    await connection.commit();
    res.status(204).send();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function listPromotions(_req, res) {
  const [rows] = await pool.query('SELECT id, code, name, discount_value, minimum_spend, starts_at, ends_at, is_active, apply_automatically, first_order_only, usage_limit, usage_count FROM promotions ORDER BY created_at DESC');
  res.json({ success: true, data: { promotions: rows } });
}

export async function createPromotion(req, res) {
  const parsed = promotionSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'INVALID_PROMOTION', 'Please check the promotion details.');
  const promotion = parsed.data;
  if (new Date(promotion.endsAt) <= new Date(promotion.startsAt)) throw new AppError(400, 'INVALID_PROMOTION_DATES', 'The end date must be after the start date.');
  const code = promotion.applyAutomatically ? `AUTO-${Date.now()}` : promotion.code.toUpperCase();
  if (!promotion.applyAutomatically && !code) throw new AppError(400, 'PROMO_CODE_REQUIRED', 'Enter a promo code.');
  try {
    const [result] = await pool.query(`INSERT INTO promotions (code, name, discount_type, discount_value, minimum_spend, starts_at, ends_at, is_active, apply_automatically, first_order_only, usage_limit) VALUES (?, ?, 'percentage', ?, ?, ?, ?, ?, ?, ?, ?)`, [code, promotion.name, promotion.discountValue, promotion.minimumSpend, new Date(promotion.startsAt), new Date(promotion.endsAt), promotion.isActive, promotion.applyAutomatically, promotion.firstOrderOnly, promotion.usageLimit]);
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new AppError(409, 'DUPLICATE_PROMO_CODE', 'This promo code already exists.');
    throw error;
  }
}

export async function updatePromotion(req, res) {
  const promotionId = Number(req.params.id);
  if (!Number.isInteger(promotionId) || promotionId < 1) throw new AppError(400, 'INVALID_PROMOTION_ID', 'The promotion ID is invalid.');
  const parsed = promotionSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'INVALID_PROMOTION', 'Please check the promotion details.', parsed.error.flatten().fieldErrors);
  const promotion = parsed.data;
  if (new Date(promotion.endsAt) <= new Date(promotion.startsAt)) throw new AppError(400, 'INVALID_PROMOTION_DATES', 'The end date must be after the start date.');
  const code = promotion.applyAutomatically ? String(req.body.code || `AUTO-${promotionId}`).toUpperCase() : promotion.code.toUpperCase();
  if (!promotion.applyAutomatically && !code) throw new AppError(400, 'PROMO_CODE_REQUIRED', 'Enter a promo code.');
  try {
    const [result] = await pool.query(`UPDATE promotions SET code = ?, name = ?, discount_value = ?, minimum_spend = ?, starts_at = ?, ends_at = ?, is_active = ?, apply_automatically = ?, first_order_only = ?, usage_limit = ? WHERE id = ?`, [code, promotion.name, promotion.discountValue, promotion.minimumSpend, new Date(promotion.startsAt), new Date(promotion.endsAt), promotion.isActive, promotion.applyAutomatically, promotion.firstOrderOnly, promotion.usageLimit, promotionId]);
    if (!result.affectedRows) throw new AppError(404, 'PROMOTION_NOT_FOUND', 'This promotion could not be found.');
    res.json({ success: true, data: { updated: true } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw new AppError(409, 'DUPLICATE_PROMO_CODE', 'This promo code already exists.');
    throw error;
  }
}

export async function togglePromotion(req, res) {
  const promotionId = Number(req.params.id);
  if (!Number.isInteger(promotionId) || promotionId < 1) throw new AppError(400, 'INVALID_PROMOTION_ID', 'The promotion ID is invalid.');
  const active = z.object({ isActive: z.boolean() }).safeParse(req.body);
  if (!active.success) throw new AppError(400, 'INVALID_PROMOTION', 'Choose whether this promotion is active.');
  const [result] = await pool.query('UPDATE promotions SET is_active = ? WHERE id = ?', [active.data.isActive, promotionId]);
  if (!result.affectedRows) throw new AppError(404, 'PROMOTION_NOT_FOUND', 'This promotion could not be found.');
  res.json({ success: true, data: { updated: true } });
}

export async function deletePromotion(req, res) {
  const promotionId = Number(req.params.id);
  if (!Number.isInteger(promotionId) || promotionId < 1) throw new AppError(400, 'INVALID_PROMOTION_ID', 'The promotion ID is invalid.');
  const [result] = await pool.query('DELETE FROM promotions WHERE id = ?', [promotionId]);
  if (!result.affectedRows) throw new AppError(404, 'PROMOTION_NOT_FOUND', 'This promotion could not be found.');
  res.status(204).send();
}
