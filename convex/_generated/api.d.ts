/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _authHelpers from "../_authHelpers.js";
import type * as admins from "../admins.js";
import type * as analytics from "../analytics.js";
import type * as apiKeys from "../apiKeys.js";
import type * as auth from "../auth.js";
import type * as authAdmin from "../authAdmin.js";
import type * as authHelpers from "../authHelpers.js";
import type * as cache from "../cache.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as dangerZone from "../dangerZone.js";
import type * as dataExport from "../dataExport.js";
import type * as discounts from "../discounts.js";
import type * as funnel from "../funnel.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as media from "../media.js";
import type * as migrations from "../migrations.js";
import type * as orders from "../orders.js";
import type * as otp from "../otp.js";
import type * as pageViews from "../pageViews.js";
import type * as posts from "../posts.js";
import type * as productContext from "../productContext.js";
import type * as products from "../products.js";
import type * as recommendations from "../recommendations.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as siteContent from "../siteContent.js";
import type * as support from "../support.js";
import type * as webVitals from "../webVitals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _authHelpers: typeof _authHelpers;
  admins: typeof admins;
  analytics: typeof analytics;
  apiKeys: typeof apiKeys;
  auth: typeof auth;
  authAdmin: typeof authAdmin;
  authHelpers: typeof authHelpers;
  cache: typeof cache;
  categories: typeof categories;
  crons: typeof crons;
  dangerZone: typeof dangerZone;
  dataExport: typeof dataExport;
  discounts: typeof discounts;
  funnel: typeof funnel;
  http: typeof http;
  inventory: typeof inventory;
  media: typeof media;
  migrations: typeof migrations;
  orders: typeof orders;
  otp: typeof otp;
  pageViews: typeof pageViews;
  posts: typeof posts;
  productContext: typeof productContext;
  products: typeof products;
  recommendations: typeof recommendations;
  seed: typeof seed;
  sessions: typeof sessions;
  siteContent: typeof siteContent;
  support: typeof support;
  webVitals: typeof webVitals;
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
