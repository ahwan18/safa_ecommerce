# User Management & Authentication Guide

## Overview
Complete user management system for ScreenStudio e-commerce platform with support for both customers and admins.

## Test Credentials

### Admin Account
- **Email**: admin@screenstudio.com
- **Password**: admin123
- **Role**: Administrator
- **Permissions**: Full access to all admin features

### Customer Accounts
1. **Name**: Budi Santoso
   - **Email**: customer@example.com
   - **Password**: password123
   - **Type**: Individual Customer

2. **Name**: Toko Online Jaya
   - **Email**: toko.online@example.com
   - **Password**: password123
   - **Type**: Business/Store

3. **Name**: Rina Kusuma
   - **Email**: personal@example.com
   - **Password**: password123
   - **Type**: Personal Customer

## Features

### Customer Features
- User Registration & Login
- Account Dashboard
  - Profile information
  - Order history
  - Loyalty points tracking
  - Account statistics
- Order Tracking
- Design Upload
- Personal Profile Management
- Quick access to shop, orders, and design upload

### Admin Features
- **User Management** (`/admin/users`)
  - View all customers and admins
  - Search and filter users
  - Add new users (customer or admin)
  - Edit user information
  - Change user role and status
  - Delete users
  - Real-time user count

- **Product Management** (`/admin/products`)
  - Full CRUD for products
  - Bulk import capability
  - Inventory management
  - Price configuration

- **Order Management** (`/admin/orders`)
  - View all orders
  - Update order status
  - Track payments
  - Order details and items

- **Content Management** (`/admin/content`)
  - Edit website sections
  - Manage hero section
  - Update contact information
  - Manage testimonials

- **Settings** (`/admin/settings`)
  - Configure pricing
  - (removed) Manage discount codes
  - Set shipping costs
  - System configuration

- **Analytics** (`/admin/analytics`)
  - Sales charts
  - Revenue tracking
  - Popular products
  - Customer insights

## Authentication System

### Session Management
- Sessions stored in browser localStorage
- User data persists between page refreshes
- Login state: `auth_session` in localStorage
- Automatic logout clears session data

### User Types
1. **Customer**
   - Can browse products
   - Make purchases
   - Track orders
   - Upload designs
   - View account information

2. **Admin**
   - Full system access
   - User management
   - Product management
   - Order management
   - Content management
   - Analytics & reporting

## Navigation

### For Customers
After login, access:
- Navbar dropdown menu shows name and role
- Account dashboard: `/account`
- Order tracking: `/order-tracking`
- Design upload: `/design-upload`
- Shopping cart: `/cart`

### For Admins
After login, access admin panel:
- Dashboard: `/admin`
- User management: `/admin/users`
- Products: `/admin/products`
- Orders: `/admin/orders`
- Content: `/admin/content`
- Settings: `/admin/settings`
- Analytics: `/admin/analytics`

## Database Schema

### Tables
1. **users** - Core user data (email, password, role, status)
2. **customer_profiles** - Customer-specific information
3. **admin_users** - Admin permissions and settings
4. **products** - Product catalog
5. **orders** - Customer orders
6. **order_items** - Individual items in orders
7. **pricing_config** - Bulk pricing tiers
8. **discount_codes** - (removed) Promotional codes were removed from the system
9. **cms_content** - Website content management
10. **audit_logs** - System activity tracking

### SQL Files
- `scripts/001_create_schema.sql` - Database schema and tables
- `scripts/002_seed_data.sql` - Sample data for testing

## Features by Role

### Customer Dashboard
- Profile card with personal information
- Statistics cards (total orders, spent, loyalty points)
- Recent orders table with status
- Quick action links (shop, upload, track)
- Logout button

### Admin Dashboard
- Key metrics (orders, revenue, customers)
- Sales charts and trends
- Recent orders list
- Analytics overview
- Quick access to management panels

## Security Considerations
- Passwords stored (demo uses mock authentication)
- In production: implement proper bcrypt hashing
- Session tokens with expiration
- Role-based access control
- Input validation on all forms

## Future Enhancements
- Email verification for new registrations
- Password reset functionality
- Two-factor authentication
- Payment gateway integration
- Email notifications
- Real backend database
- API authentication
- Role-based API endpoints
