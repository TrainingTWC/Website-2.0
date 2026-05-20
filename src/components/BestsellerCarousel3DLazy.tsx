"use client";
import dynamic from "next/dynamic";

export const BestsellerCarousel3D = dynamic(
  () =>
    import("./BestsellerCarousel3D").then((m) => ({
      default: m.BestsellerCarousel3D,
    })),
  { ssr: false }
);
