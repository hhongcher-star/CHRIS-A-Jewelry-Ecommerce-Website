-- Adds first-class jewellery details and collapses legacy variants into one
-- internal stock record per product. The storefront and admin only expose
-- product-level price, SKU and stock.

ALTER TABLE products ADD COLUMN IF NOT EXISTS material VARCHAR(255) NULL AFTER description;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR(150) NULL AFTER material;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(255) NULL AFTER color;

UPDATE products
SET material = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(description, 'Material:', -1), '\n', 1))
WHERE (material IS NULL OR material = '') AND description REGEXP '(^|\\n)Material[[:space:]]*:';

UPDATE products
SET color = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(description, 'Colour:', -1), '\n', 1))
WHERE (color IS NULL OR color = '') AND description REGEXP '(^|\\n)Colour[[:space:]]*:';

UPDATE products
SET color = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(description, 'Color:', -1), '\n', 1))
WHERE (color IS NULL OR color = '') AND description REGEXP '(^|\\n)Color[[:space:]]*:';

UPDATE product_variants pv
JOIN (
  SELECT product_id, MIN(id) AS keep_id, SUM(stock_quantity) AS total_stock
  FROM product_variants
  GROUP BY product_id
) totals ON totals.keep_id = pv.id
JOIN products p ON p.id = pv.product_id
SET pv.variant_name = 'Default',
    pv.price = p.base_price,
    pv.stock_quantity = totals.total_stock,
    pv.is_active = TRUE;

UPDATE product_variants pv
JOIN (
  SELECT product_id, MIN(id) AS keep_id
  FROM product_variants
  GROUP BY product_id
) keeper ON keeper.product_id = pv.product_id
SET pv.stock_quantity = 0,
    pv.is_active = FALSE
WHERE pv.id <> keeper.keep_id;
