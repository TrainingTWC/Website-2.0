"use client";
import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const HomeContent = dynamic(() => import("@/src/components/HomeContent"), { ssr: false });

function HomeWithRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // Redirect legacy Vite SPA admin URLs to the Next.js admin routes
    const panel = (params.get("panel") ?? params.get("PANEL") ?? "").toLowerCase();
    if (panel === "merchant") {
      router.replace("/admin");
    } else if (panel === "superadmin") {
      router.replace("/admin?role=superadmin");
    }
  }, [params, router]);

  return <HomeContent />;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeWithRedirect />
    </Suspense>
  );
}
