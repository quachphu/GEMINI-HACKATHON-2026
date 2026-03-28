#!/usr/bin/env python3
"""
AuraDirector: Performance Realism & Scene-Level Hooks Pipeline (V30)
Physical Guardrails, Mid-Video Stability, and Narrative Endings.
Director's Proof-of-Concept: Optimized for flawless physical continuity.
"""

import asyncio
import json
import mimetypes
import os
import tempfile
import uuid
import shutil
import random
from aiohttp import web
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
if not os.environ.get("GOOGLE_API_KEY"):
    load_dotenv("../.env")

# Configuration
HTTP_PORT = 8080
API_KEY = os.environ.get("GOOGLE_API_KEY")
MODEL_ID = "gemini-3.1-flash-lite-preview"
VIDEO_MODEL = "veo-3.1-fast-generate-preview"

if not API_KEY:
    print("⚠️ Warning: GOOGLE_API_KEY not found. Please set it in .env.")

client = genai.Client(api_key=API_KEY)

# V37: Global Throttling Lock (10 RPM ceiling)
veo_throttle_lock = asyncio.Lock()

# --- PHASE 1: THE LOCK (PROPOSAL BIBLE) ---

LOCK_INSTRUCTION = """
You are a Senior Film-Development AI, Director of Photography, and Pitch Architect.
MISSION: Develop a raw idea into an **Operational Proposal Bible**. Your mission is to eliminate generative randomness by defining strict physical and narrative constraints.

### THE PROPOSAL BIBLE STRUCTURE:
1. **THE PITCH**: Title, Logline, Concept Strength, Thematic Core.
2. **THE UNIFIED FILM LANGUAGE**: Exact visual grammar (e.g., '35mm anamorphic photorealism, heavy shadows, emerald/amber palette').
3. **CHARACTER IDENTITY LOCKS**:
    - **Main Character**: Name, Age, Exact build, Eye color, Hair style/color, SPECIFIC WARDROBE (e.g., 'Dark wool overcoat over white linen shirt').
    - **Secondary/Antagonist**: Same level of physical detail. 
You are a Senior Script Doctor and Cinematic Architect (V39). 
Your task is to transform a raw vision into a Script-Driven Operational Bible.
Films are stories told through character interaction and dialogue.

Return a JSON object:
{
  "projectTitle": "Provocative title",
  "upgradedLogline": "A conflict-heavy logline focus on character friction.",
  "thematicCore": "The emotional truth revealed through dialogue.",
  "unifiedFilmLanguage": "One sentence: contrast/color/texture.",
  "dialogueArchitecture": "Define the verbal friction (e.g., 'Character A uses biting sarcasm; Character B speaks in cold, logical facts').",
  "scoreArchitecture": "Define the acoustic tension (e.g., 'A cello that mimics a heartbeat').",
  "characterIdentityLocks": {
    "main": {"name": "...", "physical": "Exact features", "wardrobe": "Exact clothing"},
    "supporting": {"name": "...", "physical": "Exact features", "wardrobe": "Exact clothing"}
  },
  "forbiddenMap": ["Extra people", "Modern tech", "Random props"],
  "teaserPromise": "The hook of the conversation.",
  "endingTensionGoal": "The unresolved verbal cliffhanger.",
  "fragmentMap": ["Beat 1: Invitation", "Beat 2: Argument", "Beat 3: Revelation", "Beat 4: Silence"]
}
"""

