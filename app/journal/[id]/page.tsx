import { PostDetailClient } from "./PostDetailClient";

// ROUTE-05: fetch published post IDs from Convex HTTP API at build time
export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "posts:listPublished", args: {}, format: "clean_json" }),
      }
    );
    if (!res.ok) return [{ id: "_" }];
    const data = await res.json();
    const posts = data.value ?? [];
    if (posts.length === 0) return [{ id: "_" }];
    return posts.map((p: { _id: string }) => ({ id: p._id }));
  } catch {
    return [{ id: "_" }];
  }
}

export default async function JournalPostRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PostDetailClient id={id} />;
}
