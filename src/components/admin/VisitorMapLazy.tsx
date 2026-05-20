"use client";
import dynamic from "next/dynamic";

export type { MapPoint } from "./VisitorMap";

export const VisitorMap = dynamic(
  () =>
    import("./VisitorMap").then((m) => ({
      default: m.VisitorMap,
    })),
  { ssr: false }
);
