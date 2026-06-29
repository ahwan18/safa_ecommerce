# Safa E-Commerce Platform

Safa E-Commerce is a full-stack web platform for a custom printing business. It supports customer-facing shopping flows, design upload, order tracking, and an admin CMS for managing products, orders, content, and analytics.

## Problem

Small printing businesses often manage product catalogs, custom design requests, and order updates through scattered chat messages. This project explores how a dedicated e-commerce platform can centralize the full customer and admin workflow.

## What I Built

- Landing page for services, featured products, pricing, and contact information
- Product catalog with category filters, sorting, and product detail pages
- Shopping cart and multi-step checkout flow
- Design upload flow for custom print requests
- Order tracking page with status timeline
- Admin dashboard for products, orders, content, settings, and analytics
- Database migration scripts for products, orders, addresses, payments, and admin auth

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui and Radix UI
- Supabase
- Recharts
- Vercel Analytics

## Key Pages

```text
/                  Landing page
/shop              Product catalog
/shop/[id]         Product detail
/cart              Shopping cart
/checkout          Multi-step checkout
/order-tracking    Order tracking
/design-upload     Custom design request
/admin             Admin dashboard
```

## Role

Full-stack developer. I worked on the storefront flow, admin CMS, product and order management experience, database structure, and deployment-ready Next.js setup.

## Result

Built a complete e-commerce prototype that demonstrates both customer-side and admin-side workflows for a real printing business use case.

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Notes

This repository is a portfolio project. Production credentials and admin secrets should be configured through environment variables and never committed to the repository.
