#!/usr/bin/env python3
"""
Demoing VEO - Cinematic Director's Lab (V6 - Total Continuity Edition)
Filmmaker-grade prompts, anamorphic styling, and absolute character/environment locking.
"""

import asyncio
import json
import mimetypes
import os
import tempfile
import uuid
import shutil
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

# --- SYSTEM INSTRUCTIONS ---

PROPOSAL_INSTRUCTION = """
You are a World-Class Cinematic Director and Creative Visionary.
MISSION: Define the 'Visual Bible' for a high-end 24s teaser.

### THE BIBLE SPECS:
- PROTAGONIST: Define 'Character DNA' with technical precision (Face structure, skin/texture, specific modern attire, eye color). NO ANIMALS unless requested. NO STEREOTYPES. Modern, relatable, mixed-race (Mestizo) for Latin American contexts.
- SETTING: Define 'Environmental DNA' (Lighting conditions, architecture, atmosphere).
- CINEMATIC STYLE: Define the 'Look' (e.g., 'Arri Alexa 35, Anamorphic lenses, high-contrast chiaroscuro lighting, grainy 35mm film stock').

Respond in valid JSON (All strings):
{
  "title": "Production Title",
  "logline": "One-sentence cinematic hook",
  "storySoul": "Thematic core",
  "characterDNA": "Technical character spec (Essential for continuity)",
  "environmentDNA": "Technical setting spec (Essential for continuity)",
  "visualStyle": "Filmmaker-grade look spec (Lenses, Camera)",
  "visualTone": "Color palette, grading, and atmospheric notes",
  "emotionalArc": "Audience journey",
  "directorStatement": "Creative vision string"
}
"""

FLOW_INSTRUCTION = """
You are a Lead Cinematographer and Storyboard Artist.
Design a 3-act 24s sequence with ABSOLUTE NARRATIVE FLOW.
ACT 1: The Inciting Incident (Modern Origin).
ACT 2: The Midpoint Shift (The Struggle/Journey).
ACT 3: The Climax & Resolution (The Victory/Soul).

Respond in valid JSON (All non-array fields are strings):
{
  "timeline": [
    {"time": "0-8s", "title": "ACT 1: THE ORIGIN", "detail": "Establishing shot + Character introduction."},
    {"time": "8-16s", "title": "ACT 2: THE JOURNEY", "detail": "The transition and conflict."},
    {"time": "16-24s", "title": "ACT 3: THE SOUL", "detail": "The success and final impact."}
  ],
  "visualSequence": "Narrative flow and rhythmic progression description",
  "transitionLogic": "Detailed notes on how the end of Clip N perfectly match-cuts to Clip N+1.",
  "cameraDirection": "Anamorphic lens choices, gimbal vs handheld notes, blocking.",
  "musicDirection": "Cinematic score progression (orchestral/electronic hybrids).",
  "voiceGuidance": "Vocal performance subtext for dialogue scripts."
}
"""

