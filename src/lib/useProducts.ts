import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { Product } from "../types";

const CACHE_KEY = "brewmatch:products:v1";

function readCache(): Product[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Product[];
  } catch {
    return null;
  }
}

function writeCache(products: Product[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(products));
  } catch {
    // sessionStorage full or unavailable — silently skip
  }
}

/**
 * Drop-in replacement for `useQuery(api.products.list)`.
 * Returns the cached product list from sessionStorage on subsequent page views,
 * skipping a Convex query entirely. Falls through to a live query on first load
 * or when the cache is missing (e.g. new tab, incognito).
 *
 * Cache is invalidated by incrementing the version in CACHE_KEY above.
 */
export function useProducts(): Product[] | undefined {
  const [cached] = useState<Product[] | null>(() => readCache());

  // Only fires a live query when there is no sessionStorage cache.
  // Pass "skip" as args to tell Convex to skip the subscription entirely.
  const live = useQuery(api.products.list, cached ? "skip" : {});

  useEffect(() => {
    if (live && live.length > 0) {
      writeCache(live as Product[]);
    }
  }, [live]);

  if (cached) return cached;
  return live as Product[] | undefined;
}
