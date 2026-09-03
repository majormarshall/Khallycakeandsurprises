const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminAuth = require('../middleware/auth');

// POST create order (public)
router.post('/', async (req, res) => {
  const { customer_name, phone, email, product_name, quantity, delivery_date, notes, address } = req.body;

  if (!customer_name || !phone || !product_name) {
    return res.status(400).json({ error: 'Name, phone, and product are required.' });
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([{
      customer_name,
      phone,
      email: email || '',
      product_name,
      quantity: quantity || 1,
      delivery_date: delivery_date || null,
      notes: notes || '',
      address: address || '',
      status: 'pending'
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET all orders (admin only)
router.get('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH update order status (admin only)
router.patch('/:id/status', adminAuth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE order (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Order deleted.' });
});

module.exports = router;