PACKAGE_INSTRUCTION = """
You are a Master Cinematic Prompt Engineer and Continuity Supervisor for High-End AI Filmmaking.
MISSION: Generate three 8-second clips that form a SEAMLESS, IDENTICAL, and CINEMATIC 24-second story.

### THE CONTINUITY LOCKS (MANDATORY):
1. **CHARACTER LOCK**: You MUST use the exact 'characterDNA' provided. This description MUST be the starting sentence of every 'Subject' paragraph in all 3 prompts.
2. **ENVIRONMENT LOCK**: Every prompt must mention the same 'environmentDNA' with light/time-of-day progression.
3. **NARRATIVE THREADING**: 
   - Each prompt MUST include a 'STITCHING FRAME' (The first frame of Act N must look identical to the last frame of Act N-1).
4. **DIALOGUE SCRIPTS**: Characters MUST speak dialogue that progresses the specific story idea with emotional weight.

### THE 10-POINT CINEMATIC PROMPT TEMPLATE (MANDATORY FOR EACH ACT):
Every 'prompt' in the JSON must follow this technical structure:
- [SUBJECT]: [CharacterDNA] + specific posture/action.
- [SETTING]: [EnvironmentDNA] + position in space.
- [CAMERA]: Lenses (e.g., 50mm Anamorphic, T2.1), camera movement (Slow dolly, pan, track), frame rate.
- [LIGHTING]: Source, intensity, color temperature (e.g., 'Volumetric golden-hour light from a 45-degree angle').
- [DIALOGUE]: [NAME] says "[LINE]" with [SUBTEXT]. (Dialogue MUST be talking to the camera or another character).
- [TRANSITION]: Describe the static frame at the end for the 1s xfade.

Respond in valid JSON:
{
  "masterPrompt": "24s Narrative Summary",
  "characterDNA": "TECHNICAL MASTER SPEC",
  "clipPrompts": [
    {"id": 1, "prompt": "ACT 1 (THE HOOK). Use Bible Specs. Technical filmmaking language. 200+ words."},
    {"id": 2, "prompt": "ACT 2 (THE JOURNEY). Continuity lock to Act 1 end. 200+ words."},
    {"id": 3, "prompt": "ACT 3 (THE SOUL). Continuity lock to Act 2 end. 200+ words."}
  ],
  "musicPrompt": "24s orchestral/cinematic teaser score",
  "voicePrompt": "High-fidelity vocal direction",
  "editingInstructions": "Match-cut and transition notes for a seamless film"
}
"""

# --- BACKGROUND JOBS STORE ---
video_jobs = {}

# --- CORE HELPERS ---

async def generate_response(instruction, contents):
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            config=types.GenerateContentConfig(
                system_instruction=instruction,
                response_mime_type="application/json"
            ),
            contents=contents
        )
        return response.text
    except Exception as e:
        print(f"Gemini Error: {e}")
        return json.dumps({"error": str(e)})