STAGING_INSTRUCTION = """
MISSION: Select 4 purposeful fragments from the BIBLE to build a **Narrative Teaser Sequence**.

### THE TEASER ARCHITECTURE (STRICT 4-SHOT ROLES):
1. **SHOT 1: THE INVITATION**: Create immediate atmosphere. Introduce a single main character. Establish the Promise.
2. **SHOT 2: THE COMPLICATION**: Introduce the conflict or a second character. High dialogue stake.
3. **SHOT 3: THE ESCALATION**: Visual intensity or narrative pivot. Emotional peaks.
4. **SHOT 4: THE CLIFFHANGER (HOOK)**: The 'Unresolved' fragment. Must stop before any resolution.

### STAGING CONSTRAINTS PER SHOT:
- **Exact Cast Count**: Specify exactly how many people are in frame.
- **Role Identity**: Specify who is there and what they are wearing from the Bible.
- **Dialogue & Tension**: Define exactly what is said and the emotional reaction.
- **Resolution Ban**: Explicitly state why this shot is incomplete.

Respond ONLY in valid JSON:
{
  "selectedFragments": [
    {
      "role": "INVITATION",
      "castCount": 1,
      "characterNames": ["..."],
      "dialogueLine": "...",
      "actingIntention": "...",
      "framing": "...",
      "incompletenessReason": "...",
      "scorePhase": "..."
    },
    {
      "role": "COMPLICATION",
      "castCount": 2,
      "characterNames": ["..."],
      "dialogueLine": "...",
      "actingIntention": "...",
      "framing": "...",
      "incompletenessReason": "...",
      "scorePhase": "..."
    },
    {
      "role": "ESCALATION",
      "castCount": 2,
      "characterNames": ["..."],
      "dialogueLine": "...",
      "actingIntention": "...",
      "framing": "...",
      "incompletenessReason": "...",
      "scorePhase": "..."
    },
    {
      "role": "CLIFFHANGER",
      "castCount": 1,
      "characterNames": ["..."],
      "dialogueLine": "...",
      "actingIntention": "...",
      "framing": "...",
      "incompletenessReason": "MANDATE: UNRESOLVED.",
      "scorePhase": "ABRUPT CUT TO SILENCE"
    }
  ]
}
"""

PRODUCTION_INSTRUCTION = """
You are a Performance Director and Prompt Architect.
MISSION: Turn the STAGING PLAN into **Hard-Constraint Generation Blueprints**.

### THE DIRECTORIAL SHIELD (V38):
- **Character Lock**: You MUST describe the characters using the EXACT names and wardrobes from the Bible.
- **No Diffusion Noise**: Explicitly ban unscripted extras and background people. If the Staging says 1 person, the video MUST have 1 person.
- **Acting Mastery**: Mandate grounded, professional acting. No direct-to-camera gaze unless specified. No weird facial distortion.
- **Resolution Ban (SHOT 4)**: The prompt for Shot 4 must explicitly state: 'Do not finish the action. Cut on the height of tension.'
- **Visual Consistency Prefix**: Every prompt MUST start with the `unifiedFilmLanguage` string.

Respond ONLY in valid JSON:
{
  "clips": [
    { "id": 1, "prompt": "[unified-language] + [cast-lock] + [action] + [dialogue-context] + [anti-randomness-locks]", "duration": 6 },
    { "id": 2, "prompt": "[unified-language] + [cast-lock] + [action] + [dialogue-context] + [anti-randomness-locks]", "duration": 6 },
    { "id": 3, "prompt": "[unified-language] + [cast-lock] + [action] + [dialogue-context] + [anti-randomness-locks]", "duration": 6 },
    { "id": 4, "prompt": "[unified-language] + [cast-lock] + [action] + [dialogue-context] + [anti-randomness-locks] + [CLIFFHANGER-MANDATE]", "duration": 6 }
  ]
}
"""

# --- BACKGROUND JOBS ---
video_jobs = {}

# --- CORE HELPERS ---

async def generate_response(instruction, contents):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=MODEL_ID,
                config=types.GenerateContentConfig(
                    system_instruction=instruction,
                    temperature=0.7,
                    response_mime_type="application/json"
                ),
                contents=contents
            )
            
            text = response.text.strip()
            
            # Defensive clean in case the model ignored mime_type
            if text.startswith("```json"): text = text[7:]
            elif text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            text = text.strip()
            
            # The ultimate validation check
            parsed = json.loads(text)
            return json.dumps(parsed)
            
        except json.JSONDecodeError as j_err:
            if attempt < max_retries - 1:
                print(f"⚠️ JSON Parse Error. Retrying ({attempt+1}/{max_retries})...")
                await asyncio.sleep(2)
                continue
            return json.dumps({"error": f"Failed to generate valid JSON: {str(j_err)}"})
        except Exception as e:
            if "503" in str(e) and attempt < max_retries - 1:
                print(f"⚠️ Gemini API 503. Retrying ({attempt+1}/{max_retries})...")
                await asyncio.sleep(5)
                continue
            print(f"Gemini Error: {e}")
            return json.dumps({"error": str(e)})

