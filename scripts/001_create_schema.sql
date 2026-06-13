-- ScreenStudio Sablon E-commerce Database Schema
-- PostgreSQL Database Schema
-- Run this script to create all tables and initial data

-- 1. Users table (for both customers and admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customer profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  business_name VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Indonesia',
  company_type VARCHAR(100), -- 'personal', 'business', 'corporate'
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  permission_level VARCHAR(50) NOT NULL DEFAULT 'editor',
  can_manage_users BOOLEAN DEFAULT FALSE,
  can_manage_products BOOLEAN DEFAULT FALSE,
  can_manage_orders BOOLEAN DEFAULT FALSE,
  can_manage_content BOOLEAN DEFAULT FALSE,
  can_manage_settings BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  print_method VARCHAR(100), -- 'sablon', 'dtf', 'offset'
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  stock_quantity INTEGER DEFAULT 100,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  specifications JSONB,
  tags VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  final_price DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'shipped', 'delivered'
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
  payment_method VARCHAR(100),
  shipping_address TEXT,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  design_url VARCHAR(500),
  customization_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- 7. Pricing configuration table
CREATE TABLE IF NOT EXISTS pricing_config (
  id SERIAL PRIMARY KEY,
  product_id INTEGER,
  min_quantity INTEGER,
  max_quantity INTEGER,
  price_per_unit DECIMAL(10, 2),
  rush_fee_percentage DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


-- 9. CMS content table
CREATE TABLE IF NOT EXISTS cms_content (
  id SERIAL PRIMARY KEY,
  section_name VARCHAR(100) NOT NULL UNIQUE, -- 'hero', 'services', 'contact', 'pricing', etc
  content JSONB NOT NULL,
  updated_by INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login'
  table_name VARCHAR(100),
  record_id INTEGER,
  user_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
-- (discount_codes table removed)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Insert default admin user (password: admin123 - bcrypt hash)
-- In production, use proper password hashing!
INSERT INTO users (email, password_hash, full_name, role, status) 
VALUES (
  'admin@screenstudio.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMye', -- Placeholder - use real bcrypt hash in production
  'Admin ScreenStudio',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Insert admin permissions
INSERT INTO admin_users (user_id, permission_level, can_manage_users, can_manage_products, can_manage_orders, can_manage_content, can_manage_settings, can_view_analytics)
SELECT id, 'owner', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE FROM users WHERE email = 'admin@screenstudio.com' AND role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, description, category, print_method, price, image_url, stock_quantity, status) 
VALUES 
  ('Kaos Sablon Premium', 'kaos-sablon-premium', 'Kaos berkualitas tinggi dengan hasil sablon sempurna', 'Apparel', 'sablon', 45000, '/images/product-1.jpg', 200, 'active'),
  ('Hoodie Custom DTF', 'hoodie-custom-dtf', 'Hoodie dengan desain DTF (Direct to Film) yang tahan lama', 'Apparel', 'dtf', 85000, '/images/product-2.jpg', 150, 'active'),
  ('Tote Bag Sablon', 'tote-bag-sablon', 'Tas kanvas dengan sablon custom sesuai keinginan Anda', 'Accessories', 'sablon', 35000, '/images/product-3.jpg', 300, 'active'),
  ('Jersey Olahraga', 'jersey-olahraga', 'Jersey dengan teknologi sablon offset untuk hasil maksimal', 'Apparel', 'offset', 55000, '/images/product-4.jpg', 250, 'active'),
  ('Topi Snapback', 'topi-snapback', 'Topi premium dengan logo sablon 3D', 'Accessories', 'sablon', 65000, '/images/product-5.jpg', 180, 'active'),
  ('Jaket Windbreaker', 'jaket-windbreaker', 'Jaket praktis dengan sablon custom di bagian dada', 'Apparel', 'sablon', 95000, '/images/product-6.jpg', 120, 'active');

-- Insert CMS content defaults
INSERT INTO cms_content (section_name, content) 
VALUES 
  ('hero', '{"title":"Sablon Profesional untuk Bisnis Anda","subtitle":"Kualitas Premium, Harga Terjangkau, Layanan Terpercaya","cta_text":"Mulai Sekarang"}'),
  ('contact', '{"phone":"(021) 1234-5678","email":"info@screenstudio.com","address":"Jl. Sablon No. 123, Jakarta","hours":"Senin-Jumat: 09:00-18:00"}')
ON CONFLICT (section_name) DO NOTHING;

-- Insert shipping costs configuration
INSERT INTO pricing_config (min_quantity, max_quantity, price_per_unit)
VALUES 
  (1, 9, 0),
  (10, 49, 0),
  (50, 99, 0),
  (100, 199, 0),
  (200, 999, 0),
  (1000, 999999, 0);

-- Insert sample discount codes
-- sample discount codes removed
