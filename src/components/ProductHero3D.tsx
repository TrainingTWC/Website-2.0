import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  OrbitControls,
  ContactShadows,
  Bounds,
} from "@react-three/drei";
import type { Group } from "three";

/** Loads and auto-rotates the GLB model. Rotation pauses while user drags. */
function Model({ url, paused }: { url: string; paused: boolean }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null!);

  useFrame((_, delta) => {
    if (!paused && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.55;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

interface ProductHero3DProps {
  modelUrl: string;
  /** Shadow opacity (0–1). Set lower for dark-bg pages. Default 0.25 */
  shadowOpacity?: number;
}

export function ProductHero3D({ modelUrl, shadowOpacity = 0.25 }: ProductHero3DProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <Canvas
      camera={{ position: [0, 0.5, 3.5], fov: 38 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
      aria-label="3D product model – drag to rotate"
    >
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.4} castShadow />
      <directionalLight position={[-3, 2, -4]} intensity={0.4} />

      <Suspense fallback={null}>
        {/* Bounds auto-fits the model inside the viewport on load */}
        <Bounds fit clip observe margin={1.1}>
          <Model url={modelUrl} paused={dragging} />
        </Bounds>

        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={shadowOpacity}
          scale={4}
          blur={2.5}
          far={2}
          color="#3A1C0A"
        />

        <Environment preset="studio" />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(Math.PI * 3) / 4}
        onStart={() => setDragging(true)}
        onEnd={() => setDragging(false)}
      />
    </Canvas>
  );
}

// Preload so the model starts fetching as soon as this module is imported
ProductHero3D.preload = (url: string) => useGLTF.preload(url);
