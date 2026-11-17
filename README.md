# AI Whiteboard Tutor

An AI tutor that **explains a topic out loud while drawing it**. You type a subject, it
plans a 4–6 chapter lesson, speaks each chapter in a teacher's voice, and builds the
diagram that actually fits that explanation on a 1000 × 600 vector board you can
annotate, pause and question.

Built for the Braynix Studios technical assignment.

---

## What makes it different

Most "AI explains things" demos produce a wall of text, or the same generic two-box
diagram for every subject. The two hard problems here were **making the narration sound
like a person teaching** and **making the board mean something for an arbitrary topic**.

| | How it is handled |
|---|---|
| **Narration** | The prompt enforces spoken-language rules: short sentences, an everyday analogy before any abstraction, real names, numbers and dates, explicit signposting, and a closing line worth repeating. Vague filler ("plays a crucial role") is banned outright. |
| **The board** | The model never places pixels. It sends a compact *diagram brief* — what kind of picture and which labels — and a deterministic layout engine renders it. Legibility is guaranteed; the model still decides the content. |
| **Unknown topics** | If a brief is missing or thin, the engine reads the narration itself and infers the diagram: ordered steps, named parts, contrasted pairs, dated milestones, measured quantities, key terms. |
| **Honesty** | When the model is unreachable, the studio shows a labelled placeholder outline and says so. It never dresses a template up as a generated lesson. |

### The seven diagram archetypes

`topic-analysis.ts` scores the narration against each shape and picks the one the text
actually supports, with `concept` as the floor so a weak signal never fakes structure.

| Archetype | Chosen when the explanation… | Rendered as |
|---|---|---|
| `process` | moves through ordered stages | numbered boxes, left to right, with arrows |
| `cycle` | returns to where it started | stages around a ring |
| `comparison` | sets two things against each other | two labelled columns and a bridge arrow |
| `parts` | breaks a whole into named components | hub with branches |
| `timeline` | is dated | milestones on an axis |
| `quantity` | compares measured values | bar chart with real figures and units |
| `concept` | defines an idea | the definition, written out, plus the terms to keep |

So "how bridges stay up" gets *Truck pushes down on the deck → Deck spreads the load
sideways → Supports push into the ground → Ground pushes back up*, while "evolution of the
laptop" gets a dated axis. Neither gets "Component A".

---

## Architecture

```
Browser (Next.js App Router, React 18, Tailwind)
│
├── useLessonPlayer ── useSpeech        Web Speech API: voice choice, pause/resume
│                   └─ useWhiteboard    cumulative board state per chapter
│
├── Whiteboard.tsx                      SVG surface, pointer tools, progressive reveal
│
└── fetch → /api/generate-lesson  ─┐
          /api/ask-question        │   Zod validation · body cap · rate limit
                                   ▼
                            NvidiaNIMProvider
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
    lesson-cache            circuit-breaker            NVIDIA NIM
    TTL + LRU + dedupe      fatal vs transient         Nemotron 3.5
          │
          ▼
    normalize-lesson → layout engine (topic-analysis → diagrams → segment-layout)
```

**Module map**

| Path | Responsibility |
|---|---|
| `lib/ai/prompts.ts` | Prompt construction per depth level |
| `lib/ai/nvidia-provider.ts` | One `chat()` helper owning timeouts and typed errors |
| `lib/ai/normalize-lesson.ts` | Coerces loose model JSON into schema-valid actions |
| `lib/ai/extract-json.ts` | Pulls JSON out of fenced/prose replies, repairs truncation |
| `lib/ai/errors.ts` | `AIProviderError`, fatal vs transient classification |
| `lib/whiteboard/layout/topic-analysis.ts` | Reads narration, picks the archetype |
| `lib/whiteboard/layout/diagrams.ts` | Draws each archetype |
| `lib/whiteboard/layout/segment-layout.ts` | Composes title, diagram, notes, takeaway |
| `lib/whiteboard/safe-url.ts` | Media allowlist and SVG path grammar |
| `lib/cache/lesson-cache.ts` | TTL + LRU cache with request deduplication |
| `lib/rate-limit.ts` | Fixed-window limiter and request body cap |

---

## Engineering decisions worth calling out

**The model describes, the engine draws.** Asking a language model for 14 absolute SVG
coordinates per chapter produced overlapping shapes, off-canvas elements and replies long
enough to hit the token ceiling mid-JSON. Moving to a compact brief made generations
shorter, faster and far more reliable, and made every board legible by construction. The
model's own layout is still accepted — but only after passing a bounds and overlap check.

