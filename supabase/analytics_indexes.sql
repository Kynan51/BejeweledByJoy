-- Add index for fast retrieval of views by product and date
CREATE INDEX IF NOT EXISTS idx_views_product_id ON public.views(product_id);
CREATE INDEX IF NOT EXISTS idx_views_viewed_at ON public.views(viewed_at);
-- Add index for fast retrieval of order_items by product and date
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON public.order_items(created_at);
