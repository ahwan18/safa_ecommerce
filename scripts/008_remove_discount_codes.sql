-- Migration: remove discount_codes table
-- This migration will DROP the `discount_codes` table if it exists.
-- Apply this only if you're sure the table is unused and you accept data loss for discount codes.

DROP INDEX IF EXISTS idx_discount_codes_code;
DROP TABLE IF EXISTS discount_codes CASCADE;

-- Note: If your DB has foreign keys referencing discount_codes, CASCADE will remove them.
-- Review and backup your DB before applying in production.
