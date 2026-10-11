-- Initial CHRISÉA Jewelry catalogue.
-- Run schema.sql before this file.
-- Stock is intentionally set to 0 until the merchant confirms quantities.

USE chrisea_jewelry;

SET @necklaces_category_id = (
  SELECT id FROM categories WHERE slug = 'necklaces' LIMIT 1
);
SET @bracelets_category_id = (
  SELECT id FROM categories WHERE slug = 'bracelets' LIMIT 1
);
SET @rings_category_id = (
  SELECT id FROM categories WHERE slug = 'rings' LIMIT 1
);
SET @earrings_category_id = (
  SELECT id FROM categories WHERE slug = 'earrings' LIMIT 1
);

INSERT INTO products (
  category_id,
  name,
  slug,
  short_description,
  description,
  base_price,
  status,
  featured
) VALUES (
  @necklaces_category_id,
  '925 Sterling Silver Enamel Pendant Necklace',
  '925-sterling-silver-enamel-pendant-necklace',
  'A vintage-gold necklace with a red enamel Chinese coin-inspired pendant.',
  'Inspired by the timeless beauty of traditional Chinese design, this necklace features a classic Chinese coin motif paired with delicate pearl-like rings in a regal, court-inspired style. The rich red enamel adds a touch of vintage elegance while symbolising good fortune, prosperity and auspicious blessings.\n\nMaterial: S925 Sterling Silver / Enamel\nColour: Vintage Gold\nChain Length: Approx. 40 cm + 6 cm extender\nPendant Height: Approx. 1.5 cm',
  168.00,
  'draft',
  TRUE
);
SET @enamel_necklace_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES (
  @enamel_necklace_id, 'CHR-NKL-001', 'Vintage Gold', 168.00, 0, TRUE
);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@enamel_necklace_id, '/assets/products/enamel-coin-necklace/01-main.png', 'Vintage gold necklace with a red enamel coin-inspired pendant', 1, TRUE),
  (@enamel_necklace_id, '/assets/products/enamel-coin-necklace/02-detail.png', 'Close-up of the red enamel pendant and linked ring detail', 2, FALSE);

INSERT INTO products (
  category_id,
  name,
  slug,
  short_description,
  description,
  base_price,
  status,
  featured
) VALUES (
  @necklaces_category_id,
  'S925 Sterling Silver Vintage Zircon Heart Pendant Necklace',
  's925-sterling-silver-vintage-zircon-heart-pendant-necklace',
  'A petite vintage-gold heart pendant accented with colourful zircon details.',
  'A delicate vintage-inspired necklace featuring a sculpted heart pendant accented with colourful zircon details. Its warm vintage-gold finish and petite proportions make it an elegant piece for everyday wear or thoughtful gifting.\n\nMaterial: S925 Sterling Silver / Zircon\nColour: Vintage Gold\nChain Length: Approx. 39 cm + 6 cm extender\nPendant Size: Approx. 1.3 cm',
  155.00,
  'draft',
  FALSE
);
SET @heart_necklace_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES (
  @heart_necklace_id, 'CHR-NKL-002', 'Vintage Gold', 155.00, 0, TRUE
);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@heart_necklace_id, '/assets/products/zircon-heart-necklace/02-main.png', 'Vintage gold necklace with a petite heart pendant', 1, TRUE),
  (@heart_necklace_id, '/assets/products/zircon-heart-necklace/01-detail.png', 'Close-up of the vintage heart pendant with colourful zircon accents', 2, FALSE);

INSERT INTO products (
  category_id,
  name,
  slug,
  short_description,
  description,
  base_price,
  status,
  featured
) VALUES (
  @bracelets_category_id,
  'S925 Sterling Silver Minimalist Pearl Bracelet',
  's925-sterling-silver-minimalist-pearl-bracelet',
  'A minimalist double-strand natural pearl bracelet with a flowing vintage-gold accent.',
  'A graceful minimalist bracelet combining two delicate strands of natural pearls with a fluid vintage-gold accent. The adjustable extender offers a comfortable fit, while the organic character of each pearl makes every piece subtly unique.\n\nMaterial: S925 Sterling Silver / Natural Pearl\nColour: Vintage Gold\nBracelet Length: Approx. 16 cm + 3 cm extender\nPearl Size: Approx. 4 mm',
  189.00,
  'draft',
  TRUE
);
SET @pearl_bracelet_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES (
  @pearl_bracelet_id, 'CHR-BRC-001', 'Vintage Gold', 189.00, 0, TRUE
);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@pearl_bracelet_id, '/assets/products/minimalist-pearl-bracelet/01-main.png', 'Double-strand natural pearl bracelet with a vintage-gold accent', 1, TRUE),
  (@pearl_bracelet_id, '/assets/products/minimalist-pearl-bracelet/02-lifestyle.png', 'Natural pearl bracelet worn on the wrist', 2, FALSE),
  (@pearl_bracelet_id, '/assets/products/minimalist-pearl-bracelet/03-lifestyle.png', 'Vintage-inspired lifestyle view of the pearl bracelet', 3, FALSE),
  (@pearl_bracelet_id, '/assets/products/minimalist-pearl-bracelet/04-lifestyle.png', 'Pearl bracelet styled beside a vintage piano', 4, FALSE);

