# Unified Shopping Cart Feature Documentation

---

## Overview
The Unified Shopping Cart feature provides a robust, multi-tenant cart system for both authenticated and guest users. It supports seamless cart management, store isolation, automatic cleanup of invalid items, and cart merging on login. All logic is clearly marked with `// monjed update start` and `// monjed update end` for easy auditing.

---

## 1. Guest & Authenticated User Cart Handling
- **Authenticated Users:**
  - Cart is associated with the user's MongoDB `_id` and the current store.
  - Each user has a separate cart per store.
- **Guest Users:**
  - Cart is associated with a unique `guestId` (UUID) stored in a signed, HTTP-only cookie.
  - Each guest has a separate cart per store.
  - The `guestId` is managed by custom middleware and is automatically set if not present.

---

## 2. Files Created or Modified

### Models/Cart.js
- Defines the Cart schema with fields:
  - `user`: ObjectId (ref: User, nullable)
  - `guestId`: String (nullable, indexed)
  - `store`: ObjectId (ref: Store, required)
  - `items`: Array of cart items (product, quantity, variant, priceAtAdd, addedAt)
- Unique compound indexes ensure one cart per user/store or guestId/store.
- All logic is wrapped with `// monjed update start/end`.

### controllers/cart.controller.js
- Unified controller for all cart operations (add, update, remove, clear, get).
- Handles both user and guest carts using a helper to build the query.
- Implements automatic cleanup of out-of-stock or deleted products in `getCart` (see below).
- All logic is wrapped with `// monjed update start/end`.

### middleware/guestCart.js
- Middleware to extract or generate a `guestId` via signed cookie for guest users.
- If the user is authenticated, skips guest logic.
- Sets `req.guestId` for downstream use.
- All logic is wrapped with `// monjed update start/end`.

### Routes/cart.routes.js
- Defines RESTful endpoints for cart operations:
  - `GET    /api/cart`         → Retrieve current cart
  - `POST   /api/cart`         → Add item to cart
  - `PUT    /api/cart/:productId` → Update item quantity/variant
  - `DELETE /api/cart/:productId` → Remove item from cart
  - `DELETE /api/cart`         → Clear entire cart
- All routes use both `protect` (auth) and `guestCart` middleware, so either user or guest is always handled.
- Store isolation is enforced via `addStoreFilter` middleware.
- All logic is wrapped with `// monjed update start/end`.

### Routes/auth.js (Cart Merging on Login)
- After successful login, if a guest cart exists for the current store, it is merged into the user's cart.
- Quantities are summed for overlapping products/variants.
- Guest cart is deleted after merging.
- This logic is wrapped with `// monjed update start/end`.

---

## 3. Cart Merging on Login
- When a guest user logs in, the backend checks for a cart associated with their `guestId` and the current store.
- If found, it merges all items into the user's cart for that store:
  - If an item exists in both carts (same product and variant), quantities are summed.
  - Otherwise, the item is added to the user's cart.
- The guest cart is deleted after merging.
- This ensures a seamless transition from guest to authenticated user.

---

## 4. Automatic Cleanup of Out-of-Stock/Deleted Products
- In `controllers/cart.controller.js`, the `getCart` function automatically removes any cart item where:
  - The product no longer exists in the database (`product === null` after population)
  - The product exists but has `stock === 0`
- If any such items are found, they are removed from the cart and the cart is saved before returning the response.
- This logic is wrapped with `// monjed update start/end`.

---

## 5. Store Isolation
- All cart operations are scoped to the current store, enforced by the `addStoreFilter` middleware and by querying with the current store's `_id`.
- Users and guests have separate carts for each store.
- Cross-store cart operations are not allowed.

---

## 6. `// monjed update start/end` Markers
- All new or changed logic for the unified cart feature is wrapped with these comments in all relevant files.
- This makes it easy to audit, update, or remove the feature in the future.

---

## 7. API Endpoint Summary

| Method | Endpoint                | Description                        | Auth/Guest | Store Scoped |
|--------|-------------------------|------------------------------------|------------|--------------|
| GET    | `/api/cart`             | Retrieve current cart              | Both       | Yes          |
| POST   | `/api/cart`             | Add item to cart                   | Both       | Yes          |
| PUT    | `/api/cart/:productId`  | Update item quantity/variant       | Both       | Yes          |
| DELETE | `/api/cart/:productId`  | Remove item from cart              | Both       | Yes          |
| DELETE | `/api/cart`             | Clear entire cart                  | Both       | Yes          |

- All endpoints require the `x-store-slug` header to identify the store context.
- Authenticated users use JWT in the `Authorization` header; guests are tracked via signed `guestId` cookie.

---

## 8. How `guestId` Works
- For guest users, a UUID is generated and stored in a signed, HTTP-only cookie named `guestId`.
- The `guestCart` middleware checks for this cookie on every cart request:
  - If present, it sets `req.guestId`.
  - If absent, it generates a new UUID, sets the cookie, and sets `req.guestId`.
- This allows guests to have persistent carts across sessions (up to 30 days by default).

---

## 9. Cleanup Logic in `getCart`
- When loading the cart (`GET /api/cart`):
  - The cart is populated with product details.
  - Any item whose product is missing or has `stock === 0` is removed from the cart.
  - The cart is saved and returned in the response.
- This ensures users never see out-of-stock or deleted products in their cart.

---

## 10. Response Format & Error Handling
- All cart endpoints return responses in the format:
  - Success: `{ success: true, data: <cart object> }`
  - Error: `{ success: false, message: <error message> }`
- Appropriate status codes and messages are used for invalid input, unauthorized access, or missing products.

---

## 11. Summary
- The unified cart feature is robust, multi-tenant, and user-friendly.
- It supports seamless guest-to-user transitions, automatic cleanup, and strict store isolation.
- All logic is clearly marked for future maintenance. 