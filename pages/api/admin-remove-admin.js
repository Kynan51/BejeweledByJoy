import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow the owner to remove admins
  const { requesterEmail, id } = req.body;
  if (!id || !requesterEmail) {
    return res.status(400).json({ error: 'Missing admin id or requesterEmail' });
  }

  // Check if requester is owner
  const { data: ownerData, error: ownerError } = await supabase
    .from('admins')
    .select('is_owner')
    .eq('email', requesterEmail)
    .single();
  if (ownerError || !ownerData?.is_owner) {
    return res.status(403).json({ error: 'Only the owner can remove admins' });
  }

  const { data, error } = await supabase
    .from('admins')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
