const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabase');
const adminAuth = require('../middleware/auth');

// Multer configuration — store files in memory then upload to Supabase Storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed.'));
    }
  }
});

// POST upload media (admin only)
router.post('/', adminAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${uuidv4()}${ext}`;
  const fileType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  const bucketPath = `gallery/${filename}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('khally-media')
    .upload(bucketPath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('khally-media')
    .getPublicUrl(bucketPath);

  const publicUrl = urlData.publicUrl;

  // Save to gallery table
  const { data, error } = await supabase
    .from('gallery')
    .insert([{
      type: fileType,
      url: publicUrl,
      caption: req.body.caption || '',
      filename
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET all gallery items (public)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE gallery item (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  // Get item first to delete from storage
  const { data: item, error: fetchError } = await supabase
    .from('gallery')
    .select('filename')
    .eq('id', req.params.id)
    .single();

  if (fetchError) return res.status(404).json({ error: 'Item not found.' });

  // Delete from storage
  await supabase.storage
    .from('khally-media')
    .remove([`gallery/${item.filename}`]);

  // Delete from table
  const { error } = await supabase
    .from('gallery')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Media deleted successfully.' });
});

module.exports = router;
