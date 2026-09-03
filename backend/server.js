require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files — public storefront
app.use(express.static(path.join(__dirname, '../public')));

// Serve admin dashboard under /admin path
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/gallery', require('./routes/gallery'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Khally Cakes & Surprises API is running 🎂' });
});

// Fallback — serve storefront for any unmatched routes
app.use((req, res) => {
  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`\n🎂 Khally Cakes & Surprises server running!`);
  console.log(`   Storefront:  http://localhost:${PORT}`);
  console.log(`   Admin:       http://localhost:${PORT}/admin`);
  console.log(`   API:         http://localhost:${PORT}/api/health\n`);
});
