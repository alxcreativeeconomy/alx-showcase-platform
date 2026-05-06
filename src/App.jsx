import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import {
  Upload, Heart, Share2, MapPin, Search, Menu, X, ChevronRight,
  Play, FileText, Image as ImageIcon, Music, ArrowLeft, CheckCircle,
  ExternalLink, Linkedin, Instagram, Globe, Sparkles, Zap, Loader,
  Download, ChevronUp, ChevronDown, Shield,
} from 'lucide-react';


// ─── Firebase ────────────────────────────────────────────────────────────────
import { db, auth, storage } from './firebase';
import { collection, addDoc, getDocs, getDoc, query, orderBy, limit, doc, setDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';



// ─── ALX Brand Palette (V2.26 Brand Guidelines) ──────────────────────────────
const C = {
  navy:    '#03134F',  // Deep Navy — dominant, headers, logo
  blue:    '#0452F0',  // Twilight Blue — links, highlights
  purple:  '#5F3DC4',  // Purple — action/CTA colour
  green:   '#02B75E',  // Jungle Green — success, live indicators
  yellow:  '#EAB308',  // Sunflower Yellow — accents, badges
  black:   '#1C1F2A',  // Black — body text
  white:   '#FFFFFF',  // Pure White
  grey:    '#F8F8F8',  // Light grey background
  icyblue: '#C5E5FF',  // Icy Blue — soft backgrounds
  lavender:'#E9DBFF',  // Lavender — soft accent
  palesky: '#EBF6FF',  // Pale Sky — lightest background
  // Aliases for backward compatibility in the codebase
  dark:    '#1C1F2A',
  offwhite:'#F8F8F8',
};

// ─── Admin email whitelist — add your email(s) here ──────────────────────────
// Only these addresses will see the Admin link and be able to access /admin.
// Everyone else sees the normal site — the route simply doesn't exist for them.
const ADMIN_EMAILS = [
  'admin@alxafrica.com',   // ← replace with your real admin email(s)
];

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

  const ps = platformStyles[platform] || { color:C.purple, icon:<ExternalLink size={28}/>, label:'External Link' };

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

// ─── Fetch saved submissions from Firestore ───────────────────────────────────
async function fetchProjectsFromFirestore() {
  try {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(200));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ docId: d.id, id: d.id, ...d.data(), likedBy: d.data().likedBy || [] }));
  } catch (e) {
    console.warn('Firestore fetch failed:', e.message);
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

// ─── Creative Kente Bar — thicker, more vibrant, with geometric notches ──────
const KenteDivider = React.memo(() => (
  <div className="w-full h-3 flex overflow-hidden flex-shrink-0 relative">
    {[C.navy, C.blue, C.purple, C.green, C.yellow, C.blue, C.purple, C.green, C.navy, C.yellow].map((c,i) => (
      <div key={i} className="flex-1 relative" style={{ backgroundColor:c }}>
        {i % 3 === 0 && <div className="absolute inset-0" style={{ background:`repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 6px)` }}/>}
      </div>
    ))}
  </div>
));

// ─── Paint Splash SVG — organic creative energy ──────────────────────────────
const PaintSplash = React.memo(({ color, size=200, style={}, className='' }) => (
  <svg viewBox="0 0 200 200" className={`absolute pointer-events-none ${className}`}
    style={{ width:size, height:size, ...style }} xmlns="http://www.w3.org/2000/svg">
    <path d="M100,20 Q140,10 160,50 Q180,90 150,120 Q170,140 140,170 Q110,190 80,170 Q50,190 30,160 Q10,130 40,100 Q20,70 50,50 Q70,20 100,20Z"
      fill={color} opacity="0.12"/>
    <circle cx="155" cy="35" r="8" fill={color} opacity="0.18"/>
    <circle cx="35" cy="155" r="5" fill={color} opacity="0.15"/>
    <circle cx="170" cy="140" r="4" fill={color} opacity="0.2"/>
  </svg>
));

// ─── Geometric Shapes — floating creative elements ───────────────────────────
const GeoShapes = React.memo(({ className='' }) => (
  <svg viewBox="0 0 800 600" className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} xmlns="http://www.w3.org/2000/svg" style={{ opacity:0.06 }}>
    {/* Scattered X marks (ALX brand motif) */}
    <g stroke={C.navy} strokeWidth="2" fill="none" opacity="0.5">
      <g transform="translate(100,80) rotate(15)"><line x1="-12" y1="-12" x2="12" y2="12"/><line x1="12" y1="-12" x2="-12" y2="12"/></g>
      <g transform="translate(650,120) rotate(-10)"><line x1="-8" y1="-8" x2="8" y2="8"/><line x1="8" y1="-8" x2="-8" y2="8"/></g>
      <g transform="translate(300,450) rotate(25)"><line x1="-10" y1="-10" x2="10" y2="10"/><line x1="10" y1="-10" x2="-10" y2="10"/></g>
      <g transform="translate(720,380) rotate(-20)"><line x1="-6" y1="-6" x2="6" y2="6"/><line x1="6" y1="-6" x2="-6" y2="6"/></g>
    </g>
    {/* Circles and dots */}
    <circle cx="200" cy="200" r="40" fill="none" stroke={C.blue} strokeWidth="1" opacity="0.4"/>
    <circle cx="600" cy="350" r="25" fill="none" stroke={C.purple} strokeWidth="1" opacity="0.3"/>
    <circle cx="500" cy="100" r="3" fill={C.green} opacity="0.6"/>
    <circle cx="150" cy="400" r="3" fill={C.yellow} opacity="0.6"/>
    <circle cx="700" cy="200" r="2" fill={C.purple} opacity="0.5"/>
    {/* Triangles */}
    <polygon points="400,50 420,90 380,90" fill="none" stroke={C.yellow} strokeWidth="1" opacity="0.35"/>
    <polygon points="100,350 120,380 80,380" fill="none" stroke={C.green} strokeWidth="1" opacity="0.3"/>
    {/* Diagonal lines */}
    <line x1="0" y1="500" x2="250" y2="350" stroke={C.blue} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 8"/>
    <line x1="550" y1="0" x2="800" y2="200" stroke={C.purple} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 8"/>
  </svg>
));

// ─── Grain Texture Overlay — adds creative depth ─────────────────────────────
const grainCSS = `
@keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(2deg); } }
`;

