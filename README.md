# AuraDirector

**AI-powered cinematic pre-production — from raw story idea to a locked, composited teaser video in one pipeline.**

AuraDirector solves the core problem of generative video: randomness. Every AI video tool produces visually inconsistent clips. Characters change faces between shots. Wardrobes morph. Extra people appear. Style drifts. AuraDirector eliminates all of this through a **4-phase lock system** — each phase makes the next phase impossible to contradict.

Built for the **UCLA Gemini API Hackathon 2026** · Powered by **Gemini 3.1**, **Veo 3.1**, and **FFmpeg**

---

## Why AuraDirector Is Different

Every other approach to AI video generation treats each clip as an independent generation. AuraDirector treats the entire teaser as a single locked creative document.

| The problem | How we solve it |
|---|---|
| Characters look different in every shot | Phase 1 locks exact physical traits and wardrobe before any video is generated |
| Visual style drifts across clips | A unified film language prefix is injected into every single Veo prompt |
| Random extras appear in the background | Phase 3 includes explicit cast counts and a forbidden element map |
| Shot 4 accidentally resolves the story | An explicit resolution ban is enforced at the prompt level — the cliffhanger is mandated |
| Dialogue changes or disappears | Exact dialogue is quoted verbatim inside each generation prompt |

This is the **high-reliability pipeline** — the same principles a professional pre-production workflow uses, encoded as AI constraints.

---

## The 4-Phase Pipeline

```
User Idea
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 1 — THE LOCK                                     │
│  Gemini generates the Proposal Bible                    │
│  Character identity · Visual language · Forbidden map  │
└───────────────────────────────┬─────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 2 — THE STAGING                                  │
│  4-shot narrative structure from the Bible              │
│  Invitation · Complication · Escalation · Cliffhanger  │
└───────────────────────────────┬─────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 3 — THE PACKAGE                                  │
│  Hard-constraint generation prompts for each shot       │
│  Identity locks · Anti-randomness · Resolution ban      │
└───────────────────────────────┬─────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 4 — THE PRODUCTION                               │
│  Veo 3.1 generates 4 clips · FFmpeg composites them    │
│  Shot 1 sequential · Shots 2–4 parallel · xfade output │
└───────────────────────────────┬─────────────────────────┘
                                │
                                ▼
              teaser_<job_id>.mp4  (~24 seconds)
```

---

## Phase Details

### Phase 1 — The Lock
*Converts a raw idea into a structured creative mandate that every downstream phase must obey.*

Gemini 3.1 Flash-Lite generates a **Proposal Bible** in strict JSON:

```json
{
  "projectTitle": "The Negotiation",
  "upgradedLogline": "A diplomat's final offer becomes her last mistake.",
  "unifiedFilmLanguage": "35mm anamorphic, heavy shadows, emerald/amber palette, no handheld",
  "characterIdentityLocks": {
    "main": {
      "name": "Elena Voss",
      "physical": "Late 40s, sharp features, piercing grey eyes, scar above left brow",
      "wardrobe": "Dark wool overcoat, white linen shirt, no jewelry"
    }
  },
  "dialogueArchitecture": "Sparse. Single devastating lines. No exposition.",
  "scoreArchitecture": "Low strings, no resolution chord until cut to black",
  "forbiddenMap": ["Extra background people", "Modern technology", "Smiling faces", "Sunlight"]
}
```

The Bible is the constitution. Nothing generated in Phases 2–4 can contradict it.

---

### Phase 2 — The Staging
*Selects 4 purposeful dramatic fragments that form a complete emotional arc without resolving it.*

| Shot | Dramatic Role | Mandate |
|------|--------------|---------|
| **1 · Invitation** | Establish world and protagonist | Atmosphere first, character second |
| **2 · Complication** | Introduce conflict or second force | Something changes that cannot be unchanged |
| **3 · Escalation** | Visual or emotional intensity peak | The audience leans forward |
| **4 · Cliffhanger** | Unresolved ending | Explicitly must NOT resolve — the story stops mid-breath |

Each shot locks: cast count, exact dialogue line, acting intention, directorial framing, and musical phase direction.

The incompleteness of Shot 4 is a **feature, not a bug**. A teaser that resolves is a short film. A teaser that stops is an invitation.

