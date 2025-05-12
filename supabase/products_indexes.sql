-- Indexes for faster product filtering and sorting
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_discount ON products (discount);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);
-- If you filter by quantity, you can also add:
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products (quantity);
