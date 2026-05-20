"use client";
import dynamic from "next/dynamic";

export const MagneticCursor = dynamic(
  () =>
    import("./MagneticCursor").then((m) => ({
      default: m.MagneticCursor,
    })),
  { ssr: false }
);
