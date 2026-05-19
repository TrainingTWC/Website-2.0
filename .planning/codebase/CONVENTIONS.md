# Code Conventions

**Analysis Date:** 2026-05-20

## TypeScript

**Compiler target:** ES2022, module resolution: `bundler`, JSX: `react-jsx`.

**Notable omissions:** `strict` mode is NOT enabled. No `strictNullChecks`, no `noUncheckedIndexedAccess`, no `noImplicitAny`. The tsconfig at `tsconfig.json` only sets `target`, `lib`, `module`, `moduleResolution`, `isolatedModules`, and `moduleDetection`.

**Type-casting pattern:** `as any` is used extensively when Convex's generated API types are incomplete or when new mutations/queries haven't been regenerated yet. Pattern:

```typescript
// Preferred workaround in lib hooks (src/lib/useSiteContent.ts, src/lib/useStoryContent.ts):
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;
const entry = useQuery(convexApi.siteContent.get, { key: "banner.slides" });

// Inline in components (src/components/admin/AdminDashboard.tsx):
const orders = useQuery((api as any).orders.listOrders) as any[] | undefined;
```

**Path alias:** `@/*` maps to project root (set in both `tsconfig.json` and `vite.config.ts`). However, most code uses relative imports — the alias is available but not consistently adopted.

**Lint:** `npm run lint` runs `tsc --noEmit`. No ESLint config file — TypeScript compiler is the sole static checker.

**Type exports:** Types, interfaces, constants, and utility functions all live in `src/types.ts`. This is the single shared type module.

## Component Patterns

**All functional components.** No class components.

**Named exports only** — no default exports for UI components:
```typescript
// src/components/CartPanel.tsx
export function CartPanel({ open, onClose, ... }: CartPanelProps) { ... }

// src/components/SmartImage.tsx
export function SmartImage({ src, alt, blur, ... }: SmartImageProps) { ... }
```

**Prop interfaces declared immediately above the component:**
```typescript
interface CartPanelProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  onRemove: (productId: string) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onCheckout?: () => void;
}
export function CartPanel({ open, onClose, ... }: CartPanelProps) { ... }
```

**Sub-components co-located in the same file** — not split into separate files:
```typescript
// src/components/ShopPage.tsx — ProductCard defined at top of file, used below
function ProductCard({ product, isPrimary, isCross, onAdd, onView }: { ... }) { ... }
export function ShopPage({ cart, onAddToCart, ... }: ShopPageProps) { ... }
```

**Animation:** `motion` from `motion/react` (Framer Motion v12, not `framer-motion`). `AnimatePresence` used for conditional rendering transitions. Spring animations preferred for panels:
```typescript
transition={{ type: "spring", stiffness: 300, damping: 32 }}
```

**Event handling:** callbacks passed as props, not context. State is lifted to `App.tsx` for cart, product navigation, and page routing.

**Hooks used:** `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useInView` from React; `useScroll`, `useTransform`, `useSpring`, `useMotionValue`, `useMotionValueEvent` from `motion/react`.

