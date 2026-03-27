import React, { useRef, useEffect, useState } from 'react';
import Hero3D from './Hero3D';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion';
import { 
  ChevronRight, 
  ExternalLink, 
  MapPin,
  Sparkles,
  Zap,
  Heart,
  Play
} from 'lucide-react';

// ─── African Adinkra SVG pattern (Sankofa + Kente geometry) ──────────────────
const AdinkraPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity: 0.04 }}
  >
    <defs>
      <pattern id="adinkra" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        {/* Kente strip motif */}
        <rect x="0" y="0" width="80" height="80" fill="none" />
        <rect x="10" y="10" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1" />
        <rect x="20" y="20" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="40" cy="40" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="10" y1="10" x2="70" y2="70" stroke="currentColor" strokeWidth="0.5" />
        <line x1="70" y1="10" x2="10" y2="70" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="10" cy="10" r="2" fill="currentColor" />
        <circle cx="70" cy="10" r="2" fill="currentColor" />
        <circle cx="10" cy="70" r="2" fill="currentColor" />
        <circle cx="70" cy="70" r="2" fill="currentColor" />
        <circle cx="40" cy="10" r="1.5" fill="currentColor" />
        <circle cx="40" cy="70" r="1.5" fill="currentColor" />
        <circle cx="10" cy="40" r="1.5" fill="currentColor" />
        <circle cx="70" cy="40" r="1.5" fill="currentColor" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#adinkra)" />
  </svg>
);

// ─── Pulsing tribal ring ornament ────────────────────────────────────────────
const TribalRing = ({ size = 400, color = '#f59e0b', delay = 0, style = {} }) => (
  <motion.div
    animate={{
      scale: [1, 1.15, 1],
      opacity: [0.15, 0.35, 0.15],
      rotate: [0, 60, 0],
    }}
    transition={{ duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: `2px solid ${color}`,
      position: 'absolute',
      ...style,
    }}
  />
);

// ─── Magnetic button hook ─────────────────────────────────────────────────────
function useMagnetic(strength = 0.3) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, sx, sy, handleMove, handleLeave };
}

// ─── Magnetic CTA Button ──────────────────────────────────────────────────────
function MagneticButton({ children, onClick, variant = 'dark', className = '' }) {
  const { ref, sx, sy, handleMove, handleLeave } = useMagnetic(0.25);

  const base = `relative px-10 py-5 rounded-full font-black text-lg cursor-pointer overflow-hidden transition-all duration-500 `;
  const dark = `bg-gray-950 text-white border border-gray-800 `;
  const glass = `bg-white/10 text-white border border-white/30 backdrop-blur-xl `;

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={base + (variant === 'dark' ? dark : glass) + className}
    >
      {/* Glow layer */}
      <motion.span
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background:
            variant === 'dark'
              ? 'radial-gradient(circle at center, rgba(245,158,11,0.25) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
      <span className="relative z-10 flex items-center gap-3">{children}</span>
    </motion.button>
  );
}

// ─── Stagger container ────────────────────────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 60, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 60, damping: 18 },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8 } },
};

// ─── Scroll-triggered section wrapper ────────────────────────────────────────
function RevealSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      variants={staggerContainer}
      className={className}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </motion.div>
  );
}

