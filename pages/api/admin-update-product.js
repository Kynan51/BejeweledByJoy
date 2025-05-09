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
  const { id, name, description, price, discount, image_urls, quantity } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing product id' });
  }

  const { data, error } = await supabase
    .from('products')
    .update({ name, description, price, discount, image_urls, quantity })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
