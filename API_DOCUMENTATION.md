# CHRISÉA Jewelry REST API

Base path: `/api`

All responses should use JSON except protected image/file responses. Prices are represented as decimal strings or integer sen values; never calculate money with floating-point arithmetic.

## Common Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "fields": {}
  }
}
```

## Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register customer |
| POST | `/auth/login` | Public | Sign in |
| POST | `/auth/logout` | Customer | Sign out |
| POST | `/auth/refresh` | Customer | Refresh session/token |
| GET | `/auth/me` | Customer | Current customer profile |

## Products and Categories

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/categories` | Public | List active categories |
| GET | `/products` | Public | Search, filter, sort and paginate products |
| GET | `/products/:slug` | Public | Product details and variants |
| GET | `/products/:id/reviews` | Public | Approved product reviews |
| POST | `/products/:id/reviews` | Customer | Submit a verified-purchase review |

Suggested product query parameters: `search`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, and `limit`.

## Cart and Wishlist

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/cart` | Customer | Get current cart |
| POST | `/cart/items` | Customer | Add product variant |
| PATCH | `/cart/items/:id` | Customer | Change quantity |
| DELETE | `/cart/items/:id` | Customer | Remove item |
| GET | `/wishlist` | Customer | List saved products |
| POST | `/wishlist/:productId` | Customer | Save product |
| DELETE | `/wishlist/:productId` | Customer | Remove saved product |

## Checkout and Orders

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/checkout/quote` | Customer | Validate stock, shipping and discount |
| POST | `/orders` | Customer | Create an order |
| GET | `/orders` | Customer | List own orders |
| GET | `/orders/:orderNumber` | Customer | View own order |
| POST | `/orders/:orderNumber/payment-proof` | Customer | Upload payment proof |
| POST | `/orders/:orderNumber/cancel` | Customer | Cancel an eligible order |

Creating an order must recalculate all totals on the server. Product name, SKU and price must be copied into order items so historical orders do not change when products are edited.

Uploading a payment proof changes an eligible order from `pending_payment` to `pending_verification`. It must never automatically produce `payment_confirmed`.

Current storefront checkout creates the order before showing the payment QR code.
The implemented `POST /api/orders/:id/payment-notice` accepts the secret
`paymentNoticeToken` returned by `POST /api/orders` and moves the order to
`pending_verification`. The notice is only a customer claim; an administrator
must check the receiving account before setting `payment_confirmed`.

## Promotions

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/promotions/validate` | Customer | Validate discount code against cart |
| GET | `/promotions/active` | Public | List public active campaigns |

## Content

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/blog` | Public | Published blog posts |
| GET | `/blog/:slug` | Public | Published blog post |
| POST | `/contact` | Public | Submit contact enquiry |

## Administration

Every admin endpoint requires authenticated administrator access.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/admin/products` | Create product |
| PATCH | `/admin/products/:id` | Update product |
| PATCH | `/admin/variants/:id/stock` | Adjust stock with audit record |
| GET | `/admin/orders` | Search and filter orders |
| GET | `/admin/orders/:id` | View order and protected payment proof |
| PATCH | `/admin/orders/:id/status` | Perform an allowed status transition |
| POST | `/admin/orders/:id/verify-payment` | Confirm received payment |
| POST | `/admin/orders/:id/reject-payment` | Reject submitted payment proof |
| POST | `/admin/promotions` | Create promotion |
| PATCH | `/admin/promotions/:id` | Update promotion |
| PATCH | `/admin/reviews/:id` | Moderate review |

## Order Status Rules

```text
pending_payment
  ├─ pending_verification
  └─ cancelled

pending_verification
  ├─ payment_confirmed
  ├─ payment_rejected
  └─ cancelled

payment_confirmed → processing → shipped → completed
payment_rejected → pending_payment
```

The API must reject invalid transitions and record who changed the status, when it changed and any accompanying note.

## HTTP Status Codes

- `200` successful read or update
- `201` resource created
- `204` successful deletion with no response body
- `400` invalid request
- `401` authentication required
- `403` insufficient permission
- `404` resource not found
- `409` stock, duplicate or state conflict
- `413` uploaded file too large
- `415` unsupported file type
- `422` field validation failed
- `429` rate limit exceeded
- `500` unexpected server error

