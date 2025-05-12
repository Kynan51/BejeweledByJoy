import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing product id' });
  }

  // Delete associated rows in the views table
  const { error: viewsError } = await supabase
    .from('views')
    .delete()
    .eq('product_id', id);

  if (viewsError) {
    return res.status(500).json({ error: viewsError.message });
  }

  // Delete the product
  const { data, error: productError } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (productError) {
    return res.status(500).json({ error: productError.message });
  }

  return res.status(200).json({ data });
}
