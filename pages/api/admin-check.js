import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  const { data, error } = await supabase
    .from('admins')
    .select('id, email, is_owner')
    .eq('email', email)
    .single();

  if (error || !data) {
    return res.status(403).json({ error: 'Not an admin' });
  }

  return res.status(200).json({ admin: data });
}
