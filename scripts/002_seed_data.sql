-- ScreenStudio Sablon - Sample Data for Development & Testing
-- This script adds sample customer users and extended product data

-- Sample customer users
INSERT INTO users (email, password_hash, full_name, role, status, phone) 
VALUES 
  ('customer@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'Budi Santoso', 'customer', 'active', '08123456789'),
  ('toko.online@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'Toko Online Jaya', 'customer', 'active', '08198765432'),
  ('personal@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye', 'Rina Kusuma', 'customer', 'active', '08112345678')
ON CONFLICT (email) DO NOTHING;

-- Add customer profiles
INSERT INTO customer_profiles (user_id, business_name, address, city, province, postal_code, company_type)
SELECT u.id, 'Toko Budi', 'Jl. Merdeka No. 100', 'Jakarta', 'DKI Jakarta', '12345', 'business'
FROM users u WHERE u.email = 'customer@example.com' AND NOT EXISTS (SELECT 1 FROM customer_profiles WHERE user_id = u.id)

UNION ALL

SELECT u.id, 'Toko Online Jaya', 'Jl. Gatot Subroto No. 50', 'Surabaya', 'Jawa Timur', '60123', 'business'
FROM users u WHERE u.email = 'toko.online@example.com' AND NOT EXISTS (SELECT 1 FROM customer_profiles WHERE user_id = u.id)

UNION ALL

SELECT u.id, NULL, 'Jl. Ahmad Yani No. 75', 'Bandung', 'Jawa Barat', '40123', 'personal'
FROM users u WHERE u.email = 'personal@example.com' AND NOT EXISTS (SELECT 1 FROM customer_profiles WHERE user_id = u.id);

-- Add sample orders
INSERT INTO orders (order_number, user_id, total_price, shipping_cost, final_price, status, payment_status, payment_method, shipping_address, customer_name, customer_phone, customer_email, notes)
SELECT 
  'ORD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || '-' || FLOOR(RANDOM() * 1000),
  (SELECT id FROM users WHERE email = 'customer@example.com'),
  450000,
  30000,
  435000,
  'delivered',
  'paid',
  'bank_transfer',
  'Jl. Merdeka No. 100, Jakarta',
  'Budi Santoso',
  '08123456789',
  'customer@example.com',
  'Sudah diterima, hasilnya memuaskan!'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customer_email = 'customer@example.com');

-- Add order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, design_url, customization_notes)
SELECT 
  (SELECT id FROM orders WHERE customer_email = 'customer@example.com' LIMIT 1),
  (SELECT id FROM products WHERE slug = 'kaos-sablon-premium'),
  10,
  45000,
  '/designs/kaos-sablon-001.pdf',
  'Ukuran: L (50%), XL (50%)'
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE product_id = (SELECT id FROM products WHERE slug = 'kaos-sablon-premium'));

-- Add more products details
UPDATE products SET specifications = jsonb_build_object(
  'bahan', 'Katun 100%',
  'ukuran', 'XS-XXXL',
  'teknologi_cetak', 'Sablon manual',
  'durabilitas', 'Tahan hingga 30 kali cuci'
) WHERE slug = 'kaos-sablon-premium';

UPDATE products SET specifications = jsonb_build_object(
  'bahan', 'Polyester 80%, Cotton 20%',
  'ukuran', 'S-2XL',
  'teknologi_cetak', 'DTF (Direct to Film)',
  'durabilitas', 'Tahan hingga 50 kali cuci'
) WHERE slug = 'hoodie-custom-dtf';

UPDATE products SET specifications = jsonb_build_object(
  'bahan', 'Canvas 100%',
  'dimensi', '40cm x 35cm',
  'teknologi_cetak', 'Sablon',
  'daya_tampung', 'Ideal untuk barang sehari-hari'
) WHERE slug = 'tote-bag-sablon';

-- Insert additional pricing tiers for specific products
INSERT INTO pricing_config (product_id, min_quantity, max_quantity, price_per_unit)
SELECT id, 1, 9, 45000 FROM products WHERE slug = 'kaos-sablon-premium'
UNION ALL
SELECT id, 10, 49, 42000 FROM products WHERE slug = 'kaos-sablon-premium'
UNION ALL
SELECT id, 50, 99, 40000 FROM products WHERE slug = 'kaos-sablon-premium'
UNION ALL
SELECT id, 100, 500, 38000 FROM products WHERE slug = 'kaos-sablon-premium'
UNION ALL
SELECT id, 1, 9, 85000 FROM products WHERE slug = 'hoodie-custom-dtf'
UNION ALL
SELECT id, 10, 49, 79000 FROM products WHERE slug = 'hoodie-custom-dtf'
UNION ALL
SELECT id, 50, 99, 76000 FROM products WHERE slug = 'hoodie-custom-dtf'
ON CONFLICT DO NOTHING;

-- Sample audit log entry
INSERT INTO audit_logs (action_type, table_name, record_id, user_id, changes, ip_address)
SELECT 
  'create',
  'orders',
  (SELECT id FROM orders WHERE customer_email = 'customer@example.com' LIMIT 1),
  (SELECT id FROM users WHERE email = 'admin@screenstudio.com'),
  jsonb_build_object('order_number', 'ORD-001', 'status', 'delivered'),
  '127.0.0.1'
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE action_type = 'create' AND table_name = 'orders');