// ─── Featured Project Card ────────────────────────────────────────────────────
function FeaturedCard({ project, index, onClick }) {
  const isHero = index === 0;
  const isTall = index === 1;

  return (
    <motion.div
      variants={slideUp}
      onClick={() => onClick(project)}
      className={`group relative cursor-pointer rounded-[2rem] overflow-hidden bg-gray-900 shadow-xl
        ${isHero ? 'md:col-span-7 row-span-2' : isTall ? 'md:col-span-5' : 'md:col-span-5'}
      `}
      style={{ minHeight: isHero ? 560 : 360 }}
    >
      {/* Image */}
      <motion.img
        src={project.image}
        alt={project.title}
        className="absolute inset-0 w-full h-full object-cover"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* African diamond pattern on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(245,158,11,0.06) 0px,
            rgba(245,158,11,0.06) 1px,
            transparent 1px,
            transparent 14px
          )`,
        }}
      />

      {/* Category badge */}
      <div className="absolute top-6 left-6">
        <span className="inline-flex items-center gap-1.5 bg-amber-400/90 backdrop-blur text-black text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">
          {project.category === 'Video' && <Play size={10} fill="currentColor" />}
          {project.category}
        </span>
      </div>

      {/* Heart count */}
      <div className="absolute top-6 right-6 flex items-center gap-1.5 text-white/80 text-sm font-bold bg-black/30 backdrop-blur-md px-3 py-2 rounded-full">
        <Heart size={14} fill="currentColor" className="text-pink-400" />
        {project.likes}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <motion.div
          initial={{ y: 12, opacity: 0.7 }}
          whileHover={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-amber-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
            {project.program}
          </p>
          <h3 className={`text-white font-black leading-tight mb-3 ${isHero ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'}`}>
            {project.title}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-white/70 text-base">{project.creator}</p>
            <div className="flex items-center gap-1.5 text-white/60 text-sm">
              <MapPin size={14} />
              {project.city}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Kente stripe divider ────────────────────────────────────────────────────
const KenteDivider = () => (
  <div className="w-full h-3 flex overflow-hidden">
    {['#D4AF37', '#2D6A4F', '#D62828', '#F9A12E', '#1B4332', '#E63946', '#D4AF37', '#2D6A4F'].map(
      (c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
      )
    )}
  </div>
);

// ─── Animated counter ────────────────────────────────────────────────────────
function AnimCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseInt(target.replace(/\D/g, ''), 10);
    const duration = 1800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ HOME VIEW — Main export
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomeView({ navigate, projects = [] }) {
  const featuredProjects = (projects || []).filter((p) => p.featured).slice(0, 3);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div
      className="relative text-gray-900"
      style={{ fontFamily: "'Syne', 'Space Grotesk', system-ui, sans-serif" }}
    >
      {/* Load Syne typeface */}
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* ══════════════════════════════════════════════════════════════
          FRAME 1 — THE ENTRANCE (Full cinematic hero)
      ══════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0A0704] pt-20"
      >
        {/* Adinkra fabric texture */}
        <div className="absolute inset-0 text-amber-300 z-0">
          <AdinkraPattern />
        </div>

        {/* ── Radial colour splashes ── */}
        {/* Reddish-gold  */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.45, 0.7, 0.45], x: [0, 20, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none z-0"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 65%)', filter: 'blur(80px)' }}
        />
        {/* Deep crimson */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.55, 0.3], y: [0, -30, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute -bottom-40 -right-40 w-[800px] h-[800px] rounded-full pointer-events-none z-0"
          style={{ background: 'radial-gradient(circle, #9B1D20 0%, transparent 60%)', filter: 'blur(90px)' }}
        />
        {/* Forest green */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.45, 0.2], rotate: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
          style={{ background: 'radial-gradient(circle, #1B4332 0%, transparent 65%)', filter: 'blur(70px)' }}
        />

        {/* ── Tribal concentric rings ── */}
        <TribalRing size={600} color="#D4AF37" delay={0} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }} />
        <TribalRing size={800} color="#9B1D20" delay={2} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }} />
        <TribalRing size={1050} color="#2D6A4F" delay={4} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }} />

        {/* ── 3D canvas ── */}
        <div className="absolute inset-0 z-[2] opacity-50 pointer-events-auto mix-blend-luminosity">
          <Hero3D />
        </div>

        {/* ── Hero copy ── */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-[10] max-w-7xl mx-auto px-6 text-center pointer-events-none"
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="pointer-events-auto"
          >
            {/* Festival badge */}
            <motion.div variants={slideUp} className="inline-flex items-center gap-3 mb-10">
              <div
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.3em] border text-amber-300 border-amber-500/40"
                style={{ background: 'rgba(212,175,55,0.08)', backdropFilter: 'blur(16px)' }}
              >
                <Sparkles size={13} className="text-amber-400" />
                Festival 2026 — Now Open
              </div>
            </motion.div>

            {/* Oversized layered headline */}
            <div className="relative mb-4 leading-none">
              {/* Behind text — decorative stroke lettering */}
              <motion.h1
                variants={fadeIn}
                className="absolute inset-0 flex items-center justify-center text-[7rem] md:text-[14rem] font-black tracking-tighter select-none pointer-events-none"
                style={{
                  WebkitTextStroke: '1px rgba(212,175,55,0.12)',
                  color: 'transparent',
                  zIndex: 0,
                  lineHeight: 0.85,
                }}
              >
                AFRICA
              </motion.h1>
              <motion.h1
                variants={slideUp}
                className="relative z-10 text-[7rem] md:text-[14rem] font-black tracking-tighter text-white mix-blend-overlay"
                style={{ lineHeight: 0.85 }}
              >
                AFRICA
              </motion.h1>
            </div>

            <motion.h2
              variants={slideUp}
              className="text-[3.5rem] md:text-[7.5rem] font-black tracking-tighter leading-[0.9] mb-6"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F9A12E 35%, #E63946 65%, #9B1D20 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 60px rgba(212,175,55,0.3))',
              }}
            >
              UNTAPPED
              <br />
              <span className="italic" style={{ fontWeight: 800 }}>TALENT</span>
            </motion.h2>

            <motion.p
              variants={slideUp}
              className="text-white/60 text-xl md:text-2xl font-light max-w-xl mx-auto mb-14 leading-relaxed"
            >
              The premier digital stage for Africa's storytellers, designers & innovators.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={slideUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <MagneticButton onClick={() => navigate('submit')} variant="amber">
                <span
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37, #F9A12E)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Submit Your Work
                </span>
              </MagneticButton>
              <MagneticButton onClick={() => navigate('gallery')} variant="glass">
                Explore Showcase <ChevronRight size={18} />
              </MagneticButton>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom kente stripe */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <KenteDivider />
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-amber-400/40 rounded-full flex items-start justify-center p-1.5">
            <motion.div
              className="w-1.5 h-2.5 bg-amber-400 rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FRAME 2 — THE SHOWCASE (Editorial gallery)
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#F5F0E8] overflow-hidden">
        {/* Top kente */}
        <KenteDivider />

        {/* Subtle warm grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 py-28 relative z-10">
          {/* Section header */}
          <RevealSection className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div variants={slideUp} className="max-w-xl">
              <p className="text-amber-600 font-black text-xs uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <span
                  className="inline-block w-8 h-px"
                  style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }}
                />
                Curator's Selection
              </p>
              <h2
                className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter"
                style={{ color: '#1A0F00' }}
              >
                This Week's
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #9B1D20, #D4AF37)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Gallery
                </span>
              </h2>
            </motion.div>

            <motion.div variants={slideUp}>
              <button
                onClick={() => navigate('gallery')}
                className="group flex items-center gap-3 text-gray-900 font-black text-lg border-b-2 border-gray-900 pb-1 hover:text-amber-700 hover:border-amber-700 transition duration-300"
              >
                Full Exhibition
                <ChevronRight
                  size={20}
                  className="group-hover:translate-x-2 transition-transform"
                />
              </button>
            </motion.div>
          </RevealSection>

          {/* Asymmetric masonry grid */}
          <RevealSection className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {featuredProjects.map((project, index) => (
              <FeaturedCard
                key={project.id}
                project={project}
                index={index}
                onClick={(p) => navigate('project', p)}
              />
            ))}
          </RevealSection>
        </div>

        <KenteDivider />
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FRAME 3 — THE VISION
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0F0702] overflow-hidden py-28">
        {/* Grain texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Gold splash */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 65%)', filter: 'blur(80px)' }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <RevealSection className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left copy */}
            <div className="space-y-8">
              <motion.div variants={slideUp}>
                <span className="inline-flex items-center gap-2 text-amber-400 font-black uppercase tracking-[0.25em] text-xs">
                  <Zap size={14} /> The Vision
                </span>
              </motion.div>

              <motion.h2
                variants={slideUp}
                className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight"
                style={{ color: '#F5F0E8' }}
              >
                Your Creativity.
                <br />
                Our Platform.
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F9A12E 50%, #E63946 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Africa's Future.
                </span>
              </motion.h2>

              <motion.p
                variants={slideUp}
                className="text-lg leading-relaxed font-light max-w-lg"
                style={{ color: 'rgba(245,240,232,0.6)' }}
              >
                We believe talent is equally distributed, but opportunity is not. ALX bridges that gap
                — empowering the next generation of creative leaders with skills, network, and stage.
              </motion.p>

              <motion.button
                variants={slideUp}
                onClick={() => window.open('https://www.alxafrica.com', '_blank')}
                className="inline-flex items-center gap-3 font-black text-lg transition pb-1.5 border-b-2"
                style={{ color: '#D4AF37', borderColor: '#D4AF37' }}
                whileHover={{ color: '#F9A12E', borderColor: '#F9A12E' }}
              >
                Join the ALX Community <ExternalLink size={18} />
              </motion.button>
            </div>

            {/* Right — video card */}
            <motion.div variants={slideUp} className="relative group">
              {/* Decorative rotated bg */}
              <motion.div
                className="absolute inset-0 rounded-[2rem]"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #9B1D20 100%)',
                  transform: 'rotate(3deg) scale(1.04)',
                  opacity: 0.4,
                  zIndex: 0,
                }}
                whileHover={{ transform: 'rotate(1.5deg) scale(1.04)' }}
                transition={{ duration: 0.6 }}
              />
              <div
                className="relative z-10 rounded-[2rem] overflow-hidden border-4 aspect-video bg-black"
                style={{ borderColor: 'rgba(212,175,55,0.3)' }}
              >
                <video
                  src="/alx_vid.mp4"
                  controls
                  className="w-full h-full object-cover"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FRAME 4 — STATS (Kente-accented dark panel)
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0F0702] overflow-hidden pb-28">
        <KenteDivider />

        {/* Pan-African colour strips as vertical pillars */}
        <div className="absolute bottom-0 left-0 right-0 flex h-full pointer-events-none opacity-5">
          {['#D4AF37', '#2D6A4F', '#D62828'].map((c, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ borderRight: i < 2 ? `1px solid ${c}` : 'none' }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 relative z-10">
          <RevealSection className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { value: '1200', suffix: '+', label: 'Creators Showcased', color: '#D4AF37', ramp: 'from-amber-400 to-yellow-300' },
              { value: '35', suffix: '', label: 'Countries Represented', color: '#2D6A4F', ramp: 'from-emerald-400 to-teal-300' },
              { value: '500', suffix: '+', label: 'Industry Internships', color: '#E63946', ramp: 'from-rose-400 to-orange-300' },
            ].map(({ value, suffix, label, ramp }, i) => (
              <motion.div
                key={i}
                variants={slideUp}
                className="relative overflow-hidden rounded-[2rem] p-10 text-center cursor-default group"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(8px)',
                }}
                whileHover={{ background: 'rgba(255,255,255,0.06)' }}
              >
                {/* Glowing radial on hover */}
                <motion.div
                  className="absolute inset-0 rounded-[2rem] pointer-events-none opacity-0 group-hover:opacity-100 transition duration-700"
                  style={{
                    background: `radial-gradient(circle at center, rgba(212,175,55,0.1) 0%, transparent 70%)`,
                  }}
                />

                <div
                  className={`text-6xl md:text-7xl font-black bg-gradient-to-r ${ramp} bg-clip-text text-transparent mb-3`}
                >
                  <AnimCounter target={value} suffix={suffix} />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white/40">{label}</p>
              </motion.div>
            ))}
          </RevealSection>
        </div>
      </section>
    </div>
  );
}