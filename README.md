# 🎬 AuraDirector: Cinematic High-Reliability Pipeline

**AuraDirector** is an AI-powered cinematic video generation system that transforms raw story ideas into visually coherent teaser sequences using Google's Gemini and Veo APIs. The project uses a **4-phase pipeline** to eliminate generative randomness and ensure physical continuity in generated videos.

**Project for**: UCLA GenMedia Hackathon 2026

---

## 📊 Complete Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AuraDirector System                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─ FRONTEND LAYER ────────────────────────────────────────────────────────┐
│                                                                           │
│  index.html / style.css                 script.js                       │
│  ├─ Cinematic UI with starfield         ├─ 4-Phase State Machine       │
│  ├─ Input: Raw video idea               ├─ API Client (fetchAPI)       │
│  ├─ Sections:                           ├─ Polling for video status    │
│  │  ├─ Phase 1: Bible Lock              └─ Real-time UI updates       │
│  │  ├─ Phase 2: Staging Flow                                           │
│  │  ├─ Phase 3: Production Package                                     │
│  │  └─ Phase 4: Video Output                                           │
│  └─ Real-time status updates via polling                               │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    ↓
                            (HTTP POST/GET)
                                    ↓
┌─ BACKEND LAYER ────────────────────────────────────────────────────────┐
│                        Python aiohttp Server                             │
│                     (server.py - Port 8080)                             │
│                                                                           │
│  ┌─ ENDPOINTS ────────────────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  POST /api/lock_bible                                             │ │
│  │  │ Input: { idea: "user's vision" }                              │ │
│  │ │ Output: Proposal Bible (JSON)                                  │ │
│  │ │   ├─ projectTitle, upgradedLogline, thematicCore             │ │
│  │ │   ├─ unifiedFilmLanguage (visual style)                       │ │
│  │ │   ├─ characterIdentityLocks (name, physical, wardrobe)        │ │
│  │ │   ├─ dialogueArchitecture, scoreArchitecture                  │ │
│  │ │   └─ forbiddenMap (constraints to avoid)                      │ │
│  │                                                                     │ │
│  │  POST /api/stage_flow                                             │ │
│  │  │ Input: { bible: proposal_bible }                              │ │
│  │ │ Output: Staging Plan with 4 Fragments (JSON)                  │ │
│  │ │   ├─ SHOT 1: INVITATION (intro character)                     │ │
│  │ │   ├─ SHOT 2: COMPLICATION (introduce conflict)                │ │
│  │ │   ├─ SHOT 3: ESCALATION (emotional peak)                      │ │
│  │ │   └─ SHOT 4: CLIFFHANGER (unresolved ending)                  │ │
│  │ │   Each with: castCount, dialogueLine, actingIntention,        │ │
│  │ │              framing, incompletenessReason, scorePhase         │ │
│  │                                                                     │ │
│  │  POST /api/package_execution                                      │ │
│  │  │ Input: { bible, flow }                                        │ │
│  │ │ Output: Production Blueprints (JSON)                           │ │
│  │ │   ├─ 4 clips with hard-constraint generation prompts           │ │
│  │ │   ├─ Character locks (exact names/wardrobes)                   │ │
│  │ │   ├─ Anti-randomness locks (banned elements)                   │ │
│  │ │   └─ Resolution bans (especially for Shot 4)                   │ │
│  │                                                                     │ │
│  │  POST /api/generate_video                                         │ │
│  │  │ Input: { package, bible, flow }                               │ │
│  │ │ Returns: { job_id } (async task)                              │ │
│  │ │ Process:                                                        │ │
│  │ │   ├─ Lock Shot 1 (identity anchor)                             │ │
│  │ │   ├─ Generate Shots 2-4 in parallel                            │ │
│  │ │   ├─ Download video files                                      │ │
│  │ │   ├─ Compose with FFmpeg xfade transitions                     │ │
│  │ │   └─ Store in /static/videos/                                  │ │
│  │                                                                     │ │
│  │  GET /api/video_status/{job_id}                                   │ │
│  │  │ Returns: { status, progress, message, video_url }             │ │
│  │ │ Status: processing | completed | error                        │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─ GEMINI INTEGRATION ───────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  client.models.generate_content()                                 │ │
│  │  ├─ Model: gemini-3.1-flash-lite-preview                          │ │
│  │  ├─ System Instructions: LOCK_INSTRUCTION (Phase 1)               │ │
│  │  ├─                     STAGING_INSTRUCTION (Phase 2)             │ │
│  │  └─                     PRODUCTION_INSTRUCTION (Phase 3)          │ │
│  │  Config:                                                           │ │
│  │  ├─ temperature: 0.7 (balanced creativity)                        │ │
│  │  ├─ response_mime_type: application/json (strict validation)      │ │
│  │  ├─ Max Retries: 3 (with 2-5s backoff)                           │ │
│  │  └─ Error Handling: 503 graceful timeout                          │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─ VEO VIDEO GENERATION ─────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  client.models.generate_videos()                                  │ │
│  │  ├─ Model: veo-3.1-fast-generate-preview                          │ │
│  │  ├─ Resolution: 1920x1080 (16:9 aspect ratio)                     │ │
│  │  ├─ Duration: 6 seconds per clip                                  │ │
│  │  ├─ Videos per request: 1                                         │ │
│  │  ├─ Throttling: 10 RPM ceiling (async lock)                       │ │
│  │  ├─ Max Retries: 50 (quota exhaustion handling)                   │ │
│  │  └─ Jittered backoff: 15-60s between retries                      │ │
│  │                                                                     │ │
│  │  client.operations.get(operation)                                 │ │
│  │  └─ Poll async video generation status (every 5 seconds)          │ │
│  │                                                                     │ │
│  │  client.files.download(file)                                      │ │
│  │  └─ Download generated video to /static/videos/                   │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─ VIDEO COMPOSITION (FFmpeg) ───────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  ffmpeg with xfade filter                                         │ │
│  │  ├─ Input: 4 clips (clip_1, clip_2, clip_3, clip_4)             │ │
│  │  ├─ Transitions: xfade=fade (1s duration)                         │ │
│  │  ├─ Audio: acrossfade (crossfade audio between clips)             │ │
│  │  ├─ Codec: libx264 (H.264 video), aac (audio)                    │ │
│  │  ├─ Bitrate: 8Mbps video, 192kbps audio                          │ │
│  │  └─ Output: teaser_<job_id>.mp4 in /static/videos/              │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    ↓
                            (HTTP GET /static/)
                                    ↓
