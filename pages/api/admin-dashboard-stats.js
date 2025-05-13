import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Total products
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });
    if (productsError) throw productsError;

    // Total product views
    const { count: totalViews, error: viewsError } = await supabase
      .from('views')
      .select('id', { count: 'exact', head: true });
    if (viewsError) throw viewsError;

    // Most viewed products (top 5)
    const { data: topViewed, error: topViewedError } = await supabase
      .from('top_viewed_products')
      .select('product_id, view_count')
      .order('view_count', { ascending: false })
      .limit(5);
    if (topViewedError) throw topViewedError;

    let mostViewedProducts = [];
    if (topViewed.length > 0) {
      const productIds = topViewed.map((item) => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, discount')
        .in('id', productIds);
      if (productsError) throw productsError;
      mostViewedProducts = productsData.map((product) => {
        const viewData = topViewed.find((item) => item.product_id === product.id);
        return {
          ...product,
          view_count: viewData ? viewData.view_count : 0,
        };
      }).sort((a, b) => b.view_count - a.view_count);
    }

    res.status(200).json({
      totalProducts: totalProducts || 0,
      totalViews: totalViews || 0,
      mostViewedProducts: mostViewedProducts || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
