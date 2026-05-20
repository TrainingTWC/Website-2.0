import { useEffect, useRef, useState } from "react";

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** LQIP data URL (e.g. base64 webp ~20px wide) */
  blur?: string;
  /** Aspect ratio CSS string, e.g. "4/5". Prevents layout shift. */
  aspectRatio?: string;
  /** Priority loading hint for above-the-fold images */
  priority?: boolean;
  /** Optional className wrapper, kept for compatibility */
  wrapperClassName?: string;
}

/**
 * Image with blur-up placeholder, lazy decoding, and no layout shift.
 *
 * Renders the LQIP as a CSS background that fades out the moment the
 * real image decodes — this makes hero/product cards feel instant even
 * before bytes finish arriving.
 */
export function SmartImage({
  src,
  alt,
  blur,
  aspectRatio,
  priority = false,
  wrapperClassName = "",
  className = "",
  style,
  ...rest
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Ensure images always become visible even when the browser defers onLoad
  // (e.g. Edge's lazy-load intervention that replaces images with placeholders).
  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    // Hard fallback: always reveal after 4 s regardless of load events
    const timer = setTimeout(() => { if (!cancelled) setLoaded(true); }, 4000);

    // img.decode() resolves when pixels are ready for compositing —
    // fires even when the browser defers the standard load event.
    img
      .decode()
      .then(() => { if (!cancelled) setLoaded(true); })
      .catch(() => { /* decode can fail for un-started lazy images; timer handles it */ });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden ${wrapperClassName}`}
      style={{
        aspectRatio,
        backgroundColor: "var(--color-natural-muted)",
        backgroundImage: blur ? `url(${blur})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        ...style,
      }}
    >
      {/* Soft blur over the LQIP so pixelation is invisible */}
      {blur && !loaded && (
        <div
          className="absolute inset-0 backdrop-blur-xl"
          style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
        />
      )}
      <img
        {...rest}
        ref={ref}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        className={`relative w-full h-full transition-opacity duration-700 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
      />
    </div>
  );
}
