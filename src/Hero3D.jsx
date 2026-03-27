import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls, Torus, Box, Sphere, Cylinder, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// ── Floating phone/screen device ───────────────────────────────────────────
function PhoneDevice({ position, rotation, scale = 1, color = '#FF6B35' }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.004;
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.12;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Phone body */}
      <mesh>
        <boxGeometry args={[0.55, 1.1, 0.07]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.1} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0, 0, 0.042]}>
        <boxGeometry args={[0.46, 0.96, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} roughness={0} metalness={0} />
      </mesh>
      {/* Screen content lines (fake UI) */}
      {[-0.25, -0.05, 0.1, 0.25].map((y, i) => (
        <mesh key={i} position={[0, y, 0.055]}>
          <boxGeometry args={[0.3 - i * 0.04, 0.025, 0.001]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Camera dot */}
      <mesh position={[0, 0.44, 0.042]}>
        <circleGeometry args={[0.025, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Like/heart particles around screen */}
      <mesh position={[0.35, 0.25, 0.06]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FF3B77" emissive="#FF3B77" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.42, 0.05, 0.06]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ── Floating camera/ring light ──────────────────────────────────────────────
function RingLight({ position }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    ref.current.rotation.z += 0.008;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <torusGeometry args={[0.4, 0.06, 16, 48]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.5} metalness={0.9} roughness={0.05} />
      </mesh>
      {/* Inner ring glow */}
      <mesh>
        <torusGeometry args={[0.28, 0.03, 12, 36]} />
        <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={2} />
      </mesh>
      {/* Tripod leg hints */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ── Social media notification bubble ─────────────────────────────────────────
function NotificationBubble({ position, color, delay = 0 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + delay;
    ref.current.position.y = position[1] + Math.sin(t * 1.2) * 0.18;
    ref.current.position.x = position[0] + Math.cos(t * 0.7) * 0.06;
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.15;
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={0.1} metalness={0.3} />
      </mesh>
      {/* Plus/notification indicator */}
      <mesh position={[0.05, 0.05, 0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

// ── Floating mic / podcast orb ────────────────────────────────────────────
function MicOrb({ position }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.9 + 1) * 0.13;
    ref.current.rotation.y += 0.006;
  });

  return (
    <group ref={ref} position={position} scale={0.85}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.16, 0.4, 8, 16]} />
        <meshStandardMaterial color="#2D6A4F" metalness={0.7} roughness={0.15} />
      </mesh>
      {/* Grille stripes */}
      {[-0.1, 0, 0.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.165]}>
          <boxGeometry args={[0.22, 0.03, 0.01]} />
          <meshStandardMaterial color="#1B4332" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {/* Glow dot at top */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

// ── Central floating laptop ─────────────────────────────────────────────────
function Laptop({ position }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.25;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
  });

  return (
    <group ref={ref} position={position}>
      {/* Base */}
      <mesh rotation={[0.1, 0, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.95]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.08} />
      </mesh>
      {/* Screen panel */}
      <mesh position={[0, 0.55, -0.42]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.4, 1.0, 0.05]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Screen glow — vibrant creator dashboard */}
      <mesh position={[0, 0.55, -0.39]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.25, 0.85, 0.01]} />
        <meshStandardMaterial color="#0066FF" emissive="#0066FF" emissiveIntensity={0.9} roughness={0} />
      </mesh>
      {/* Dashboard UI bars */}
      {[0.15, -0.05, -0.22].map((y, i) => (
        <mesh key={i} position={[-0.3 + i * 0.1, 0.5 + y, -0.36]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.5 - i * 0.1, 0.04, 0.005]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* Keyboard hint */}
      <mesh position={[0, 0.04, 0.15]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[1.1, 0.01, 0.55]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Trackpad */}
      <mesh position={[0, 0.04, 0.32]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.42, 0.012, 0.26]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── Floating social icons (abstract geometric) ────────────────────────────
function SocialIcon({ position, shape = 'box', color = '#FF6B35', delay = 0 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + delay;
    ref.current.rotation.x += 0.012;
    ref.current.rotation.y += 0.008;
    ref.current.position.y = position[1] + Math.sin(t * 1.1) * 0.14;
  });

  return (
    <mesh ref={ref} position={position}>
      {shape === 'box' && <boxGeometry args={[0.22, 0.22, 0.22]} />}
      {shape === 'oct' && <octahedronGeometry args={[0.16]} />}
      {shape === 'tetra' && <tetrahedronGeometry args={[0.18]} />}
      {shape === 'icosa' && <icosahedronGeometry args={[0.15]} />}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} metalness={0.4} roughness={0.1} />
    </mesh>
  );
}

// ── Particle constellation (creator data network) ────────────────────────
function DataParticles() {
  const count = 80;
  const ref = useRef();

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [1.0, 0.42, 0.21],   // #FF6B35 orange
      [0.0, 0.40, 1.0],    // #0066FF blue
      [0.83, 0.69, 0.22],  // #D4AF37 gold
      [0.18, 0.42, 0.31],  // #2D6A4F green
      [1.0, 0.23, 0.47],   // #FF3B77 pink
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

// ── Main Hero3D export ────────────────────────────────────────────────────
export default function Hero3D() {
  return (
    <Canvas camera={{ position: [0, 0.5, 6.5], fov: 50 }}>
      {/* Vibrant multi-colour lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.8} color="#FFFFFF" />
      <pointLight position={[-4, 3, 2]} intensity={2.5} color="#FF6B35" />
      <pointLight position={[4, -2, 1]} intensity={2} color="#0066FF" />
      <pointLight position={[0, 5, -2]} intensity={1.5} color="#D4AF37" />
      <pointLight position={[-3, -3, 3]} intensity={1.8} color="#FF3B77" />
      <pointLight position={[3, 2, -3]} intensity={1.5} color="#00CC88" />

      {/* Background particle cloud */}
      <DataParticles />

      {/* Central laptop — the hero piece */}
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.5}>
        <Laptop position={[0, 0.1, 0]} />
      </Float>

      {/* Ring light — creator studio feel */}
      <RingLight position={[-2.4, 0.6, -0.5]} />
      <RingLight position={[2.6, -0.3, -1]} />

      {/* Floating phones with social content */}
      <PhoneDevice position={[-3.0, 0.2, 0.8]} rotation={[0, 0.4, 0.1]} scale={0.9} color="#FF3B77" />
      <PhoneDevice position={[3.1, -0.1, 0.6]} rotation={[0, -0.5, -0.08]} scale={0.85} color="#0066FF" />
      <PhoneDevice position={[1.4, 1.4, -0.8]} rotation={[0.15, -0.3, 0.05]} scale={0.7} color="#D4AF37" />
      <PhoneDevice position={[-1.6, -1.3, 0.4]} rotation={[-0.1, 0.5, 0.06]} scale={0.75} color="#FF6B35" />

      {/* Mic orb — audio creator */}
      <Float speed={1.4} floatIntensity={0.6}>
        <MicOrb position={[-0.8, 1.8, 0.2]} />
      </Float>
      <Float speed={1.0} floatIntensity={0.4}>
        <MicOrb position={[1.8, -1.5, 0.5]} />
      </Float>

      {/* Notification bubbles — engagement metrics */}
      <NotificationBubble position={[-1.5, 1.6, 1.2]} color="#FF3B77" delay={0} />
      <NotificationBubble position={[2.2, 1.3, 0.8]} color="#FF6B35" delay={1.2} />
      <NotificationBubble position={[-2.8, -0.8, 0.6]} color="#D4AF37" delay={0.6} />
      <NotificationBubble position={[0.5, -1.9, 1.0]} color="#00CC88" delay={1.8} />
      <NotificationBubble position={[3.4, 0.8, -0.2]} color="#0066FF" delay={2.4} />

      {/* Social icon geometrics orbiting the scene */}
      <SocialIcon position={[-3.8, 1.4, -0.3]} shape="oct" color="#FF6B35" delay={0} />
      <SocialIcon position={[3.6, 1.2, 0.1]} shape="icosa" color="#FF3B77" delay={1} />
      <SocialIcon position={[-3.2, -1.6, 0.4]} shape="tetra" color="#D4AF37" delay={2} />
      <SocialIcon position={[3.0, -1.8, -0.2]} shape="box" color="#0066FF" delay={3} />
      <SocialIcon position={[0, 2.5, -1]} shape="oct" color="#00CC88" delay={1.5} />
      <SocialIcon position={[-1.2, -2.4, 0.6]} shape="icosa" color="#FF6B35" delay={2.5} />

      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.35} maxPolarAngle={Math.PI * 0.65} minPolarAngle={Math.PI * 0.35} />
    </Canvas>
  );
}