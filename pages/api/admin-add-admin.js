import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow the owner to add admins
  const { requesterEmail, email } = req.body;
  if (!email || !requesterEmail) {
    return res.status(400).json({ error: 'Missing admin email or requesterEmail' });
  }

  // Check if requester is owner
  const { data: ownerData, error: ownerError } = await supabase
    .from('admins')
    .select('is_owner')
    .eq('email', requesterEmail)
    .single();
  if (ownerError || !ownerData?.is_owner) {
    return res.status(403).json({ error: 'Only the owner can add admins' });
  }

  // Check if the email exists in the users table
  const { data: userExists, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  if (userError || !userExists) {
    return res.status(400).json({ error: 'This email is not a registered user.' });
  }

  const { data, error } = await supabase
    .from('admins')
    .insert([{ email }])
    .select('*')
    .single();

  if (error) {
    // Handle duplicate admin email error
    if (error.code === '23505' || error.message?.includes('duplicate key value')) {
      return res.status(400).json({ error: 'This user is already an admin.' });
    }
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
