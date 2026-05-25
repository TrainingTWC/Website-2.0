"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import keeps lottie-react out of the SSR bundle.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

/**
 * IntersectionObserver-gated Lottie player.
 * - Loads the Lottie JSON once per src
 * - Pauses (autoplay=false) when offscreen
 * - When prefersReducedMotion is true, renders the first frame still (no loop, no autoplay)
 */
export function LottiePlayer({
  src,
  prefersReducedMotion,
  className,
}: {
  src: string;
  prefersReducedMotion: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<unknown>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!data) return <div ref={ref} className={className} />;

  return (
    <div ref={ref} className={className}>
      <Lottie
        animationData={data}
        loop={!prefersReducedMotion}
        autoplay={inView && !prefersReducedMotion}
      />
    </div>
  );
}
