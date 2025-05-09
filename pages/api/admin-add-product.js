import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  console.log('API /admin-add-product called', req.method, req.body);
  if (req.method !== 'POST') {
    console.log('Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Replace with real admin authentication logic
  const { name, description, price, discount, image_urls, quantity } = req.body;
  if (!name || !price) {
    console.log('Missing required fields', req.body);
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, description, price, discount, image_urls, quantity }])
      .select('*')
      .single();
    if (error) {
      console.log('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }
    console.log('Product inserted:', data);
    return res.status(200).json({ data });
  } catch (err) {
    console.log('Unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
