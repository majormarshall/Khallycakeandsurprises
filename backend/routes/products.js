const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabase');
const adminAuth = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    allowed.test(ext) ? cb(null, true) : cb(new Error('Only images allowed.'));
  }
});

// POST upload product image (admin only)
router.post('/upload-image', adminAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided.' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `products/${uuidv4()}${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('khally-media')
    .upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
  if (uploadError) return res.status(500).json({ error: uploadError.message });
  const { data: urlData } = supabase.storage.from('khally-media').getPublicUrl(filename);
  res.json({ url: urlData.publicUrl });
});


// GET all products (public)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET single product (public)
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Product not found' });
  res.json(data);
});

// POST create product (admin only)
router.post('/', adminAuth, async (req, res) => {
  const { name, description, price, category, image_url, badge } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required.' });
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{ name, description, price, category, image_url, badge }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT update product (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  const { name, description, price, category, image_url, badge } = req.body;

  const { data, error } = await supabase
    .from('products')
    .update({ name, description, price, category, image_url, badge })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE product (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Product deleted successfully.' });
});

module.exports = router;
