-- CHRISEA production promotion schema repair.
-- Safe to run repeatedly; no existing rows are deleted.
USE `u751690829_yhyh111111`;

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS first_order_only BOOLEAN NOT NULL DEFAULT FALSE
  AFTER apply_automatically;

UPDATE promotions
SET first_order_only = TRUE
WHERE UPPER(code) = 'PROMO10';
