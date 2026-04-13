# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, hot reload)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint across all JS/JSX files
npm run deploy     # Build + push to GitHub Pages (gh-pages -d dist)
```

No test suite is configured.

## Architecture

This is a **single-page React app** — nearly all logic lives in two files:

- `src/App.jsx` — the entire application (~1000+ lines). Contains all components, state, data, and page sections as one flat module.
- `src/Hero3D.jsx` — performance-optimized Three.js hero animation, lazy-loaded via `React.lazy`.

### Data flow

Submissions come from three sources, merged and deduplicated at runtime (Firestore takes priority):

1. **`INITIAL_PROJECTS`** — hardcoded seed data with local/CDN image assets served from `public/` (referenced via `BASE = import.meta.env.BASE_URL`).
2. **Firebase Firestore** (`projects` collection) — primary store for all new submissions. Each document includes `userId` (Firebase UID), creator info, media link, and metadata. Config lives in `src/firebase.js` — the user must paste their Firebase project credentials there.
3. **Google Sheets** — legacy read-only source for pre-Firebase submissions. POSTed via Apps Script `doPost` using `no-cors` FormData as a backup; read via `doGet`. Results cached in `sessionStorage` for 2 minutes (`CACHE_TTL`).

### Auth

Firebase Auth (email/password) guards the Submit form. `onAuthStateChanged` in `App()` keeps `authUser` state in sync. `AuthModal` handles sign-in and sign-up in a single modal component. The `users/{uid}` Firestore document stores `{ name, email, createdAt }` on sign-up.

### Profile pages

`ProfileView` receives a `creator` object `{ name, email, userId, program, city, ... }`. It filters the full `projects` array client-side matching on `creator`, `email`, or `userId`. All three are needed because legacy Google Sheets projects don't have a `userId`. Creator names in `GalleryView` and the "View Full Profile" button in `ProjectView` both navigate to `view === 'profile'` with the creator object in `selected` state.

### Brand palette

All colours are defined once in the `C` object at the top of `App.jsx` (ALX V2.26 brand guidelines). Always reference `C.navy`, `C.blue`, etc. rather than hardcoding hex values.

### Key patterns

- **`BASE` prefix** — all local `public/` assets must use `` `${BASE}filename` `` because the Vite base is `/alx-showcase-platform/` for GitHub Pages.
- **`SafeImage`** — use this component (not `<img>`) for any project image; it falls back to `FALLBACK_IMG` on error.
- **`SocialEmbed`** — handles YouTube (full iframe), TikTok (embed endpoint), and link-out cards for Instagram/LinkedIn/X/Facebook.
- **`useMagnetic`** — rAF-throttled magnetic button hook; use `MagneticButton` for CTAs.
- **`KenteDivider`** — ALX brand section separator; use between major page sections.

### Hero3D performance constraints

`Hero3D.jsx` is carefully tuned for low-end devices. If editing it:
- Keep to a single `useFrame` hook — multiple hooks are expensive.
- The `PerformanceMonitor` component auto-hides the canvas if the device can't sustain 30 fps.
- Geometry segment counts are intentionally low; don't raise them without profiling.

### Deployment

The site deploys to GitHub Pages at `https://alxcreativeeconomy.github.io/alx-showcase-platform/`. The Vite `base` config and all asset paths must stay consistent with this. Run `npm run deploy` to publish.
