import { ProductClient } from "./ProductClient";

// ROUTE-03: enumerate all product _ids at build time via Convex HTTP API
export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "products:list", args: {}, format: "clean_json" }),
      }
    );
    if (!res.ok) return [{ slug: "_" }];
    const data = await res.json();
    const products = data.value ?? [];
    if (products.length === 0) return [{ slug: "_" }];
    return products.map((p: { _id: string }) => ({ slug: p._id }));
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
