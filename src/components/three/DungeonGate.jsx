import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function DungeonGate() {
  const outerRef = useRef();
  const innerRef = useRef();
  const rune1Ref = useRef();
  const rune2Ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (outerRef.current) {
      outerRef.current.material.emissiveIntensity =
        0.6 + Math.sin(t * 1.4) * 0.35;
    }
    if (innerRef.current) {
      innerRef.current.material.emissiveIntensity =
        0.3 + Math.sin(t * 0.8 + 1) * 0.2;
    }
    if (rune1Ref.current) {
      rune1Ref.current.rotation.z = t * 0.4;
    }
    if (rune2Ref.current) {
      rune2Ref.current.rotation.z = -t * 0.25;
    }
  });

  return (
    <group>
      {/* Outer glowing torus ring */}
      <mesh ref={outerRef}>
        <torusGeometry args={[2.2, 0.07, 24, 80]} />
        <meshStandardMaterial
          color="#1E6FE8"
          emissive="#1E6FE8"
          emissiveIntensity={0.8}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Inner secondary ring */}
      <mesh ref={innerRef} scale={[0.75, 0.75, 0.75]}>
        <torusGeometry args={[2.2, 0.04, 16, 60]} />
        <meshStandardMaterial
          color="#7B4FFF"
          emissive="#7B4FFF"
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Rotating rune ring 1 */}
      <mesh ref={rune1Ref} scale={[0.55, 0.55, 0.55]}>
        <torusGeometry args={[2.2, 0.025, 8, 12]} />
        <meshStandardMaterial
          color="#4A9EFF"
          emissive="#4A9EFF"
          emissiveIntensity={0.6}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Rotating rune ring 2 */}
      <mesh ref={rune2Ref} scale={[0.9, 0.9, 0.9]}>
        <torusGeometry args={[2.2, 0.02, 6, 8]} />
        <meshStandardMaterial
          color="#C4A8FF"
          emissive="#C4A8FF"
          emissiveIntensity={0.4}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Dark void center */}
      <mesh position={[0, 0, -0.05]}>
        <circleGeometry args={[2.15, 64]} />
        <meshStandardMaterial
          color="#010105"
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Inner glow plane */}
      <mesh position={[0, 0, -0.04]}>
        <circleGeometry args={[1.6, 64]} />
        <meshStandardMaterial
          color="#050B1E"
          emissive="#1E6FE8"
          emissiveIntensity={0.08}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
