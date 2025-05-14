// API route to get all pending orders for admin dashboard
import supabase from '../../utils/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Fetch all orders with status 'pending'
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ orders: data, count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
