-- Development inventory used to exercise in-stock, low-stock and sold-out states.
-- Re-running this file is safe because stock is assigned by SKU.
UPDATE product_variants SET stock_quantity = CASE sku
  WHEN 'CHR-NKL-001' THEN 0
  WHEN 'CHR-NKL-002' THEN 8
  WHEN 'CHR-BRC-001' THEN 14
  WHEN 'CHR-BRC-002' THEN 3
  WHEN 'CHR-BRC-003' THEN 0
  WHEN 'CHR-RNG-001' THEN 7
  WHEN 'CHR-RNG-002' THEN 2
  WHEN 'CHR-RNG-003-GD' THEN 5
  WHEN 'CHR-RNG-003-PT' THEN 0
  WHEN 'CHR-RNG-004' THEN 11
  WHEN 'CHR-ERG-001-GD' THEN 6
  WHEN 'CHR-ERG-001-PT' THEN 2
  WHEN 'CHR-ERG-002' THEN 0
  WHEN 'CHR-ERG-003-GD' THEN 9
  WHEN 'CHR-ERG-003-PT' THEN 4
  WHEN 'CHR-ERG-004-GD' THEN 7
  WHEN 'CHR-ERG-004-PT' THEN 3
  ELSE stock_quantity
END;
