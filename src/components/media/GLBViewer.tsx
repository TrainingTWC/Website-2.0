"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState, Suspense } from "react";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/**
 * R3F GLB viewer with IntersectionObserver-driven Canvas teardown.
 * Off-screen the Canvas is unmounted entirely, releasing GPU/WebGL resources.
 */
export function GLBViewer({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {inView && (
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 2.5], fov: 35 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 3, 3]} intensity={0.8} />
          <Suspense fallback={null}>
            <Model url={src} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
