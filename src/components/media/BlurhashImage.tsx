"use client";

import { useState } from "react";
import { Blurhash } from "react-blurhash";

/**
 * Image with blurhash LQIP placeholder. Fades in once the real image loads.
 *
 * NOTE: uses a raw <img> intentionally. Convex storage URLs are signed and not
 * known at build time, so next/image static optimisation isn't a fit here.
 */
export function BlurhashImage({
  src,
  alt,
  blurhash,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  blurhash?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      {blurhash && !loaded && (
        <div className="absolute inset-0">
          <Blurhash
            hash={blurhash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- Convex storage URLs are dynamic, not statically resolvable for next/image */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        className={`relative h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
