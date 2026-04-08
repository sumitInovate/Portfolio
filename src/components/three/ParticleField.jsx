import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ParticleField({ count = 800, color = '#4A9EFF', spread = 10 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        pos: [
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * (spread * 0.5),
        ],
        speed: Math.random() * 0.25 + 0.05,
        offset: Math.random() * Math.PI * 2,
        size: Math.random() * 0.03 + 0.02,
      })),
    [count, spread]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    particles.forEach((p, i) => {
      dummy.position.set(
        p.pos[0] + Math.sin(t * p.speed * 0.5 + p.offset) * 0.3,
        p.pos[1] + Math.sin(t * p.speed + p.offset) * 0.5,
        p.pos[2]
      );
      const scale = p.size + Math.sin(t + p.offset) * 0.01;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} />
    </instancedMesh>
  );
}