---

### Phase 3 — The Package
*Translates the staging plan into hard-constraint Veo generation prompts.*

Every prompt is prefixed with the unified film language from Phase 1. Character names, wardrobes, and physical descriptions are embedded verbatim — no paraphrasing. The forbidden map items become explicit negative instructions. Shot 4 receives an additional resolution ban: the model is explicitly instructed to generate a moment that is visually and narratively incomplete.

This is the layer where creative intent becomes machine instruction.

---

### Phase 4 — The Production
*Generates the clips and composites the final teaser.*

```
1. Generate Shot 1 sequentially      → identity anchor for all parallel generations
2. Generate Shots 2–4 in parallel   → throttled at 10 RPM ceiling (Veo rate limit)
3. Poll all async operations         → up to 50 retries with 15–60s jittered backoff
4. Download all 4 clips              → /static/videos/clip_<job_id>_N.mp4
5. Compose with FFmpeg               → xfade transitions (1s cross-dissolve between clips)
6. Clean up temporary files          → only teaser_<job_id>.mp4 persists
```

Final output: ~24 seconds (4 × 6s clips + 1s transitions), H.264, 8Mbps, 1080p.

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | HTML5 · CSS3 · Vanilla JS | Cinematic UI, 4-phase state machine, async polling |
| Backend | Python 3 · aiohttp | REST API server, async job management |
| Text generation | Gemini 3.1 Flash-Lite | Phases 1, 2, and 3 — strict JSON output |
| Video generation | Veo 3.1 Fast | 4 × 6-second clips with locked prompts |
| Composition | FFmpeg | xfade transitions, audio crossfade, H.264 output |
| Auth | Google API Key | Gemini + Veo access |

---

## Full System Architecture

```
┌─ FRONTEND ──────────────────────────────────────────────────────────────┐
│                                                                           │
│  index.html + style.css                  script.js                      │
│  ├─ Cinematic starfield UI               ├─ 4-phase state machine       │
│  ├─ Input: raw video idea                ├─ fetchAPI client             │
│  ├─ Phase 1: Bible Lock panel            ├─ Async job polling           │
│  ├─ Phase 2: Staging Flow panel          └─ Real-time status updates    │
│  ├─ Phase 3: Production Package panel                                    │
│  └─ Phase 4: Video Output panel                                          │
│                                                                           │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │  HTTP POST / GET
                                   ▼
┌─ BACKEND (server.py · port 8080) ───────────────────────────────────────┐
│                                                                           │
│  POST /api/lock_bible          → Phase 1 · returns Proposal Bible JSON  │
│  POST /api/stage_flow          → Phase 2 · returns 4-shot staging plan  │
│  POST /api/package_execution   → Phase 3 · returns locked Veo prompts   │
│  POST /api/generate_video      → Phase 4 · starts async job, returns ID │
│  GET  /api/video_status/{id}   → Phase 4 · polls job progress           │
│                                                                           │
│  ┌─ GEMINI INTEGRATION ──────────────────────────────────────────────┐  │
│  │  client.models.generate_content()                                 │  │
│  │  model: gemini-3.1-flash-lite-preview                             │  │
│  │  response_mime_type: application/json  (strict — no loose text)   │  │
│  │  temperature: 0.7  ·  max retries: 3  ·  backoff: 2–5s           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─ VEO INTEGRATION ─────────────────────────────────────────────────┐  │
│  │  client.models.generate_videos()                                  │  │
│  │  model: veo-3.1-fast-generate-preview                             │  │
│  │  aspect_ratio: 16:9  ·  duration: 6s  ·  1 video per request     │  │
│  │  throttle: 10 RPM async lock  ·  max retries: 50                  │  │
│  │  backoff: 15–60s jittered                                         │  │
│  │  client.operations.get()  →  poll every 5s until done             │  │
│  │  client.files.download()  →  save to /static/videos/              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─ FFMPEG COMPOSITION ──────────────────────────────────────────────┐  │
│  │  Input: clip_1.mp4 · clip_2.mp4 · clip_3.mp4 · clip_4.mp4        │  │
│  │  Filter: xfade=fade · duration=1s · offset per clip               │  │
│  │  Audio: acrossfade between clips                                  │  │
│  │  Output: teaser_<job_id>.mp4                                      │  │
│  │  Codec: libx264 · 8Mbps · aac · 192kbps                          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │  HTTP GET /static/
                                   ▼
┌─ STORAGE (/static/videos/) ──────────────────────────────────────────────┐
│  clip_<job_id>_1.mp4  ·  clip_<job_id>_2.mp4  ·  clip_<job_id>_3.mp4   │
│  clip_<job_id>_4.mp4  →  deleted after composition                       │
│  teaser_<job_id>.mp4  →  persisted as final output                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Python 3.8+
- Google API key with Gemini and Veo access enabled
- FFmpeg installed on your system

### Installation

```bash
# 1. Navigate to project folder
cd "Demoing VEO"

