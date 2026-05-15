# Summary: Phase 01 Plan 02 — Admin Editorial CMS

**Phase:** 01-data-layer-admin-cms
**Plan:** 01-02
**Status:** Complete
**Commit:** 2da7044

## What Was Built

### src/components/admin/AdminDashboard.tsx (modified)
- Added `Newspaper` icon import
- Added `EditorialCMS` import
- Extended `activeTab` type union to include `"editorial"`
- Added 5th "Editorial" tab with Newspaper icon
- Renders `<EditorialCMS />` when Editorial tab is active

### src/components/admin/EditorialCMS.tsx (created)
Self-contained component (~740 lines) with two sub-tabs:

**Posts sub-tab (`PostsManager`):**
- Lists all posts via `api.posts.listAll` in a table with type badge, status badge, publish date, and actions (Edit, Publish/Unpublish, Delete)
- Slide-in panel from right for create/edit with all fields:
  - Type selector (5 options) with conditional fields
  - Champion type: reveals `personName`, `personRole`, `personStory` fields
  - Flash-sale type: reveals `discountId` selector + `expiresAt` field
  - Product-launch/champion: reveals `linkedProductId` selector
  - Cover image upload via `generateUploadUrl` mutation + PUT to signed URL
- `togglePublish` mutation wired to Publish/Unpublish button
- `deletePost` with confirm dialog

**Discounts sub-tab (`DiscountsManager`):**
- Lists all discount codes via `api.discounts.listDiscounts` in a table
- Inline create form (no separate panel): code, type, amount, firstOrderOnly, expiresAt, maxUses
- Error display for duplicate code (ConvexError caught)
- Delete with confirm dialog

## Technical Notes
- Used `(api as any)` cast via `convexApi` alias until `npx convex dev` regenerates types
- Follows exact same design tokens as AdminDashboard (INPUT, LABEL constants, natural-accent colors)
- `motion/react` AnimatePresence used for slide-in panel and inline form reveal

## Files Modified
- `src/components/admin/AdminDashboard.tsx`
- `src/components/admin/EditorialCMS.tsx` (created)