**Failures are classified, not swallowed.** A missing API key is a configuration problem
the user must see; a 502 from upstream is worth absorbing. `AIProviderError` separates the
two: fatal errors are rethrown as 401/429 and never trip the circuit breaker, transient
ones fall back to a clearly-labelled outline that is **never written to the cache** — one
blip should not pin a placeholder to a topic for 24 hours.

**The cache key is the whole question.** Topic, model and depth level, with the topic
normalised so "What is rabies?" and "rabies" share an entry while beginner and advanced do
not. In-flight deduplication means ten simultaneous requests for one topic cost one
generation.

**Truncation degrades gracefully.** A cut-off reply is repaired by closing its open
structures, so a long lesson loses its final chapter instead of failing entirely.

**Photographs are opt-in, not automatic.** Live image search returns off-topic results for
arbitrary subjects (a jet-engine lesson was illustrated with soldiers around a workbench).
Only hand-verified assets reach the board; everything else is taught with a drawn diagram,
which is always on-topic.

---

## Security

Model output is untrusted input, and the app is deployed without authentication, so both
are treated accordingly.

- **Media allowlist.** `drawImage` URLs are model-authored. Only `https` URLs on
  allowlisted Wikimedia hosts render — blocking `javascript:`, `data:`, `blob:`, plain
  `http`, credentialed URLs, look-alike hosts (`upload.wikimedia.org.evil.com`) and
  arbitrary tracking pixels. Enforced in the normaliser *and* again in the renderer.
- **SVG path grammar.** Path data reaches the DOM verbatim, so it is restricted to the
  characters a path can legitimately contain; anything else becomes `M 0 0`.
- **Board text** is React-escaped and additionally stripped of angle brackets, and every
  coordinate is clamped onto the canvas.
- **Content Security Policy** plus `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, a `Permissions-Policy` denying camera/microphone/geolocation, HSTS
  and COOP. `connect-src 'self'`: the browser never talks to the model provider directly.
- **Input validation.** Zod schemas on both routes, a model-id allowlist pattern, and a
  128 KB body cap checked before parsing.
- **Rate limiting.** Fixed-window per IP — 8 lessons/min on the deployment's shared key,
  40 for callers spending their own. (Swap the in-memory store for Redis to make this
  hold across instances.)
- **Keys.** A user key lives in their own browser and is sent only to this app's API
  route; it is never logged, and never written into a lesson or cache entry.

---

## Running it

```bash
npm install
cp .env.example .env.local   # add NVIDIA_API_KEY, or add one in Studio settings later
npm run dev
```

Open <http://localhost:3000>. The pre-built masterclasses on the home page run with no key
at all.

```bash
npm test          # 39 unit tests
npm run lint
npx tsc --noEmit
npm run build
```

CI runs all four on every push and pull request.

### Environment

| Variable | Required | Default |
|---|---|---|
| `NVIDIA_API_KEY` | for live generation | — |
| `NVIDIA_MODEL` | no | `nvidia/nemotron-3.5-lightning-30b-a3b` |
| `NVIDIA_BASE_URL` | no | `https://integrate.api.nvidia.com/v1` |

---

## Using the studio

| Control | |
|---|---|
| `Space` | play / pause |
| `←` `→` | previous / next chapter |
| `M` | mute (the board still advances on a timer) |
| Tools | inspect, pan, pen, highlighter, eraser, undo — mouse, pen and touch |
| Settings | pick the narration voice (with preview), model, and your own API key |

Click any element on the board to see what it represents. Pausing stops at the word being
spoken and resuming continues from there, not from the top of the chapter.

---

## Testing

39 unit tests cover the parts most likely to break quietly rather than loudly:

- JSON extraction from fenced, prose-wrapped and truncated model replies
- Lesson normalisation, board bounds, heading centring and action coercion
- Archetype selection for process, cycle, timeline, comparison and concept chapters
- Text fitting and wrapping against measured widths
- Cache key separation, and the rule that fallbacks are never cached
- Fatal-vs-transient error handling in the circuit breaker
- The rate limiter
- Security: media allowlist bypasses, hostile SVG paths, text sanitisation, coordinate
  clamping

---

## Stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · Zod ·
Framer Motion · Web Speech API · NVIDIA NIM (Nemotron 3.5) · Vitest
