ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER base_price;

UPDATE product_variants pv
JOIN products p ON p.id = pv.product_id
SET pv.price = ROUND(p.base_price * (1 - p.discount_percent / 100), 2);

