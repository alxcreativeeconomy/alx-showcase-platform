import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Heart, 
  Share2, 
  MapPin, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  Play, 
  FileText, 
  Image as ImageIcon, 
  Music,
  ArrowLeft,
  CheckCircle,
  Filter,
  ExternalLink,
  Linkedin,
  Instagram,
  Globe,
  Sparkles,
  Zap,
  Loader
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot 
} from 'firebase/firestore';

// --- Firebase Initialization ---
// Your specific configuration from the previous step
const localFirebaseConfig = {
  apiKey: "AIzaSyAryqYa-abV5fPtm5q6JP3OpbcuVgPiXK4",
  authDomain: "alx-showcase-db.firebaseapp.com",
  projectId: "alx-showcase-db",
  storageBucket: "alx-showcase-db.firebasestorage.app",
  messagingSenderId: "693474179877",
  appId: "1:693474179877:web:0677e03aa82cee0a22b8cc"
};

// Logic to handle environment (Canvas Preview vs Local)
let firebaseConfig;
try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    firebaseConfig = localFirebaseConfig;
  }
} catch (e) {
  firebaseConfig = localFirebaseConfig;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Use a static ID for local dev
const appId = typeof __app_id !== 'undefined' ? __app_id : 'alx-creative-showcase';

// --- Mock Data ---
const INITIAL_PROJECTS = [
  {
    id: 1,
    title: "Urban Rhythms: Ghana",
    creator: "Diana Aidoo.",
    program: "Content Creation",
    city: "Accra, Ghana",
    category: "Video",
    image: "/dina.png", 
    videoUrl: "/diana.mp4",
    linkedin: "https://www.linkedin.com/in/diana-aidoo/",
    profileImage: "/dina.png", 
    description: "Urban Rhythms Ghana is a vibrant visual journey through the streets of Accra, where movement, culture, and sound collide. Captured through the lens of creator Diana Aidoo, the video celebrates Ghana’s street dance scene as a powerful form of self-expression, storytelling, and identity.",
    likes: 124,
    tags: ["AfricanDance", "Ghana", "Culture"],
    featured: true
  },
  {
    id: 2,
    title: "Generative Lagos: 2050",
    creator: "Tunde M.",
    program: "AI for Creators",
    city: "Lagos, Nigeria",
    category: "Visual",
    image: "Ai.jpeg", 
    linkedin: "https://www.linkedin.com/",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
    description: "A series of AI-generated landscapes imagining Lagos in the year 2050. Created using Midjourney and Stable Diffusion, this project explores the intersection of traditional Yoruba architecture and cyberpunk aesthetics.",
    likes: 215,
    tags: ["AI Art", "Midjourney", "Futurism"],
    featured: true
  },
  {
    id: 3,
    title: "Savannah Coffee Branding",
    creator: "Layla H.",
    program: "Graphic Design",
    city: "Cairo, Egypt",
    category: "Visual",
    image: "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?auto=format&fit=crop&q=80&w=1600", 
    linkedin: "https://www.linkedin.com/",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    description: "A complete brand identity and packaging design for an artisanal coffee startup. The visual language uses geometric patterns inspired by Egyptian textiles to create a modern yet rooted look.",
    likes: 143,
    tags: ["Branding", "Packaging", "Typography"],
    featured: false
  },
  {
    id: 4,
    title: "Afro-Futurism 3D Concept",
    creator: "Kofi A.",
    program: "3D Animation",
    city: "Accra, Ghana",
    category: "Visual",
    image: "3D.jpeg",
    linkedin: "https://www.linkedin.com/",
    description: "Character design and environment modeling for a sci-fi short film set in 2080 Accra. Rendered in Blender using Cycles with custom procedural textures.",
    likes: 210,
    tags: ["Blender", "3D", "Concept Art"],
    featured: true
  },
  {
    id: 5,
    title: "Sounds of the Savannah",
    creator: "Zola B.",
    program: "Audio Engineering",
    city: "Johannesburg, SA",
    category: "Audio",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1600", 
    linkedin: "https://www.linkedin.com/",
    description: "An immersive audio soundscape recorded across three national parks. Best experienced with noise-cancelling headphones.",
    likes: 45,
    tags: ["Sound Design", "Field Recording", "Nature"],
    featured: false
  }
];

// --- Styles for Animation ---
const styles = `
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
}
@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.animate-fade-in {
  animation: fade-in-up 0.6s ease-out forwards;
}
`;

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState('home'); 
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Firebase Auth & Data Sync ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Auth Error:", error);
        }
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Fallback to mock data if user not logged in yet, or allow read if your rules allow
    if (!user) {
        // We can still try to load projects if security rules allow public read
        // But for UI smoothness, we'll wait for auth or show mock
        setProjects(INITIAL_PROJECTS);
        setLoading(false);
        return;
    }

    const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
    const unsubscribeData = onSnapshot(projectsRef, (snapshot) => {
      const dbProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const allProjects = dbProjects.length > 0 ? dbProjects : INITIAL_PROJECTS;
      const sortedProjects = allProjects.sort((a, b) => b.createdAt - a.createdAt);
      
      setProjects(sortedProjects);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setLoading(false);
      setProjects(INITIAL_PROJECTS); 
    });

    return () => unsubscribeData();
  }, [user]);

  // Navigation Helper
  const navigate = (newView, project = null) => {
    window.scrollTo(0, 0);
    setView(newView);
    if (project) setSelectedProject(project);
    setIsMenuOpen(false);
  };

  // Add new project handler (Firestore)
  const handleSubmission = async (newProject) => {
    // If auth isn't ready, we just fallback to local state update so it feels responsive
    if (!user) {
      setProjects([newProject, ...projects]);
      navigate('gallery');
      return;
    }

    try {
      const projectToSave = {
        ...newProject,
        createdAt: Date.now(),
        userId: user.uid,
        likes: 0,
        featured: false 
      };

      const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
      await addDoc(projectsRef, projectToSave);
      
      navigate('gallery');
    } catch (error) {
      console.error("Error saving project:", error);
      // Fallback: Show locally even if save failed
      setProjects([newProject, ...projects]);
      navigate('gallery');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 relative overflow-hidden bg-slate-50 selection:bg-pink-200 selection:text-pink-900">
      <style>{styles}</style>
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-t from-white via-transparent to-transparent opacity-80"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/40 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => navigate('home')}
            >
              {/* Logo */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 blur opacity-20 group-hover:opacity-40 transition duration-500 rounded-full"></div>
                <img 
                  src="/alx-logo.png" 
                  alt="ALX Logo" 
                  className="h-10 w-auto object-contain relative z-10" 
                />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                ALX CREATIVE SHOWCASE
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => navigate('gallery')} className="text-sm font-semibold text-gray-600 hover:text-black hover:scale-105 transition duration-300">Gallery</button>
              <button 
                onClick={() => navigate('submit')}
                className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 transition-all duration-300 border border-transparent"
              >
                Submit Work
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden glass-panel border-b border-gray-100 px-4 py-4 space-y-4 animate-fade-in">
            <button onClick={() => navigate('gallery')} className="block w-full text-left font-medium p-2 hover:bg-white/50 rounded-lg transition">Gallery</button>
            <button onClick={() => navigate('submit')} className="block w-full text-left font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 p-2">Submit Work</button>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10">
        {view === 'home' && <HomeView navigate={navigate} projects={projects} />}
        {view === 'gallery' && <GalleryView navigate={navigate} projects={projects} />}
        {view === 'submit' && <SubmitView navigate={navigate} onSubmit={handleSubmission} />}
        {view === 'project' && <ProjectView navigate={navigate} project={selectedProject} />}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-16 mt-20 relative overflow-hidden">
        {/* Subtle footer gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-900 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-12 relative z-10">
          <div className="max-w-md">
            <h3 className="font-bold text-2xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 inline-block">ALX Creative Showcase</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Unlocking the next generation of African creative talent through innovation, technology, and art.</p>
          </div>
          
          <div className="flex flex-col md:items-end">
            <h4 className="font-bold mb-6 text-lg">Connect</h4>
            <div className="flex gap-4">
              <a 
                href="https://www.linkedin.com/school/alx-africa/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:text-white text-gray-400 transition-all duration-300"
                title="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="https://www.instagram.com/alx_africa/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 hover:border-pink-500 hover:text-white text-gray-400 transition-all duration-300"
                title="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.tiktok.com/@alx_africa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 hover:border-gray-600 hover:text-white text-gray-400 transition-all duration-300"
                title="TikTok"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.54-1.15v8.36c0 1.21-.19 2.38-.77 3.42-.96 1.69-2.5 2.97-4.41 3.53-3.6 1.09-7.51-.71-8.99-4.17-1.12-2.62-.25-5.91 2.11-7.79 1.71-1.35 4.09-1.57 6.01-.52v4.29c-.84-.5-1.92-.62-2.82-.25-.9.37-1.54 1.22-1.62 2.21-.08 1.02.51 2.02 1.43 2.47.93.45 2.05.28 2.8-.46.75-.72.93-1.85.5-2.82V.02z"/>
                </svg>
              </a>
              <a 
                href="https://www.alxafrica.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 hover:border-green-500 hover:text-white text-gray-400 transition-all duration-300"
                title="Join ALX"
              >
                <Globe size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- VIEW: Home ---
function HomeView({ navigate, projects }) {
  // Use either the real projects from DB or fallback, take top 3
  const featuredProjects = projects.slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-36 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-white/50 rounded-full text-xs font-bold tracking-wide mb-8 shadow-sm animate-[float_4s_ease-in-out_infinite]">
            <Sparkles size={14} className="text-yellow-500" /> FESTIVAL 2026 NOW OPEN
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-gray-900 mb-8 leading-[1.1]">
            Discover Africa's <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500">Untapped Creative Talent</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            The ALX Creative Showcase is the premier digital stage for storytellers, designers, and innovators. <span className="font-medium text-gray-900">Join the movement.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button 
              onClick={() => navigate('submit')}
              className="px-10 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition shadow-xl shadow-purple-500/10 hover:shadow-purple-500/30 transform hover:-translate-y-1"
            >
              Submit Your Work
            </button>
            <button 
              onClick={() => navigate('gallery')}
              className="px-10 py-4 bg-white/70 backdrop-blur-sm text-gray-900 border border-white rounded-full font-bold hover:bg-white transition shadow-lg shadow-gray-200/50"
            >
              Explore Showcase
            </button>
          </div>
        </div>
      </section>

      {/* Vision Video Section */}
      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          {/* Animated Glow Behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-purple-500/20 rounded-full blur-[100px] -z-10"></div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 text-purple-600 font-bold tracking-widest text-sm uppercase mb-4">
                <Zap size={16} /> The Vision
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                Your Creativity. <br/>
                Our Platform. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Africa's Future.</span>
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                We believe that talent is equally distributed, but opportunity is not. ALX bridges that gap by empowering the next generation of creative leaders with the skills, network, and stage they need to shine.
              </p>
              <button 
                onClick={() => window.open('https://www.alxafrica.com', '_blank')}
                className="inline-flex items-center gap-2 text-gray-900 font-bold border-b-2 border-gray-900 hover:text-purple-600 hover:border-purple-600 transition pb-1"
              >
                Join the ALX Community <ExternalLink size={16} />
              </button>
            </div>
            
            <div className="order-1 lg:order-2 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl transform rotate-2 scale-105 opacity-20 group-hover:rotate-1 transition duration-500"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white aspect-video bg-black">
                 {/* Video Player: Uses video tag for local files to ensure playback */}
                 <video 
                    width="100%" 
                    height="100%" 
                    src="/alx_vid.mp4" 
                    title="ALX Vision Video"
                    controls
                    className="w-full h-full object-cover"
                 >
                    Your browser does not support the video tag.
                 </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-3">Curator's Picks</h2>
            <p className="text-gray-500 text-lg">Highlights from this week's top submissions.</p>
          </div>
          <button onClick={() => navigate('gallery')} className="hidden md:flex items-center gap-2 text-purple-600 font-bold hover:text-purple-700 transition group">
            View All <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {featuredProjects.map((project, index) => (
            <div 
              key={project.id} 
              onClick={() => navigate('project', project)}
              className="group cursor-pointer"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold z-20 shadow-sm uppercase tracking-wide">
                  {project.category}
                </div>
              </div>
              <h3 className="text-2xl font-bold group-hover:text-purple-600 transition-colors mb-2 leading-tight">{project.title}</h3>
              <p className="text-sm text-gray-500 font-medium">{project.creator} • {project.program}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats / Proof */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/95 z-0"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-purple-900/30 to-transparent z-0"></div>
        
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative z-10 text-white">
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition duration-300">
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-3">1.2k+</div>
            <div className="text-sm text-gray-400 font-medium uppercase tracking-widest">Creators</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition duration-300">
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 mb-3">35</div>
            <div className="text-sm text-gray-400 font-medium uppercase tracking-widest">Countries</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition duration-300">
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300 mb-3">500+</div>
            <div className="text-sm text-gray-400 font-medium uppercase tracking-widest">Internships</div>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- VIEW: Gallery ---
function GalleryView({ navigate, projects }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Video', 'Visual', 'Audio', 'Writing'];

  const filteredProjects = filter === 'All' 
    ? projects 
    : projects.filter(p => p.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <h1 className="text-5xl font-black mb-4 tracking-tight">The Showcase</h1>
          <p className="text-gray-600 text-lg">Browse groundbreaking work from across the continent.</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {filters.map(f => {
            // Calculate count for this filter
            const count = f === 'All' 
              ? projects.length 
              : projects.filter(p => p.category === f).length;
              
            const isActive = filter === f;
            
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 border ${
                  isActive 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-105' 
                    : 'bg-white/60 backdrop-blur-sm text-gray-600 border-white hover:bg-white hover:shadow-md'
                }`}
              >
                {f}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                   isActive ? 'bg-white/20' : 'bg-gray-200/70 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredProjects.map((project, index) => (
          <div 
            key={project.id}
            onClick={() => navigate('project', project)}
            className="group glass-panel rounded-3xl overflow-hidden hover:shadow-2xl transition duration-500 cursor-pointer flex flex-col h-full hover:-translate-y-2 border-0"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-gray-100">
               <img 
                 src={project.image} 
                 alt={project.title} 
                 className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
               />
               <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-500"></div>
               <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-full shadow-lg">
                 {project.category === 'Video' && <Play size={18} fill="currentColor" />}
                 {project.category === 'Audio' && <Music size={18} />}
                 {project.category === 'Writing' && <FileText size={18} />}
                 {project.category === 'Visual' && <ImageIcon size={18} />}
               </div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow relative bg-white/40">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest border border-purple-200 px-2 py-1 rounded bg-purple-50">{project.program}</span>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                  <Heart size={14} fill="currentColor" className="text-pink-500" /> {project.likes}
                </div>
              </div>
              
              <h3 className="font-bold text-xl mb-2 leading-tight text-gray-900 group-hover:text-purple-700 transition">{project.title}</h3>
              <p className="text-sm text-gray-600 mb-6">{project.creator}</p>
              
              <div className="mt-auto flex items-center gap-2 text-xs text-gray-500 font-medium pt-4 border-t border-gray-200/50">
                <MapPin size={14} /> {project.city}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-32 glass-panel rounded-3xl mx-auto max-w-2xl">
          <p className="text-gray-400 text-xl font-light">No projects found in this category yet.</p>
          <button onClick={() => setFilter('All')} className="text-purple-600 font-bold mt-4 hover:underline">Clear Filters</button>
        </div>
      )}
    </div>
  );
}

// --- VIEW: Submit Form ---
function SubmitView({ navigate, onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    creator: '',
    program: 'Graphic Design',
    city: '',
    category: 'Visual',
    description: '',
    link: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if the link is a valid URL or just use placeholder for this demo
    const mediaLink = formData.link || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800';
    
    // Note: Local files (blob:) will only work for this session on this computer.
    // To make them permanent, one would need Firebase Storage.

    const newProject = {
      ...formData,
      image: mediaLink,
    };
    
    onSubmit(newProject);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 animate-fade-in">
      <button onClick={() => navigate('home')} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black transition font-medium group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
      </button>

      <div className="glass-panel rounded-3xl shadow-2xl border-0 overflow-hidden relative">
        {/* Decorative gradient inside card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-100/50 flex">
          <div className={`h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500 ease-out ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
        </div>

        <div className="p-10 relative z-10">
          <h1 className="text-3xl font-black mb-2 text-gray-900">Submit Your Work</h1>
          <p className="text-gray-600 mb-10 text-lg font-light">Share your creativity with the ALX community and hiring partners.</p>

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Full Name</label>
                    <input 
                      required
                      className="w-full bg-white/70 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition shadow-sm"
                      placeholder="e.g. Jane Doe"
                      value={formData.creator}
                      onChange={(e) => setFormData({...formData, creator: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Program</label>
                    <select 
                      className="w-full bg-white/70 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition shadow-sm appearance-none"
                      value={formData.program}
                      onChange={(e) => setFormData({...formData, program: e.target.value})}
                    >
                      <option>Content Creation</option>
                      <option>AI For Creators</option>
                      <option>Graphic Design</option>
                      <option>Music and Audio Production</option>
                      <option>Data Science</option>
                      <option>Cloud Computing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">City & Country</label>
                  <input 
                    required
                    className="w-full bg-white/70 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition shadow-sm"
                    placeholder="e.g. Nairobi, Kenya"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>

                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 hover:shadow-gray-900/40 transform hover:-translate-y-0.5"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">Project Title</label>
                  <input 
                    required
                    className="w-full bg-white/70 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition shadow-sm"
                    placeholder="Give your work a catchy title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">Category</label>
                  <div className="flex gap-3">
                    {['Visual', 'Video', 'Audio', 'Writing'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, category: type})}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                          formData.category === type 
                            ? 'bg-purple-100 border-purple-200 text-purple-700 shadow-inner' 
                            : 'bg-white/50 border-gray-200 hover:bg-white hover:border-gray-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">Media Link / Upload</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center bg-white/40 transition hover:bg-white/60 hover:border-purple-300 group">
                      <input 
                        type="file" 
                        id="file-upload"
                        className="hidden" 
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setFormData({...formData, link: url});
                          }
                        }}
                      />
                      
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition duration-300">
                          <Upload className="text-purple-600" size={28} />
                        </div>
                        <p className="text-base text-gray-700 font-bold hover:text-purple-600 transition">
                          {formData.link && formData.link.startsWith('blob:') 
                            ? <span className="text-green-600 flex items-center justify-center gap-2"><CheckCircle size={18}/> File Selected</span> 
                            : "Click to browse files from your computer"
                          }
                        </p>
                        <p className="text-sm text-gray-400 mt-2">Supports JPG, PNG, MP4</p>
                      </label>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest text-gray-400">
                          <span className="bg-white/50 px-2 rounded">Or paste URL</span>
                        </div>
                      </div>

                      <input 
                        type="text" 
                        placeholder="Paste URL (YouTube, Behance, Drive, or Public Image URL)" 
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        value={!formData.link?.startsWith('blob:') ? formData.link : ''}
                        onChange={(e) => setFormData({...formData, link: e.target.value})}
                      />
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">Description</label>
                    <textarea 
                      className="w-full bg-white/70 border border-gray-200 rounded-xl p-4 h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none shadow-sm"
                      placeholder="Tell us about the inspiration behind this project..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 border border-gray-200 transition"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition transform hover:-translate-y-0.5"
                  >
                    Submit Project
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// --- VIEW: Project Details ---
function ProjectView({ navigate, project }) {
  if (!project) return null;

  // Helper to check if URL is a YouTube/External link or a local file
  const isExternalVideo = (url) => url.includes('http') || url.includes('www');

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <button onClick={() => navigate('gallery')} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black font-medium group px-4 py-2 rounded-lg hover:bg-white/50 transition w-fit">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Gallery
        </button>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Media Column */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-3xl overflow-hidden shadow-2xl mb-10 ring-4 ring-white/30">
              {/* Dynamic Media Player */}
              <div className="aspect-video relative flex items-center justify-center bg-gray-900">
                {project.category === 'Video' && project.videoUrl ? (
                   isExternalVideo(project.videoUrl) ? (
                     <iframe 
                        src={project.videoUrl} 
                        title={project.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                     ></iframe>
                   ) : (
                     <video 
                        src={project.videoUrl} 
                        className="w-full h-full"
                        controls
                        autoPlay={false}
                     >
                       Your browser does not support the video tag.
                     </video>
                   )
                ) : (
                  <>
                    <img src={project.image} alt={project.title} className="w-full h-full object-contain opacity-90" />
                    {project.category === 'Audio' && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                         <div className="w-24 h-24 bg-white/10 border border-white/20 backdrop-blur rounded-full flex items-center justify-center animate-pulse">
                           <Music size={40} className="text-white" />
                         </div>
                       </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="prose max-w-none px-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">{project.title}</h1>
                <div className="flex gap-2">
                   <button className="bg-white p-3 rounded-full hover:bg-gray-100 transition shadow-sm border border-gray-200 text-gray-600">
                      <Share2 size={20} />
                   </button>
                   <button className="bg-white p-3 rounded-full hover:bg-gray-100 transition shadow-sm border border-gray-200 text-gray-600">
                      <ExternalLink size={20} />
                   </button>
                </div>
              </div>
              
              <div className="glass-panel p-8 rounded-2xl mb-8">
                <p className="text-gray-700 leading-relaxed text-lg font-light">
                  {project.description}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {project.tags.map(tag => (
                  <span key={tag} className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 font-bold shadow-sm">#{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-8 shadow-xl">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Created By</h3>
              <div className="flex items-center gap-5 mb-8">
                
                {/* Updated Avatar Logic */}
                {project.profileImage ? (
                  <img 
                    src={project.profileImage} 
                    alt={project.creator} 
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl border-4 border-white shadow-md">
                    {project.creator.charAt(0)}
                  </div>
                )}

                <div>
                  <div className="font-bold text-2xl text-gray-900">{project.creator}</div>
                  <div className="text-purple-600 font-medium">{project.program}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1 font-medium">
                    <MapPin size={14} /> {project.city}
                  </div>
                </div>
              </div>
              <a 
                href={project.linkedin || "https://www.linkedin.com/"}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
              >
                View Profile
              </a>
            </div>

            <div className="glass-panel rounded-3xl p-8 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Engagement</h3>
                 <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded">HOT</span>
              </div>
              
              <div className="flex gap-4">
                <button className="flex-1 bg-white border border-pink-100 text-pink-600 py-3.5 rounded-xl font-bold hover:bg-pink-50 transition flex items-center justify-center gap-2 group">
                  <Heart fill="currentColor" className="group-hover:scale-110 transition-transform" /> {project.likes}
                </button>
              </div>
            </div>

             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
               <h3 className="font-bold text-xl mb-2 relative z-10">Hire this Talent</h3>
               <p className="text-blue-100 text-sm mb-6 relative z-10 leading-relaxed">Interested in collaborating with {project.creator} on your next big project?</p>
               <button className="w-full bg-white text-blue-600 font-bold py-3.5 rounded-xl hover:bg-blue-50 transition shadow-lg relative z-10">
                 Send Message
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}