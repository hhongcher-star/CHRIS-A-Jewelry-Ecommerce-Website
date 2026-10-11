# CHRISÉA Jewelry Development Plan

## Phase 1 — Foundation

- Initialize React frontend and Express backend.
- Configure MySQL or MariaDB connection.
- Add environment validation, logging and centralized error handling.
- Establish Burgundy and Ivory design tokens.
- Create responsive navigation, footer and common page layout.

## Phase 2 — Accounts and Catalogue

- Customer registration, login and logout.
- Password hashing and JWT/session authentication.
- Customer profile and delivery addresses.
- Product categories, products, variants, images and stock.
- Shop search, filters, sorting and pagination.
- Product details and wishlist.

## Phase 3 — Cart, Checkout and Payment

- Persistent shopping cart.
- Checkout with address and shipping selection.
- Server-side price, stock and promotion validation.
- Order creation with immutable order-item snapshots.
- Display Touch 'n Go QR and bank-transfer information.
- Upload payment proof to private storage.
- Generate WhatsApp confirmation link containing the order number.
- Keep orders in `pending_verification` until manually checked.

## Phase 4 — Administration

- Role-protected administration area.
- Product, category, variant and inventory management.
- Order and payment-proof review.
- Controlled order-status transitions and audit trail.
- Promotion and discount-code management.
- Product-review moderation.

## Phase 5 — Content and Policies

- Home, About, Contact, FAQ and Promotion pages.
- Customer Reviews and Blog pages.
- Shipping & Delivery policy.
- Return & Refund policy.
- Terms & Conditions and Privacy Policy.
- Replace all placeholder business and product information.

## Phase 6 — Quality and Deployment

- Unit and API integration tests.
- End-to-end tests for account, cart and checkout flows.
- Mobile, tablet and desktop visual testing.
- Accessibility, SEO and performance review.
- Security review for authentication, uploads and administration.
- Production database backup and restore test.
- Build the frontend and deploy to Hostinger.
- Configure domain, HTTPS, environment variables and monitoring.

## Information Required Before Launch

- Brand story and approved logo usage variants.
- Product photos, names, descriptions, prices and variations.
- Stock quantities.
- WhatsApp Business number and social links.
- Touch 'n Go QR and bank-account information.
- Shipping fees, delivery coverage and estimated delivery times.
- Approved return, refund, privacy and terms content.
- Domain name and production email address.

## Definition of Done

A feature is complete when it has server-side validation, authorization where required, responsive UI, error and loading states, relevant tests, and no secrets or customer uploads committed to Git.