INSERT INTO products (
  category_id,
  name,
  slug,
  short_description,
  description,
  base_price,
  status,
  featured
) VALUES (
  @bracelets_category_id,
  'Pearl & Turquoise Gemstone Bracelet',
  'pearl-turquoise-gemstone-bracelet',
  'A French vintage-inspired pearl bracelet centred with a blue synthetic turquoise accent.',
  'Vintage 37-bead pearls are beautifully paired with a delicate blue turquoise accent at the centre, creating an elegant French vintage charm reminiscent of the timeless glamour of the Breakfast at Tiffany’s era.\n\nMaterial: S925 Sterling Silver / Synthetic Turquoise / Natural Pearls\nColour: Vintage Gold\nBracelet Length: Approx. 16 cm + 3 cm extender\nPearl Size: Approx. 4–5 mm\nTurquoise Size: Approx. 5 mm',
  139.00,
  'draft',
  FALSE
);
SET @turquoise_bracelet_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES (
  @turquoise_bracelet_id, 'CHR-BRC-002', 'Vintage Gold', 139.00, 0, TRUE
);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@turquoise_bracelet_id, '/assets/products/pearl-turquoise-bracelet/01-main.png', 'Pearl and vintage-gold bracelet with a blue turquoise centre accent', 1, TRUE),
  (@turquoise_bracelet_id, '/assets/products/pearl-turquoise-bracelet/02-detail.png', 'Close-up of the blue synthetic turquoise setting and natural pearls', 2, FALSE),
  (@turquoise_bracelet_id, '/assets/products/pearl-turquoise-bracelet/03-lifestyle.png', 'Pearl and turquoise bracelet worn on the wrist', 3, FALSE);

-- Price is temporarily 0.00 because the merchant has not supplied it.
-- Keep this product in draft and update both prices before publication.
INSERT INTO products (
  category_id,
  name,
  slug,
  short_description,
  description,
  base_price,
  status,
  featured
) VALUES (
  @bracelets_category_id,
  'Vintage Gold Malachite & Pearl Bracelet',
  'vintage-gold-malachite-pearl-bracelet',
  'An adjustable natural pearl bracelet with a malachite charm and symbolic Fu-inspired detail.',
  'A delicate arrangement of pearls creates an effortless, elegant look, complemented by a fluid gold-tone setting featuring a traditional “Fu” character design. Symbolising blessings, happiness and good fortune, this bracelet lets you carry beautiful wishes with you wherever you go.\n\nMaterial: S925 Sterling Silver / Malachite / Natural Pearls\nColour: Vintage Gold\nType: Adjustable Sterling Silver Bracelet\nBracelet Length: Approx. 16 cm + 3 cm extender\nPearl Size: Approx. 4–6 mm\nPrice: TO BE CONFIRMED',
  0.00,
  'draft',
  FALSE
);
SET @malachite_bracelet_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES (
  @malachite_bracelet_id, 'CHR-BRC-003', 'Vintage Gold', 0.00, 0, FALSE
);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@malachite_bracelet_id, '/assets/products/malachite-pearl-bracelet/01-main.png', 'Natural pearl bracelet with a vintage-gold malachite pendant', 1, TRUE),
  (@malachite_bracelet_id, '/assets/products/malachite-pearl-bracelet/02-full-view.png', 'Full view of the malachite and pearl bracelet', 2, FALSE),
  (@malachite_bracelet_id, '/assets/products/malachite-pearl-bracelet/03-lifestyle.png', 'Malachite and natural pearl bracelet worn on the wrist', 3, FALSE),
  (@malachite_bracelet_id, '/assets/products/malachite-pearl-bracelet/04-lifestyle.png', 'Close lifestyle view of the malachite pearl bracelet', 4, FALSE);

