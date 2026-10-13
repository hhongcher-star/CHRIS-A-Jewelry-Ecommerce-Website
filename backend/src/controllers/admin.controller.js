import { pool } from '../config/database.js';
import { z } from 'zod';
import { AppError } from '../errors/app-error.js';

const createProductSchema = z.object({
  name: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(100),
  price: z.coerce.number().min(0).max(999999),
  sku: z.string().trim().min(3).max(100).transform((value) => value.toUpperCase()),
  variantName: z.string().trim().min(2).max(150).default('Default'),
  stockQuantity: z.coerce.number().int().min(0).max(999999),
  status: z.enum(['draft', 'active']).default('draft'),
  imageUrl: z.string().trim().max(1000).optional().default(''),
  description: z.string().trim().max(500).optional().default('')
});

const slugify = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function dashboard(_req, res) {
  const [[summaryRows], [stockRows], [recentOrders], [salesRows], [topProducts]] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM product_variants WHERE is_active = TRUE) AS variants,
        (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE is_active = TRUE) AS stock,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending_verification') AS payments_to_review,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
        (SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status NOT IN ('cancelled', 'payment_rejected')) AS total_sales,
        (SELECT COALESCE(AVG(grand_total), 0) FROM orders WHERE status NOT IN ('cancelled', 'payment_rejected')) AS average_order_value
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
      ORDER BY o.created_at DESC LIMIT 6
    `),
    pool.query(`
      SELECT DATE(created_at) AS sale_date, COUNT(*) AS orders, COALESCE(SUM(grand_total), 0) AS revenue
      FROM orders
      WHERE created_at >= UTC_DATE() - INTERVAL 29 DAY
        AND status NOT IN ('cancelled', 'payment_rejected')
      GROUP BY DATE(created_at)
      ORDER BY sale_date ASC
    `),
    pool.query(`
      SELECT oi.product_name AS name, SUM(oi.quantity) AS units,
        (SELECT pi.image_url FROM product_images pi JOIN products p ON p.id = pi.product_id WHERE p.name = oi.product_name ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image_url
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled', 'payment_rejected')
      GROUP BY oi.product_name
      ORDER BY units DESC, oi.product_name ASC
      LIMIT 4
    `)
  ]);

  res.json({
    success: true,
    data: { summary: summaryRows[0], lowStock: stockRows, recentOrders, sales: salesRows, topProducts }
  });
}

export async function listProducts(_req, res) {
  const [rows] = await pool.query(`
    SELECT
      p.id, p.name, p.slug, p.base_price, p.status, p.featured,
      c.name AS category,
      (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) AS image_url,
      COUNT(pv.id) AS variant_count,
      COALESCE(SUM(pv.stock_quantity), 0) AS stock_quantity
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    GROUP BY p.id, c.name
    ORDER BY p.created_at DESC, p.id DESC
  `);
  res.json({ success: true, data: { products: rows } });
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
      INSERT INTO products (category_id, name, slug, short_description, base_price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [categoryRows[0].id, product.name, slug, product.description || null, product.price, product.status]);

    await connection.query(`
      INSERT INTO product_variants (product_id, sku, variant_name, price, stock_quantity, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `, [result.insertId, product.sku, product.variantName, product.price, product.stockQuantity]);

    if (product.imageUrl) {
      await connection.query(`
        INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
        VALUES (?, ?, ?, 1, TRUE)
      `, [result.insertId, product.imageUrl, product.name]);
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

export async function listOrders(_req, res) {
  const [rows] = await pool.query(`
    SELECT o.id, o.order_number, o.status, o.grand_total, o.currency,
      o.payment_method, o.created_at, u.full_name, u.email,
      COUNT(oi.id) AS item_count
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id, u.full_name, u.email
    ORDER BY o.created_at DESC
    LIMIT 100
  `);
  res.json({ success: true, data: { orders: rows } });
}
