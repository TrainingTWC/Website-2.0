/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as cache from "../cache.js";
import type * as categories from "../categories.js";
import type * as discounts from "../discounts.js";
import type * as migrations from "../migrations.js";
import type * as orders from "../orders.js";
import type * as pageViews from "../pageViews.js";
import type * as posts from "../posts.js";
import type * as productContext from "../productContext.js";
import type * as products from "../products.js";
import type * as recommendations from "../recommendations.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as siteContent from "../siteContent.js";
import type * as support from "../support.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  cache: typeof cache;
  categories: typeof categories;
  discounts: typeof discounts;
  migrations: typeof migrations;
  orders: typeof orders;
  pageViews: typeof pageViews;
  posts: typeof posts;
  productContext: typeof productContext;
  products: typeof products;
  recommendations: typeof recommendations;
  seed: typeof seed;
  sessions: typeof sessions;
  siteContent: typeof siteContent;
  support: typeof support;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
