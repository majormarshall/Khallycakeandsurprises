-- ============================================
-- KHALLY CAKES & SURPRISES — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  category TEXT DEFAULT 'custom',
  image_url TEXT,
  badge TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  delivery_date DATE,
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GALLERY TABLE
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'image' CHECK (type IN ('image','video')),
  url TEXT NOT NULL,
  filename TEXT,
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (optional but recommended)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (storefront can view products & gallery)
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read gallery" ON gallery FOR SELECT USING (true);

-- ALLOW SERVICE ROLE FULL ACCESS (your backend uses service role key — bypasses RLS)
-- No additional policies needed for service role.

-- SEED SAMPLE PRODUCTS (optional — delete if you want a fresh start)
INSERT INTO products (name, description, price, category, badge) VALUES
  ('Classic Chocolate Drip Cake', 'Rich, moist chocolate layers with luxurious ganache drip and hand-crafted chocolate decorations.', 35000, 'birthday', 'Best Seller'),
  ('Floral Elegance Wedding Cake', 'Three-tier white vanilla cake adorned with hand-piped sugar flowers and gold leaf accents.', 150000, 'wedding', 'Premium'),
  ('Surprise Birthday Box', 'A beautiful gift box filled with 12 mini cupcakes, cookies, and a personalized note.', 18000, 'surprise', NULL),
  ('Unicorn Fantasy Cake', 'Vibrant rainbow layers topped with whipped cream, edible glitter, and a gold unicorn horn.', 45000, 'birthday', 'Fan Favorite'),
  ('Red Velvet Custom Cake', 'Classic red velvet with cream cheese frosting, customized with your own design and message.', 28000, 'custom', NULL),
  ('Anniversary Love Cake', 'Elegant two-tier cake with romantic rose accents, perfect for anniversaries and proposals.', 55000, 'custom', 'Popular');

-- CREATE STORAGE BUCKET (run this or create manually in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('khally-media', 'khally-media', true);
