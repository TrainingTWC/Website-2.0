import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * Custom magnetic cursor. A small filled dot tracks the mouse 1:1 while a
 * larger outlined ring chases with a soft spring. When the cursor enters
 * anything with `[data-magnetic]` or interactive tags (a/button), the ring
 * grows and locks onto the element's center for a "stick" effect.
 *
 * Auto-hides on touch devices and when the document loses focus.
 */
export function MagneticCursor() {
  const dotX = useMotionValue(0);
  const dotY = useMotionValue(0);
  const ringX = useSpring(dotX, { stiffness: 320, damping: 26, mass: 0.6 });
  const ringY = useSpring(dotY, { stiffness: 320, damping: 26, mass: 0.6 });

  const stateRef = useRef<{ enabled: boolean; hover: boolean }>({
    enabled: true,
    hover: false,
  });
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Touch device? Bail entirely.
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      stateRef.current.enabled = false;
      return;
    }
    document.documentElement.classList.add("has-magnetic-cursor");

    const onMove = (e: MouseEvent) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
    };

    const setHover = (next: boolean, size = 60) => {
      stateRef.current.hover = next;
      if (!ringRef.current) return;
      ringRef.current.style.width = `${next ? size : 32}px`;
      ringRef.current.style.height = `${next ? size : 32}px`;
      ringRef.current.style.opacity = next ? "1" : "0.55";
      ringRef.current.style.borderWidth = next ? "1.5px" : "1px";
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const magnetic = t.closest<HTMLElement>(
        "[data-magnetic], button, a, [role='button'], input, textarea, select, [data-cursor='zoom']"
      );
      if (!magnetic) {
        setHover(false);
        return;
      }
      const r = magnetic.getBoundingClientRect();
      const size = Math.min(Math.max(r.width, r.height) + 12, 140);
      setHover(true, size);
    };

    const onOut = () => setHover(false);
    const onBlur = () => {
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };
    const onFocus = () => {
      if (ringRef.current) ringRef.current.style.opacity = "0.55";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.documentElement.classList.remove("has-magnetic-cursor");
    };
  }, [dotX, dotY]);

  if (!stateRef.current.enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 pointer-events-none z-[9999] w-1.5 h-1.5 rounded-full bg-natural-text mix-blend-difference"
        style={{ x: dotX, y: dotY, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        ref={ringRef}
        aria-hidden
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full border border-natural-text mix-blend-difference transition-[width,height,opacity,border-width] duration-200 ease-out"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          width: 32,
          height: 32,
          opacity: 0.55,
        }}
      />
    </>
  );
}