async def produce_video(job_id, package):
    video_jobs[job_id] = {"status": "processing", "progress": 5}
    clip_prompts = package.get("clipPrompts", [])
    
    if len(clip_prompts) < 3:
        video_jobs[job_id] = {"status": "error", "error": "Insufficient clips for a 24s production."}
        return

    print(f"🎬 [Job {job_id}] Starting 24s Master Production (V6 - Total Continuity)...")
    video_dir = os.path.join(os.path.dirname(__file__), "static", "videos")
    os.makedirs(video_dir, exist_ok=True)
    
    clip_paths = []
    try:
        for i, clip_data in enumerate(clip_prompts):
            prompt = clip_data.get("prompt", "")
            clip_id = clip_data.get("id", i+1)
            video_jobs[job_id]["progress"] = 10 + (i * 25)
            
            print(f"   🎞️ Rendering Act {clip_id}/3...")
            operation = client.models.generate_videos(
                model=VIDEO_MODEL,
                prompt=prompt,
                config=types.GenerateVideosConfig(
                    aspect_ratio="16:9",
                    duration_seconds=8,
                    number_of_videos=1,
                ),
            )
            
            while not operation.done:
                await asyncio.sleep(5)
                operation = client.operations.get(operation)

            if operation.error: raise RuntimeError(f"Veo Error on Act {clip_id}: {operation.error}")
            
            if not operation.response or not operation.response.generated_videos:
                raise RuntimeError(f"Veo Error: No video response for Act {clip_id}.")

            generated_video = operation.response.generated_videos[0]
            clip_filename = f"clip_{job_id}_{clip_id}.mp4"
            clip_path = os.path.join(video_dir, clip_filename)
            
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp: tmp_path = tmp.name

            def _download_sync(video_obj, path):
                client.files.download(file=video_obj.video)
                video_obj.video.save(path)

            await asyncio.get_event_loop().run_in_executor(None, _download_sync, generated_video, tmp_path)
            shutil.move(tmp_path, clip_path)
            clip_paths.append(clip_path)

        video_jobs[job_id]["progress"] = 90
        if len(clip_paths) < 3:
            raise RuntimeError(f"Production Failed: Only {len(clip_paths)}/3 clips rendered successfully.")

        final_filename = f"teaser_{job_id}.mp4"
        final_path = os.path.join(video_dir, final_filename)
        
        # PRO-FADE STITCHING
        xfade_cmd = [
            "ffmpeg", "-y",
            "-i", clip_paths[0], "-i", clip_paths[1], "-i", clip_paths[2],
            "-filter_complex", 
            "[0:v][1:v]xfade=transition=fade:duration=1:offset=7[v1]; "
            "[v1][2:v]xfade=transition=fade:duration=1:offset=14[v2]; "
            "[0:a][1:a]acrossfade=d=1[a1]; [a1][2:a]acrossfade=d=1[a2]",
            "-map", "[v2]", "-map", "[a2]",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-b:v", "5M",
            "-c:a", "aac", "-b:a", "192k",
            final_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *xfade_cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE, cwd=video_dir
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            xfade_v_only = [
                "ffmpeg", "-y",
                "-i", clip_paths[0], "-i", clip_paths[1], "-i", clip_paths[2],
                "-filter_complex", 
                "[0:v][1:v]xfade=transition=fade:duration=1:offset=7[v1]; "
                "[v1][2:v]xfade=transition=fade:duration=1:offset=14[v2]",
                "-map", "[v2]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-b:v", "5M",
                final_path
            ]
            process = await asyncio.create_subprocess_exec(
                *xfade_v_only, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE, cwd=video_dir
            )
            await process.communicate()

        # Cleanup
        for cp in clip_paths: 
            try: os.remove(cp)
            except: pass

        video_jobs[job_id] = {"status": "completed", "progress": 100, "video_url": f"/static/videos/{final_filename}"}
        print(f"✅ [Job {job_id}] Seamless 22s Teaser Complete.")

    except Exception as e:
        video_jobs[job_id] = {"status": "error", "error": str(e)}

# --- API ENDPOINTS ---

async def api_proposal(request):
    data = await request.json()
    res = await generate_response(PROPOSAL_INSTRUCTION, f"Idea: {data.get('idea', '')}")
    return web.Response(text=res, content_type="application/json")

async def api_flow(request):
    data = await request.json()
    res = await generate_response(FLOW_INSTRUCTION, f"Idea: {data.get('idea', '')}\nProposal: {data.get('proposal', '')}")
    return web.Response(text=res, content_type="application/json")

async def api_package(request):
    data = await request.json()
    res = await generate_response(PACKAGE_INSTRUCTION, f"Idea: {data.get('idea', '')}\nProposal: {data.get('proposal', '')}\nFlow: {data.get('flow', '')}")
    return web.Response(text=res, content_type="application/json")

async def api_generate_video(request):
    data = await request.json()
    package = data.get("package", {})
    if not package: return web.json_response({"error": "No package"}, status=400)
    job_id = str(uuid.uuid4())
    asyncio.create_task(produce_video(job_id, package))
    return web.json_response({"job_id": job_id})

async def api_video_status(request):
    job = video_jobs.get(request.match_info.get("job_id"))
    if not job: return web.json_response({"error": "Not found"}, status=404)
    return web.json_response(job)

async def serve_static_file(request):
    path = request.match_info.get("path", "index.html").lstrip("/") or "index.html"
    if ".." in path: return web.Response(text="Invalid", status=400)
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
    app.router.add_post("/api/proposal", api_proposal)
    app.router.add_post("/api/flow", api_flow)
    app.router.add_post("/api/package", api_package)
    app.router.add_post("/api/generate_video", api_generate_video)
    app.router.add_get("/api/video_status/{job_id}", api_video_status)
    app.router.add_get("/", serve_static_file)
    app.router.add_static("/static/", os.path.join(os.path.dirname(__file__), "static"))
    app.router.add_get("/{path:.*}", serve_static_file)
    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "0.0.0.0", 8080).start()
    print("\n🚀 VEO Cinematic Continuity Lab running at http://localhost:8080")
    while True: await asyncio.sleep(3600)

if __name__ == "__main__":
    try: asyncio.run(main())
    except: print("\n👋 Server stopped")
