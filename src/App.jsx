import React, { useRef, useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion';
import {
  Upload, Heart, Share2, MapPin, Search, Menu, X, ChevronRight,
  Play, FileText, Image as ImageIcon, Music, ArrowLeft, CheckCircle,
  ExternalLink, Linkedin, Instagram, Globe, Sparkles, Zap, Loader
} from 'lucide-react';


// ─── Lazy-load Hero3D (heaviest component) ────────────────────────────────────
const Hero3D = lazy(() => import('./Hero3D'));



// ─── Colour palette ────────────────────────────────────────────────────────────
const C = {
  orange:  '#FF6B35',
  blue:    '#0066FF',
  gold:    '#D4AF37',
  green:   '#2D6A4F',
  pink:    '#FF3B77',
  teal:    '#00CC88',
  dark:    '#0D0D1A',
  offwhite:'#FAFAF8',
  cream:   '#FFF8F0',
};

// ─── Base URL for assets (works with Vite's base path on GitHub Pages) ────────
const BASE = import.meta.env.BASE_URL;

// ─── Fallback image for broken/missing images ─────────────────────────────────
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800';

// ─── Platform detection from URL ──────────────────────────────────────────────
function detectPlatform(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('linkedin.com')) return 'LinkedIn';
  if (u.includes('instagram.com')) return 'Instagram';
  if (u.includes('x.com') || u.includes('twitter.com')) return 'X';
  if (u.includes('tiktok.com')) return 'TikTok';
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.watch')) return 'Facebook';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('behance.net')) return 'Behance';
  return null;
}

// ─── Convert URLs to embeddable format ────────────────────────────────────────
function getEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // TikTok — use oembed approach via blockquote (handled in component)
  // Instagram, X, LinkedIn, Facebook — use oEmbed or link-out (no reliable free iframe embed)
  return null;
}

// ─── Social embed component ──────────────────────────────────────────────────
// Renders embedded content for supported platforms, or a branded link-out card
function SocialEmbed({ url, title }) {
  const platform = detectPlatform(url);
  const embedUrl = getEmbedUrl(url);

  // YouTube — full iframe embed
  if (embedUrl && platform === 'YouTube') {
    return (
      <iframe src={embedUrl} title={title} className="w-full h-full rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen loading="lazy" />
    );
  }

  // TikTok — iframe embed via their embed endpoint
  if (platform === 'TikTok') {
    // Extract video ID from various TikTok URL formats
    const tiktokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (tiktokMatch) {
      return (
        <iframe src={`https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`}
          title={title} className="w-full h-full rounded-xl" allowFullScreen loading="lazy"
          style={{ border:'none' }} />
      );
    }
  }

  // For Instagram, X, LinkedIn, Facebook — these platforms block iframe embedding.
  // Show a branded "View on Platform" card instead.
  const platformStyles = {
    LinkedIn: { color:'#0A66C2', icon:<Linkedin size={28}/>, label:'LinkedIn' },
    Instagram: { color:'#E1306C', icon:<Instagram size={28}/>, label:'Instagram' },
    X: { color:'#000000', icon:<ExternalLink size={28}/>, label:'X (Twitter)' },
    TikTok: { color:'#000000', icon:<Play size={28}/>, label:'TikTok' },
    Facebook: { color:'#1877F2', icon:<Globe size={28}/>, label:'Facebook' },
    Behance: { color:'#1769FF', icon:<ExternalLink size={28}/>, label:'Behance' },
  };

  const ps = platformStyles[platform] || { color:C.orange, icon:<ExternalLink size={28}/>, label:'External Link' };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8 text-center"
      style={{ background:`linear-gradient(135deg, ${ps.color}10, ${ps.color}05)` }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: ps.color, color: 'white' }}>
        {ps.icon}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] mb-2" style={{ color: ps.color }}>{ps.label}</p>
        <p className="text-sm font-medium mb-6" style={{ color:`${C.dark}60` }}>
          This content is hosted on {ps.label}. Click below to view the original post.
        </p>
      </div>
      <a href={url.startsWith('http') ? url : 'https://' + url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-black text-white shadow-lg transition hover:opacity-90 hover:scale-105"
        style={{ background: ps.color }}>
        View on {ps.label} <ExternalLink size={16}/>
      </a>
    </div>
  );
}

// ─── Google Sheets submission logger ──────────────────────────────────────────
// HOW TO SET UP:
// 1. Open Google Sheets → Extensions → Apps Script
// 2. DELETE the existing code and paste this UPDATED version, then re-deploy:
//
//    function doPost(e) {
//      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//      var data = e.parameter;
//      sheet.appendRow([
//        new Date(),
//        data.firstName || '',
//        data.lastName || '',
//        data.email || '',
//        data.city || '',
//        data.alxStatus || '',
//        data.postLink || '',
//        data.description || '',
//        data.linkedin || '',
//        data.program || '',
//        data.category || '',
//        data.title || '',
//        data.platform || '',
//      ]);
//      return ContentService.createTextOutput(
//        JSON.stringify({ status: 'success' })
//      ).setMimeType(ContentService.MimeType.JSON);
//    }
//
//    function doGet(e) {
//      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//      var data = sheet.getDataRange().getValues();
//      var headers = data[0];
//      var rows = [];
//      for (var i = 1; i < data.length; i++) {
//        var row = {};
//        for (var j = 0; j < headers.length; j++) {
//          row[headers[j]] = data[i][j];
//        }
//        rows.push(row);
//      }
//      return ContentService.createTextOutput(
//        JSON.stringify(rows)
//      ).setMimeType(ContentService.MimeType.JSON);
//    }
//
// 3. Click Deploy → Manage deployments → Edit (pencil icon)
// 4. Set Version to "New version" and click Deploy
// 5. The URL stays the same

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwpbp-UroQ0kjBiBZuEl2JRtuTXhcav5FLeP6jFjJeHWjLRV9Z-p7LV7SNgzThDpj3h/exec';

async function logToGoogleSheets(data) {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('Google Sheets URL not configured — submission not logged');
    return;
  }
  try {
    // Use form-encoded POST — this works reliably with Apps Script + no-cors
    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => formData.append(key, val || ''));
    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData,
    });
  } catch (e) {
    console.warn('Failed to log to Google Sheets:', e.message);
  }
}

// ─── Fetch saved submissions from Google Sheets on page load ──────────────────
const CACHE_KEY = 'alx_showcase_submissions';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

