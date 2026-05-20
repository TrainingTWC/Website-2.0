"use client";
import dynamic from "next/dynamic";

const HomeContent = dynamic(() => import("@/src/components/HomeContent"), { ssr: false });

export default function Home() {
  return <HomeContent />;
}
