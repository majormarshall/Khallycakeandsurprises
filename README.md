# Khally Cakes & Surprises 🎂

A full-featured bakery website with public storefront + admin dashboard.

## Setup Instructions

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, paste and run the contents of `supabase_schema.sql`
3. Go to **Storage** → Create a new bucket called `khally-media` (set it to **Public**)
4. Copy your **Project URL** and **Service Role Key** from Settings → API

### 2. Configure Environment Variables
Edit `backend/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
ADMIN_PASSWORD=khally2024
JWT_SECRET=change-this-to-a-random-string
PORT=3000
```

### 3. Install & Run
```bash
cd backend
npm install
npm start
```

Open: http://localhost:3000
Admin: http://localhost:3000/admin

### Admin Login
Default password: `khally2024` (change in `.env`)

## Features
- 🎂 Beautiful storefront with products, services, gallery
- 📱 WhatsApp integration (+234 817 398 5467)
- 📦 Online order form with WhatsApp confirmation
- 🔐 Protected admin dashboard
- 📊 Order management with status tracking
- 🖼️ Image & video gallery upload
- ☁️ Supabase cloud database + storage