async function fetchSubmissionsFromSheet() {
  if (!GOOGLE_SHEETS_URL) return [];

  // Check cache first
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
  } catch { /* sessionStorage not available — continue to fetch */ }

  try {
    const res = await fetch(GOOGLE_SHEETS_URL);
    if (!res.ok) return [];
    const rows = await res.json();
    const projects = rows.map((row, i) => ({
      id: 'sheet-' + i,
      title: row['Title'] || 'Untitled',
      creator: [row['First Name'], row['Last Name']].filter(Boolean).join(' ') || 'Anonymous',
      email: row['Email'] || '',
      program: row['Program'] || '',
      city: row['Country / City'] || '',
      category: row['Category'] || 'Visual',
      description: row['Description'] || '',
      link: row['Link to Post'] || '',
      image: row['Link to Post'] || FALLBACK_IMG,
      linkedin: row['LinkedIn'] || '',
      alxStatus: row['ALX Status'] || '',
      likes: 0,
      tags: [],
      featured: false,
      createdAt: row['Submission Date'] ? new Date(row['Submission Date']).getTime() : 0,
    })).filter(p => p.title && p.title !== 'Untitled');

    // Save to cache
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: projects, timestamp: Date.now() }));
    } catch { /* storage full or unavailable — no problem */ }

    return projects;
  } catch (e) {
    console.warn('Failed to fetch from Google Sheets:', e.message);
    return [];
  }
}

// ─── Mock data — use hosted URLs as fallbacks for local images ────────────────
const INITIAL_PROJECTS = [
  { id:1, title:"Urban Rhythms: Ghana", creator:"Diana Aidoo.", program:"Content Creation", city:"Accra, Ghana", category:"Video", image:`${BASE}dina.png`, videoUrl:`${BASE}diana.mp4`, linkedin:"https://www.linkedin.com/in/diana-aidoo/", profileImage:`${BASE}dina.png`, description:"Urban Rhythms Ghana is a vibrant visual journey through the streets of Accra, where movement, culture, and sound collide. Captured through the lens of creator Diana Aidoo, the video celebrates Ghana's street dance scene as a powerful form of self-expression, storytelling, and identity.", likes:124, tags:["AfricanDance","Ghana","Culture"], featured:true },
  { id:2, title:"Generative Lagos: 2050", creator:"Tunde M.", program:"AI for Creators", city:"Lagos, Nigeria", category:"Visual", image:`${BASE}Ai.jpeg`, linkedin:"https://www.linkedin.com/", profileImage:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200", description:"A series of AI-generated landscapes imagining Lagos in the year 2050. Created using Midjourney and Stable Diffusion, this project explores the intersection of traditional Yoruba architecture and cyberpunk aesthetics.", likes:215, tags:["AI Art","Midjourney","Futurism"], featured:true },
  { id:3, title:"Savannah Coffee Branding", creator:"Layla H.", program:"Graphic Design", city:"Cairo, Egypt", category:"Visual", image:"https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?auto=format&fit=crop&q=80&w=1600", linkedin:"https://www.linkedin.com/", profileImage:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200", description:"A complete brand identity and packaging design for an artisanal coffee startup. The visual language uses geometric patterns inspired by Egyptian textiles to create a modern yet rooted look.", likes:143, tags:["Branding","Packaging","Typography"], featured:false },
  { id:4, title:"Afro-Futurism 3D Concept", creator:"Kofi A.", program:"3D Animation", city:"Accra, Ghana", category:"Visual", image:`${BASE}3D.jpeg`, linkedin:"https://www.linkedin.com/", description:"Character design and environment modeling for a sci-fi short film set in 2080 Accra. Rendered in Blender using Cycles with custom procedural textures.", likes:210, tags:["Blender","3D","Concept Art"], featured:true },
  { id:5, title:"Sounds of the Savannah", creator:"Zola B.", program:"Audio Engineering", city:"Johannesburg, SA", category:"Audio", image:"https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1600", linkedin:"https://www.linkedin.com/", description:"An immersive audio soundscape recorded across three national parks. Best experienced with noise-cancelling headphones.", likes:45, tags:["Sound Design","Field Recording","Nature"], featured:false }
];

// ─── Image component with fallback ────────────────────────────────────────────
function SafeImage({ src, alt, className, style, ...props }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setImgSrc(FALLBACK_IMG)}
      {...props}
    />
  );
}

// ─── Kente divider ────────────────────────────────────────────────────────────
const KenteDivider = React.memo(() => (
  <div className="w-full h-2 flex overflow-hidden flex-shrink-0">
    {[C.orange, C.green, C.pink, C.gold, C.blue, C.teal, C.orange, C.green].map((c,i) => (
      <div key={i} className="flex-1" style={{ backgroundColor:c }} />
    ))}
  </div>
));

// ─── Adinkra pattern — STATIC SVG, no re-renders ─────────────────────────────
// FIX: Memoize so this never re-renders. The SVG is purely decorative.
const AdinkraPattern = React.memo(() => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{ opacity:0.06 }}>
    <defs>
      <pattern id="adk" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <rect x="10" y="10" width="60" height="60" fill="none" stroke={C.orange} strokeWidth="1"/>
        <rect x="22" y="22" width="36" height="36" fill="none" stroke={C.blue} strokeWidth="0.6"/>
        <circle cx="40" cy="40" r="9" fill="none" stroke={C.gold} strokeWidth="1"/>
        <line x1="10" y1="10" x2="70" y2="70" stroke={C.orange} strokeWidth="0.5"/>
        <line x1="70" y1="10" x2="10" y2="70" stroke={C.orange} strokeWidth="0.5"/>
        {[[10,10],[70,10],[10,70],[70,70]].map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="2.5" fill={C.gold}/>)}
        {[[40,10],[40,70],[10,40],[70,40]].map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="1.5" fill={C.blue}/>)}
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#adk)"/>
  </svg>
));

// ─── Tribal ring — CSS animation instead of Framer Motion ─────────────────────
// FIX: Replace Framer Motion infinite JS animation with pure CSS.
// CSS animations run on the compositor thread and don't cause main-thread jank.
const tribalRingKeyframes = `
@keyframes tribalPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.08; }
  50% { transform: translate(-50%, -50%) scale(1.12) rotate(30deg); opacity: 0.18; }
}
`;

const TribalRing = React.memo(({ size, color, delay=0 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: `1.5px solid ${color}`,
      position: 'absolute',
      pointerEvents: 'none',
      top: '50%',
      left: '50%',
      willChange: 'auto',
      animation: `tribalPulse ${14+delay}s ease-in-out ${delay}s infinite`,
    }}
  />
));

// ─── Colour blob — CSS animation instead of Framer Motion ─────────────────────
// FIX: These were 4-7 separate Framer Motion infinite loops causing constant
// React re-renders + style recalculations. CSS keyframes run on GPU instead.
const blobKeyframes = `
@keyframes scrollBounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(10px); } }
@keyframes scrollDot { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(12px); opacity: 0; } }
`;

