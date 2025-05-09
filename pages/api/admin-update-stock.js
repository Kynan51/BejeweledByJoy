import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Replace with real admin authentication logic
  const { productId, newStock } = req.body;
  // Example: You should verify the user's admin status here

  if (!productId || typeof newStock !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { data, error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