**Admin components** use shared design token constants defined at module scope:
```typescript
// src/components/admin/AdminDashboard.tsx
const INPUT = "w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 ...";
const LABEL = "block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5";
```

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` — e.g., `ShopPage.tsx`, `CartPanel.tsx`, `SmartImage.tsx`
- React hooks / lib utilities: `camelCase.ts` — e.g., `useProducts.ts`, `useSiteContent.ts`, `asset.ts`, `slug.ts`
- Convex backend files: `camelCase.ts` — e.g., `products.ts`, `orders.ts`, `recommendations.ts`
- Admin sub-components: `PascalCase.tsx` in `src/components/admin/`

**Components:** PascalCase — `DiscoveryWidget`, `ProductHero3D`, `BestsellerCarousel3D`

**Functions:** camelCase — `submitOrder`, `getRecommendation`, `slugify`, `resolveTaxonomy`

**Types & interfaces:** PascalCase — `Product`, `CartItem`, `StoryStat`, `BannerSlide`

**Type aliases for string literals:** PascalCase — `ProductType`, `RoastLevel`, `StockStatus`, `MainCategory`

**Convex mutation/query names:** camelCase verbs — `list`, `listByType`, `getById`, `add`, `update`, `submitOrder`, `getOrder`

**CSS custom properties:** `--color-natural-*` pattern for theme tokens

**Constants / enum-like arrays:** `SCREAMING_SNAKE_CASE` — `MAIN_CATEGORIES`, `SUBCATEGORIES`, `QUESTIONS`, `ROAST_LEVELS`, `PRODUCT_TYPES`

## Styling Patterns

**Tailwind v4** via `@tailwindcss/vite` plugin. No `tailwind.config.*` file — configuration lives in `src/index.css`.

**Theme tokens** defined in `@theme` block (`src/index.css`):
```css
@theme {
  --font-sans: "Merriweather", Georgia, serif;
  --font-serif: "Lato", ui-sans-serif, system-ui, sans-serif;
  --color-natural-bg: #F5F2ED;
  --color-natural-text: #2C1810;
  --color-natural-accent: #5A5A40;
  --color-natural-border: #E0D8D0;
  --color-natural-paper: #FAF9F6;
  --color-natural-muted: #EBE7E0;
  --color-natural-stone: #D9D1C7;
}
```

**Font naming is intentionally inverted:** `font-sans` is Merriweather (serif) and `font-serif` is Lato (sans). This is intentional branding.

**Custom utilities** via `@utility` blocks (`src/index.css`): `scrollbar-hide`, `perspective-1000`, `preserve-3d`, `paper-grain`, glassmorphism utilities.

**Responsive breakpoints:** `sm:`, `md:` prefixes used inline. No custom breakpoints defined.

**Z-index layers:** Hardcoded Tailwind arbitrary values — `z-70` (cart backdrop), `z-80` (cart panel), `z-[100]` (other overlays).

**Color usage:** Always use `natural-*` tokens, not raw hex values (exception: admin panel uses `stone-*` from Tailwind's default palette directly).

## Data Fetching Patterns

**`useQuery`** — reactive Convex subscriptions. Component re-renders on data change. Preferred for all read operations:
```typescript
const products = useQuery(api.products.list);
// Returns undefined while loading, then data
```

**`useMutation`** — returns a callable async function. Called in event handlers:
```typescript
const submitOrder = useMutation(api.orders.submitOrder);
// In handler:
const { orderId } = await submitOrder({ customer: ..., items: ... });
```

**`useAction`** — for Convex actions (Node.js runtime, AI calls). Same call pattern as mutation:
```typescript
const getRecommendation = useAction(api.recommendations.getRecommendation);
const result = await getRecommendation({ answers, products });
```

**Custom hooks with default fallback pattern** — all CMS/content hooks return defaults when Convex returns `undefined`:
```typescript
// src/lib/useStoryContent.ts
export function useStoryContent(): StoryContent {
  const entry = useQuery(convexApi.siteContent.get, { key: "story" });
  if (!entry?.value) return DEFAULTS;   // always return something
  return { ...DEFAULTS, ...entry.value };
}
```

**SessionStorage caching layer** in `useProducts` (`src/lib/useProducts.ts`):
- On first load: fires live Convex query, writes result to `sessionStorage` under `brewmatch:products:v1`
- On subsequent loads within same tab session: reads from cache, passes `"skip"` to `useQuery` to prevent subscription
- Cache invalidated by bumping version suffix in `CACHE_KEY`

**Loading state pattern:** check for `undefined` (loading), `null` (not found), or array/object (data):
```typescript
if (!products) return <LoadingScreen />;
```

## File Organization

```
src/
├── App.tsx              # Root component — all client-side routing, global state
├── index.css            # Tailwind v4 theme + global base styles
├── main.tsx             # React entry point (ConvexProvider, ConvexAuthProvider)
├── types.ts             # ALL shared types, interfaces, constants, utility functions
├── components/          # All UI components (PascalCase.tsx)
│   ├── admin/           # Admin panel components
│   └── widget/          # Discovery widget and kiosk pipeline
└── lib/                 # Custom hooks and utility functions (camelCase)

convex/
├── schema.ts            # Single source of truth for all table schemas
├── _generated/          # Auto-generated — DO NOT EDIT
└── *.ts                 # One file per domain (products, orders, recommendations...)
```

**No barrel `index.ts` files.** Every import references the exact file.

**Sub-components are co-located** in the parent file, not split out, unless they are genuinely reusable (e.g., `SmartImage`, `SiteFooter`).

**App.tsx is a god file** — it contains the full SPA router, all global state (cart, page, product navigation), and many inline sub-components (`ScrollReveal`, `scrollTo`, `goToStorefront`). This is the primary architectural concern.

## Import Patterns

**Order (unenforced, observed pattern):**
1. React core — `import { useState, ... } from "react"`
2. Third-party libraries — `motion/react`, `lucide-react`, `convex/react`
3. Convex generated API — `import { api } from "../../convex/_generated/api"`
4. Internal lib hooks — `import { useProducts } from "../lib/useProducts"`
5. Internal components — `import { CartPanel } from "./CartPanel"`
6. Types — `import type { Product } from "../types"`

**`import type`** used consistently for type-only imports.

**`motion/react`** (not `framer-motion`) — the package was renamed in v12. Using the old name will fail.

**`@/*` alias** is configured but underused. Most imports use relative paths like `../../convex/_generated/api`.

## Convex Patterns

**All functions use explicit `{ args, handler }` object form:**
```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});
```

**Validators:** `v` from `convex/values`. Use `v.union(v.literal(...))` for string enums (matches `schema.ts`). Use `v.optional()` for nullable fields. Use `v.id("tableName")` for document references.

**`v.any()`** used for loosely-typed dynamic data — `sessions.answers`, `rules.condition`. Avoid in new code where possible.

**Actions** require `"use node"` directive at top of file for Node.js builtins (crypto, etc.):
```typescript
"use node";
import { action } from "./_generated/server";
```

**AI cache pattern** (`convex/recommendations.ts`, `convex/cache.ts`): All Mistral AI calls are keyed by SHA-256 hash of `CACHE_VERSION + actionName + stableStringify(args)`. Increment `CACHE_VERSION` to invalidate all cached responses after prompt changes.

**`ConvexError`** from `convex/values` used for user-visible errors (not internal errors).

**Indexes** declared inline in schema using `.index("name", ["field"])`. Query with `.withIndex("name", q => q.eq(...))`.

**Schema denormalization:** `orders` table denormalizes `customerPhone` and `customerEmail` as top-level fields to support index queries (see `convex/schema.ts` lines 139–142).

---

*Convention analysis: 2026-05-20*
