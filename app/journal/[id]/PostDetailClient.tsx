"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Post detail pages have moved to /third-circle/[id] — redirect transparently
export function PostDetailClient({ id }: { id: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/third-circle/${id}`);
  }, [router, id]);
  return null;
}
