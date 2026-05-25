"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { usePerfTier } from "@/src/lib/usePerfTier";
import { BlurhashImage } from "./media/BlurhashImage";
import { LottiePlayer } from "./media/LottiePlayer";
import { GLBViewer } from "./media/GLBViewer";
import type { StudioSlot } from "@/src/lib/studioSlots";

/**
 * StudioMedia — top-level renderer for a slot-bound media asset.
 *
 * - Branches on `kind` (image | gif | video | lottie | glb)
 * - Tier-gates expensive content: video autoplay only when tier === "high" AND not prefers-reduced-motion
 * - IntersectionObserver-driven play/pause for `<video>`
 * - Returns null while loading or when no published row exists (no broken-image flash)
 *
 * NOTE: This component consumes `usePerfTier()` (the v6.0 adaptive perf hook).
 * The hook returns `reducedMotion` (not `prefersReducedMotion`); we rename
 * locally so downstream component props stay readable.
 */
type Props = {
  slot: StudioSlot;
  slotKey: string;
  className?: string;
  alt?: string;
};

export function StudioMedia({ slot, slotKey, className, alt }: Props) {
  const media = useQuery(api.media.getActive, { slot, slotKey });
  const perf = usePerfTier();
  const tier = perf.tier;
  const prefersReducedMotion = perf.reducedMotion;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoInView, setVideoInView] = useState(false);

  const canAutoplay = tier === "high" && !prefersReducedMotion;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVideoInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [media?.kind]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (canAutoplay && videoInView) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [canAutoplay, videoInView]);

  if (media === undefined || media === null) return null;

  const altText = alt ?? `${slot} ${slotKey}`;

  switch (media.kind) {
    case "image":
      return (
        <BlurhashImage
          src={media.url ?? ""}
          alt={altText}
          blurhash={media.blurhash}
          width={media.width}
          height={media.height}
          className={className}
        />
      );

    case "gif": {
      // gif: reduced-motion → prefer poster still if available, else render the gif.
      const src =
        prefersReducedMotion && media.posterUrl
          ? media.posterUrl
          : (media.url ?? "");
      return (
        <BlurhashImage
          src={src}
          alt={altText}
          blurhash={media.blurhash}
          width={media.width}
          height={media.height}
          className={className}
        />
      );
    }

    case "video":
      if (!canAutoplay) {
        const stillSrc = media.posterUrl ?? media.url ?? "";
        return (
          <BlurhashImage
            src={stillSrc}
            alt={altText}
            blurhash={media.blurhash}
            width={media.width}
            height={media.height}
            className={className}
          />
        );
      }
      return (
        <video
          ref={videoRef}
          className={className}
          src={media.url ?? undefined}
          poster={media.posterUrl ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={altText}
        />
      );

    case "lottie":
      return (
        <LottiePlayer
          src={media.url ?? ""}
          prefersReducedMotion={prefersReducedMotion}
          className={className}
        />
      );

    case "glb":
      return <GLBViewer src={media.url ?? ""} className={className} />;

    default:
      return null;
  }
}
