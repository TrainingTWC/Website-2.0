"use client";
import dynamic from "next/dynamic";

export const ProductHero3D = dynamic(
  () =>
    import("./ProductHero3D").then((m) => ({
      default: m.ProductHero3D,
    })),
  { ssr: false }
);