// ─── Inject all CSS keyframes once ────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const styleId = 'perf-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = tribalRingKeyframes + blobKeyframes;
    document.head.appendChild(style);
  }
}

// ─── Magnetic button — throttled mousemove ────────────────────────────────────
// FIX: The original fires on every single mousemove pixel. We throttle via rAF.
function useMagnetic(s=0.25) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness:200, damping:20 });
  const sy = useSpring(y, { stiffness:200, damping:20 });
  const rafId = useRef(null);

  const onMove = useCallback((e) => {
    if (rafId.current) return; // skip if a frame is already queued
    rafId.current = requestAnimationFrame(() => {
      if (!ref.current) { rafId.current = null; return; }
      const r = ref.current.getBoundingClientRect();
      x.set((e.clientX - (r.left + r.width / 2)) * s);
      y.set((e.clientY - (r.top + r.height / 2)) * s);
      rafId.current = null;
    });
  }, [s, x, y]);

  const onLeave = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    x.set(0);
    y.set(0);
  }, [x, y]);

  useEffect(() => () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, []);

  return { ref, sx, sy, onMove, onLeave };
}

function MagneticButton({ children, onClick, variant='primary', className='' }) {
  const { ref, sx, sy, onMove, onLeave } = useMagnetic();
  const v = {
    primary: { bg:`linear-gradient(135deg,${C.orange},${C.pink})`, cls:'text-white border-0 shadow-lg', glow:`rgba(255,107,53,0.35)` },
    secondary: { bg:`linear-gradient(135deg,${C.blue},${C.teal})`, cls:'text-white border-0 shadow-lg', glow:`rgba(0,102,255,0.3)` },
    outline: { bg:'transparent', cls:`text-gray-900 border-2`, glow:`rgba(0,0,0,0.08)`, border:`2px solid ${C.dark}` },
  };
  const s = v[variant] || v.primary;
  return (
    <motion.button ref={ref} style={{ x:sx, y:sy, background:s.bg, border:s.border||'none' }}
      onMouseMove={onMove} onMouseLeave={onLeave} whileTap={{ scale:0.95 }} onClick={onClick}
      className={`relative px-10 py-4 rounded-full font-black text-base cursor-pointer overflow-hidden transition-all duration-300 ${s.cls} ${className}`}>
      <motion.span className="absolute inset-0 rounded-full pointer-events-none" initial={{ opacity:0 }} whileHover={{ opacity:1 }}
        style={{ background:`radial-gradient(circle at center,${s.glow} 0%,transparent 70%)` }}/>
      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </motion.button>
  );
}

// ─── Animation variants — lighter springs ─────────────────────────────────────
// FIX: Reduced stagger from 0.12 to 0.08 for faster perceived load
const SC = { hidden:{ opacity:0 }, show:{ opacity:1, transition:{ staggerChildren:0.08, delayChildren:0.04 } } };
const SU = { hidden:{ opacity:0, y:30 }, show:{ opacity:1, y:0, transition:{ type:'spring', stiffness:80, damping:20 } } };
const FI = { hidden:{ opacity:0 }, show:{ opacity:1, transition:{ duration:0.6 } } };

// FIX: Use IntersectionObserver margin to trigger earlier, preventing pop-in
function RevealSection({ children, className='' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:'-40px' });
  return <motion.div ref={ref} initial="hidden" animate={inView?'show':'hidden'} variants={SC} className={className}>{children}</motion.div>;
}

