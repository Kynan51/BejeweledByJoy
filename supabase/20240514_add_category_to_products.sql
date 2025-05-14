-- Migration: Add category column to products table
ALTER TABLE products ADD COLUMN category text;

-- Add index for category to optimize filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- (Optional) Add more indexes for other filterable fields
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);

-- Optionally, you can set a default value or add a CHECK constraint for allowed categories.
-- Example (uncomment to use):
-- ALTER TABLE products ADD CONSTRAINT category_check CHECK (category IN (
--   'Rings', 'Necklaces', 'Chains', 'Lockets', 'Pendants', 'Earrings', 'Bracelets', 'Bangles',
--   'Charm Bracelets', 'Anklets', 'Belly Rings', 'Brooches & Pins', 'Nose Rings'
-- ));