INSERT INTO products (
  category_id,
  name,
  slug,
  short_description,
  description,
  base_price,
  status,
  featured
) VALUES (
  @rings_category_id,
  'S925 Sterling Silver Statement Zircon Ring',
  's925-sterling-silver-statement-zircon-ring',
  'A bold vintage-gold linked ring with refined zircon accents.',
  'A bold vintage-gold statement ring crafted in S925 sterling silver. Its sculptural linked design is illuminated with zircon accents, balancing distinctive character with refined shine. The open construction allows for an adjustable fit.\n\nMaterial: S925 Sterling Silver / Zircon\nColour: Vintage Gold\nSize: Adjustable open ring, approx. US size 16 (size system to be confirmed)',
  120.00,
  'draft',
  FALSE
);
SET @statement_ring_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES (
  @statement_ring_id, 'CHR-RNG-001', 'Vintage Gold / Adjustable', 120.00, 0, TRUE
);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@statement_ring_id, '/assets/products/statement-zircon-ring/01-main.png', 'Vintage-gold statement ring with linked design and zircon accents', 1, TRUE),
  (@statement_ring_id, '/assets/products/statement-zircon-ring/02-styled.png', 'Statement zircon ring styled with vintage-gold heart earrings', 2, FALSE);

INSERT INTO products (
  category_id,
  name,
  slug,
  short_description,
  description,
  base_price,
  status,
  featured
) VALUES (
  @rings_category_id,
  'Gilded Bow Ring',
  'gilded-bow-ring',
  'A delicately textured vintage-gold bow ring with an elegant zircon detail.',
  'The delicate textured finish adds an effortlessly vintage touch, while the delicate teardrop zircon detail captures a sense of graceful, sophisticated elegance.\n\nMaterial: S925 Sterling Silver\nColour: Vintage Gold\nSize: Adjustable open ring, approx. US size 16 (size system to be confirmed)',
  128.00,
  'draft',
  FALSE
);
SET @bow_ring_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES (
  @bow_ring_id, 'CHR-RNG-002', 'Vintage Gold / Adjustable', 128.00, 0, TRUE
);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@bow_ring_id, '/assets/products/gilded-bow-ring/04-main.png', 'Vintage-gold textured bow ring on a white display', 1, TRUE),
  (@bow_ring_id, '/assets/products/gilded-bow-ring/01-lifestyle.png', 'Gilded bow ring worn on the hand', 2, FALSE),
  (@bow_ring_id, '/assets/products/gilded-bow-ring/02-lifestyle.png', 'Close lifestyle view of the vintage-gold bow ring', 3, FALSE),
  (@bow_ring_id, '/assets/products/gilded-bow-ring/03-lifestyle.png', 'Gilded bow ring styled with vintage accessories', 4, FALSE);

INSERT INTO products (
  category_id,
  name,
  slug,
  short_description,
  description,
  base_price,
  status,
  featured
) VALUES (
  @rings_category_id,
  'S925 Sterling Silver Vintage Zircon Lapis Lazuli / Mother-of-Pearl Ring',
  's925-vintage-zircon-lapis-mother-of-pearl-ring',
  'A vintage open ring offered with lapis lazuli or mother-of-pearl.',
  'A romantic vintage-inspired open ring accented with sparkling zircon and a sculptural centre stone. Choose deep-blue lapis lazuli in warm Vintage Gold or luminous mother-of-pearl in cool Platinum. The intricate woven band brings delicate texture and timeless character to either finish.\n\nMaterial: S925 Sterling Silver / Zircon / Lapis Lazuli / Mother-of-Pearl\nColours: Vintage Gold / Platinum\nSize: Adjustable open ring, approx. US size 14 (size system to be confirmed)\nNote: Platinum is available by pre-order only.',
  138.00,
  'draft',
  FALSE
);
SET @lapis_mop_ring_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES
  (@lapis_mop_ring_id, 'CHR-RNG-003-GD', 'Vintage Gold / Lapis Lazuli', 138.00, 0, TRUE),
  (@lapis_mop_ring_id, 'CHR-RNG-003-PT', 'Platinum / Mother-of-Pearl / Pre-order', 138.00, 0, TRUE);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@lapis_mop_ring_id, '/assets/products/lapis-mother-of-pearl-ring/01-vintage-gold.png', 'Vintage-gold open ring with lapis lazuli and zircon', 1, TRUE),
  (@lapis_mop_ring_id, '/assets/products/lapis-mother-of-pearl-ring/02-both-colours.png', 'Vintage Gold lapis lazuli and Platinum mother-of-pearl ring options', 2, FALSE),
  (@lapis_mop_ring_id, '/assets/products/lapis-mother-of-pearl-ring/03-both-colours.png', 'Alternate view of both gemstone and colour options', 3, FALSE);

