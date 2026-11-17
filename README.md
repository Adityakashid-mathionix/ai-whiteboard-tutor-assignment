# Braynix Studios — AI-Powered Interactive Whiteboard Tutor

> **Official Technical Assignment Submission for Braynix Studios**  
> An autonomous AI learning platform that explains any educational or technical concept through synchronized voice narration, real-time SVG whiteboard animations, and interactive follow-up Q&A.

**🌐 Live Production Deployment:** [https://ai-whiteboard-tutor-two.vercel.app](https://ai-whiteboard-tutor-two.vercel.app)  
**⚡ Alternate Deployment:** [https://ai-whiteboard-tutor-ghzgw163w-bhau-ki-team.vercel.app](https://ai-whiteboard-tutor-ghzgw163w-bhau-ki-team.vercel.app)

---

## 🌟 Executive Summary & Product Vision

Traditional online education typically oscillates between two extremes: static video lectures (passive, non-interactive, fixed pace) and text-only chatbot interfaces (lacking spatial hierarchy, visual intuition, and spoken flow).

The **Braynix Studios AI Interactive Whiteboard Tutor** re-imagines digital tutoring. When a learner requests any topic:
1. **AI Lesson Architecture**: NVIDIA NIM decomposes the concept into a progressive 4–6 segment masterclass (~120 seconds).
2. **Generative SVG Whiteboard**: The tutor dynamically plans visual vectors—shapes, system flows, arrows, and highlight regions within a normalized $1000 \times 600$ viewport.
3. **Synchronized Voice Narration**: Powered by the browser-native Web Speech API (`SpeechSynthesisUtterance`), the tutor narrates each segment while drawing the corresponding whiteboard elements in real time.
4. **Interactive Playback Controls**: Full transport deck enabling Play, Pause, Resume, Chapter Seeking, Restart, and Speed Multipliers ($0.75\times, 1.0\times, 1.25\times, 1.5\times$).
5. **Contextual Socratic Follow-Up**: Students can ask questions at any point. The AI receives the original topic, segment transcripts, and conversation history to deliver crystal-clear explanations.

---

## 🛠️ Architecture & Technology Stack

```
                              ┌──────────────────────────────────┐
                              │       Student / Web Client       │
                              │  (Next.js App Router, Tailwind)  │
                              └─────────────────┬────────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
        ┌─────────────────────────┐                           ┌─────────────────────────┐
        │   Interactive Studio    │                           │  Next.js Route Handlers │
        │  - SVG Vector Engine    │                           │  - /api/generate-lesson │
        │  - SpeechSynthesis Sync │                           │  - /api/ask-question    │
        │  - Framer Motion Paths  │                           └────────────┬────────────┘
        │  - Transport Scrubber   │                                        │
        └─────────────────────────┘                                        ▼
                                                              ┌─────────────────────────┐
                                                              │  AI Provider Abstraction│
                                                              │  (lib/ai/provider.ts)   │
                                                              └────────────┬────────────┘
                                                                           │
                                                                           ▼
                                                              ┌─────────────────────────┐
                                                              │       NVIDIA NIM        │
                                                              │  (Hosted Inference API) │
                                                              │  Nemotron 3.5 Lightning │
                                                              └─────────────────────────┘
```

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript (Strict Mode), Tailwind CSS.
- **Animations & Microinteractions**: Framer Motion (SVG `pathLength`, opacity, scaling), Canvas Confetti.
- **Whiteboard Engine**: Custom SVG action renderer with strict discriminated union types (`addText`, `drawLine`, `drawCircle`, `drawRect`, `drawPath`, `drawArrow`, `highlight`, `addLabel`, `erase`, `clear`).
- **Voice Engine**: Browser-native Web Speech API (`SpeechSynthesisUtterance`) with event tracking (`onstart`, `onend`, `onpause`, `onresume`, `onerror`), fallback timer simulation when muted.
- **AI Core**: NVIDIA NIM hosted inference (`nvidia/nemotron-3.5-lightning-30b-a3b`) with clean provider abstraction (`lib/ai/provider.ts`) and Zod schema validation.
- **Deployment**: Vercel Serverless.

---

## 🎨 Visual & UX Craftsmanship

The interface is designed with a **Linear & Apple** aesthetic:
- **Obsidian Dark Foundation**: Deep graphite `#060911` palette with micro-dot matrix grid and coordinate guides.
- **Controlled SVG Primitives**: No raw innerHTML or dangerous script injection. Every element is typed and validated through Zod.
- **Live Laser Pointer & Visualizer**: An active laser pointer tracks the element currently being explained, alongside an audio oscilloscope wave.
- **Ergonomic Transport Deck**: Centralized tactile transport controls with chapter scrubber, speed pills, and global keyboard shortcuts (`Space` to toggle playback, `←` / `→` to navigate chapters, `M` to mute).

---

## 🧪 Verified Topics (Comprehensive Test Suite)

The application has been verified end-to-end with the 5 required curriculum subjects:

| Subject | Topic | Whiteboard Visual Demonstration | Verification Status |
| :--- | :--- | :--- | :---: |
| **1. Biology** | *How the Human Heart Works* | Dual pump, 4 chambers (atria/ventricles), pulmonary/systemic loops, ECG waveform | ✅ Verified |
| **2. Plant Biology** | *Photosynthesis* | Chloroplast organelle, sunlight photons, root water (H2O), stomatal CO2, glucose/O2 equation | ✅ Verified |
| **3. Physics** | *Newton's Third Law* | Matched action-reaction force vectors, formula $F_{AB} = -F_{BA}$, rocket propulsion | ✅ Verified |
| **4. Mobile Systems** | *React Native Architecture* | JS thread, Native main thread, C++ JSI bridge, Fabric concurrent renderer, TurboModules | ✅ Verified |
| **5. Software Engineering** | *How an API Works* | Client app, cloud server & database, HTTP GET request arrow, JSON response payload | ✅ Verified |

---

## ⚙️ Environment Variables & Setup

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v22)
- npm 9+

### 2. Environment Configuration
Create a `.env.local` file in the project root (see `.env.example`):

```bash
# NVIDIA NIM API Key (Obtain free 1000 credits from https://build.nvidia.com)
NVIDIA_API_KEY=nvapi-your-key-here

# Selected High-Speed Reasoning Model
NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b

# Base Endpoint for NVIDIA NIM
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

> **Client Key Override**: Users and reviewers can also enter or test their own NVIDIA API key directly in the Studio via the **Settings** modal. Keys are transmitted only via secure server request headers and are never exposed in frontend bundles.

### 3. Installation & Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Or build and launch production server
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚀 Public Deployment Guide (Vercel)

To deploy to Vercel:

```bash
# Deploy with Vercel CLI
vercel --prod
```

Configure `NVIDIA_API_KEY` and `NVIDIA_MODEL` in your Vercel Project Settings under **Environment Variables**.

---

## 🛡️ Security & Performance Guarantees

- **Server-Side Secret Isolation**: `NVIDIA_API_KEY` is strictly confined to Next.js route handlers (`/api/*`).
- **No Unsafe HTML / SVG**: AI-generated responses are validated against `LessonSchema` using Zod before any node renders.
- **Zero-Mock Commitment**: Live requests interact with real inference endpoints; exemplary masterclasses serve as verified curriculum benchmarks.
- **Graceful Error Recovery**: Network timeouts, missing keys, or rate limits display actionable UI notices with instant exemplar fallbacks.

---

*Crafted with precision for the Braynix Studios Technical Assignment — November 2026.*