// ─── Inject all CSS keyframes once ────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const styleId = 'perf-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = grainCSS;
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
    primary: { bg:`linear-gradient(135deg,${C.purple},${C.blue})`, cls:'text-white border-0 shadow-lg', glow:`rgba(95,61,196,0.35)` },
    secondary: { bg:`linear-gradient(135deg,${C.blue},${C.green})`, cls:'text-white border-0 shadow-lg', glow:`rgba(0,102,255,0.3)` },
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
function FeaturedCard({ project, index, onClick, authUser, onSignInRequest }) {
  const isHero = index === 0;
  const [liked, setLiked] = useState(() => authUser && project?.likedBy?.includes(authUser.uid));
  const [likes, setLikes] = useState(project?.likes || 0);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!authUser) { onSignInRequest('signin'); return; }
    if (!project.docId) return;
    const ref = doc(db, 'projects', project.docId);
    if (liked) {
      setLiked(false); setLikes(c => Math.max(0, c - 1));
      await updateDoc(ref, { likes: increment(-1), likedBy: arrayRemove(authUser.uid) }).catch(() => {});
    } else {
      setLiked(true); setLikes(c => c + 1);
      await updateDoc(ref, { likes: increment(1), likedBy: arrayUnion(authUser.uid) }).catch(() => {});
    }
  };

  return (
    <motion.div variants={SU} onClick={() => onClick(project)}
      className={`group relative cursor-pointer rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500 ${isHero?'md:col-span-7':'md:col-span-5'}`}
      style={{ minHeight: isHero?420:280, background:C.dark, contain:'layout style paint' }}>
      <SafeImage src={project.image} alt={project.title}
        className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.06]"/>
      <div className="absolute inset-0" style={{ background:'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }}/>
      {/* Category pill */}
      <div className="absolute top-5 left-5">
        <span className="inline-flex items-center gap-1.5 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg"
          style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
          {project.category==='Video'&&<Play size={9} fill="currentColor"/>}{project.category}
        </span>
      </div>
      {/* Like button */}
      <button onClick={handleLike}
        className="absolute top-5 right-5 flex items-center gap-1.5 text-white text-sm font-bold px-3 py-2 rounded-full transition hover:scale-110 active:scale-95"
        style={{ background: liked ? 'rgba(59,130,246,0.7)' : 'rgba(0,0,0,0.4)' }}>
        <Heart size={13} fill={liked ? 'currentColor' : 'none'} className="text-blue-300"/>{likes}
      </button>
      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] mb-2" style={{ color:C.green }}>{project.program}</p>
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
  const [authUser, setAuthUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin');
  const isAdmin = ADMIN_EMAILS.includes(authUser?.email);

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setAuthUser);
    return unsub;
  }, []);

  // Fetch submissions from Firestore + Google Sheets on page load
  useEffect(() => {
    Promise.all([fetchProjectsFromFirestore(), fetchSubmissionsFromSheet()]).then(([firestoreProjects, sheetProjects]) => {
      const allRemote = [...firestoreProjects, ...sheetProjects];
      if (allRemote.length === 0) return;
      const initialTitles = new Set(INITIAL_PROJECTS.map(p => p.title.toLowerCase()));
      // Deduplicate by title (Firestore takes priority since it comes first)
      const seen = new Set(initialTitles);
      const newFromRemote = allRemote.filter(p => {
        const key = (p.title || '').toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setProjects([...newFromRemote.reverse(), ...INITIAL_PROJECTS]);
    });
  }, []);

  const nav = useCallback((v, p=null) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setView(v);
    if (p !== null) setSelected(p);
    setMenuOpen(false);
  }, []);

  const openSignIn = useCallback((mode = 'signin') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    nav('home');
  }, [nav]);

  const handleSubmit = useCallback(async (np) => {
    let projectId = String(Date.now());
    // Save to Firestore (primary store for new submissions)
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...np,
        userId: authUser?.uid || null,
        createdAt: Date.now(),
        likes: 0,
      });
      projectId = docRef.id;
    } catch (e) {
      console.warn('Firestore save failed, falling back to local only:', e.message);
    }
    setProjects(p => [{ ...np, id: projectId, createdAt: Date.now(), likes: 0, featured: false }, ...p]);
    try { sessionStorage.removeItem(CACHE_KEY); } catch { /* sessionStorage unavailable */ }
    // Also log to Google Sheets as a backup record
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
      tiktok: np.tiktok || '',
      instagram: np.instagram || '',
      program: np.program || '',
      category: np.category || '',
      title: np.title || '',
      platform: detectPlatform(np.link) || 'Direct Upload',
    });
    nav('profile', { name: np.creator, email: np.email, userId: authUser?.uid || null, program: np.program, city: np.city, alxStatus: np.alxStatus, linkedin: np.linkedin, instagram: np.instagram, tiktok: np.tiktok });
  }, [nav, authUser]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily:"'Poppins',system-ui,sans-serif", background:C.offwhite, color:C.dark }}>

      {showAuthModal && (
        <AuthModal mode={authModalMode} onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)}/>
      )}

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <motion.nav initial={{ y:-100 }} animate={{ y:0 }} transition={{ duration:0.5, ease:'easeOut' }}
        className="fixed top-0 w-full z-50 shadow-sm"
        style={{ background:'rgba(250,250,248,0.96)', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => nav('home')}>
              <SafeImage src={`${BASE}alx-logo.png`} alt="ALX" className="h-10 w-auto object-contain"/>
              <span className="font-black text-xl tracking-tight hidden sm:block" style={{ color:C.dark }}>ALX CREATIVE SHOWCASE</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => nav('gallery')} className="text-sm font-black uppercase tracking-wide transition hover:opacity-70" style={{ color:C.dark }}>Gallery</button>
              {authUser ? (
                <>
                  <button
                    onClick={() => nav('profile', { name: authUser.displayName || authUser.email, email: authUser.email, userId: authUser.uid })}
                    className="text-sm font-black uppercase tracking-wide transition hover:opacity-70" style={{ color:C.dark }}>
                    My Profile
                  </button>
                  {isAdmin && (
                    <button onClick={() => nav('admin')}
                      className="text-sm font-black uppercase tracking-wide transition hover:opacity-70 flex items-center gap-1.5"
                      style={{ color:C.purple }}>
                      <Shield size={14}/> Admin
                    </button>
                  )}
                  <button onClick={handleSignOut} className="text-sm font-bold uppercase tracking-wide transition hover:opacity-70" style={{ color:`${C.dark}55` }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => openSignIn('signin')} className="text-sm font-black uppercase tracking-wide transition hover:opacity-70" style={{ color:C.dark }}>
                  Sign In
                </button>
              )}
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
            {authUser ? (
              <>
                <button onClick={() => { nav('profile', { name: authUser.displayName || authUser.email, email: authUser.email, userId: authUser.uid }); }} className="block w-full text-left font-black p-3 rounded-xl hover:bg-gray-50 transition text-sm uppercase tracking-wide">My Profile</button>
                {isAdmin && (
                  <button onClick={() => nav('admin')} className="block w-full text-left font-black p-3 rounded-xl hover:bg-gray-50 transition text-sm uppercase tracking-wide flex items-center gap-2" style={{ color:C.purple }}>
                    <Shield size={14}/> Admin
                  </button>
                )}
                <button onClick={handleSignOut} className="block w-full text-left font-bold p-3 rounded-xl hover:bg-gray-50 transition text-sm uppercase tracking-wide" style={{ color:`${C.dark}55` }}>Sign Out</button>
              </>
            ) : (
              <button onClick={() => openSignIn('signin')} className="block w-full text-left font-black p-3 rounded-xl hover:bg-gray-50 transition text-sm uppercase tracking-wide">Sign In</button>
            )}
            <button onClick={() => nav('submit')} className="block w-full text-left font-black p-3 rounded-xl text-white text-sm" style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>Submit Work</button>
          </motion.div>
        )}
      </motion.nav>

      <main>
        {view === 'home'    && <HomeView nav={nav} projects={projects} authUser={authUser} onSignInRequest={openSignIn}/>}
        {view === 'gallery' && <GalleryView nav={nav} projects={projects} authUser={authUser} onSignInRequest={openSignIn}/>}
        {view === 'submit'  && <SubmitView key={authUser?.uid || 'guest'} nav={nav} onSubmit={handleSubmit} authUser={authUser} onSignInRequest={openSignIn}/>}
        {view === 'project' && <ProjectView nav={nav} project={selected} authUser={authUser} onSignInRequest={openSignIn}/>}
        {view === 'profile' && <ProfileView nav={nav} projects={projects} creator={selected} authUser={authUser}/>}
        {view === 'admin'   && <AdminView nav={nav} authUser={authUser} isAdmin={isAdmin}/>}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ background:C.navy, color:'white' }} className="relative overflow-hidden">
        <KenteDivider/>
        {/* Creative accent splashes */}
        <PaintSplash color={C.purple} size={200} style={{ bottom:'-5%', right:'5%', transform:'rotate(45deg)' }} className="opacity-20"/>
        <PaintSplash color={C.blue} size={150} style={{ top:'10%', left:'3%', transform:'rotate(-30deg)' }} className="opacity-15"/>
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row justify-between gap-12 relative z-10">
          <div className="max-w-sm">
            <SafeImage src={`${BASE}alx-logo.png`} alt="ALX" className="h-10 mb-5 opacity-80"/>
            <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.5)' }}>Unlocking the next generation of African creative talent through innovation, technology, and art.</p>
          </div>
          <div className="flex flex-col md:items-end gap-5">
            <h4 className="font-black text-lg" style={{ color:C.purple }}>Connect</h4>
            <div className="flex gap-3">
              {[
                { href:'https://www.linkedin.com/school/alx-africa/', icon:<Linkedin size={18}/>, hoverBg:C.blue },
                { href:'https://www.instagram.com/alx_africa/', icon:<Instagram size={18}/>, hoverBg:C.blue },
                { href:'https://www.alxafrica.com', icon:<Globe size={18}/>, hoverBg:C.green },
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
function HomeView({ nav, projects=[], authUser, onSignInRequest }) {
  const feat = useMemo(() => (projects || []).filter(p => p.featured).slice(0, 3), [projects]);

  return (
    <div>

      {/* FRAME 1 — ENTRANCE — Creative Studio Aesthetic */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
        style={{ background:`linear-gradient(160deg, #FFFFFF 0%, ${C.palesky} 50%, ${C.lavender}40 100%)` }}>

        {/* Geometric background shapes */}
        <div className="absolute inset-0 z-0"><GeoShapes/></div>

        {/* Paint splashes — vibrant creative energy */}
        <PaintSplash color={C.purple} size={450} style={{ top:'-5%', left:'-8%' }}/>
        <PaintSplash color={C.blue} size={400} style={{ bottom:'-10%', right:'-5%', transform:'rotate(120deg)' }}/>
        <PaintSplash color={C.green} size={250} style={{ top:'20%', right:'5%', transform:'rotate(-45deg)' }}/>
        <PaintSplash color={C.yellow} size={200} style={{ bottom:'15%', left:'8%', transform:'rotate(60deg)' }}/>

        {/* Diagonal accent stripe — bold creative energy */}
        <div className="absolute top-0 right-0 w-[600px] h-[120px] pointer-events-none z-0 -rotate-12 translate-x-20 -translate-y-6"
          style={{ background:`linear-gradient(90deg, transparent, ${C.purple}08, ${C.blue}06, transparent)` }}/>
        <div className="absolute bottom-20 left-0 w-[500px] h-[80px] pointer-events-none z-0 rotate-6 -translate-x-20"
          style={{ background:`linear-gradient(90deg, transparent, ${C.green}06, ${C.yellow}05, transparent)` }}/>

        {/* Floating creative images — small polaroid-style cards hanging in space */}
        <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden hidden md:block">
          {/* Top left — tilted photo card */}
          <div className="absolute top-[12%] left-[4%] w-[90px] rounded-lg overflow-hidden shadow-xl -rotate-12"
            style={{ background:'white', padding:'4px 4px 16px 4px', animation:'float 6s ease-in-out infinite' }}>
            <img src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=60&w=200" alt="" className="w-full aspect-square object-cover rounded"/>
            <div className="w-6 h-6 rounded-full absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ background:C.yellow }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white"/>
            </div>
          </div>

          {/* Top right — music/audio card */}
          <div className="absolute top-[8%] right-[6%] w-[80px] rounded-lg overflow-hidden shadow-xl rotate-6"
            style={{ background:'white', padding:'4px 4px 16px 4px', animation:'float 7s ease-in-out 1s infinite' }}>
            <img src="https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?auto=format&fit=crop&q=60&w=200" alt="" className="w-full aspect-square object-cover rounded"/>
            <div className="w-6 h-6 rounded-full absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ background:C.green }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white"/>
            </div>
          </div>

          {/* Mid left — design card */}
          <div className="absolute top-[45%] left-[2%] w-[70px] rounded-lg overflow-hidden shadow-lg rotate-[8deg]"
            style={{ background:'white', padding:'4px 4px 14px 4px', animation:'float 8s ease-in-out 2s infinite' }}>
            <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=60&w=200" alt="" className="w-full aspect-square object-cover rounded"/>
            <div className="w-6 h-6 rounded-full absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ background:C.purple }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white"/>
            </div>
          </div>

          {/* Mid right — AI art card */}
          <div className="absolute top-[55%] right-[3%] w-[85px] rounded-lg overflow-hidden shadow-lg -rotate-[5deg]"
            style={{ background:'white', padding:'4px 4px 14px 4px', animation:'float 7.5s ease-in-out 0.5s infinite' }}>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=60&w=200" alt="" className="w-full aspect-square object-cover rounded"/>
            <div className="w-6 h-6 rounded-full absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ background:C.blue }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white"/>
            </div>
          </div>

          {/* Bottom left — video card */}
          <div className="absolute bottom-[15%] left-[10%] w-[75px] rounded-lg overflow-hidden shadow-lg rotate-[15deg]"
            style={{ background:'white', padding:'4px 4px 14px 4px', animation:'float 9s ease-in-out 3s infinite' }}>
            <div className="w-full aspect-square rounded flex items-center justify-center" style={{ background:`linear-gradient(135deg, ${C.navy}, ${C.purple})` }}>
              <Play size={18} className="text-white" fill="white"/>
            </div>
            <div className="w-6 h-6 rounded-full absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ background:C.yellow }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white"/>
            </div>
          </div>

          {/* Bottom right — 3D art card */}
          <div className="absolute bottom-[20%] right-[8%] w-[70px] rounded-lg overflow-hidden shadow-lg -rotate-[10deg]"
            style={{ background:'white', padding:'4px 4px 14px 4px', animation:'float 6.5s ease-in-out 1.5s infinite' }}>
            <div className="w-full aspect-square rounded flex items-center justify-center" style={{ background:`linear-gradient(135deg, ${C.blue}, ${C.green})` }}>
              <Sparkles size={16} className="text-white"/>
            </div>
            <div className="w-6 h-6 rounded-full absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center" style={{ background:C.green }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white"/>
            </div>
          </div>
        </div>

        {/* Hero copy — entrance animation only, no scroll-based transforms */}
        <div className="relative z-[10] w-full max-w-6xl mx-auto px-6 text-center pointer-events-none">
          <motion.div variants={SC} initial="hidden" animate="show" className="pointer-events-auto">

            <motion.div variants={SU} className="inline-flex items-center gap-3 mb-10">
              <div className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-md"
                style={{ background:'white', color:C.purple, border:`1.5px solid ${C.purple}30` }}>
                <Sparkles size={13} style={{ color:C.purple }}/> Showcase Platform 2026
              </div>
            </motion.div>

            {/* FIX: Removed duplicate ghost AFRICA heading — it was a full extra paint layer */}
            <motion.h1 variants={SU} className="font-black tracking-tighter text-[3.5rem] sm:text-[5.5rem] md:text-[8rem] leading-[0.85] mb-3"
              style={{ color:C.dark }}>
              ALX SHOWCASE
            </motion.h1>


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
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20"><KenteDivider/></div>
      </section>

      {/* FRAME 2 — CURATOR'S GALLERY */}
      <section className="relative overflow-hidden" style={{ background:'white' }}>
        <KenteDivider/>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:`radial-gradient(circle,${C.navy}0D 1px,transparent 1px)`, backgroundSize:'32px 32px' }}/>
        {/* Creative corner accents */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none" style={{ background:`linear-gradient(225deg, ${C.purple}08 0%, transparent 60%)` }}/>
        <PaintSplash color={C.blue} size={180} style={{ top:'10%', right:'-3%', transform:'rotate(90deg)' }}/>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
          <RevealSection className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6">
            <motion.div variants={SU} className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-0.5 rounded-full" style={{ background:`linear-gradient(90deg,${C.purple},transparent)` }}/>
                <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color:C.purple }}>Curator's Selection</p>
              </div>
              <h2 className="font-black leading-[0.88] tracking-tighter text-4xl md:text-6xl" style={{ color:C.dark }}>
                This Week's<br/>
                <span style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Gallery</span>
              </h2>
            </motion.div>
            <motion.div variants={SU}>
              <button onClick={() => nav('gallery')} className="group flex items-center gap-2 font-black text-lg pb-1 border-b-2 transition duration-300"
                style={{ color:C.dark, borderColor:C.dark }}
                onMouseEnter={e => { e.currentTarget.style.color=C.purple; e.currentTarget.style.borderColor=C.purple; }}
                onMouseLeave={e => { e.currentTarget.style.color=C.dark; e.currentTarget.style.borderColor=C.dark; }}>
                Full Exhibition <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform"/>
              </button>
            </motion.div>
          </RevealSection>

          <RevealSection className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {feat.length > 0
              ? feat.map((p, i) => <FeaturedCard key={p.id} project={p} index={i} onClick={pr => nav('project', pr)} authUser={authUser} onSignInRequest={onSignInRequest}/>)
              : <motion.div variants={SU} className="md:col-span-12 text-center py-24">
                  <p className="text-xl font-light text-gray-400">No featured projects yet.</p>
                  <button onClick={() => nav('submit')} className="mt-6 px-8 py-4 rounded-full font-black text-white shadow-lg" style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>Be the first to submit</button>
                </motion.div>
            }
          </RevealSection>
        </div>
        <KenteDivider/>
      </section>

      {/* FRAME 3 — THE VISION */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background:`linear-gradient(160deg,${C.navy} 0%,#061A5E 100%)` }}>
        {/* Paint splashes on dark — vibrant pops of colour */}
        <PaintSplash color={C.purple} size={350} style={{ top:'-5%', left:'-5%', transform:'rotate(30deg)' }} className="opacity-30"/>
        <PaintSplash color={C.blue} size={300} style={{ bottom:'-8%', right:'-3%', transform:'rotate(180deg)' }} className="opacity-25"/>
        <PaintSplash color={C.green} size={200} style={{ top:'40%', right:'10%', transform:'rotate(-60deg)' }} className="opacity-20"/>
        {/* Diagonal creative stripe */}
        <div className="absolute top-0 left-0 w-full h-[3px] pointer-events-none"
          style={{ background:`linear-gradient(90deg, ${C.purple}, ${C.blue}, ${C.green}, ${C.yellow})` }}/>
        {/* Scattered geometric dots */}
        <div className="absolute top-[15%] left-[8%] w-3 h-3 rounded-full pointer-events-none" style={{ background:C.green, opacity:0.3 }}/>
        <div className="absolute top-[60%] right-[12%] w-2 h-2 rounded-full pointer-events-none" style={{ background:C.yellow, opacity:0.25 }}/>
        <div className="absolute bottom-[20%] left-[20%] w-2 h-2 pointer-events-none" style={{ background:C.purple, opacity:0.2, transform:'rotate(45deg)' }}/>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <RevealSection className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <motion.div variants={SU}><span className="inline-flex items-center gap-2 font-black uppercase tracking-[0.25em] text-xs" style={{ color:C.green }}><Zap size={14}/>The Vision</span></motion.div>
              <motion.h2 variants={SU} className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.05] tracking-tight text-white">
                Your Creativity.<br/>Our Platform.<br/>
                <span style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Africa's Future.</span>
              </motion.h2>
              <motion.p variants={SU} className="text-lg leading-relaxed font-light max-w-lg" style={{ color:'rgba(255,255,255,0.55)' }}>
                We believe talent is equally distributed, but opportunity is not. ALX bridges that gap — empowering the next generation of creative leaders with skills, network, and stage.
              </motion.p>
              <motion.button variants={SU} onClick={() => window.open('https://www.alxafrica.com','_blank')}
                className="inline-flex items-center gap-3 font-black text-lg transition-all pb-1.5 border-b-2 hover:opacity-75"
                style={{ color:C.purple, borderColor:C.purple }}>
                Join the ALX Community <ExternalLink size={18}/>
              </motion.button>
            </div>
            <motion.div variants={SU} className="relative group order-1 lg:order-2">
              <div className="absolute inset-0 rounded-3xl rotate-3 scale-105 opacity-40 group-hover:rotate-[1.5deg] transition duration-700"
                style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})`, zIndex:0 }}/>
              <div className="relative z-10 rounded-3xl overflow-hidden border-4 aspect-video bg-black" style={{ borderColor:'rgba(95,61,196,0.2)' }}>
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
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:`radial-gradient(circle,${C.blue}0D 1px,transparent 1px)`, backgroundSize:'28px 28px' }}/>
        <PaintSplash color={C.yellow} size={150} style={{ bottom:'5%', left:'2%', transform:'rotate(200deg)' }}/>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 relative z-10">
          <RevealSection className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value:'1200', suffix:'+', label:'Creators Showcased', color:C.purple, bg:`linear-gradient(135deg,${C.purple}15,${C.blue}10)`, border:C.purple },
              { value:'35', suffix:'', label:'Countries Represented', color:C.blue, bg:`linear-gradient(135deg,${C.blue}15,${C.green}10)`, border:C.blue },
              { value:'500', suffix:'+', label:'Industry Internships', color:C.green, bg:`linear-gradient(135deg,${C.green}15,${C.green}10)`, border:C.green },
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
function GalleryLikeBtn({ project, authUser, onSignInRequest }) {
  const [liked, setLiked] = useState(() => !!(authUser && project?.likedBy?.includes(authUser.uid)));
  const [likes, setLikes] = useState(project?.likes || 0);
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!authUser) { onSignInRequest('signin'); return; }
    if (!project.docId) return;
    const ref = doc(db, 'projects', project.docId);
    if (liked) {
      setLiked(false); setLikes(c => Math.max(0, c - 1));
      await updateDoc(ref, { likes: increment(-1), likedBy: arrayRemove(authUser.uid) }).catch(() => {});
    } else {
      setLiked(true); setLikes(c => c + 1);
      await updateDoc(ref, { likes: increment(1), likedBy: arrayUnion(authUser.uid) }).catch(() => {});
    }
  };
  return (
    <button onClick={handleLike}
      className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full transition hover:scale-110 active:scale-95"
      style={liked ? { background:`${C.blue}15`, color:C.blue } : { color:`${C.dark}50` }}
      title={authUser ? (liked ? 'Unlike' : 'Like this project') : 'Sign in to like'}>
      <Heart size={14} fill={liked ? 'currentColor' : 'none'} style={{ color: liked ? C.blue : `${C.dark}50` }}/>{likes}
    </button>
  );
}

function GalleryView({ nav, projects=[], authUser, onSignInRequest }) {
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
              <div className="w-8 h-0.5 rounded-full" style={{ background:`linear-gradient(90deg,${C.purple},transparent)` }}/>
              <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color:C.purple }}>The Showcase</p>
            </div>
            <h1 className="font-black leading-tight tracking-tighter text-4xl md:text-6xl" style={{ color:C.dark }}>Gallery</h1>
            <p className="text-lg font-light mt-2" style={{ color:`${C.dark}60` }}>Groundbreaking work from across the continent.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={17} style={{ color:`${C.dark}40` }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators or titles…"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none transition shadow-sm"
              style={{ background:'white', border:'1px solid rgba(0,0,0,0.1)', color:C.dark }}
              onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
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
                  ? { background:`linear-gradient(135deg,${C.purple},${C.blue})`, color:'white', boxShadow:`0 8px 24px ${C.purple}30`, transform:'scale(1.05)' }
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
                  <GalleryLikeBtn project={project} authUser={authUser} onSignInRequest={onSignInRequest}/>
                </div>
                <h3 className="font-black text-2xl mb-1.5 leading-tight transition group-hover:opacity-75" style={{ color:C.dark }}>{project.title}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); nav('profile', { name: project.creator, email: project.email, userId: project.userId, program: project.program, city: project.city, alxStatus: project.alxStatus, linkedin: project.linkedin, instagram: project.instagram, tiktok: project.tiktok }); }}
                  className="text-sm font-medium mb-6 text-left hover:opacity-60 transition"
                  style={{ color:`${C.dark}55` }}>
                  {project.creator}
                </button>
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
function SubmitView({ nav, onSubmit, authUser, onSignInRequest }) {
  const [fd, setFd] = useState(() => ({
    title:'', creator: authUser?.displayName || '', email: authUser?.email || '',
    program:'Content Creation', city:'', category:'Visual', description:'',
    link:'', image:'', linkedin:'', tiktok:'', instagram:'', alxStatus:'Current Learner',
  }));
  const [uploadProgress, setUploadProgress] = useState(null); // null | 0–100 | 'done' | 'error'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Pre-fill saved profile data from Firestore when signed in
  useEffect(() => {
    if (!authUser) return;
    getDoc(doc(db, 'users', authUser.uid)).then(snap => {
      if (!snap.exists()) return;
      const d = snap.data();
      setFd(prev => ({
        ...prev,
        creator:   authUser.displayName || d.name  || prev.creator,
        program:   d.program   || prev.program,
        city:      d.city      || prev.city,
        alxStatus: d.alxStatus || prev.alxStatus,
        linkedin:  d.linkedin  || prev.linkedin,
        instagram: d.instagram || prev.instagram,
        tiktok:    d.tiktok    || prev.tiktok,
      }));
    }).catch(() => {});
  }, [authUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadProgress(0);
    const fileRef = storageRef(storage, `submissions/${authUser.uid}/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(fileRef, file);
    task.on('state_changed',
      snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      ()   => setUploadProgress('error'),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        const isImage = file.type.startsWith('image/');
        setFd(prev => ({ ...prev, link: url, image: isImage ? url : FALLBACK_IMG }));
        setUploadProgress('done');
      }
    );
  };

  // Gate: must be signed in to see the form
  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background:C.offwhite }}>
        <div className="max-w-md w-full text-center mt-20">
          <div className="rounded-3xl shadow-xl p-12" style={{ background:'white', border:'1px solid rgba(0,0,0,0.06)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background:`linear-gradient(135deg,${C.purple}20,${C.blue}20)` }}>
              <Upload size={32} style={{ color:C.purple }}/>
            </div>
            <h2 className="text-3xl font-black mb-3 tracking-tight" style={{ color:C.dark }}>Submit Your Work</h2>
            <p className="mb-8 text-base font-light leading-relaxed" style={{ color:`${C.dark}55` }}>
              Create a free account to submit your work and build your public creator profile.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => onSignInRequest('signup')}
                className="w-full py-4 rounded-2xl font-black text-white shadow-lg transition hover:opacity-90"
                style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
                Create Free Account
              </button>
              <button onClick={() => onSignInRequest('signin')}
                className="w-full py-4 rounded-2xl font-black transition"
                style={{ color:C.dark, border:'1.5px solid rgba(0,0,0,0.1)' }}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    let linkedinUrl = fd.linkedin.trim();
    if (linkedinUrl && !linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://')) {
      linkedinUrl = 'https://' + linkedinUrl;
    }
    let postLink = fd.link.trim();
    if (postLink && !postLink.startsWith('http')) postLink = 'https://' + postLink;
    const image = fd.image || FALLBACK_IMG;
    onSubmit({ ...fd, link:postLink, image, linkedin:linkedinUrl, tiktok:fd.tiktok.trim(), instagram:fd.instagram.trim(), id:Date.now(), likes:0, tags:[], comments:[] });
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
          <div className="h-1.5" style={{ background:`linear-gradient(90deg,${C.purple},${C.blue})` }}/>

          <div className="p-10 sm:p-12">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] mb-1" style={{ color:C.purple }}>Quick Upload</p>
                <h1 className="text-4xl font-black tracking-tight" style={{ color:C.dark }}>Add New Work</h1>
              </div>
              {/* Profile avatar pill — links to their profile */}
              <button
                onClick={() => nav('profile', { name: authUser.displayName || authUser.email, email: authUser.email, userId: authUser.uid })}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition hover:opacity-80 shrink-0 mt-1"
                style={{ background:`${C.purple}08`, border:`1px solid ${C.purple}15` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
                  {(authUser.displayName || authUser.email)?.charAt(0)?.toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black leading-tight truncate max-w-[120px]" style={{ color:C.dark }}>
                    {authUser.displayName || authUser.email}
                  </p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color:`${C.dark}45` }}>My Profile</p>
                </div>
              </button>
            </div>
            <p className="mb-10 text-base font-light" style={{ color:`${C.dark}55` }}>Share your latest creative work with the community.</p>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Title */}
              <div>
                <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Project Title</label>
                <input required className={inp} style={inpStyle} placeholder="Give your work a catchy title"
                  value={fd.title} onChange={e => setFd({...fd, title:e.target.value})}
                  onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Category</label>
                <div className="flex flex-wrap gap-3">
                  {['Visual','Video','Audio','Writing'].map(type => (
                    <button key={type} type="button" onClick={() => setFd({...fd, category:type})}
                      className="px-6 py-3 rounded-full text-sm font-black transition-all"
                      style={fd.category === type
                        ? { background:`linear-gradient(135deg,${C.purple},${C.blue})`, color:'white', boxShadow:`0 8px 24px ${C.purple}30` }
                        : { background:'white', color:C.dark, border:'1.5px solid rgba(0,0,0,0.12)' }}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media upload */}
              <div>
                <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Media / File Upload</label>
                <div className="border-2 border-dashed rounded-2xl p-8 text-center transition group"
                  style={{ borderColor: uploadProgress === 'done' ? C.green : 'rgba(0,0,0,0.12)', background:'rgba(95,61,196,0.02)' }}
                  onMouseEnter={e => { if (uploadProgress !== 'done') e.currentTarget.style.borderColor = C.purple; }}
                  onMouseLeave={e => { if (uploadProgress !== 'done') e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}>
                  <input type="file" id="fu" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx" onChange={handleFileChange}/>
                  <label htmlFor="fu" className="cursor-pointer block">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition"
                      style={{ background: uploadProgress === 'done' ? `${C.green}15` : `${C.purple}12` }}>
                      {uploadProgress === 'done'
                        ? <CheckCircle size={28} style={{ color:C.green }}/>
                        : uploadProgress === 'error'
                        ? <X size={28} style={{ color:'#EF4444' }}/>
                        : <Upload size={28} style={{ color:C.purple }}/>}
                    </div>
                    {uploadProgress === null && (
                      <>
                        <p className="text-base font-bold" style={{ color:C.dark }}>Click to browse files</p>
                        <p className="text-xs mt-1" style={{ color:`${C.dark}40` }}>Images · Video · Audio · PDF · Word · PowerPoint</p>
                      </>
                    )}
                    {typeof uploadProgress === 'number' && (
                      <div className="mt-2">
                        <p className="text-sm font-bold mb-2 truncate" style={{ color:C.dark }}>{uploadedFileName}</p>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background:'rgba(0,0,0,0.08)' }}>
                          <div className="h-full rounded-full transition-all duration-300" style={{ width:`${uploadProgress}%`, background:`linear-gradient(90deg,${C.purple},${C.blue})` }}/>
                        </div>
                        <p className="text-xs mt-1.5 font-bold" style={{ color:C.purple }}>{uploadProgress}% uploaded…</p>
                      </div>
                    )}
                    {uploadProgress === 'done' && (
                      <div className="mt-1">
                        <p className="text-sm font-bold" style={{ color:C.green }}>Upload complete!</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color:`${C.dark}50` }}>{uploadedFileName}</p>
                        <p className="text-xs mt-1 underline" style={{ color:C.purple }}>Click to replace file</p>
                      </div>
                    )}
                    {uploadProgress === 'error' && (
                      <div className="mt-1">
                        <p className="text-sm font-bold" style={{ color:'#EF4444' }}>Upload failed</p>
                        <p className="text-xs mt-0.5" style={{ color:`${C.dark}50` }}>Check your connection and try again</p>
                        <p className="text-xs mt-1 underline" style={{ color:C.purple }}>Click to retry</p>
                      </div>
                    )}
                  </label>
                </div>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor:'rgba(0,0,0,0.08)' }}/></div>
                  <div className="relative flex justify-center"><span className="px-4 text-xs uppercase font-black tracking-widest bg-white rounded-full" style={{ color:`${C.dark}40` }}>Or paste a link instead</span></div>
                </div>
                <input type="text" placeholder="LinkedIn, Instagram, TikTok, YouTube, SoundCloud, Google Drive…"
                  className="w-full border rounded-xl p-3.5 text-sm focus:outline-none bg-white shadow-sm"
                  style={{ borderColor:'rgba(0,0,0,0.1)', color:C.dark }}
                  value={uploadProgress === 'done' ? '' : fd.link} onChange={e => setFd({...fd, link:e.target.value})}
                  onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                {detectedPlatform && uploadProgress !== 'done' && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background:`${C.green}10`, border:`1px solid ${C.green}25` }}>
                    <CheckCircle size={14} style={{ color:C.green }}/>
                    <span className="text-xs font-bold" style={{ color:C.green }}>Detected: {detectedPlatform}</span>
                    <span className="text-xs" style={{ color:`${C.dark}40` }}>— will display as embedded content or link card</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>
                  Description <span className="font-medium normal-case tracking-normal" style={{ color:`${C.dark}40` }}>(optional)</span>
                </label>
                <textarea className={`${inp} h-32 resize-none`} style={inpStyle}
                  placeholder="Tell us the inspiration behind this project…"
                  value={fd.description} onChange={e => setFd({...fd, description:e.target.value})}
                  onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
              </div>

              {/* Collapsible profile details */}
              <div className="rounded-2xl overflow-hidden" style={{ border:'1.5px solid rgba(0,0,0,0.08)' }}>
                <button type="button" onClick={() => setShowDetails(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 transition hover:bg-gray-50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Profile Details</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wide"
                      style={{ background:`${C.blue}12`, color:C.blue }}>Optional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(fd.program || fd.city) && (
                      <span className="text-xs font-medium hidden sm:block truncate max-w-[160px]" style={{ color:`${C.dark}40` }}>
                        {[fd.program, fd.city].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    {showDetails ? <ChevronUp size={16} style={{ color:`${C.dark}40` }}/> : <ChevronDown size={16} style={{ color:`${C.dark}40` }}/>}
                  </div>
                </button>
                {showDetails && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.2 }}
                    className="px-5 pb-6 space-y-5 border-t" style={{ borderColor:'rgba(0,0,0,0.06)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5">
                      <div>
                        <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Program</label>
                        <select className={inp} style={inpStyle} value={fd.program} onChange={e => setFd({...fd, program:e.target.value})}
                          onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}>
                          {['Front End','Back End','Front-End ProDev','Back-End ProDev','Data Analytics','Data Science','Data Engineering','AWS Cloud Practitioner','AWS Solutions Architect','SalesForce Associate','SalesForce Administrator','Cybersecurity','AI for Creatives','Graphic Design','Content Creation','Audio Production'].map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>ALX Status</label>
                        <select className={inp} style={inpStyle} value={fd.alxStatus} onChange={e => setFd({...fd, alxStatus:e.target.value})}
                          onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}>
                          {['Current Learner','Alumni','Applicant'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>City & Country</label>
                      <input className={inp} style={inpStyle} placeholder="e.g. Nairobi, Kenya"
                        value={fd.city} onChange={e => setFd({...fd, city:e.target.value})}
                        onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                    </div>
                    <div>
                      <label className="block text-xs font-black mb-2.5 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>
                        Social Profiles <span className="font-medium normal-case tracking-normal" style={{ color:`${C.dark}40` }}>(optional)</span>
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <Linkedin size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color:`${C.blue}70` }}/>
                          <input className={`${inp} pl-11`} style={inpStyle} placeholder="linkedin.com/in/your-name"
                            value={fd.linkedin} onChange={e => setFd({...fd, linkedin:e.target.value})}
                            onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                        </div>
                        <div className="relative">
                          <Instagram size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color:`${C.purple}70` }}/>
                          <input className={`${inp} pl-11`} style={inpStyle} placeholder="instagram.com/your-handle"
                            value={fd.instagram} onChange={e => setFd({...fd, instagram:e.target.value})}
                            onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                        </div>
                        <div className="relative">
                          <Play size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color:`${C.dark}50` }}/>
                          <input className={`${inp} pl-11`} style={inpStyle} placeholder="tiktok.com/@your-handle"
                            value={fd.tiktok} onChange={e => setFd({...fd, tiktok:e.target.value})}
                            onFocus={e => e.target.style.borderColor = C.dark} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                        </div>
                      </div>
                      <p className="text-xs mt-1.5 font-medium" style={{ color:`${C.dark}35` }}>Help recruiters and collaborators find you</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Submit */}
              <motion.button whileTap={{ scale:0.97 }} type="submit"
                disabled={typeof uploadProgress === 'number'}
                className="w-full py-5 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
                {typeof uploadProgress === 'number'
                  ? `Uploading ${uploadProgress}%…`
                  : <><Upload size={20}/> Upload Work ✦</>}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ProjectView({ nav, project, authUser, onSignInRequest }) {
  // likeOverride: null = derive from props, true/false = user has toggled in this session
  const [likeOverride, setLikeOverride] = useState(null);
  const [likeDelta, setLikeDelta] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [comments, setComments] = useState(project?.comments || []);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');

  if (!project) return null;

  // Derive liked/likes from props + any local override
  const liked = likeOverride !== null ? likeOverride : !!(authUser && project?.likedBy?.includes(authUser.uid));
  const likes = (project?.likes || 0) + likeDelta;
  const isExt = url => url && (url.includes('http') || url.includes('www'));

  const handleLike = async () => {
    if (!authUser) { onSignInRequest('signin'); return; }
    if (likeLoading || !project.docId) return;
    setLikeLoading(true);
    const ref = doc(db, 'projects', project.docId);
    if (liked) {
      setLikeOverride(false);
      setLikeDelta(d => d - 1);
      await updateDoc(ref, { likes: increment(-1), likedBy: arrayRemove(authUser.uid) }).catch(() => {});
    } else {
      setLikeOverride(true);
      setLikeDelta(d => d + 1);
      await updateDoc(ref, { likes: increment(1), likedBy: arrayUnion(authUser.uid) }).catch(() => {});
    }
    setLikeLoading(false);
  };

  const addComment = () => {
    if (!commentText.trim() || !commentName.trim()) return;
    setComments(prev => [...prev, { name:commentName.trim(), text:commentText.trim(), date:new Date().toLocaleDateString() }]);
    setCommentText('');
  };

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
                      {project.category === 'Audio' && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><div className="w-24 h-24 border rounded-full flex items-center justify-center animate-pulse" style={{ background:`${C.purple}15`, borderColor:`${C.purple}30` }}><Music size={38} style={{ color:C.purple }}/></div></div>}
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
                  : <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white border-4 border-white shadow-lg" style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>{project.creator?.charAt(0)}</div>
                }
                <div>
                  <div className="font-black text-2xl mb-0.5" style={{ color:C.dark }}>{project.creator}</div>
                  <div className="font-black text-sm mb-1" style={{ color:C.purple }}>{project.program}</div>
                  <div className="text-sm flex items-center gap-1.5 font-medium" style={{ color:`${C.dark}50` }}><MapPin size={13}/>{project.city}</div>
                </div>
              </div>
              <button
                onClick={() => nav('profile', { name: project.creator, email: project.email, userId: project.userId, program: project.program, city: project.city, alxStatus: project.alxStatus, linkedin: project.linkedin, instagram: project.instagram, tiktok: project.tiktok })}
                className="block w-full text-center font-black py-3.5 rounded-2xl text-white shadow-lg transition hover:opacity-90"
                style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>View Full Profile</button>
            </div>
            <div className="rounded-3xl p-8 shadow-lg" style={{ background:'white', border:'1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color:`${C.dark}40` }}>Engagement</h3>
                <span className="text-xs font-black px-3 py-1.5 rounded-lg" style={{ background:`${C.blue}12`, color:C.blue }}>HOT</span>
              </div>
              <button onClick={handleLike} disabled={likeLoading}
                className={`w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all border disabled:opacity-60 ${liked ? '' : 'hover:opacity-80'}`}
                style={liked ? { background:`${C.blue}10`, borderColor:`${C.blue}30`, color:C.blue } : { background:'white', borderColor:`${C.blue}20`, color:C.blue }}>
                <Heart fill={liked ? 'currentColor' : 'none'} size={22} style={{ transform:liked ? 'scale(1.2)' : 'scale(1)', transition:'transform 0.2s' }}/>
                {likes}
                {!authUser && <span className="text-sm font-medium opacity-60 ml-1">(sign in to like)</span>}
              </button>
            </div>

            {/* Social Profiles */}
            {(project.instagram || project.tiktok) && (
              <div className="rounded-3xl p-8 shadow-lg" style={{ background:'white', border:'1px solid rgba(0,0,0,0.06)' }}>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-5" style={{ color:`${C.dark}40` }}>Also Find Them On</h3>
                <div className="space-y-3">
                  {project.instagram && (
                    <a href={project.instagram.startsWith('http') ? project.instagram : `https://${project.instagram}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl transition hover:scale-[1.02]" style={{ background:`${C.purple}08`, border:`1px solid ${C.purple}15` }}>
                      <Instagram size={18} style={{ color:C.purple }}/> <span className="text-sm font-bold" style={{ color:C.dark }}>Instagram</span>
                      <ExternalLink size={13} className="ml-auto" style={{ color:`${C.dark}30` }}/>
                    </a>
                  )}
                  {project.tiktok && (
                    <a href={project.tiktok.startsWith('http') ? project.tiktok : `https://${project.tiktok}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl transition hover:scale-[1.02]" style={{ background:`${C.dark}06`, border:`1px solid ${C.dark}10` }}>
                      <Play size={18} style={{ color:C.dark }}/> <span className="text-sm font-bold" style={{ color:C.dark }}>TikTok</span>
                      <ExternalLink size={13} className="ml-auto" style={{ color:`${C.dark}30` }}/>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Feedback / Comments */}
            <div className="rounded-3xl p-8 shadow-lg" style={{ background:'white', border:'1px solid rgba(0,0,0,0.06)' }}>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-5" style={{ color:`${C.dark}40` }}>Give Feedback</h3>
              <div className="space-y-3 mb-5">
                <input value={commentName} onChange={e => setCommentName(e.target.value)} placeholder="Your name"
                  className="w-full border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition"
                  style={{ borderColor:'rgba(0,0,0,0.1)', color:C.dark }}
                  onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Share your thoughts on this work…"
                  className="w-full border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition resize-none h-24"
                  style={{ borderColor:'rgba(0,0,0,0.1)', color:C.dark }}
                  onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                <button onClick={addComment}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition hover:opacity-90"
                  style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
                  Post Feedback
                </button>
              </div>
              {comments.length > 0 && (
                <div className="space-y-4 pt-4" style={{ borderTop:'1px solid rgba(0,0,0,0.06)' }}>
                  {comments.map((c, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold" style={{ color:C.dark }}>{c.name}</span>
                          <span className="text-xs" style={{ color:`${C.dark}40` }}>{c.date}</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color:`${C.dark}70` }}>{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white"
              style={{ background:`linear-gradient(135deg,${C.navy} 0%,#061A5E 100%)` }}>
              <PaintSplash color={C.purple} size={120} style={{ top:'-15%', right:'-10%', transform:'rotate(60deg)' }} className="opacity-30"/>
              <PaintSplash color={C.blue} size={100} style={{ bottom:'-10%', left:'-8%', transform:'rotate(-30deg)' }} className="opacity-20"/>
              <h3 className="font-black text-2xl mb-2 relative z-10">Hire this Talent</h3>
              <p className="text-sm mb-7 relative z-10 leading-relaxed font-light" style={{ color:'rgba(255,255,255,0.55)' }}>Interested in collaborating with {project.creator}?</p>
              <motion.button whileTap={{ scale:0.97 }}
                className="w-full font-black py-3.5 rounded-2xl text-white shadow-xl relative z-10 transition"
                style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
                Send Message
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH MODAL — sign in / sign up
// ══════════════════════════════════════════════════════════════════════════════
function AuthModal({ mode: initialMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode || 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const inp = "w-full border rounded-2xl px-5 py-4 focus:outline-none text-base font-medium transition";
  const inpStyle = { borderColor:'rgba(0,0,0,0.1)', color:C.dark };

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        setDoc(doc(db, 'users', cred.user.uid), { name, email, createdAt: Date.now() }).catch(() => {});
        onSuccess();
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset email sent! Check your inbox.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?/, '').trim());
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const u = cred.user;
      // Save to Firestore on first sign-in (setDoc with merge won't overwrite existing data)
      setDoc(doc(db, 'users', u.uid), { name: u.displayName || '', email: u.email, createdAt: Date.now() }, { merge: true }).catch(() => {});
      onSuccess();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?/, '').trim());
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.2 }}
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative" style={{ background:'white' }}>
        <div className="h-1.5" style={{ background:`linear-gradient(90deg,${C.purple},${C.blue})` }}/>
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition z-10">
          <X size={20} style={{ color:`${C.dark}60` }}/>
        </button>
        <div className="p-10">
          <h2 className="text-3xl font-black mb-1 tracking-tight" style={{ color:C.dark }}>
            {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Join the Showcase' : 'Reset Password'}
          </h2>
          <p className="mb-8 font-light" style={{ color:`${C.dark}55` }}>
            {mode === 'signin' ? 'Sign in to submit and manage your work.'
              : mode === 'signup' ? 'Create a free account and build your creator profile.'
              : "Enter your email and we'll send you a reset link."}
          </p>

          {/* Google sign-in — only for signin/signup */}
          {mode !== 'reset' && (
            <>
              <button onClick={handleGoogle} disabled={loading}
                className="w-full py-3.5 rounded-2xl font-black text-base border flex items-center justify-center gap-3 transition hover:bg-gray-50 disabled:opacity-60 mb-5"
                style={{ borderColor:'rgba(0,0,0,0.12)', color:C.dark }}>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
              </button>
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor:'rgba(0,0,0,0.08)' }}/></div>
                <div className="relative flex justify-center"><span className="px-4 text-xs uppercase font-black tracking-widest bg-white" style={{ color:`${C.dark}35` }}>or continue with email</span></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Full Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe"
                  className={inp} style={inpStyle}
                  onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
              </div>
            )}
            <div>
              <label className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com"
                className={inp} style={inpStyle}
                onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
            </div>
            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Password</label>
                  {mode === 'signin' && (
                    <button type="button" onClick={() => switchMode('reset')}
                      className="text-xs font-black transition hover:opacity-70" style={{ color:C.purple }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6}
                  className={inp} style={inpStyle}
                  onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
              </div>
            )}
            {error && (
              <p className="text-sm font-medium px-4 py-3 rounded-xl" style={{ background:`${C.yellow}25`, color:'#92400e' }}>{error}</p>
            )}
            {success && (
              <p className="text-sm font-medium px-4 py-3 rounded-xl" style={{ background:'#d1fae5', color:'#065f46' }}>{success}</p>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl font-black text-white text-base shadow-xl transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center"
              style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
              {loading ? <Loader size={20} className="animate-spin"/>
                : mode === 'signin' ? 'Sign In'
                : mode === 'signup' ? 'Create Account'
                : 'Send Reset Link'}
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color:`${C.dark}50` }}>
            {mode === 'reset' ? (
              <>Remember your password?{' '}
                <button onClick={() => switchMode('signin')} className="font-black transition hover:opacity-70" style={{ color:C.purple }}>Sign In</button>
              </>
            ) : mode === 'signin' ? (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => switchMode('signup')} className="font-black transition hover:opacity-70" style={{ color:C.purple }}>Sign Up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('signin')} className="font-black transition hover:opacity-70" style={{ color:C.purple }}>Sign In</button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EDIT PROFILE MODAL
// ══════════════════════════════════════════════════════════════════════════════
function EditProfileModal({ authUser, initialData, onClose, onSaved }) {
  const [fd, setFd] = useState({
    name:      authUser.displayName || initialData.name || '',
    bio:       initialData.bio       || '',
    city:      initialData.city      || '',
    program:   initialData.program   || 'Content Creation',
    alxStatus: initialData.alxStatus || 'Current Learner',
    linkedin:  initialData.linkedin  || '',
    instagram: initialData.instagram || '',
    tiktok:    initialData.tiktok    || '',
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const inp = "w-full bg-white border rounded-2xl px-5 py-4 focus:outline-none text-base font-medium shadow-sm transition";
  const inpStyle = { borderColor:'rgba(0,0,0,0.1)', color:C.dark };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updates = {
        name:      fd.name,
        email:     authUser.email,
        bio:       fd.bio,
        city:      fd.city,
        program:   fd.program,
        alxStatus: fd.alxStatus,
        linkedin:  fd.linkedin,
        instagram: fd.instagram,
        tiktok:    fd.tiktok,
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'users', authUser.uid), updates, { merge: true });
      if (fd.name && fd.name !== authUser.displayName) {
        await updateProfile(authUser, { displayName: fd.name });
      }
      setSuccess(true);
      setTimeout(() => { onSaved(updates); onClose(); }, 800);
    } catch {
      setError('Could not save changes. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background:'rgba(0,0,0,0.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.2 }}
        className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative my-8" style={{ background:'white' }}>
        <div className="h-1.5" style={{ background:`linear-gradient(90deg,${C.purple},${C.blue})` }}/>
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition z-10">
          <X size={20} style={{ color:`${C.dark}60` }}/>
        </button>
        <div className="p-10">
          <h2 className="text-3xl font-black mb-1 tracking-tight" style={{ color:C.dark }}>Edit Profile</h2>
          <p className="mb-8 font-light" style={{ color:`${C.dark}55` }}>Update your creator profile information.</p>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Display Name</label>
              <input required value={fd.name} onChange={e => setFd({...fd, name:e.target.value})} placeholder="Jane Doe"
                className={inp} style={inpStyle}
                onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
            </div>

            <div>
              <label className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>
                Bio <span className="font-medium normal-case tracking-normal" style={{ color:`${C.dark}40` }}>(optional)</span>
              </label>
              <textarea value={fd.bio} onChange={e => setFd({...fd, bio:e.target.value})}
                placeholder="Tell us about yourself and your creative work…"
                className={`${inp} h-24 resize-none`} style={inpStyle}
                onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Program</label>
                <select className={inp} style={inpStyle} value={fd.program} onChange={e => setFd({...fd, program:e.target.value})}
                  onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}>
                  {['Front End','Back End','Front-End ProDev','Back-End ProDev','Data Analytics','Data Science','Data Engineering','AWS Cloud Practitioner','AWS Solutions Architect','SalesForce Associate','SalesForce Administrator','Cybersecurity','AI for Creatives','Graphic Design','Content Creation','Audio Production'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>ALX Status</label>
                <select className={inp} style={inpStyle} value={fd.alxStatus} onChange={e => setFd({...fd, alxStatus:e.target.value})}
                  onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}>
                  {['Current Learner','Alumni','Applicant'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>City & Country</label>
              <input value={fd.city} onChange={e => setFd({...fd, city:e.target.value})} placeholder="e.g. Nairobi, Kenya"
                className={inp} style={inpStyle}
                onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
            </div>

            <div>
              <label className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color:`${C.dark}70` }}>Social Profiles</label>
              <div className="space-y-3">
                <div className="relative">
                  <Linkedin size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color:`${C.blue}70` }}/>
                  <input className={`${inp} pl-11`} style={inpStyle} placeholder="linkedin.com/in/your-name"
                    value={fd.linkedin} onChange={e => setFd({...fd, linkedin:e.target.value})}
                    onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                </div>
                <div className="relative">
                  <Instagram size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color:`${C.purple}70` }}/>
                  <input className={`${inp} pl-11`} style={inpStyle} placeholder="instagram.com/your-handle"
                    value={fd.instagram} onChange={e => setFd({...fd, instagram:e.target.value})}
                    onFocus={e => e.target.style.borderColor = C.purple} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                </div>
                <div className="relative">
                  <Play size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color:`${C.dark}50` }}/>
                  <input className={`${inp} pl-11`} style={inpStyle} placeholder="tiktok.com/@your-handle"
                    value={fd.tiktok} onChange={e => setFd({...fd, tiktok:e.target.value})}
                    onFocus={e => e.target.style.borderColor = C.dark} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}/>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium px-4 py-3 rounded-xl" style={{ background:`${C.yellow}25`, color:'#92400e' }}>{error}</p>
            )}
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background:`${C.green}15`, border:`1px solid ${C.green}30` }}>
                <CheckCircle size={16} style={{ color:C.green }}/>
                <p className="text-sm font-bold" style={{ color:C.green }}>Profile saved!</p>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-black text-base transition"
                style={{ background:'white', color:C.dark, border:'1.5px solid rgba(0,0,0,0.1)' }}>Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-[2] py-4 rounded-2xl font-black text-white text-base shadow-xl transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
                {saving ? <Loader size={18} className="animate-spin"/> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE VIEW — public creator profile with all their work
// ══════════════════════════════════════════════════════════════════════════════
function ProfileView({ nav, projects, creator, authUser }) {
  const [editOpen, setEditOpen]         = useState(false);
  const [savedOverrides, setSavedOverrides] = useState({});

  const creatorProjects = useMemo(() => {
    if (!creator) return [];
    return (projects || []).filter(p =>
      p.creator === creator.name ||
      (creator.email && p.email === creator.email) ||
      (creator.userId && p.userId === creator.userId)
    );
  }, [projects, creator]);

  // Fetch latest profile data from Firestore (picks up bio + any edits)
  useEffect(() => {
    if (!creator?.userId) return;
    getDoc(doc(db, 'users', creator.userId)).then(snap => {
      if (snap.exists()) setSavedOverrides(snap.data());
    }).catch(() => {});
  }, [creator?.userId]);

  useEffect(() => {
    if (!creator) nav('gallery');
  }, [creator, nav]);

  if (!creator) return null;

  // Is the signed-in user viewing their own profile?
  const isOwnProfile = authUser && (
    authUser.uid === creator.userId ||
    authUser.email === creator.email
  );

  // Merge: base creator object → Firestore data → post-edit local overrides
  const merged = { ...creator, ...savedOverrides };
  const ref        = creatorProjects[0] || {};
  const displayName = merged.name      || creator.name || '';
  const program    = merged.program    || ref.program    || '';
  const city       = merged.city       || ref.city       || '';
  const linkedin   = merged.linkedin   || ref.linkedin   || '';
  const instagram  = merged.instagram  || ref.instagram  || '';
  const tiktok     = merged.tiktok     || ref.tiktok     || '';
  const alxStatus  = merged.alxStatus  || ref.alxStatus  || '';
  const bio        = merged.bio        || '';
  const totalLikes = creatorProjects.reduce((sum, p) => sum + (p.likes || 0), 0);

  return (
    <div className="min-h-screen" style={{ background:C.offwhite }}>
      {editOpen && isOwnProfile && (
        <EditProfileModal
          authUser={authUser}
          initialData={{ name: displayName, bio, city, program, alxStatus, linkedin, instagram, tiktok }}
          onClose={() => setEditOpen(false)}
          onSaved={updates => setSavedOverrides(prev => ({ ...prev, ...updates }))}
        />
      )}

      <KenteDivider/>

      {/* ── Profile hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background:`linear-gradient(160deg,${C.navy} 0%,#061A5E 100%)` }}>
        <PaintSplash color={C.purple} size={350} style={{ top:'-5%', left:'-5%', transform:'rotate(30deg)' }} className="opacity-25"/>
        <PaintSplash color={C.blue}   size={300} style={{ bottom:'-8%', right:'-3%', transform:'rotate(180deg)' }} className="opacity-20"/>
        <PaintSplash color={C.green}  size={180} style={{ top:'40%', right:'12%', transform:'rotate(-45deg)' }} className="opacity-15"/>

        <div className="max-w-5xl mx-auto px-6 py-24 relative z-10">
          {/* Top bar: back button + own-profile actions */}
          <div className="flex items-center justify-between mb-12 flex-wrap gap-3">
            <button onClick={() => nav('gallery')} className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-full transition hover:opacity-80"
              style={{ color:'rgba(255,255,255,0.7)', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)' }}>
              <ArrowLeft size={15}/> Back to Gallery
            </button>
            {isOwnProfile && (
              <div className="flex items-center gap-3">
                <button onClick={() => nav('submit')}
                  className="inline-flex items-center gap-2 font-black text-sm px-5 py-2.5 rounded-full transition hover:opacity-80"
                  style={{ background:`${C.green}25`, color:C.green, border:`1px solid ${C.green}40` }}>
                  <Upload size={14}/> Add Work
                </button>
                <button onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-2 font-black text-sm px-5 py-2.5 rounded-full transition hover:opacity-80"
                  style={{ background:'rgba(255,255,255,0.12)', color:'white', border:'1px solid rgba(255,255,255,0.2)' }}>
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-2xl flex-shrink-0"
              style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})`, border:'4px solid rgba(255,255,255,0.15)' }}>
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">{displayName}</h1>
                {alxStatus && (
                  <span className="text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest"
                    style={{ background:`${C.green}25`, color:C.green, border:`1px solid ${C.green}35` }}>
                    {alxStatus}
                  </span>
                )}
              </div>
              {program && <p className="font-black text-lg mb-1" style={{ color:C.purple }}>{program}</p>}
              {city && (
                <p className="flex items-center gap-1.5 text-sm font-medium mb-3" style={{ color:'rgba(255,255,255,0.45)' }}>
                  <MapPin size={13}/>{city}
                </p>
              )}
              {bio && (
                <p className="text-sm leading-relaxed mb-5 max-w-lg" style={{ color:'rgba(255,255,255,0.6)' }}>{bio}</p>
              )}
              {/* Social links */}
              <div className="flex flex-wrap gap-3">
                {linkedin && (
                  <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition hover:opacity-80"
                    style={{ background:`${C.blue}30`, color:'white', border:`1px solid ${C.blue}40` }}>
                    <Linkedin size={14}/> LinkedIn
                  </a>
                )}
                {instagram && (
                  <a href={instagram.startsWith('http') ? instagram : `https://${instagram}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition hover:opacity-80"
                    style={{ background:'rgba(255,255,255,0.08)', color:'white', border:'1px solid rgba(255,255,255,0.15)' }}>
                    <Instagram size={14}/> Instagram
                  </a>
                )}
                {tiktok && (
                  <a href={tiktok.startsWith('http') ? tiktok : `https://${tiktok}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition hover:opacity-80"
                    style={{ background:'rgba(255,255,255,0.08)', color:'white', border:'1px solid rgba(255,255,255,0.15)' }}>
                    <Play size={14}/> TikTok
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex gap-12 mt-14 pt-10 border-t" style={{ borderColor:'rgba(255,255,255,0.1)' }}>
            <div>
              <div className="text-4xl font-black text-white">{creatorProjects.length}</div>
              <div className="text-xs font-black uppercase tracking-[0.2em] mt-1" style={{ color:'rgba(255,255,255,0.35)' }}>Works</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white">{totalLikes}</div>
              <div className="text-xs font-black uppercase tracking-[0.2em] mt-1" style={{ color:'rgba(255,255,255,0.35)' }}>Total Likes</div>
            </div>
            {program && (
              <div>
                <div className="text-lg font-black text-white leading-tight">{program}</div>
                <div className="text-xs font-black uppercase tracking-[0.2em] mt-1" style={{ color:'rgba(255,255,255,0.35)' }}>Program</div>
              </div>
            )}
          </div>
        </div>
      </section>
      <KenteDivider/>

      {/* ── Projects grid ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <RevealSection>
          <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
            <motion.h2 variants={SU} className="text-3xl font-black tracking-tight" style={{ color:C.dark }}>
              {displayName?.split(' ')[0]}'s Work
              <span className="ml-3 text-lg font-bold" style={{ color:`${C.dark}35` }}>({creatorProjects.length})</span>
            </motion.h2>
            {isOwnProfile && (
              <motion.button variants={SU} onClick={() => nav('submit')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm text-white shadow-md transition hover:opacity-90"
                style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
                <Upload size={14}/> Add New Work
              </motion.button>
            )}
          </div>
        </RevealSection>

        {creatorProjects.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl font-light mb-6" style={{ color:`${C.dark}40` }}>No submissions found yet.</p>
            {isOwnProfile ? (
              <button onClick={() => nav('submit')} className="px-8 py-4 rounded-full font-black text-white shadow-lg"
                style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>
                Upload Your First Work
              </button>
            ) : (
              <button onClick={() => nav('gallery')} className="px-8 py-4 rounded-full font-black text-white shadow-lg"
                style={{ background:`linear-gradient(135deg,${C.purple},${C.blue})` }}>Browse the Gallery</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {creatorProjects.map((project, i) => (
              <motion.div key={project.id}
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3), type:'spring', stiffness:80, damping:20 }}
                onClick={() => nav('project', project)}
                className="group rounded-3xl overflow-hidden cursor-pointer flex flex-col hover:-translate-y-2 transition-all duration-500"
                style={{ background:'white', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid rgba(0,0,0,0.05)', contain:'layout style' }}>
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  <SafeImage src={project.image} alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"/>
                  <div className="absolute top-4 right-4 text-white p-2.5 rounded-full" style={{ background:'rgba(0,0,0,0.35)' }}>
                    {project.category === 'Video'   && <Play     size={16} fill="currentColor"/>}
                    {project.category === 'Audio'   && <Music    size={16}/>}
                    {project.category === 'Writing' && <FileText size={16}/>}
                    {project.category === 'Visual'  && <ImageIcon size={16}/>}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-[10px] font-black uppercase tracking-widest border px-3 py-1.5 rounded-lg mb-3 w-fit"
                    style={{ color:C.blue, borderColor:`${C.blue}25`, background:`${C.blue}08` }}>{project.program}</span>
                  <h3 className="font-black text-xl mb-1 leading-tight transition group-hover:opacity-75" style={{ color:C.dark }}>{project.title}</h3>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t" style={{ borderColor:'rgba(0,0,0,0.06)' }}>
                    <span className="text-sm font-medium flex items-center gap-1.5" style={{ color:`${C.dark}40` }}>
                      <MapPin size={13}/>{project.city}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color:`${C.dark}50` }}>
                      <Heart size={13} fill="currentColor" style={{ color:C.blue }}/>{project.likes || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin table columns (defined outside component — stable reference) ────────
const ADMIN_COLS = [
  { key: 'createdAt', label: 'Date' },
  { key: 'creator',   label: 'Name' },
  { key: 'email',     label: 'Email' },
  { key: 'program',   label: 'Program' },
  { key: 'city',      label: 'City' },
  { key: 'alxStatus', label: 'Status' },
  { key: 'category',  label: 'Category' },
  { key: 'title',     label: 'Title' },
  { key: 'likes',     label: 'Likes' },
  { key: 'link',      label: 'Link' },
  { key: '_source',   label: 'Source' },
];
// Columns that sort numerically rather than alphabetically
const NUMERIC_SORT_KEYS = new Set(['createdAt', 'likes']);

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN VIEW — submissions dashboard (admin emails only)
// ══════════════════════════════════════════════════════════════════════════════
function AdminView({ nav, authUser, isAdmin }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true); // true until first fetch completes
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Hard redirect — non-admins never see data
  useEffect(() => {
    if (!isAdmin) nav('home');
  }, [isAdmin, nav]);

  useEffect(() => {
    if (!isAdmin) return;
    // loading is already true from useState initialiser — no setState needed here
    Promise.all([fetchProjectsFromFirestore(), fetchSubmissionsFromSheet()])
      .then(([fsRows, sheetRows]) => {
        const tagged = [
          ...fsRows.map(r => ({ ...r, _source: 'Firestore' })),
          ...sheetRows.map(r => ({ ...r, _source: 'Sheets' })),
        ];
        const seen = new Set();
        const deduped = tagged.filter(r => {
          const key = `${(r.email || '').toLowerCase()}|${(r.title || '').toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setRows(deduped);
        setLoading(false);
      });
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows
      .filter(r => !q || ADMIN_COLS.some(c => String(r[c.key] || '').toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = NUMERIC_SORT_KEYS.has(sortKey) ? (Number(a[sortKey]) || 0) : String(a[sortKey] || '').toLowerCase();
        const bv = NUMERIC_SORT_KEYS.has(sortKey) ? (Number(b[sortKey]) || 0) : String(b[sortKey] || '').toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [rows, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const exportCSV = () => {
    const exportCols = ['createdAt','creator','email','program','city','alxStatus','category','title','likes','link','description','linkedin','instagram','tiktok','_source'];
    const header = exportCols.join(',');
    const rowsCsv = filtered.map(r =>
      exportCols.map(k => {
        const val = k === 'createdAt' && r[k] ? new Date(r[k]).toLocaleDateString() : (r[k] || '');
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const blob = new Blob([[header, ...rowsCsv].join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `alx-submissions-${new Date().toISOString().slice(0,10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const SOURCE_STYLE = {
    Firestore: { bg: `${C.purple}25`, color: C.purple },
    Sheets:    { bg: '#EAB30825',     color: '#92400e' },
  };
  const STATUS_STYLE = {
    'Current Learner': { bg: `${C.green}20`,  color: C.green },
    'Alumni':          { bg: `${C.blue}20`,   color: C.blue  },
    'Applicant':       { bg: '#EAB30820',     color: '#92400e' },
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen" style={{ background:'#0F172A', color:'#E2E8F0', fontFamily:"'Poppins',system-ui,sans-serif" }}>

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div className="border-b px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderColor:'rgba(255,255,255,0.07)', background:'#0B1120' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => nav('home')} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition hover:opacity-80" style={{ color:'#475569' }}>
            <ArrowLeft size={13}/> Site
          </button>
          <div className="w-px h-5" style={{ background:'rgba(255,255,255,0.1)' }}/>
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color:C.purple }}/>
            <span className="font-black text-lg text-white tracking-tight">Admin Dashboard</span>
          </div>
        </div>
        <span className="text-xs font-medium" style={{ color:C.purple }}>{authUser?.email}</span>
      </div>

      <div className="px-4 sm:px-6 py-6">

        {/* ── Stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label:'Total Submissions', value: rows.length,                                                                    color: C.purple },
            { label:'From Firestore',    value: rows.filter(r => r._source === 'Firestore').length,                             color: C.blue   },
            { label:'From Sheets',       value: rows.filter(r => r._source === 'Sheets').length,                                color: '#EAB308'},
            { label:'Unique Programs',   value: new Set(rows.map(r => r.program).filter(Boolean)).size,                         color: C.green  },
            { label:'Total Likes',       value: rows.reduce((sum, r) => sum + (Number(r.likes) || 0), 0),                       color: '#E11D48' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-5 border" style={{ background:'#0B1120', borderColor:'rgba(255,255,255,0.07)' }}>
              <div className="text-3xl font-black mb-1" style={{ color }}>{loading ? '—' : value}</div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color:'#475569' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'#475569' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, program, city, title…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none border"
              style={{ background:'#0B1120', borderColor:'rgba(255,255,255,0.1)', color:'#E2E8F0' }}/>
          </div>
          <span className="text-sm font-medium self-center" style={{ color:'#475569' }}>
            {!loading && `${filtered.length} row${filtered.length !== 1 ? 's' : ''}`}
          </span>
          <button onClick={exportCSV} disabled={loading || filtered.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition hover:opacity-80 disabled:opacity-40"
            style={{ background:C.purple, color:'white' }}>
            <Download size={15}/> Export CSV
          </button>
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader size={28} className="animate-spin" style={{ color:C.purple }}/>
            <span className="ml-3 text-sm font-medium" style={{ color:'#475569' }}>Loading submissions…</span>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor:'rgba(255,255,255,0.07)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ background:'#0B1120', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                    {ADMIN_COLS.map(col => (
                      <th key={col.key} onClick={() => toggleSort(col.key)}
                        className="text-left px-4 py-3 font-black text-xs uppercase tracking-widest whitespace-nowrap cursor-pointer select-none transition hover:opacity-80"
                        style={{ color: sortKey === col.key ? C.purple : '#475569' }}>
                        <span className="flex items-center gap-1">
                          {col.label}
                          {sortKey === col.key
                            ? (sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)
                            : <ChevronDown size={12} style={{ opacity:0 }}/>}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-white/5 transition-colors"
                      style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>

                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color:'#475569' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">{r.creator || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a href={`mailto:${r.email}`} className="transition hover:text-white" style={{ color:'#94A3B8' }}>{r.email || '—'}</a>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color:'#94A3B8' }}>{r.program || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color:'#94A3B8' }}>{r.city || '—'}</td>
                      <td className="px-4 py-3">
                        {r.alxStatus
                          ? <span className="px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap"
                              style={{ background: STATUS_STYLE[r.alxStatus]?.bg||'rgba(255,255,255,0.1)', color: STATUS_STYLE[r.alxStatus]?.color||'#94A3B8' }}>
                              {r.alxStatus}
                            </span>
                          : <span style={{ color:'#475569' }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.category
                          ? <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background:`${C.blue}20`, color:C.blue }}>{r.category}</span>
                          : <span style={{ color:'#475569' }}>—</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-white" style={{ maxWidth:180 }}>
                        <span className="block truncate" title={r.title}>{r.title || '—'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(r.likes > 0)
                          ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black"
                              style={{ background:'#E11D4820', color:'#E11D48' }}>
                              <Heart size={11} fill="currentColor"/> {r.likes}
                            </span>
                          : <span className="text-xs" style={{ color:'#475569' }}>0</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.link?.startsWith('http')
                          ? <a href={r.link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs whitespace-nowrap transition hover:opacity-80"
                              style={{ color:C.blue }}>
                              <ExternalLink size={11}/> View
                            </a>
                          : <span style={{ color:'#475569' }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap"
                          style={{ background: SOURCE_STYLE[r._source]?.bg||'rgba(255,255,255,0.08)', color: SOURCE_STYLE[r._source]?.color||'#94A3B8' }}>
                          {r._source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-20 text-sm font-medium" style={{ color:'#475569' }}>
                  {search ? `No results for "${search}"` : 'No submissions yet.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}