INSERT INTO products (
  category_id,
  name,
  slug,
  short_description,
  description,
  base_price,
  status,
  featured
) VALUES (
  @rings_category_id,
  'S925 Sterling Silver Zircon Ring',
  's925-sterling-silver-four-leaf-zircon-ring',
  'A regal four-leaf clover ring with beaded details and a central cubic zirconia.',
  'A regal four-leaf clover design framed with delicate beaded detailing, gracefully surrounding the central zircon stone. The intricate setting exudes an elegant, luxurious feel reminiscent of fine jewellery.\n\nMaterial: S925 Sterling Silver / Cubic Zirconia\nColour: Vintage Gold\nSize: Adjustable open ring, approx. US size 14 (size system to be confirmed)',
  138.00,
  'draft',
  FALSE
);
SET @four_leaf_ring_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES (
  @four_leaf_ring_id, 'CHR-RNG-004', 'Vintage Gold / Adjustable', 138.00, 0, TRUE
);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@four_leaf_ring_id, '/assets/products/four-leaf-zircon-ring/03-main.png', 'Vintage-gold four-leaf clover ring with a central green cubic zirconia', 1, TRUE),
  (@four_leaf_ring_id, '/assets/products/four-leaf-zircon-ring/04-styled.png', 'Four-leaf zircon ring displayed on a burgundy jewellery box', 2, FALSE),
  (@four_leaf_ring_id, '/assets/products/four-leaf-zircon-ring/01-lifestyle.png', 'Four-leaf zircon ring worn on the hand', 3, FALSE),
  (@four_leaf_ring_id, '/assets/products/four-leaf-zircon-ring/02-lifestyle.png', 'Four-leaf zircon ring styled with a matching pearl bracelet', 4, FALSE);

INSERT INTO products (
  category_id, name, slug, short_description, description,
  base_price, status, featured
) VALUES (
  @earrings_category_id,
  'S925 Sterling Silver Vintage Natural Mother-of-Pearl Heart Earrings',
  's925-vintage-natural-mother-of-pearl-heart-earrings',
  'Romantic vintage heart earrings with luminous natural mother-of-pearl.',
  'A delicate heart in motion, evoking the feeling of longing and affection. The soft, lustrous mother-of-pearl symbolises the purity and devotion of love, while the vintage-inspired design adds a timeless and romantic touch.\n\nMaterial: S925 Sterling Silver / Natural Mother-of-Pearl\nColours: Vintage Gold / Platinum\nSize: Approx. 2 cm in height\nNote: Platinum is available by pre-order only.',
  152.00,
  'draft',
  FALSE
);
SET @mop_heart_earrings_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES
  (@mop_heart_earrings_id, 'CHR-ERG-001-GD', 'Vintage Gold', 152.00, 0, TRUE),
  (@mop_heart_earrings_id, 'CHR-ERG-001-PT', 'Platinum / Pre-order', 152.00, 0, TRUE);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@mop_heart_earrings_id, '/assets/products/mother-of-pearl-heart-earrings/01-vintage-gold.png', 'Vintage-gold heart earrings with natural mother-of-pearl', 1, TRUE),
  (@mop_heart_earrings_id, '/assets/products/mother-of-pearl-heart-earrings/02-both-colours.png', 'Mother-of-pearl heart earrings in Vintage Gold and Platinum', 2, FALSE);

