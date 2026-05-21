import { ProductClient } from "./ProductClient";
import { slugify } from "@/src/lib/slug";

// ROUTE-03: enumerate all product slugs at build time via Convex HTTP API
const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://different-bulldog-772.convex.cloud";

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${CONVEX_URL}/api/query`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "products:list", args: {} }),
      }
    );
    if (!res.ok) return [{ slug: "_" }];
    const data = await res.json();
    const products = data.value ?? [];
    if (products.length === 0) return [{ slug: "_" }];
    return products.map((p: { _id: string; name: string }) => ({
      slug: slugify(p.name || p._id),
    }));
  } catch {
    return [{ slug: "_" }];
  }
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductClient slug={slug} />;
}