# 2. Copy and configure environment
cp .env.example .env
# Open .env and set: GOOGLE_API_KEY=your_key_here

# 3. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate       # macOS / Linux
# .venv\Scripts\activate        # Windows

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start the server
python3 server.py
# or: bash run.sh
```

Open **http://localhost:8080** in your browser.

---

## Usage

### Step 1 — Enter your vision
Type a story concept into the input field and click **LOCK THE BIBLE**.

Good inputs give the system something specific to lock:

```
"A tense negotiation between a diplomat and a rebel leader,
unresolved after a shocking revelation"
```

```
"A ruthless CEO confronted by their past in a high-rise boardroom
at midnight — they are not alone"
```

### Step 2 — Review the staging plan
Click **DESIGN STAGING PLAN**. Review the 4-shot structure — each shot shows its dramatic role, the locked dialogue line, cast count, and directorial framing. The cliffhanger shot will explicitly state why it does not resolve.

### Step 3 — Generate production blueprints
Click **GENERATE PRODUCTION PACKAGE**. Review the locked Veo prompts. Each prompt is a single paragraph that encodes every constraint from the Bible. You can edit individual shot prompts before generating video.

### Step 4 — Produce the teaser
Click **PRODUCE VIDEO**. Real-time status shows progress across all 4 clips. The final composited teaser plays in the browser when complete.

Expected time: **5–15 minutes** depending on Veo queue depth.

---

## API Reference

All endpoints accept and return `application/json`.

### `POST /api/lock_bible`
Generate the Proposal Bible from a raw idea.

```bash
curl -X POST http://localhost:8080/api/lock_bible \
  -H "Content-Type: application/json" \
  -d '{"idea": "A tense negotiation with an unexpected twist"}'
```

Returns: `{ projectTitle, upgradedLogline, thematicCore, unifiedFilmLanguage, characterIdentityLocks, dialogueArchitecture, scoreArchitecture, forbiddenMap }`

---

### `POST /api/stage_flow`
Generate the 4-shot staging plan from the Bible.

```bash
curl -X POST http://localhost:8080/api/stage_flow \
  -H "Content-Type: application/json" \
  -d '{"bible": { ... }}'
```

Returns: `{ selectedFragments: [ { role, castCount, dialogueLine, actingIntention, framing, incompletenessReason, scorePhase } ] }`

---

### `POST /api/package_execution`
Generate hard-constraint Veo prompts from the Bible and staging plan.

```bash
curl -X POST http://localhost:8080/api/package_execution \
  -H "Content-Type: application/json" \
  -d '{"bible": { ... }, "flow": { ... }}'
```

Returns: `{ clips: [ { id, prompt, duration } ] }`

---

### `POST /api/generate_video`
Start async video generation. Returns immediately with a job ID.

```bash
curl -X POST http://localhost:8080/api/generate_video \
  -H "Content-Type: application/json" \
  -d '{"package": { ... }, "bible": { ... }, "flow": { ... }}'
```

Returns: `{ job_id: "uuid-string" }`

---

### `GET /api/video_status/{job_id}`
Poll generation progress.

```bash
curl http://localhost:8080/api/video_status/550e8400-e29b-41d4-a716-446655440000
```

In progress:
```json
{ "status": "processing", "progress": 65, "message": "Gathered 3/4 Parallel Clips..." }
```

Complete:
```json
{
  "status": "completed",
  "progress": 100,
  "video_url": "/static/videos/teaser_550e8400-e29b-41d4-a716-446655440000.mp4"
}
```

---

## Configuration

### Environment Variables (`.env`)

```env
# Required
GOOGLE_API_KEY=AIza...

