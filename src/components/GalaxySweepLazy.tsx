"use client";
import dynamic from "next/dynamic";

export const GalaxySweep = dynamic(
  () =>
    import("./GalaxySweep").then((m) => ({
      default: m.GalaxySweep,
    })),
  { ssr: false }
);
