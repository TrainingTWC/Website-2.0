# Summary: Phase 01 Plan 01 — Convex Data Layer

**Phase:** 01-data-layer-admin-cms
**Plan:** 01-01
**Status:** Complete
**Commit:** 636fee7

## What Was Built

Extended the Convex backend with the full Editorial Hub data layer:

### convex/schema.ts
- Added `posts` table with 5 content types (flash-sale, product-launch, cafe-news, brand-story, champion), status workflow (draft/published/scheduled), cover image storage, champion-only fields, and 3 indexes (by_status, by_type, by_status_and_type)
- Added `discounts` table with percent/flat types, firstOrderOnly flag, maxUses cap, usageCount tracker, and by_code unique index
- Extended `orders` table with 3 optional fields: `discountCode`, `customerPhone`, `customerEmail` (denormalized for index queries) + 2 new indexes (by_customerPhone, by_customerEmail)

### convex/posts.ts (new)
9 exports: `listPublished`, `listAll`, `getPost`, `createPost`, `updatePost`, `togglePublish`, `deletePost`, `generateUploadUrl`, `getStorageUrl`

### convex/discounts.ts (new)
5 exports: `listDiscounts`, `validateDiscount`, `claimDiscount`, `createDiscount`, `deleteDiscount`
- `validateDiscount` uses `withIndex("by_customerPhone")` for firstOrderOnly check — no filter scan
- `claimDiscount` atomically checks then increments `usageCount` in one mutation
- All invalid cases return typed `{ valid: false, reason: "..." }` or throw `ConvexError`

### convex/orders.ts (updated)
- `submitOrder` now accepts `discountCode?: string`
- Denormalizes `customer.phone → customerPhone` and `customer.email → customerEmail` on insert

## Decisions Made

- Used `withIndex` throughout — no filter scans
- `generateUploadUrl` is a mutation (required by Convex storage rules)
- `usageCount` starts at 0 on create; never set by client
- Discount validation reasons are typed const string literals for frontend type safety

## Files Modified

- `convex/schema.ts`
- `convex/posts.ts` (created)
- `convex/discounts.ts` (created)
- `convex/orders.ts`
