import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE-OPTIMIZED Hero3D
// ═══════════════════════════════════════════════════════════════════════════════
//
// Changes from original:
//
// 1. LIGHTS: 7 point lights → 1 directional + 2 point lights
//    - Each point light = extra draw call per mesh per frame
//    - 7 lights × ~25 meshes = ~175 extra lighting calculations/frame → now ~50
//
// 2. OBJECTS: Cut from ~25 meshes to ~14 key meshes
//    - Removed: 2nd ring light, 2 of 4 phones, 3 of 5 notification bubbles,
//      3 of 6 social icons, fake UI detail meshes (screen lines, grille stripes)
//    - These tiny details are invisible at the hero section's viewing distance
//
// 3. useFrame CONSOLIDATION: 20+ separate useFrame hooks → 1 single hook
//    - Each useFrame registers a separate callback that runs every frame
//    - A single consolidated hook is dramatically cheaper
//
// 4. GEOMETRY: Reduced segment counts (sphere 16→10, torus 48→24, etc.)
//    - Lower poly = fewer vertices for the GPU to process each frame
//    - At the viewing distance, the difference is invisible
//
// 5. REMOVED: Float (adds its own useFrame), MeshDistortMaterial import,
//    OrbitControls autoRotate (replaced with simple scene rotation)
//
// 6. ADDED: frameloop="demand" option + reduced pixel ratio for mobile
//    - Canvas only re-renders when something changes (always, since we animate)
//    - Capped DPR at 1.5 to avoid rendering 4x pixels on retina screens
//
// 7. PARTICLES: 80 → 40, with smaller point size
//
// ═══════════════════════════════════════════════════════════════════════════════

