import { pool } from '../config/database.js';

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