┌─ STORAGE LAYER ────────────────────────────────────────────────────────┐
│                                                                           │
│  /static/videos/                                                        │
│  ├─ clip_<job_id>_1.mp4 (temporary, deleted after output)             │
│  ├─ clip_<job_id>_2.mp4 (temporary, deleted after output)             │
│  ├─ clip_<job_id>_3.mp4 (temporary, deleted after output)             │
│  ├─ clip_<job_id>_4.mp4 (temporary, deleted after output)             │
│  └─ teaser_<job_id>.mp4 (final output - persisted)                    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 4-Phase Pipeline

### Phase 1: **THE LOCK** (Proposal Bible)
Converts raw ideas into structured creative mandates:

**Input**: User's story concept  
**Process**: Gemini generates JSON proposal  
**Output**:
- Project title & elevated logline
- Unified film language (visual consistency)
- Character identity locks (exact physical traits + wardrobe)
- Dialogue & score architecture
- Forbidden element map (anti-randomness constraints)

```json
{
  "projectTitle": "The Negotiation",
  "unifiedFilmLanguage": "35mm anamorphic, heavy shadows, emerald/amber palette",
  "characterIdentityLocks": {
    "main": {
      "name": "Elena Voss",
      "physical": "Late 40s, sharp features, piercing grey eyes",
      "wardrobe": "Dark wool overcoat, white linen shirt"
    }
  },
  "forbiddenMap": ["Extra people", "Modern tech", "Smiling faces"]
}
```

---

### Phase 2: **THE STAGING** (Narrative Teaser)
Selects 4 purposeful fragments from the Bible:

**Input**: Proposal Bible  
**Output**: 4-shot structure with:

| Shot | Role | Purpose |
|------|------|---------|
| 1 | **INVITATION** | Establish atmosphere, introduce main character |
| 2 | **COMPLICATION** | Introduce conflict or second character |
| 3 | **ESCALATION** | Visual intensity or narrative pivot |
| 4 | **CLIFFHANGER** | Unresolved ending (must stop before resolution) |

