-- View: public.top_viewed_products
-- Shows product_id and view_count, grouped and ordered by most viewed

CREATE OR REPLACE VIEW public.top_viewed_products AS
SELECT 
  product_id,
  COUNT(*) AS view_count,
  MIN(viewed_at) AS first_viewed_at, -- optional, for extra analytics
  MAX(viewed_at) AS last_viewed_at   -- optional, for extra analytics
FROM public.views
GROUP BY product_id;
