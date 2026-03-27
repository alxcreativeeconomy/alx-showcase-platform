import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls } from '@react-three/drei';

export default function Hero3D() {
  return (
    // The Canvas is the 3D window. It takes up 100% of its parent container.
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      
      {/* Lighting so we can see the object */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#d8b4fe" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#f9a8d4" />

      {/* Float makes it hover up and down smoothly */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh>
          <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          {/* MeshDistortMaterial gives it a liquid/wobbly look */}
          <MeshDistortMaterial 
            color="#a855f7" 
            envMapIntensity={1} 
            clearcoat={1} 
            clearcoatRoughness={0.1} 
            metalness={0.5}
            distort={0.3}
            speed={2}
          />
        </mesh>
      </Float>

      {/* Allows the user to click and drag to rotate the object */}
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}