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

## Confirmed Future Systems — 14 October 2026

### 1. Interactive Administration Tutorial

Goal: teach a new administrator how to use every completed administration page without requiring a separate manual.

- Provide a first-login welcome and an optional guided tour.
- Give each administration page its own interactive walkthrough.
- Highlight the exact control being explained while dimming the rest of the interface.
- Include concise instructions, step progress, Back, Next, Skip and Finish controls.
- Explain product creation, image entry, categories, price, variants, stock and product status.
- Explain order handling, payment verification, customers, promotions, analytics and settings when those pages are implemented.
- Save tutorial completion per administrator so completed tours do not open automatically again.
- Add a persistent “Help / Start tutorial” control so a tour can be replayed at any time.
- Support desktop, tablet and mobile layouts and keep tutorial text easy to update.
- Never allow the tutorial to submit, delete or modify real records by itself.

### 2. Frontend Content Management

Goal: allow an authorised administrator to update selected frontend wording from the administration area without editing source code.

- Add a Content section to the administration navigation.
- Organise editable content by frontend page and section, for example Home hero, announcement bar, About, Shop promotions, FAQ, Contact and footer.
- Use clearly labelled fields that correspond to visible frontend content.
- Support Draft, Preview and Publish states.
- Show a frontend preview before publishing changes.
- Store content in the database and expose only published content through a public API.
- Keep revision history with the administrator, timestamp and changed values.
- Allow restoration of a previous published revision.
- Validate field length and content type on the server.
- Restrict editing and publishing to authorised administrator roles.
- Keep fixed brand elements, legal text and structural layout locked unless explicitly configured as editable.
- Use safe plain text by default; any rich-text field must be sanitised before display.

### Decisions Required Before Implementation

- Confirm whether tutorial wording should be English only, Chinese only, or bilingual.
- Confirm whether every administrator receives the same tutorial or whether it varies by role.
- Confirm which frontend pages and exact text sections administrators may edit.
- Confirm whether one administrator can publish directly or another administrator must approve changes.
- Confirm whether content management covers text only initially, or also banners, photographs, buttons and links.

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

