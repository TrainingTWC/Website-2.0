import { ThirdCirclePostClient } from "./ThirdCirclePostClient";

// Reuse the same static params as journal posts
const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://different-bulldog-772.convex.cloud";

export async function generateStaticParams() {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "posts:listPublished", args: {}, format: "clean_json" }),
    });
    if (!res.ok) return [{ id: "_" }];
    const data = await res.json();
    const posts = data.value ?? [];
    if (posts.length === 0) return [{ id: "_" }];
    return posts.map((p: { _id: string }) => ({ id: p._id }));
  } catch {
    return [{ id: "_" }];
  }
}

export default async function ThirdCirclePostRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ThirdCirclePostClient id={id} />;
}
