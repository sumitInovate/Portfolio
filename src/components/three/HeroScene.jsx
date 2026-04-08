import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, OrbitControls } from '@react-three/drei';
import { useRef, useState, useEffect, Suspense } from 'react';
import { DungeonGate } from './DungeonGate';
import { ParticleField } from './ParticleField';

/**
 * MouseParallaxRig — smoothly moves camera to follow mouse
 * giving the parallax illusion. Gate appears to follow the cursor.
 */
function MouseParallaxRig() {
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      targetRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useFrame((state) => {
    // Smooth lerp towards mouse position
    currentRef.current.x += (targetRef.current.x * 0.6 - currentRef.current.x) * 0.04;
    currentRef.current.y += (targetRef.current.y * 0.4 - currentRef.current.y) * 0.04;

    state.camera.position.x = currentRef.current.x;
    state.camera.position.y = currentRef.current.y;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#020409']} />
      <fog attach="fog" args={['#020409', 12, 28]} />

      {/* Dungeon atmosphere lighting */}
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 0, 4]} color="#1E6FE8" intensity={4} distance={10} />
      <pointLight position={[-5, 3, -3]} color="#7B4FFF" intensity={2.5} distance={14} />
      <pointLight position={[4, -2, 2]} color="#4A9EFF" intensity={1.5} distance={8} />

      {/* Star field */}
      <Stars radius={80} depth={60} count={5000} factor={3.5} fade speed={0.35} />

      {/* Main gate — floating + mouse-interactive */}
      <Float speed={1.0} rotationIntensity={0.25} floatIntensity={0.4}>
        <DungeonGate />
      </Float>

      {/* Particle clouds */}
      <ParticleField count={700}  color="#4A9EFF" spread={10} />
      <ParticleField count={350}  color="#7B4FFF" spread={8} />
      <ParticleField count={150}  color="#C4A8FF" spread={6} />

      {/* Mouse parallax camera controller */}
      <MouseParallaxRig />
    </>
  );
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 58 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