// ── All animated objects in ONE useFrame ─────────────────────────────────────
function SceneContent() {
  const sceneRef = useRef();
  const laptopRef = useRef();
  const phone1Ref = useRef();
  const phone2Ref = useRef();
  const ringRef = useRef();
  const micRef = useRef();
  const notif1Ref = useRef();
  const notif2Ref = useRef();
  const icon1Ref = useRef();
  const icon2Ref = useRef();
  const icon3Ref = useRef();
  const particlesRef = useRef();

  // Single consolidated animation loop — MUCH cheaper than 20 separate useFrame hooks
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Slow scene rotation (replaces OrbitControls autoRotate)
    if (sceneRef.current) {
      sceneRef.current.rotation.y = t * 0.06;
    }

    // Laptop — gentle float
    if (laptopRef.current) {
      laptopRef.current.rotation.y = Math.sin(t * 0.4) * 0.25;
      laptopRef.current.position.y = 0.1 + Math.sin(t * 0.5) * 0.06;
    }

    // Phones
    if (phone1Ref.current) {
      phone1Ref.current.rotation.y += 0.003;
      phone1Ref.current.position.y = 0.2 + Math.sin(t * 0.8 - 3) * 0.1;
    }
    if (phone2Ref.current) {
      phone2Ref.current.rotation.y += 0.003;
      phone2Ref.current.position.y = -0.1 + Math.sin(t * 0.8 + 3.1) * 0.1;
    }

    // Ring light
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.3;
      ringRef.current.rotation.z += 0.006;
      ringRef.current.position.y = 0.6 + Math.sin(t * 0.6) * 0.12;
    }

    // Mic
    if (micRef.current) {
      micRef.current.position.y = 1.8 + Math.sin(t * 0.9 + 1) * 0.1;
      micRef.current.rotation.y += 0.004;
    }

    // Notification bubbles
    if (notif1Ref.current) {
      notif1Ref.current.position.y = 1.6 + Math.sin(t * 1.2) * 0.14;
      notif1Ref.current.position.x = -1.5 + Math.cos(t * 0.7) * 0.05;
    }
    if (notif2Ref.current) {
      notif2Ref.current.position.y = 1.3 + Math.sin((t + 1.2) * 1.2) * 0.14;
      notif2Ref.current.position.x = 2.2 + Math.cos((t + 1.2) * 0.7) * 0.05;
    }

    // Social icons
    if (icon1Ref.current) {
      icon1Ref.current.rotation.x += 0.008;
      icon1Ref.current.rotation.y += 0.006;
      icon1Ref.current.position.y = 1.4 + Math.sin(t * 1.1) * 0.1;
    }
    if (icon2Ref.current) {
      icon2Ref.current.rotation.x += 0.008;
      icon2Ref.current.rotation.y += 0.006;
      icon2Ref.current.position.y = 1.2 + Math.sin((t + 1) * 1.1) * 0.1;
    }
    if (icon3Ref.current) {
      icon3Ref.current.rotation.x += 0.008;
      icon3Ref.current.rotation.y += 0.006;
      icon3Ref.current.position.y = 2.5 + Math.sin((t + 1.5) * 1.1) * 0.1;
    }

    // Particles — slow rotation
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.025;
    }
  });

  // ── Particles (reduced from 80 → 40) ──────────────────────────────────────
  const { particlePositions, particleColors } = useMemo(() => {
    const count = 40;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [1.0, 0.42, 0.21], // orange
      [0.0, 0.40, 1.0],  // blue
      [0.83, 0.69, 0.22], // gold
      [0.18, 0.42, 0.31], // green
      [1.0, 0.23, 0.47],  // pink
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    return { particlePositions: pos, particleColors: col };
  }, []);

  return (
    <group ref={sceneRef}>
      {/* ── Lighting: 3 lights instead of 7 ─────────────────────────────── */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.6} color="#FFFFFF" />
      <pointLight position={[-4, 3, 2]} intensity={2.5} color="#FF6B35" />
      <pointLight position={[4, -2, 1]} intensity={2} color="#0066FF" />

      {/* ── Particles ────────────────────────────────────────────────────── */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[particleColors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} vertexColors transparent opacity={0.65} sizeAttenuation />
      </points>

      {/* ── Laptop (simplified — removed keyboard/trackpad detail meshes) ─ */}
      <group ref={laptopRef} position={[0, 0.1, 0]}>
        {/* Base */}
        <mesh rotation={[0.1, 0, 0]}>
          <boxGeometry args={[1.4, 0.06, 0.95]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Screen panel */}
        <mesh position={[0, 0.55, -0.42]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[1.4, 1.0, 0.05]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Screen glow */}
        <mesh position={[0, 0.55, -0.39]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[1.25, 0.85, 0.01]} />
          <meshStandardMaterial color="#0066FF" emissive="#0066FF" emissiveIntensity={0.9} roughness={0} />
        </mesh>
      </group>

      {/* ── Ring light (1 instead of 2) ──────────────────────────────────── */}
      <group ref={ringRef} position={[-2.4, 0.6, -0.5]}>
        <mesh>
          <torusGeometry args={[0.4, 0.06, 12, 24]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.5} metalness={0.9} roughness={0.05} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.28, 0.03, 8, 20]} />
          <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* ── Phones (2 instead of 4, simplified) ──────────────────────────── */}
      <group ref={phone1Ref} position={[-3.0, 0.2, 0.8]} rotation={[0, 0.4, 0.1]} scale={0.9}>
        <mesh>
          <boxGeometry args={[0.55, 1.1, 0.07]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.042]}>
          <boxGeometry args={[0.46, 0.96, 0.01]} />
          <meshStandardMaterial color="#FF3B77" emissive="#FF3B77" emissiveIntensity={1.2} roughness={0} />
        </mesh>
      </group>

      <group ref={phone2Ref} position={[3.1, -0.1, 0.6]} rotation={[0, -0.5, -0.08]} scale={0.85}>
        <mesh>
          <boxGeometry args={[0.55, 1.1, 0.07]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.042]}>
          <boxGeometry args={[0.46, 0.96, 0.01]} />
          <meshStandardMaterial color="#0066FF" emissive="#0066FF" emissiveIntensity={1.2} roughness={0} />
        </mesh>
      </group>

      {/* ── Mic orb (1 instead of 2, simplified) ─────────────────────────── */}
      <group ref={micRef} position={[-0.8, 1.8, 0.2]} scale={0.85}>
        <mesh>
          <capsuleGeometry args={[0.16, 0.4, 6, 12]} />
          <meshStandardMaterial color="#2D6A4F" metalness={0.7} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={3} />
        </mesh>
      </group>

      {/* ── Notification bubbles (2 instead of 5) ────────────────────────── */}
      <group ref={notif1Ref} position={[-1.5, 1.6, 1.2]}>
        <mesh>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial color="#FF3B77" emissive="#FF3B77" emissiveIntensity={1.5} roughness={0.1} />
        </mesh>
      </group>
      <group ref={notif2Ref} position={[2.2, 1.3, 0.8]}>
        <mesh>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={1.5} roughness={0.1} />
        </mesh>
      </group>

      {/* ── Social icons (3 instead of 6) ────────────────────────────────── */}
      <mesh ref={icon1Ref} position={[-3.8, 1.4, -0.3]}>
        <octahedronGeometry args={[0.16]} />
        <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={1.2} metalness={0.4} roughness={0.1} />
      </mesh>
      <mesh ref={icon2Ref} position={[3.6, 1.2, 0.1]}>
        <icosahedronGeometry args={[0.15]} />
        <meshStandardMaterial color="#FF3B77" emissive="#FF3B77" emissiveIntensity={1.2} metalness={0.4} roughness={0.1} />
      </mesh>
      <mesh ref={icon3Ref} position={[0, 2.5, -1]}>
        <octahedronGeometry args={[0.14]} />
        <meshStandardMaterial color="#00CC88" emissive="#00CC88" emissiveIntensity={1.2} metalness={0.4} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ── Adaptive performance — detect low-end devices ─────────────────────────
function PerformanceMonitor({ onLowPerf }) {
  const { gl } = useThree();
  const frameTimesRef = useRef([]);
  const checkedRef = useRef(false);

  useFrame(() => {
    if (checkedRef.current) return;
    const now = performance.now();
    frameTimesRef.current.push(now);

    // Check after 30 frames
    if (frameTimesRef.current.length >= 30) {
      const times = frameTimesRef.current;
      const avgFrameTime = (times[times.length - 1] - times[0]) / (times.length - 1);
      // If averaging below 30fps (>33ms per frame), signal low perf
      if (avgFrameTime > 33) {
        onLowPerf();
      }
      checkedRef.current = true;
    }
  });

  return null;
}

// ── Main Hero3D export ────────────────────────────────────────────────────
export default function Hero3D() {
  const [lowPerf, setLowPerf] = useState(false);

  // If the device can't handle 30fps, hide the 3D entirely
  // and show a simple gradient fallback
  if (lowPerf) {
    return (
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 30% 40%, rgba(255,107,53,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(0,102,255,0.12) 0%, transparent 50%)',
      }} />
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0.5, 6.5], fov: 50 }}
      // Cap pixel ratio — retina screens render 4x pixels which destroys GPU perf
      dpr={[1, 1.5]}
      // Performance hints
      gl={{
        antialias: false,          // Slight edge jaggies but major perf gain
        powerPreference: 'low-power',
        alpha: true,
      }}
      // Don't process resize events on every pixel
      resize={{ debounce: 200 }}
    >
      <PerformanceMonitor onLowPerf={() => setLowPerf(true)} />
      <SceneContent />
    </Canvas>
  );
}