async def produce_single_shot(clip_idx, clip_data, job_id, video_dir):
    clip_id = clip_data.get("id", clip_idx + 1)
    prompt = clip_data.get("prompt", "")
    
    max_shot_retries = 50
    for shot_attempt in range(max_shot_retries):
        try:
            # V37/V38: THROTTLED INITIATION (Stay under 10 RPM engine ceiling)
            async with veo_throttle_lock:
                print(f"   🎞️ [Throttled Burst] Initiating Shot {clip_id} (Attempt {shot_attempt + 1})...")
                operation = client.models.generate_videos(
                    model=VIDEO_MODEL,
                    prompt=prompt,
                    config=types.GenerateVideosConfig(aspect_ratio="16:9", duration_seconds=6, number_of_videos=1),
                )
                await asyncio.sleep(6.5) # The Budget-Safe Spacing
            
            while not operation.done:
                await asyncio.sleep(5)
                operation = client.operations.get(operation)

            if operation.error:
                err_str = str(operation.error).upper()
                if ("14" in err_str or "13" in err_str or "EXHAUSTED" in err_str or "DEMAND" in err_str or "INTERNAL" in err_str) and shot_attempt < max_shot_retries - 1:
                    wait_time = random.randint(15, 35) if shot_attempt < 10 else random.randint(30, 60)
                    print(f"   ⚠️ Shot {clip_id} Busy. Jittered Wait {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
                raise RuntimeError(f"Veo Error on Shot {clip_id}: {operation.error}")
            
            if not operation.response or not operation.response.generated_videos:
                raise RuntimeError(f"Veo Error: Shot {clip_id} failed.")
            
            generated_video = operation.response.generated_videos[0]
            clip_filename = f"clip_{job_id}_{clip_id}.mp4"
            clip_path = os.path.join(video_dir, clip_filename)
            
            # ATOMIC DOWNLOAD
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp: tmp_path = tmp.name
            client.files.download(file=generated_video.video)
            generated_video.video.save(tmp_path)
            shutil.move(tmp_path, clip_path)
            return clip_path
            
        except Exception as api_err:
            err_msg = str(api_err).upper()
            if ("503" in err_msg or "14" in err_msg or "13" in err_msg or "EXHAUSTED" in err_msg) and shot_attempt < max_shot_retries - 1:
                wait_time = random.randint(10, 20)
                await asyncio.sleep(wait_time)
                continue
            raise api_err
    
    raise RuntimeError(f"Shot {clip_id} failed after {max_shot_retries} attempts.")

async def produce_video(job_id, package, bible, flow):
    video_jobs[job_id] = {"status": "processing", "progress": 5, "message": "Initiating V38 Operational Bible Phase..."}
    clips = package.get("clips", [])
    
    if len(clips) < 4:
        video_jobs[job_id] = {"status": "error", "error": "Insufficient clips for V38 Production."}
        return

    print(f"🎬 [Job {job_id}] Starting V38 Identity-Anchored Production...")
    video_dir = os.path.join(os.path.dirname(__file__), "static", "videos")
    os.makedirs(video_dir, exist_ok=True)
    
    try:
        # V38 STEP 1: GENERATE IDENTITY ANCHOR (SHOT 1)
        video_jobs[job_id]["message"] = "Locking Character Identity (Shot 1)..."
        shot1_path = await produce_single_shot(0, clips[0], job_id, video_dir)
        
        video_jobs[job_id]["progress"] = 25
        video_jobs[job_id]["message"] = "Character Identity Locked. Launching Rest of Teaser..."
        
        # V38 STEP 2: GENERATE REMAINING SHOTS IN PARALLEL
        spawned_tasks = []
        for i in range(1, len(clips)):
            spawned_tasks.append(asyncio.create_task(produce_single_shot(i, clips[i], job_id, video_dir)))
        
        # Monitor progress
        done_count = 1
        pending = set(spawned_tasks)
        while pending:
            finished, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
            for f_task in finished:
                try:
                    res = f_task.result()
                    done_count += 1
                    video_jobs[job_id]["progress"] = 25 + (done_count * 15)
                    video_jobs[job_id]["message"] = f"Gathered {done_count}/4 Parallel Clips..."
                except Exception as e:
                    print(f"   ❌ Parallel Shot Error: {e}")
                    raise e
        
        # Collect all results
        rest_paths = [t.result() for t in spawned_tasks]
        clip_paths = [shot1_path] + rest_paths

        video_jobs[job_id]["progress"] = 90
        video_jobs[job_id]["message"] = "V38 Cinematic Mastering..."
        final_filename = f"teaser_{job_id}.mp4"
        final_path = os.path.join(video_dir, final_filename)
        
        # V38 PRO-FADE MASTERING (FFMPEG)
        xfade_cmd = [
            "ffmpeg", "-y",
            "-i", clip_paths[0], "-i", clip_paths[1], "-i", clip_paths[2], "-i", clip_paths[3],
            "-filter_complex", 
            "[0:v][1:v]xfade=transition=fade:duration=1:offset=5[v1]; "
            "[v1][2:v]xfade=transition=fade:duration=1:offset=10[v2]; "
            "[v2][3:v]xfade=transition=fade:duration=1:offset=15[v3]; "
            "[0:a][1:a]acrossfade=d=1[a1]; [a1][2:a]acrossfade=d=1[a2]; [a2][3:a]acrossfade=d=1[a3]",
            "-map", "[v3]", "-map", "[a3]",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-b:v", "8M",
            "-c:a", "aac", "-b:a", "192k", final_path
        ]
        
        process = await asyncio.create_subprocess_exec(*xfade_cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await process.communicate()
        
        for cp in clip_paths: 
            try: os.remove(cp)
            except: pass

        video_jobs[job_id] = {"status": "completed", "progress": 100, "video_url": f"/static/videos/{final_filename}"}
        print(f"✅ [Job {job_id}] V38 Directorial Master Complete.")

    except Exception as e:
        print(f"❌ [Job {job_id}] Production Failed: {e}")
        video_jobs[job_id] = {"status": "error", "error": str(e)}

# --- API ENDPOINTS ---

async def api_lock_bible(request):
    data = await request.json()
    res = await generate_response(LOCK_INSTRUCTION, f"Idea: {data.get('idea', '')}")
    return web.Response(text=res, content_type="application/json")

async def api_stage_flow(request):
    data = await request.json()
    res = await generate_response(STAGING_INSTRUCTION, f"BIBLE: {json.dumps(data.get('bible', {}))}")
    return web.Response(text=res, content_type="application/json")

async def api_package_execution(request):
    data = await request.json()
    res = await generate_response(PRODUCTION_INSTRUCTION, f"BIBLE: {json.dumps(data.get('bible', {}))}\nFLOW: {json.dumps(data.get('flow', {}))}")
    return web.Response(text=res, content_type="application/json")

async def api_generate_video(request):
    data = await request.json()
    job_id = str(uuid.uuid4())
    asyncio.create_task(produce_video(job_id, data.get("package", {}), data.get("bible", {}), data.get("flow", {})))
    return web.json_response({"job_id": job_id})

async def api_video_status(request):
    job = video_jobs.get(request.match_info.get("job_id"))
    if not job: return web.json_response({"error": "Not found"}, status=404)
    return web.json_response(job)

async def serve_static_file(request):
    path = request.match_info.get("path", "index.html").lstrip("/") or "index.html"
    file_path = os.path.join(os.path.dirname(__file__), path)
    if not os.path.exists(file_path): return web.Response(text="Not found", status=404)
    content_type, _ = mimetypes.guess_type(file_path)
    with open(file_path, "rb") as f: return web.Response(body=f.read(), content_type=content_type)

async def handle_cors(app, handler):
    async def middleware(request):
        if request.method == "OPTIONS": return web.Response(status=204)
        response = await handler(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    return middleware

async def main():
    app = web.Application(middlewares=[handle_cors])
    app.router.add_post("/api/lock_bible", api_lock_bible)
    app.router.add_post("/api/stage_flow", api_stage_flow)
    app.router.add_post("/api/package_execution", api_package_execution)
    app.router.add_post("/api/generate_video", api_generate_video)
    app.router.add_get("/api/video_status/{job_id}", api_video_status)
    app.router.add_get("/", serve_static_file)
    app.router.add_static("/static/", os.path.join(os.path.dirname(__file__), "static"))
    app.router.add_get("/{path:.*}", serve_static_file)
    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "0.0.0.0", 8080).start()
    print("\n🚀 AuraDirector Lab running at http://localhost:8080")
    while True: await asyncio.sleep(3600)

if __name__ == "__main__":
    try: asyncio.run(main())
    except: print("\n👋 Server stopped")