# Optional — for Vertex AI integration
GOOGLE_CLOUD_PROJECT=your-project-id
GCS_BUCKET_NAME=your-bucket-name
```

### Key Server Settings (`server.py`)

```python
HTTP_PORT = 8080
MODEL_ID   = "gemini-3.1-flash-lite-preview"   # Text generation (Phases 1–3)
VIDEO_MODEL = "veo-3.1-fast-generate-preview"   # Video generation (Phase 4)
max_shot_retries = 50                            # Max Veo retries before failure
# veo_throttle_lock enforces 10 RPM ceiling across all parallel generations
```

### Adjusting Video Output

```python
# In produce_single_shot()
config = types.GenerateVideosConfig(
    aspect_ratio="16:9",    # "9:16" for portrait/mobile
    duration_seconds=6,      # 4, 6, or 8
    number_of_videos=1
)
```

### Adjusting Transitions

```python
# In produce_video() — xfade filter chain
# xfade=transition=fade  →  change to: dissolve, wipeleft, slideleft, etc.
# duration=1             →  transition length in seconds
# offset=5               →  when to start (clip_duration - transition_duration)
```

### Modifying the System Prompts

The three instruction strings in `server.py` control what Gemini generates in each phase:

- `LOCK_INSTRUCTION` — controls the structure and constraints of the Proposal Bible
- `STAGING_INSTRUCTION` — controls the 4-shot narrative logic and incompleteness mandate
- `PRODUCTION_INSTRUCTION` — controls how prompts are constructed from the Bible + staging data

Edit these to change the creative philosophy of the system.

---

## Performance Reference

| Metric | Value | Notes |
|---|---|---|
| Phase 1–3 latency | 3–8s each | Gemini Flash-Lite, JSON mode |
| Veo generation per clip | 60–180s | Varies significantly by queue |
| Full pipeline (4 clips) | 5–15 min | Shots 2–4 run in parallel |
| FFmpeg composition | 10–30s | Depends on clip file sizes |
| Final output size | ~50–100 MB | 24s · H.264 · 1080p · 8Mbps |
| Veo rate limit | 10 RPM | Enforced by async throttle lock |
| Max retries | 50 per shot | With 15–60s jittered backoff |

---

## Troubleshooting

**Port 8080 already in use**
```bash
lsof -i :8080
kill -9 <PID>
```

**`ModuleNotFoundError: No module named 'aiohttp'`**
```bash
pip install -r requirements.txt
```

**`GOOGLE_API_KEY not found`**
Make sure `.env` exists in the project root with `GOOGLE_API_KEY=your_actual_key`. Restart the server after editing.

**403 Permission Error from Gemini / Veo**
Verify the API key has Gemini and Veo access enabled in Google Cloud Console. Check quota limits at `console.cloud.google.com`.

**Video generation times out after many retries**
Veo can experience extended queue times. Check your quota at Google Cloud Console. The server will retry up to 50 times automatically — no action needed unless you hit quota limits.

**FFmpeg not found**
```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg

# Windows — download from ffmpeg.org/download.html
```

---

## Example: End-to-End Run

**Input:**
> "A ruthless CEO confronted by their past in a high-rise boardroom"

**Phase 1 output (Bible):**
- Title: *The Reckoning*
- Character: Marcus Steele, 55, silver hair, charcoal suit, no tie
- Film language: Corporate cold aesthetics, steel-blue tones, single hard light source from above
- Forbidden: natural light, smiling, background staff, warm color grading

**Phase 2 output (Staging):**
1. Marcus alone at the boardroom window — phone call he doesn't answer *(Invitation)*
2. A woman enters from the service door — he recognizes her face *(Complication)*
3. She places a document on the table — he reads it standing, does not sit *(Escalation)*
4. Camera holds on his face after he finishes reading — he says nothing — cut *(Cliffhanger)*

**Phase 4 output:**
Four locked clips, composited → `teaser_<job_id>.mp4` · 24 seconds · 1080p

---

## License

Built for the UCLA Gemini API Hackathon 2026.

---

*AuraDirector — Because generative randomness is the enemy of cinema.*