// ─── Featured card — lazy images ──────────────────────────────────────────────
function FeaturedCard({ project, index, onClick }) {
  const isHero = index === 0;
  return (
    <motion.div variants={SU} onClick={() => onClick(project)}
      className={`group relative cursor-pointer rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500 ${isHero?'md:col-span-7':'md:col-span-5'}`}
      style={{ minHeight: isHero?420:280, background:C.dark, contain:'layout style paint' }}>
      {/* FIX: Use CSS transform for hover zoom instead of Framer Motion whileHover on img */}
      <SafeImage src={project.image} alt={project.title}
        className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.06]"/>
      <div className="absolute inset-0" style={{ background:'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }}/>
      {/* Category pill */}
      <div className="absolute top-5 left-5">
        <span className="inline-flex items-center gap-1.5 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg"
          style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})` }}>
          {project.category==='Video'&&<Play size={9} fill="currentColor"/>}{project.category}
        </span>
      </div>
      {/* Likes */}
      <div className="absolute top-5 right-5 flex items-center gap-1.5 text-white text-sm font-bold px-3 py-2 rounded-full"
        style={{ background:'rgba(0,0,0,0.4)' }}>
        {/* FIX: Removed backdrop-blur from small elements — expensive for tiny visual gain */}
        <Heart size={13} fill="currentColor" className="text-pink-400"/>{project.likes}
      </div>
      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] mb-2" style={{ color:C.teal }}>{project.program}</p>
        <h3 className={`text-white font-black leading-tight mb-2 ${isHero?'text-3xl md:text-4xl':'text-xl md:text-2xl'}`}>{project.title}</h3>
        <div className="flex items-center justify-between">
          <p className="text-white/70">{project.creator}</p>
          <div className="flex items-center gap-1.5 text-white/50 text-sm"><MapPin size={12}/>{project.city}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Animated counter — uses rAF instead of setInterval ───────────────────────
// FIX: setInterval(16ms) doesn't align with frames. rAF is smoother.
function AnimCounter({ target, suffix='' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once:true });
  useEffect(() => {
    if (!inView) return;
    const end = parseInt(target.replace(/\D/g,''), 10);
    const duration = 1800; // ms
    let start = null;
    let rafId;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // easeOutCubic for smoother deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState('home');
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch saved submissions from Google Sheets on page load
  useEffect(() => {
    fetchSubmissionsFromSheet().then(sheetProjects => {
      if (sheetProjects.length > 0) {
        // Always build the full list from scratch: sheet submissions + hardcoded projects
        // This prevents duplicates from stale React state
        const initialTitles = new Set(INITIAL_PROJECTS.map(p => p.title.toLowerCase()));
        const newFromSheet = sheetProjects.filter(sp => !initialTitles.has(sp.title.toLowerCase()));
        setProjects([...newFromSheet.reverse(), ...INITIAL_PROJECTS]);
      }
    });
  }, []);

  const nav = useCallback((v, p=null) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setView(v);
    if (p) setSelected(p);
    setMenuOpen(false);
  }, []);

  const handleSubmit = useCallback((np) => {
    setProjects(p => [{ ...np, createdAt: Date.now(), likes: 0, featured: false }, ...p]);
    // Clear cache so next refresh fetches fresh data including this submission
    try { sessionStorage.removeItem(CACHE_KEY); } catch {}
    // Log to Google Sheets in background (non-blocking)
    const nameParts = (np.creator || '').trim().split(/\s+/);
    logToGoogleSheets({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: np.email || '',
      city: np.city || '',
      alxStatus: np.alxStatus || '',
      postLink: np.link || '',
      description: np.description || '',
      linkedin: np.linkedin || '',
      program: np.program || '',
      category: np.category || '',
      title: np.title || '',
      platform: detectPlatform(np.link) || 'Direct Upload',
    });
    nav('gallery');
  }, [nav]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily:"'Syne',system-ui,sans-serif", background:C.offwhite, color:C.dark }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      {/* FIX: Removed backdrop-blur from nav on mobile — huge perf win on low-end devices */}
      <motion.nav initial={{ y:-100 }} animate={{ y:0 }} transition={{ duration:0.5, ease:'easeOut' }}
        className="fixed top-0 w-full z-50 shadow-sm"
        style={{ background:'rgba(250,250,248,0.96)', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => nav('home')}>
              <SafeImage src={`${BASE}alx-logo.png`} alt="ALX" className="h-10 w-auto object-contain"/>
              <span className="font-black text-xl tracking-tight hidden sm:block" style={{ color:C.dark }}>ALX CREATIVE SHOWCASE</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => nav('gallery')} className="text-sm font-black uppercase tracking-wide transition hover:opacity-70" style={{ color:C.dark }}>Gallery</button>
              <MagneticButton onClick={() => nav('submit')} variant="primary">Submit Work</MagneticButton>
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition">
              {menuOpen ? <X size={24}/> : <Menu size={24}/>}
            </button>
          </div>
        </div>
        {menuOpen && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
            className="md:hidden border-t px-4 py-4 space-y-3" style={{ background:'rgba(250,250,248,0.98)', borderColor:'rgba(0,0,0,0.07)' }}>
            <button onClick={() => nav('gallery')} className="block w-full text-left font-black p-3 rounded-xl hover:bg-gray-50 transition text-sm uppercase tracking-wide">Gallery</button>
            <button onClick={() => nav('submit')} className="block w-full text-left font-black p-3 rounded-xl text-white text-sm" style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})` }}>Submit Work</button>
          </motion.div>
        )}
      </motion.nav>

      <main>
        {view === 'home' && <HomeView nav={nav} projects={projects}/>}
        {view === 'gallery' && <GalleryView nav={nav} projects={projects}/>}
        {view === 'submit' && <SubmitView nav={nav} onSubmit={handleSubmit}/>}
        {view === 'project' && <ProjectView nav={nav} project={selected}/>}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ background:C.dark, color:'white' }} className="relative overflow-hidden">
        <KenteDivider/>
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row justify-between gap-12 relative z-10">
          <div className="max-w-sm">
            <SafeImage src={`${BASE}alx-logo.png`} alt="ALX" className="h-10 mb-5 opacity-80"/>
            <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.5)' }}>Unlocking the next generation of African creative talent through innovation, technology, and art.</p>
          </div>
          <div className="flex flex-col md:items-end gap-5">
            <h4 className="font-black text-lg" style={{ color:C.orange }}>Connect</h4>
            <div className="flex gap-3">
              {[
                { href:'https://www.linkedin.com/school/alx-africa/', icon:<Linkedin size={18}/>, hoverBg:'#0A66C2' },
                { href:'https://www.instagram.com/alx_africa/', icon:<Instagram size={18}/>, hoverBg:C.pink },
                { href:'https://www.alxafrica.com', icon:<Globe size={18}/>, hoverBg:C.teal },
              ].map(({ href, icon, hoverBg }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}
                  onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>{icon}</a>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-xs pb-8" style={{ color:'rgba(255,255,255,0.25)' }}>© 2026 ALX Africa. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME VIEW
// ══════════════════════════════════════════════════════════════════════════════
function HomeView({ nav, projects=[] }) {
  const feat = useMemo(() => (projects || []).filter(p => p.featured).slice(0, 3), [projects]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target:heroRef, offset:['start start','end start'] });
  // FIX: Use GPU-friendly transform (translate) not percentage-based
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroO = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  // FIX: Track if hero is visible to pause 3D when scrolled away
  const heroInView = useInView(heroRef, { margin: '200px' });

  return (
    <div>

      {/* FRAME 1 — ENTRANCE */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
        style={{ background:`linear-gradient(160deg, ${C.offwhite} 0%, #FFF5EE 40%, #F0F4FF 100%)` }}>

        <div className="absolute inset-0 z-0"><AdinkraPattern/></div>

        {/* Colour accents — static pre-blurred gradients, no filter:blur, no animation */}
        <div className="absolute -top-20 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none z-0 opacity-25"
          style={{ background:`radial-gradient(circle, ${C.orange} 0%, ${C.orange}40 25%, transparent 65%)` }}/>
        <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full pointer-events-none z-0 opacity-20"
          style={{ background:`radial-gradient(circle, ${C.blue} 0%, ${C.blue}30 25%, transparent 60%)` }}/>
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full pointer-events-none z-0 opacity-15"
          style={{ background:`radial-gradient(circle, ${C.pink} 0%, ${C.pink}30 30%, transparent 65%)` }}/>
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full pointer-events-none z-0 opacity-12"
          style={{ background:`radial-gradient(circle, ${C.teal} 0%, ${C.teal}25 30%, transparent 65%)` }}/>

        {/* CSS-animated tribal rings */}
        <TribalRing size={380} color={C.orange} delay={0}/>
        <TribalRing size={520} color={C.blue} delay={2}/>

        {/* FIX: Hero3D lazy-loaded + only rendered when in viewport */}
        {heroInView && (
          <div className="absolute inset-0 z-[2] opacity-75 pointer-events-auto" style={{ mixBlendMode:'multiply' }}>
            <Suspense fallback={null}>
              <Hero3D/>
            </Suspense>
          </div>
        )}

        {/* Copy — FIX: use transform: translateY instead of percentage for GPU compositing */}
        <motion.div style={{ y:heroY, opacity:heroO, willChange:'transform,opacity' }} className="relative z-[10] w-full max-w-6xl mx-auto px-6 text-center pointer-events-none">
          <motion.div variants={SC} initial="hidden" animate="show" className="pointer-events-auto">

            <motion.div variants={SU} className="inline-flex items-center gap-3 mb-10">
              <div className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-md"
                style={{ background:'white', color:C.orange, border:`1.5px solid ${C.orange}30` }}>
                <Sparkles size={13} style={{ color:C.orange }}/> Festival 2026 — Now Open
              </div>
            </motion.div>

            {/* FIX: Removed duplicate ghost AFRICA heading — it was a full extra paint layer */}
            <motion.h1 variants={SU} className="font-black tracking-tighter text-[3.5rem] sm:text-[5.5rem] md:text-[8rem] leading-[0.85] mb-3"
              style={{ color:C.dark }}>
              AFRICA
            </motion.h1>

            <motion.h2 variants={SU} className="font-black tracking-tighter leading-[0.88] mb-8 text-[2rem] sm:text-[3.2rem] md:text-[4.5rem]"
              style={{ background:`linear-gradient(135deg,${C.orange} 0%,${C.pink} 45%,${C.blue} 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              UNTAPPED<br/><span className="italic" style={{ fontWeight:800 }}>TALENT</span>
            </motion.h2>

            <motion.p variants={SU} className="text-base md:text-xl font-light max-w-xl mx-auto mb-10 leading-relaxed px-4"
              style={{ color:`${C.dark}80` }}>
              The premier digital stage for Africa's storytellers, designers & innovators.
            </motion.p>

            <motion.div variants={SU} className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <MagneticButton onClick={() => nav('submit')} variant="primary">
                Submit Your Work <ChevronRight size={18}/>
              </MagneticButton>
              <MagneticButton onClick={() => nav('gallery')} variant="outline">
                Explore Showcase
              </MagneticButton>
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 z-20"><KenteDivider/></div>

        {/* Scroll indicator — CSS animation */}
        <div className="absolute bottom-7 left-1/2 z-20"
          style={{ animation:'scrollBounce 2s ease-in-out infinite' }}>
          <div className="w-6 h-10 rounded-full flex items-start justify-center p-1.5" style={{ border:`2px solid ${C.orange}60` }}>
            <div className="w-1.5 h-2.5 rounded-full" style={{ background:C.orange, animation:'scrollDot 2s ease-in-out infinite' }}/>
          </div>
        </div>
      </section>

      {/* FRAME 2 — CURATOR'S GALLERY */}
      <section className="relative overflow-hidden" style={{ background:'white' }}>
        <KenteDivider/>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:`radial-gradient(circle,rgba(255,107,53,0.12) 1px,transparent 1px)`, backgroundSize:'32px 32px' }}/>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
          <RevealSection className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6">
            <motion.div variants={SU} className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-0.5 rounded-full" style={{ background:`linear-gradient(90deg,${C.orange},transparent)` }}/>
                <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color:C.orange }}>Curator's Selection</p>
              </div>
              <h2 className="font-black leading-[0.88] tracking-tighter text-4xl md:text-6xl" style={{ color:C.dark }}>
                This Week's<br/>
                <span style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Gallery</span>
              </h2>
            </motion.div>
            <motion.div variants={SU}>
              <button onClick={() => nav('gallery')} className="group flex items-center gap-2 font-black text-lg pb-1 border-b-2 transition duration-300"
                style={{ color:C.dark, borderColor:C.dark }}
                onMouseEnter={e => { e.currentTarget.style.color=C.orange; e.currentTarget.style.borderColor=C.orange; }}
                onMouseLeave={e => { e.currentTarget.style.color=C.dark; e.currentTarget.style.borderColor=C.dark; }}>
                Full Exhibition <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform"/>
              </button>
            </motion.div>
          </RevealSection>

          <RevealSection className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {feat.length > 0
              ? feat.map((p, i) => <FeaturedCard key={p.id} project={p} index={i} onClick={pr => nav('project', pr)}/>)
              : <motion.div variants={SU} className="md:col-span-12 text-center py-24">
                  <p className="text-xl font-light text-gray-400">No featured projects yet.</p>
                  <button onClick={() => nav('submit')} className="mt-6 px-8 py-4 rounded-full font-black text-white shadow-lg" style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})` }}>Be the first to submit</button>
                </motion.div>
            }
          </RevealSection>
        </div>
        <KenteDivider/>
      </section>

      {/* FRAME 3 — THE VISION */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background:`linear-gradient(160deg,#0D0D1A 0%,#101628 100%)` }}>
        {/* FIX: Removed the noise texture SVG data-URI — it was a large inline SVG being parsed + rendered as a background */}

        {/* FIX: Vision blobs use CSS animations */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-20"
          style={{ background:`radial-gradient(circle, ${C.orange} 0%, ${C.orange}30 25%, transparent 65%)` }}/>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none opacity-15"
          style={{ background:`radial-gradient(circle, ${C.blue} 0%, ${C.blue}25 25%, transparent 65%)` }}/>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <RevealSection className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <motion.div variants={SU}><span className="inline-flex items-center gap-2 font-black uppercase tracking-[0.25em] text-xs" style={{ color:C.teal }}><Zap size={14}/>The Vision</span></motion.div>
              <motion.h2 variants={SU} className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.05] tracking-tight text-white">
                Your Creativity.<br/>Our Platform.<br/>
                <span style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Africa's Future.</span>
              </motion.h2>
              <motion.p variants={SU} className="text-lg leading-relaxed font-light max-w-lg" style={{ color:'rgba(255,255,255,0.55)' }}>
                We believe talent is equally distributed, but opportunity is not. ALX bridges that gap — empowering the next generation of creative leaders with skills, network, and stage.
              </motion.p>
              <motion.button variants={SU} onClick={() => window.open('https://www.alxafrica.com','_blank')}
                className="inline-flex items-center gap-3 font-black text-lg transition-all pb-1.5 border-b-2 hover:opacity-75"
                style={{ color:C.orange, borderColor:C.orange }}>
                Join the ALX Community <ExternalLink size={18}/>
              </motion.button>
            </div>
            <motion.div variants={SU} className="relative group order-1 lg:order-2">
              <div className="absolute inset-0 rounded-3xl rotate-3 scale-105 opacity-40 group-hover:rotate-[1.5deg] transition duration-700"
                style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})`, zIndex:0 }}/>
              <div className="relative z-10 rounded-3xl overflow-hidden border-4 aspect-video bg-black" style={{ borderColor:'rgba(255,107,53,0.2)' }}>
                {/* FIX: Added preload="metadata" — don't load entire video until play */}
                <video src={`${BASE}alx_vid.mp4`} controls preload="metadata" className="w-full h-full object-cover">Your browser does not support video.</video>
              </div>
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* FRAME 4 — STATS */}
      <section className="relative overflow-hidden py-16" style={{ background:'white' }}>
        <KenteDivider/>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:`radial-gradient(circle,rgba(0,102,255,0.08) 1px,transparent 1px)`, backgroundSize:'28px 28px' }}/>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 relative z-10">
          <RevealSection className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value:'1200', suffix:'+', label:'Creators Showcased', color:C.orange, bg:`linear-gradient(135deg,${C.orange}15,${C.pink}10)`, border:C.orange },
              { value:'35', suffix:'', label:'Countries Represented', color:C.blue, bg:`linear-gradient(135deg,${C.blue}15,${C.teal}10)`, border:C.blue },
              { value:'500', suffix:'+', label:'Industry Internships', color:C.green, bg:`linear-gradient(135deg,${C.green}15,${C.teal}10)`, border:C.green },
            ].map(({ value, suffix, label, color, bg, border }, i) => (
              <motion.div key={i} variants={SU} className="relative overflow-hidden rounded-3xl p-10 text-center group cursor-default"
                style={{ background:bg, border:`1px solid ${border}20` }}>
                {/* FIX: Removed dynamic boxShadow from whileHover — triggers paint */}
                <div className="text-5xl md:text-6xl font-black mb-3" style={{ color }}><AnimCounter target={value} suffix={suffix}/></div>
                <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color:`${C.dark}60` }}>{label}</p>
              </motion.div>
            ))}
          </RevealSection>
        </div>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GALLERY VIEW
// ══════════════════════════════════════════════════════════════════════════════
function GalleryView({ nav, projects=[] }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const filters = ['All','Video','Visual','Audio','Writing'];

  // FIX: Memoize filtered list to avoid recalculating on every render
  const filtered = useMemo(() =>
    (projects || [])
      .filter(p => filter === 'All' || p.category === filter)
      .filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.creator?.toLowerCase().includes(search.toLowerCase())),
    [projects, filter, search]
  );

  return (
    <div className="min-h-screen" style={{ background:C.offwhite }}>
      <KenteDivider/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-28">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-0.5 rounded-full" style={{ background:`linear-gradient(90deg,${C.orange},transparent)` }}/>
              <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color:C.orange }}>The Showcase</p>
            </div>
            <h1 className="font-black leading-tight tracking-tighter text-4xl md:text-6xl" style={{ color:C.dark }}>Gallery</h1>
            <p className="text-lg font-light mt-2" style={{ color:`${C.dark}60` }}>Groundbreaking work from across the continent.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={17} style={{ color:`${C.dark}40` }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators or titles…"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none transition shadow-sm"
              style={{ background:'white', border:'1px solid rgba(0,0,0,0.1)', color:C.dark }}
              onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-12">
          {filters.map(f => {
            const cnt = f === 'All' ? (projects||[]).length : (projects||[]).filter(p => p.category === f).length;
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="px-5 py-2.5 rounded-full text-sm font-black transition-all duration-300 flex items-center gap-2.5"
                style={active
                  ? { background:`linear-gradient(135deg,${C.orange},${C.pink})`, color:'white', boxShadow:`0 8px 24px ${C.orange}30`, transform:'scale(1.05)' }
                  : { background:'white', color:C.dark, border:'1px solid rgba(0,0,0,0.1)' }
                }>
                {f} <span className="text-xs px-2 py-0.5 rounded-full" style={active ? { background:'rgba(255,255,255,0.25)', color:'white' } : { background:'rgba(0,0,0,0.06)', color:`${C.dark}70` }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* FIX: Reduced stagger delay from 0.06 to 0.03 for snappier appearance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((project, i) => (
            <motion.div key={project.id}
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), type:'spring', stiffness:80, damping:20 }}
              onClick={() => nav('project', project)}
              className="group rounded-3xl overflow-hidden cursor-pointer flex flex-col hover:-translate-y-2 transition-all duration-500"
              style={{ background:'white', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid rgba(0,0,0,0.05)', contain:'layout style' }}>
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                <SafeImage src={project.image} alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"/>
                <div className="absolute top-4 right-4 text-white p-2.5 rounded-full" style={{ background:'rgba(0,0,0,0.35)' }}>
                  {project.category === 'Video' && <Play size={16} fill="currentColor"/>}
                  {project.category === 'Audio' && <Music size={16}/>}
                  {project.category === 'Writing' && <FileText size={16}/>}
                  {project.category === 'Visual' && <ImageIcon size={16}/>}
                </div>
              </div>
              <div className="p-7 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest border px-3 py-1.5 rounded-lg"
                    style={{ color:C.blue, borderColor:`${C.blue}25`, background:`${C.blue}08` }}>{project.program}</span>
                  <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color:`${C.dark}50` }}>
                    <Heart size={14} fill="currentColor" style={{ color:C.pink }}/>{project.likes}
                  </div>
                </div>
                <h3 className="font-black text-2xl mb-1.5 leading-tight transition group-hover:opacity-75" style={{ color:C.dark }}>{project.title}</h3>
                <p className="text-sm font-medium mb-6" style={{ color:`${C.dark}55` }}>{project.creator}</p>
                <div className="mt-auto flex items-center gap-1.5 text-sm font-medium pt-5 border-t" style={{ color:`${C.dark}40`, borderColor:'rgba(0,0,0,0.06)' }}>
                  <MapPin size={13}/>{project.city}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center py-24"><p className="text-xl font-light" style={{ color:`${C.dark}40` }}>No projects found.</p></div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBMIT VIEW
// ══════════════════════════════════════════════════════════════════════════════
function SubmitView({ nav, onSubmit }) {
  const [step, setStep] = useState(1);
  const [fd, setFd] = useState({ title:'', creator:'', email:'', program:'Content Creation', city:'', category:'Visual', description:'', link:'', linkedin:'', alxStatus:'Current Learner' });
  const handleSubmit = (e) => {
    e.preventDefault();
    let linkedinUrl = fd.linkedin.trim();
    if (linkedinUrl && !linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://')) {
      linkedinUrl = 'https://' + linkedinUrl;
    }
    let postLink = fd.link.trim();
    if (postLink && !postLink.startsWith('http') && !postLink.startsWith('blob:')) {
      postLink = 'https://' + postLink;
    }
    onSubmit({...fd, link:postLink, image:postLink||FALLBACK_IMG, linkedin:linkedinUrl, id:Date.now(), likes:0, tags:[]});
  };
  const inp = "w-full bg-white border rounded-2xl px-5 py-4 focus:outline-none text-base font-medium shadow-sm transition";
  const inpStyle = { borderColor:'rgba(0,0,0,0.1)', color:C.dark };
  const detectedPlatform = detectPlatform(fd.link);

  return (
    <div className="min-h-screen" style={{ background:C.offwhite }}>
      <KenteDivider/>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-28">
        <button onClick={() => nav('home')} className="mb-10 flex items-center gap-2 font-bold group px-4 py-2 rounded-full shadow-sm transition w-fit bg-white"
          style={{ color:`${C.dark}60`, border:'1px solid rgba(0,0,0,0.08)' }}>
          <ArrowLeft size={17} className="group-hover:-translate-x-1 transition-transform"/> Back to Home
        </button>

        <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background:'white', border:'1px solid rgba(0,0,0,0.06)' }}>
          <div className="h-1.5">
            <motion.div className="h-full" animate={{ width:step === 1 ? '50%' : '100%' }} transition={{ duration:0.4 }} style={{ background:`linear-gradient(90deg,${C.orange},${C.pink})` }}/>
          </div>
          <div className="relative">
            <div className="p-10 sm:p-12 relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color:C.orange }}>Step {step} of 2</p>
              <h1 className="text-4xl font-black mb-2 tracking-tight" style={{ color:C.dark }}>Submit Your Work</h1>
              <p className="mb-10 text-lg font-light" style={{ color:`${C.dark}55` }}>Share your creativity with the ALX community.</p>

              <form onSubmit={handleSubmit}>
                {step === 1 ? (
                  <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.3 }} className="space-y-7">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Full Name</label>
                        <input required className={inp} style={inpStyle} placeholder="e.g. Jane Doe" value={fd.creator} onChange={e => setFd({...fd, creator:e.target.value})} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                      </div>
                      <div>
                        <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Email</label>
                        <input required type="email" className={inp} style={inpStyle} placeholder="jane@example.com" value={fd.email} onChange={e => setFd({...fd, email:e.target.value})} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Program</label>
                        <select className={inp} style={inpStyle} value={fd.program} onChange={e => setFd({...fd, program:e.target.value})} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}>
                          {['Content Creation','AI For Creators','Graphic Design','Music and Audio Production','Data Science','Cloud Computing'].map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>ALX Status</label>
                        <select className={inp} style={inpStyle} value={fd.alxStatus} onChange={e => setFd({...fd, alxStatus:e.target.value})} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}>
                          {['Current Learner','Alumni','Applicant'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>City & Country</label>
                      <input required className={inp} style={inpStyle} placeholder="e.g. Nairobi, Kenya" value={fd.city} onChange={e => setFd({...fd, city:e.target.value})} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                    </div>
                    <motion.button whileTap={{ scale:0.97 }}
                      type="button" onClick={() => { if (fd.creator && fd.city && fd.email) setStep(2); }}
                      className="w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 shadow-lg"
                      style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})` }}>
                      Next Step <ChevronRight size={20}/>
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.3 }} className="space-y-7">
                    <div>
                      <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Project Title</label>
                      <input required className={inp} style={inpStyle} placeholder="Give your work a catchy title" value={fd.title} onChange={e => setFd({...fd, title:e.target.value})} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                    </div>
                    <div>
                      <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Category</label>
                      <div className="flex flex-wrap gap-3">
                        {['Visual','Video','Audio','Writing'].map(type => (
                          <button key={type} type="button" onClick={() => setFd({...fd, category:type})}
                            className="px-6 py-3 rounded-full text-sm font-black transition-all"
                            style={fd.category === type ? { background:`linear-gradient(135deg,${C.orange},${C.pink})`, color:'white', boxShadow:`0 8px 24px ${C.orange}30` } : { background:'white', color:C.dark, border:'1.5px solid rgba(0,0,0,0.12)' }}>
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Media Link / Upload</label>
                      <div className="border-2 border-dashed rounded-2xl p-10 text-center transition group" style={{ borderColor:'rgba(0,0,0,0.12)', background:'rgba(255,107,53,0.02)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.orange} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'}>
                        <input type="file" id="fu" className="hidden" accept="image/*,video/*" onChange={e => { const f = e.target.files[0]; if (f) setFd({...fd, link:URL.createObjectURL(f)}); }}/>
                        <label htmlFor="fu" className="cursor-pointer block">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition" style={{ background:`${C.orange}12` }}>
                            <Upload size={28} style={{ color:C.orange }}/>
                          </div>
                          <p className="text-base font-bold" style={{ color:C.dark }}>
                            {fd.link?.startsWith('blob:')
                              ? <span className="flex items-center justify-center gap-2" style={{ color:C.teal }}><CheckCircle size={17}/>File Selected</span>
                              : 'Click to browse files'}
                          </p>
                          <p className="text-xs mt-1" style={{ color:`${C.dark}40` }}>Supports JPG, PNG, MP4</p>
                        </label>
                        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor:'rgba(0,0,0,0.08)' }}/></div><div className="relative flex justify-center"><span className="px-4 text-xs uppercase font-black tracking-widest bg-white rounded-full" style={{ color:`${C.dark}40` }}>Or paste social / media URL</span></div></div>
                        <input type="text" placeholder="Paste link from LinkedIn, Instagram, TikTok, X, Facebook, YouTube…"
                          className="w-full border rounded-xl p-3.5 text-sm focus:outline-none bg-white shadow-sm"
                          style={{ borderColor:'rgba(0,0,0,0.1)', color:C.dark }}
                          value={!fd.link?.startsWith('blob:') ? fd.link : ''} onChange={e => setFd({...fd, link:e.target.value})}
                          onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                        {detectedPlatform && (
                          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background:`${C.teal}10`, border:`1px solid ${C.teal}25` }}>
                            <CheckCircle size={14} style={{ color:C.teal }}/>
                            <span className="text-xs font-bold" style={{ color:C.teal }}>Detected: {detectedPlatform}</span>
                            <span className="text-xs" style={{ color:`${C.dark}40` }}>— will display as embedded content or link card</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Description</label>
                      <textarea className={`${inp} h-36 resize-none`} style={inpStyle} placeholder="Tell us the inspiration behind this project…" value={fd.description} onChange={e => setFd({...fd, description:e.target.value})} onFocus={e => e.target.style.borderColor = C.orange} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                    </div>
                    <div>
                      <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>LinkedIn Profile</label>
                      <div className="relative">
                        <Linkedin size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color:`${C.blue}70` }}/>
                        <input className={`${inp} pl-11`} style={inpStyle} placeholder="https://www.linkedin.com/in/your-name" value={fd.linkedin} onChange={e => setFd({...fd, linkedin:e.target.value})} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                      </div>
                      <p className="text-xs mt-1.5 font-medium" style={{ color:`${C.dark}35` }}>So recruiters and collaborators can find you</p>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <motion.button whileTap={{ scale:0.97 }} type="button" onClick={() => setStep(1)}
                        className="flex-1 py-4 rounded-2xl font-black text-base transition"
                        style={{ background:'white', color:C.dark, border:'1.5px solid rgba(0,0,0,0.1)' }}>Back</motion.button>
                      <motion.button whileTap={{ scale:0.97 }} type="submit"
                        className="flex-[2] py-4 rounded-2xl font-black text-white text-base shadow-xl"
                        style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})` }}>Submit Project ✦</motion.button>
                    </div>
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ProjectView({ nav, project }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(project?.likes || 0);
  if (!project) return null;
  const isExt = url => url && (url.includes('http') || url.includes('www'));

  return (
    <div className="min-h-screen" style={{ background:C.offwhite }}>
      <KenteDivider/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <button onClick={() => nav('gallery')} className="mb-10 flex items-center gap-2 font-bold group px-5 py-2.5 rounded-full shadow-sm transition w-fit bg-white"
          style={{ color:`${C.dark}60`, border:'1px solid rgba(0,0,0,0.08)' }}>
          <ArrowLeft size={17} className="group-hover:-translate-x-1 transition-transform"/> Back to Gallery
        </button>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="rounded-3xl overflow-hidden shadow-xl mb-10 bg-gray-950" style={{ border:'1px solid rgba(0,0,0,0.08)' }}>
              <div className="aspect-video relative flex items-center justify-center">
                {(() => {
                  const platform = detectPlatform(project.link || project.videoUrl);
                  const mediaUrl = project.link || project.videoUrl;

                  // Social media link — use embed component
                  if (platform && mediaUrl) {
                    return <SocialEmbed url={mediaUrl} title={project.title}/>;
                  }

                  // Direct video file
                  if (project.category === 'Video' && project.videoUrl) {
                    return isExt(project.videoUrl)
                      ? <iframe src={project.videoUrl} title={project.title} className="w-full h-full" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" loading="lazy"/>
                      : <video src={project.videoUrl} className="w-full h-full" controls preload="metadata"/>;
                  }

                  // Image fallback
                  return (
                    <>
                      <SafeImage src={project.image} alt={project.title} className="w-full h-full object-contain"/>
                      {project.category === 'Audio' && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><div className="w-24 h-24 border rounded-full flex items-center justify-center animate-pulse" style={{ background:`${C.orange}15`, borderColor:`${C.orange}30` }}><Music size={38} style={{ color:C.orange }}/></div></div>}
                    </>
                  );
                })()}
              </div>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight" style={{ color:C.dark }}>{project.title}</h1>
                <div className="flex gap-3 flex-shrink-0">
                  <button className="p-3.5 rounded-full shadow-md transition hover:scale-110" style={{ background:'white', border:'1px solid rgba(0,0,0,0.08)' }}><Share2 size={18} style={{ color:C.dark }}/></button>
                  <button className="p-3.5 rounded-full shadow-md transition hover:scale-110" style={{ background:'white', border:'1px solid rgba(0,0,0,0.08)' }}><ExternalLink size={18} style={{ color:C.dark }}/></button>
                </div>
              </div>
              <div className="rounded-2xl p-7 mb-7 shadow-sm" style={{ background:'white', border:'1px solid rgba(0,0,0,0.05)' }}>
                <p className="leading-relaxed text-lg font-light" style={{ color:`${C.dark}80` }}>{project.description || 'No description provided.'}</p>
              </div>
              {(project.tags || []).length > 0 && <div className="flex flex-wrap gap-2.5">{project.tags.map(t => <span key={t} className="px-4 py-2 bg-white rounded-full text-sm font-bold shadow-sm" style={{ border:'1px solid rgba(0,0,0,0.08)', color:C.dark }}>#{t}</span>)}</div>}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl p-8 shadow-lg" style={{ background:'white', border:'1px solid rgba(0,0,0,0.06)' }}>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6" style={{ color:`${C.dark}40` }}>Created By</h3>
              <div className="flex items-center gap-5 mb-8">
                {project.profileImage
                  ? <SafeImage src={project.profileImage} alt={project.creator} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"/>
                  : <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white border-4 border-white shadow-lg" style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})` }}>{project.creator?.charAt(0)}</div>
                }
                <div>
                  <div className="font-black text-2xl mb-0.5" style={{ color:C.dark }}>{project.creator}</div>
                  <div className="font-black text-sm mb-1" style={{ color:C.orange }}>{project.program}</div>
                  <div className="text-sm flex items-center gap-1.5 font-medium" style={{ color:`${C.dark}50` }}><MapPin size={13}/>{project.city}</div>
                </div>
              </div>
              <a href={(() => {
                  const url = project.linkedin || 'https://www.linkedin.com/';
                  if (!url) return 'https://www.linkedin.com/';
                  if (url.startsWith('http://') || url.startsWith('https://')) return url;
                  return 'https://' + url;
                })()} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center font-black py-3.5 rounded-2xl text-white shadow-lg transition hover:opacity-90"
                style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})` }}>View Profile</a>
            </div>
            <div className="rounded-3xl p-8 shadow-lg" style={{ background:'white', border:'1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color:`${C.dark}40` }}>Engagement</h3>
                <span className="text-xs font-black px-3 py-1.5 rounded-lg" style={{ background:`${C.pink}12`, color:C.pink }}>HOT</span>
              </div>
              <button onClick={() => { setLiked(!liked); setLikes(c => liked ? c-1 : c+1); }}
                className={`w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all border ${liked ? '' : 'hover:opacity-80'}`}
                style={liked ? { background:`${C.pink}10`, borderColor:`${C.pink}30`, color:C.pink } : { background:'white', borderColor:`${C.pink}20`, color:C.pink }}>
                <Heart fill={liked ? 'currentColor' : 'none'} size={22} style={{ transform:liked ? 'scale(1.2)' : 'scale(1)', transition:'transform 0.2s' }}/>{likes}
              </button>
            </div>
            <div className="rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white"
              style={{ background:`linear-gradient(135deg,${C.dark} 0%,#1a1040 100%)` }}>
              <h3 className="font-black text-2xl mb-2 relative z-10">Hire this Talent</h3>
              <p className="text-sm mb-7 relative z-10 leading-relaxed font-light" style={{ color:'rgba(255,255,255,0.55)' }}>Interested in collaborating with {project.creator}?</p>
              <motion.button whileTap={{ scale:0.97 }}
                className="w-full font-black py-3.5 rounded-2xl text-white shadow-xl relative z-10 transition"
                style={{ background:`linear-gradient(135deg,${C.orange},${C.pink})` }}>
                Send Message
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}