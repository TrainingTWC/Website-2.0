/**
 * TIIcon — the official Third Intelligence icon.
 * Use this anywhere we'd otherwise reach for a "sparkle" / "AI" glyph.
 * Sourced from public/third-intelligence-icon.png and shipped via the
 * static asset CDN (GitHub Pages base path).
 */
import { asset } from "../lib/asset";

export function TIIcon({
  className = "w-4 h-4",
  style,
  alt = "",
}: {
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}) {
  return (
    <img
      src={asset("third-intelligence-icon.png")}
      alt={alt}
      className={`${className} object-contain shrink-0`}
      style={style}
      draggable={false}
    />
  );
}
