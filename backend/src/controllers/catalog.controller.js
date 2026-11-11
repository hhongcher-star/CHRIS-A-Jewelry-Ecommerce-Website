import { pool } from '../config/database.js';
import { AppError } from '../errors/app-error.js';

async function loadPublicProducts(whereClause = '', params = []) {
  const [products] = await pool.query(`
    SELECT p.id, p.name, p.slug, p.short_description, p.description, p.material, p.color, p.size, p.base_price, p.discount_percent,
      p.featured, p.created_at, c.name AS category
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'active' AND c.is_active = TRUE ${whereClause}
    ORDER BY p.featured DESC, p.created_at DESC, p.id DESC
  `, params);
  if (!products.length) return [];

  const productIds = products.map((product) => product.id);
  const placeholders = productIds.map(() => '?').join(',');
  const [[images], [variants]] = await Promise.all([
    pool.query(`SELECT id, product_id, image_url, alt_text, is_primary, sort_order FROM product_images WHERE product_id IN (${placeholders}) ORDER BY is_primary DESC, sort_order ASC, id ASC`, productIds),
    pool.query(`SELECT id, product_id, sku, variant_name, price, stock_quantity FROM product_variants WHERE product_id IN (${placeholders}) AND is_active = TRUE ORDER BY id ASC`, productIds)
  ]);

  return products.map((product) => {
    const productVariants = variants.filter((variant) => Number(variant.product_id) === Number(product.id));
    const purchaseVariant = productVariants.find(variant => Number(variant.stock_quantity) > 0) || productVariants[0] || null;
    return {
      ...product,
      images: images.filter((image) => Number(image.product_id) === Number(product.id)),
      variants: productVariants,
      purchase_variant: purchaseVariant,
      stock_quantity: productVariants.reduce((sum, variant) => sum + Number(variant.stock_quantity || 0), 0)
    };
  });
}

export async function catalogueProducts(_req, res) {
  res.json({ success: true, data: { products: await loadPublicProducts() } });
}

export async function catalogueProduct(req, res) {
  const products = await loadPublicProducts('AND p.slug = ?', [req.params.slug]);
  if (!products.length) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'This product is not available.');
  res.json({ success: true, data: { product: products[0] } });
}

export async function productInventory(_req, res) {
  const [rows] = await pool.query(`
    SELECT p.slug, COALESCE(SUM(CASE WHEN pv.is_active = TRUE THEN pv.stock_quantity ELSE 0 END), 0) AS stock_quantity
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    GROUP BY p.id, p.slug
    ORDER BY p.id
  `);

  res.json({ success: true, data: { products: rows } });
}

export async function catalogueCategories(_req, res) {
  const [rows] = await pool.query(`
    SELECT c.id, c.name, c.slug, COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
    WHERE c.is_active = TRUE
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `);
  res.json({ success: true, data: { categories: rows } });
}