INSERT INTO products (
  category_id, name, slug, short_description, description,
  base_price, status, featured
) VALUES (
  @earrings_category_id,
  'Zircon Button Earrings',
  'zircon-button-earrings',
  'Round vintage-gold button earrings accented with sparkling zircon.',
  'The round button design symbolises wholeness and smoothness in life, while the sparkling zircon accents represent a life filled with brightness and brilliance. Wear them as a little reminder to embrace joy, completeness and good fortune wherever you go.\n\nMaterial: S925 Sterling Silver\nColour: Vintage Gold\nSize: Approx. 1.6 cm',
  128.00,
  'draft',
  FALSE
);
SET @zircon_button_earrings_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES (
  @zircon_button_earrings_id, 'CHR-ERG-002', 'Vintage Gold', 128.00, 0, TRUE
);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@zircon_button_earrings_id, '/assets/products/zircon-button-earrings/01-main.png', 'Round vintage-gold button earrings with zircon accents', 1, TRUE),
  (@zircon_button_earrings_id, '/assets/products/zircon-button-earrings/02-styled.png', 'Zircon button earrings styled with a pearl bracelet', 2, FALSE);

INSERT INTO products (
  category_id, name, slug, short_description, description,
  base_price, status, featured
) VALUES (
  @earrings_category_id,
  'S925 Sterling Silver Statement Natural Pearl Earrings',
  's925-statement-natural-pearl-earrings',
  'Natural pearl earrings framed by ornate vintage-inspired detailing.',
  'Natural pearls sit at the centre of ornate, vintage-inspired frames, creating a confident statement with refined detail. Available in warm Vintage Gold or cool Platinum, these earrings bring timeless character to both everyday and occasion styling.\n\nMaterial: S925 Sterling Silver / Natural Pearl\nColours: Vintage Gold / Platinum\nSize: Approx. 1.5 cm\nPearl Size: Approx. 7 mm\nNote: Platinum is available by pre-order only.',
  135.00,
  'draft',
  FALSE
);
SET @statement_pearl_earrings_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES
  (@statement_pearl_earrings_id, 'CHR-ERG-003-GD', 'Vintage Gold', 135.00, 0, TRUE),
  (@statement_pearl_earrings_id, 'CHR-ERG-003-PT', 'Platinum / Pre-order', 135.00, 0, TRUE);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@statement_pearl_earrings_id, '/assets/products/statement-pearl-earrings/01-vintage-gold.png', 'Vintage-gold statement earrings with natural pearls', 1, TRUE),
  (@statement_pearl_earrings_id, '/assets/products/statement-pearl-earrings/02-styled.png', 'Statement natural pearl earrings styled with a pearl necklace', 2, FALSE),
  (@statement_pearl_earrings_id, '/assets/products/statement-pearl-earrings/03-both-colours.png', 'Statement pearl earrings in Vintage Gold and Platinum', 3, FALSE);

INSERT INTO products (
  category_id, name, slug, short_description, description,
  base_price, status, featured
) VALUES (
  @earrings_category_id,
  'S925 Sterling Silver Statement Heart Zircon Earrings',
  's925-statement-heart-zircon-earrings',
  'Sculptural heart earrings intertwined with sparkling cubic zirconia.',
  'Sculptural heart silhouettes intertwine with sparkling cubic zirconia to create a compact yet expressive statement. Available in warm Vintage Gold or cool Platinum, these sterling silver earrings bring a polished romantic accent to everyday styling.\n\nMaterial: S925 Sterling Silver / Cubic Zirconia\nColours: Vintage Gold / Platinum\nType: Sterling Silver Earrings\nSize: Approx. 1 cm\nNote: Platinum is available by pre-order only.',
  120.00,
  'draft',
  FALSE
);
SET @heart_zircon_earrings_id = LAST_INSERT_ID();

INSERT INTO product_variants (
  product_id, sku, variant_name, price, stock_quantity, is_active
) VALUES
  (@heart_zircon_earrings_id, 'CHR-ERG-004-GD', 'Vintage Gold', 120.00, 0, TRUE),
  (@heart_zircon_earrings_id, 'CHR-ERG-004-PT', 'Platinum / Pre-order', 120.00, 0, TRUE);

INSERT INTO product_images (
  product_id, image_url, alt_text, sort_order, is_primary
) VALUES
  (@heart_zircon_earrings_id, '/assets/products/statement-heart-zircon-earrings/01-vintage-gold.png', 'Vintage-gold statement heart earrings with cubic zirconia', 1, TRUE),
  (@heart_zircon_earrings_id, '/assets/products/statement-heart-zircon-earrings/02-styled.png', 'Statement heart zircon earrings styled with a vintage-gold ring', 2, FALSE),
  (@heart_zircon_earrings_id, '/assets/products/statement-heart-zircon-earrings/03-both-colours.png', 'Statement heart zircon earrings in Vintage Gold and Platinum', 3, FALSE);