Each shot includes:
- Cast count (exact number of people)
- Dialogue line
- Acting intention
- Directorial framing
- Score phase (musical direction)
- **Incompleteness mandate** (why it's unfinished)

---

### Phase 3: **THE PACKAGE** (Production Blueprints)
Converts staging into hard-constraint generation prompts:

**Input**: Bible + Staging Flow  
**Output**: 4 locked video prompts with:
- Unified film language prefix (visual consistency)
- Character name/wardrobe locks (no substitution)
- Action description
- Dialogue context
- Anti-randomness locks (banned extras, style mandates)
- **Resolution ban for Shot 4** (explicit "do not finish" instruction)

---

### Phase 4: **THE PRODUCTION** (Video Generation)
Generates 4 clips and composites into final teaser:

**Process**:
1. Generate Shot 1 sequentially (identity anchor)
2. Generate Shots 2-4 in parallel (throttled at 10 RPM)
3. Poll async operations until completion (50 retries max)
4. Download all 4 clips to `/static/videos/`
5. Compose with FFmpeg xfade transitions (1s cross-dissolves)
6. Cleanup temporary files

**Output**: `teaser_<job_id>.mp4` (24s total: 6s × 4 + transitions)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JS | Cinematic UI, state management |
| **Backend** | Python 3, aiohttp | REST API, async processing |
| **GenAI** | Gemini 3.1 Flash-Lite | Text generation (3 phases) |
| **GenVideo** | Veo 3.1 | Video clip generation (4 clips) |
| **Composition** | FFmpeg | Video merging with xfade |
| **Auth** | Google API Key | Gemini/Veo API access |
| **Deployment** | Python + aiohttp | Local server (port 8080) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Google API Key (with Gemini/Veo access)
- FFmpeg (for video composition)

### Installation

```bash
cd "Demoing VEO"

# 1. Set up environment
cp .env.example .env
# Edit .env and add: GOOGLE_API_KEY=your_key_here

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# OR
.venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start server
python3 server.py
```

Or use the provided launcher:
```bash
bash run.sh
```

The server will start at: **http://localhost:8080**

---

## 📝 Usage

### Step 1: Enter Your Vision
1. Go to http://localhost:8080
2. Type your video concept in the input box
3. Click **"LOCK THE BIBLE"**

Example:
> "A tense negotiation between a diplomat and a rebel leader, unresolved after a shocking revelation"

### Step 2: Generate Staging Plan
1. Wait for Bible to generate
2. Click **"DESIGN STAGING PLAN"**
3. Review the 4-shot structure with dialogue and framing

### Step 3: Create Production Blueprints
1. Click **"GENERATE PRODUCTION PACKAGE"**
2. Review the locked video generation prompts
3. Optionally edit individual shot prompts

### Step 4: Produce Videos
1. Click **"PRODUCE VIDEO"**
2. Watch real-time production status
3. Final teaser plays when complete

---

## 📦 API Reference

All endpoints require `Content-Type: application/json`

### `POST /api/lock_bible`
**Generate creative proposal**
```bash
curl -X POST http://localhost:8080/api/lock_bible \
  -H "Content-Type: application/json" \
  -d '{"idea": "A tense negotiation with an unexpected twist"}'
```

**Response**: `{ projectTitle, upgradedLogline, thematicCore, ... }`

---

### `POST /api/stage_flow`
**Generate 4-shot staging plan**
```bash
curl -X POST http://localhost:8080/api/stage_flow \
  -H "Content-Type: application/json" \
  -d '{"bible": {...}}'
```

**Response**: `{ selectedFragments: [ { role, castCount, dialogueLine, ... }, ... ] }`

---

### `POST /api/package_execution`
**Generate hard-constraint video prompts**
```bash
curl -X POST http://localhost:8080/api/package_execution \
  -H "Content-Type: application/json" \
  -d '{"bible": {...}, "flow": {...}}'
```

**Response**: `{ clips: [ { id, prompt, duration }, ... ] }`

---

### `POST /api/generate_video`
**Start async video generation**
```bash
curl -X POST http://localhost:8080/api/generate_video \
  -H "Content-Type: application/json" \
  -d '{"package": {...}, "bible": {...}, "flow": {...}}'
```

**Response**: `{ job_id: "uuid-string" }`

---

### `GET /api/video_status/{job_id}`
**Poll video generation progress**
```bash
curl http://localhost:8080/api/video_status/550e8400-e29b-41d4-a716-446655440000
```

**Response**:
```json
{
  "status": "processing",
  "progress": 65,
  "message": "Gathered 3/4 Parallel Clips..."
}
```

**or when complete**:
```json
{
  "status": "completed",
  "progress": 100,
  "video_url": "/static/videos/teaser_550e8400-e29b-41d4-a716-446655440000.mp4"
}
```

---

## ⚙️ Configuration

### Environment Variables (`.env`)
```env
# Required: Google API key with Gemini/Veo access
GOOGLE_API_KEY=AIza...

# Optional: GCP project ID (for Vertex AI future integration)
GOOGLE_CLOUD_PROJECT=your-project-id

# Optional: Google Cloud Storage bucket (for future use)
GCS_BUCKET_NAME=your-bucket
```

### Server Settings (`server.py`)
```python
HTTP_PORT = 8080                                         # Server port
MODEL_ID = "gemini-3.1-flash-lite-preview"             # Text generation
VIDEO_MODEL = "veo-3.1-fast-generate-preview"          # Video generation
max_shot_retries = 50                                    # Max video retries
veo_throttle_lock = 10 RPM ceiling                      # Rate limiting
```

---

## 🎨 Customization

### Modify System Prompts

Edit the instruction strings in `server.py`:

- **`LOCK_INSTRUCTION`** (line ~45): Controls Phase 1 output structure
- **`STAGING_INSTRUCTION`** (line ~95): Controls Phase 2 staging rules
- **`PRODUCTION_INSTRUCTION`** (line ~150): Controls Phase 3 prompt generation

### Adjust Video Parameters

In `produce_single_shot()` function:
```python
config=types.GenerateVideosConfig(
    aspect_ratio="16:9",      # Change ratio
    duration_seconds=6,        # Clip length
    number_of_videos=1         # Videos per prompt
)
```

### Change FFmpeg Composition

In `produce_video()` around line 280:
```python
xfade_cmd = [
    "ffmpeg", "-y",
    # ...
    "-filter_complex", 
    "[0:v][1:v]xfade=transition=fade:duration=1:offset=5[v1]; ..."
    # Adjust: transition type, duration, offset
]
```

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 8080 is already in use
lsof -i :8080

# Kill process
kill -9 <PID>
```

### "ModuleNotFoundError: No module named 'aiohttp'"
```bash
pip install -r requirements.txt
# Or manually
pip install aiohttp google-genai python-dotenv
```

### "GOOGLE_API_KEY not found"
1. Create `.env` file in project root
2. Add: `GOOGLE_API_KEY=your_actual_key`
3. Restart server

### Gemini Returns 403 Permission Error
- Verify API key has Gemini/Veo access in Google Cloud Console
- Check rate limits: https://console.cloud.google.com/

### Video Generation Times Out
- Veo can take 1-3 minutes per 6s clip
- Server retries up to 50 times with jittered backoff
- If rate limited, check quota in Google Cloud Console

### FFmpeg Not Found
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

---

## 📈 Performance & Limits

| Metric | Value | Notes |
|--------|-------|-------|
| Gemini Requests/Min | ~3-5 | Only Phase 1-3 |
| Veo Generation/Min | 10 (throttled) | V37 rate limit |
| Per-Clip Duration | 6s | Fixed |
| Ideal Clip Latency | 60-180s | Varies by queue |
| Full Pipeline Time | 5-15 min | Depends on Veo queue |
| Storage per Video | ~50-100 MB | 24s composite |

---

## 🔒 Anti-Randomness Features

This system eliminates common generative AI problems:

✅ **Character Consistency**: Identity locks ensure same person across shots  
✅ **Style Uniformity**: Film language prefix on every prompt  
✅ **No Extras**: Explicit cast counts prevent random people  
✅ **Dialogue Fidelity**: Exact quoted dialogue in prompts  
✅ **Resolution Bans**: Shot 4 explicitly mandated to be unresolved  
✅ **Wardrobe Lock**: Exact clothing specified in character data  
✅ **Forbidden Map**: Explicit list of elements to avoid  

---

## 🎬 Example Output

**Input Idea**:
> "A ruthless CEO confronted by their past in a high-rise boardroom"

**Generated Bible**:
- **Title**: "The Reckoning"
- **Character**: Marcus Steele, 55, silver-haired, charcoal suit
- **Film Language**: "Corporate cold aesthetics, steel tones, single light source"

**4-Shot Teaser**:
1. Marcus alone, receiving a mysterious call (invitation)
2. Woman enters, confrontation begins (complication)
3. She reveals damaging secret (escalation)
4. Marcus silent reaction, camera freeze on his face (cliffhanger)

**Output**: 24-second video teaser with all elements locked and reproducible.

---

## 📄 License

Project for UCLA GenMedia Hackathon 2026

---

## 🤝 Contributing

For hackathon submissions:
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📞 Support

For questions during the hackathon:
- Check the `.env` configuration
- Verify GOOGLE_API_KEY is valid
- Review server logs for detailed error messages
- Test individual APIs with `curl` command examples above

---

**Built with ❤️ for UCLA GenMedia Hack 2026**
