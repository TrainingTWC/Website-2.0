"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// The journal URL has moved to /third-circle — redirect transparently
export default function JournalRoute() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/third-circle");
  }, [router]);
  return null;
}

