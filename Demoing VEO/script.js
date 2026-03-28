/**
 * AuraDirector: Cinematic Coherence & Anti-Randomness Pipeline (V33)
 * Full UI/Backend synchronization for V33 Global Styles, Flow, and Anti-Hallucination bounds.
 */

// --- STATE MANAGEMENT ---
let appState = {
    idea: "",
    bible: null,
    flow: null,
    package: null
};

// --- V44: DREAM SUGGESTIONS ---
const DREAM_EXAMPLES = {
    1: `Make an ultra-cute, fluffy, heart-melting Coca-Cola Christmas advertisement set in a magical North Pole village glowing with warm festive lights, where chubby, soft, wide-eyed polar bears and tiny, round, extra-fluffy penguins (with plush fur texture, sparkling eyes, and gentle, expressive faces) play, laugh, and interact in irresistibly adorable ways—sliding on ice, hugging, waddling together, and sharing joyful moments—while every single frame clearly and beautifully integrates Coca-Cola as a central, natural element of the world (iconic red bottles, glowing Coke trucks, branded crates, subtle logos on scarves, lights shaped like Coke bottles, etc.), ensuring the brand is always visible but feels magical and part of the environment rather than forced; the scene should feel extremely cozy, colorful, and whimsical with rich holiday reds, soft glowing gold lights, snowy blues, and sparkling textures, while the animals show strong emotional interaction—happy giggles, caring gestures, excited reactions to Coca-Cola—making the entire ad feel like a premium, cinematic, emotionally warm, super-cute holiday story that is visually stunning, deeply festive, and overflowing with charm, fluffiness, and joyful Christmas spirit.`,
    2: `Create an ultra-cinematic yet overwhelmingly adorable Spider-Man–inspired story where the main character is an extremely cute, tiny baby pig with exaggerated “kawaii” features—very round body, soft chubby cheeks, tiny hooves, big glossy sparkling eyes, a small snout with subtle shine, fluffy smooth pink texture, and expressive micro-reactions that make every emotion feel heart-melting—wearing a soft, slightly oversized Spider-Man suit with plush fabric, stitched web patterns, and a tiny mask that sometimes slips to reveal its adorable face; ensure that in every frame the pig looks irresistibly cute, soft, and huggable, with lighting and camera angles chosen specifically to enhance its cuteness (close-ups on eyes, soft glow highlights, warm reflections), while the story clearly mirrors iconic Spider-Man elements like learning responsibility, protecting others, and moving through a stylized city environment inspired by Spider-Man films, including rooftops, skyline views, and web-like motion (interpreted in a playful, safe, non-realistic way); include a similarly cute and non-threatening villain inspired by a Spider-Man character (such as a rounded, toy-like goblin or soft, bouncy tentacle creature), where their “conflict” is expressive, playful, and full of personality rather than violent, and emphasize strong emotional interaction, charm, and cinematic storytelling so the entire result feels like a high-quality, emotionally engaging, visually rich, and irresistibly cute superhero short that still clearly evokes Spider-Man while keeping the pig as the most adorable and lovable focus in every single moment.`
};

function fillExample(id) {
    const ideaBox = document.getElementById('videoIdea');
    if (ideaBox) {
        ideaBox.value = DREAM_EXAMPLES[id];
        ideaBox.classList.add('reveal-anim');
        setTimeout(() => ideaBox.classList.remove('reveal-anim'), 500);
    }
}

function restartDirector() {
    if (!confirm("Start a new cinematic project? Current work will be lost.")) return;
    window.location.reload(); // Simplest reset for V44
}

// --- CONFIGURATION ---
const API_BASE = window.location.port === '8080' ? '' : 'http://localhost:8080';

// --- V45: DOM CONTROL TOOLS (GLOBAL SCOPE) ---
const DIRECTORIAL_TOOLS = [
    {
        name: "scroll_viewport",
        description: "Scroll the page up or down.",
        parameters: {
            type: "object",
            properties: {
                direction: { type: "string", enum: ["up", "down"], description: "Direction to scroll" },
                amount: { type: "number", description: "Pixels to scroll (e.g., 500)" }
            },
            required: ["direction", "amount"]
        }
    },
    {
        name: "click_element",
        description: "Click a button or link based on its text content.",
        parameters: {
            type: "object",
            properties: {
                text: { type: "string", description: "The visible text of the button/link to click" }
            },
            required: ["text"]
        }
    },
    {
        name: "set_production_idea",
        description: "Update the theatrical idea console and automatically trigger the Bible Lock.",
        parameters: {
            type: "object",
            properties: {
                improved_prompt: { type: "string", description: "The refined, cinematic 4K prompt" }
            },
            required: ["improved_prompt"]
        }
    },
    {
        name: "navigate_to_page",
        description: "Redirect the user between the Landing Page and the Laboratory.",
        parameters: {
            type: "object",
            properties: {
                page: { type: "string", enum: ["landing", "laboratory"], description: "The destination page" }
            },
            required: ["page"]
        }
    }
];

function handleDirectorialTool(call) {
    const { name, args } = call;
    console.log(`🎬 MASTER CONTROL: [${name}]`, args);

    if (name === "scroll_viewport") {
        const sign = args.direction === 'up' ? -1 : 1;
        window.scrollBy({ top: args.amount * sign, behavior: 'smooth' });
    } else if (name === "click_element") {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const target = buttons.find(b => b.innerText.toLowerCase().includes(args.text.toLowerCase()));
        if (target) target.click();
    } else if (name === "set_production_idea") {
        const ideaBox = document.getElementById('videoIdea');
        if (ideaBox) {
            ideaBox.value = args.improved_prompt;
            document.getElementById('lockBtn')?.click();
        }
    } else if (name === "navigate_to_page") {
        window.location.href = args.page === 'laboratory' ? 'app.html' : 'index.html';
    }
}

class AudioPlayer {
    constructor() { this.ctx = null; this.nextStartTime = 0; }
    async init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        if (this.ctx.state === 'suspended') await this.ctx.resume();
    }
    play(base64Data) {
        if (!this.ctx) return;
        const binary = atob(base64Data);
        const pcm16 = new Int16Array(new ArrayBuffer(binary.length));
        for (let i = 0; i < binary.length / 2; i++) {
            pcm16[i] = (binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8));
        }
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768.0;
        const buffer = this.ctx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        const startTime = Math.max(this.ctx.currentTime, this.nextStartTime);
        source.start(startTime);
        this.nextStartTime = startTime + buffer.duration;
    }
}
const audioPlayer = new AudioPlayer();

// --- UTILITIES ---

function safeSet(id, value, type = 'innerText') {
    const el = document.getElementById(id);
    if (!el) return;
    
    let content = value;
    if (typeof value === 'object' && value !== null) {
        content = value.description || value.detail || value.summary || value.prompt || JSON.stringify(value);
    }
    
    if (type === 'value') {
        el.value = content || '';
    } else {
        el.innerText = content || '';
    }
}

async function fetchAPI(endpoint, data) {
    const url = `${API_BASE}${endpoint}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const text = await response.text();
        if (!response.ok) {
            let errorMsg = `Studio Error: ${response.status}`;
            try {
                const error = JSON.parse(text);
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = text || errorMsg;
            }
            throw new Error(errorMsg);
        }

        return JSON.parse(text);
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

function setLoading(btnId, isLoading, text = "Processing...") {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const btnText = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.loader');
    
    if (isLoading) {
        btn.disabled = true;
        if (btnText) btnText.dataset.original = btnText.innerText;
        if (btnText) btnText.innerText = text;
        loader?.classList.remove('hidden');
    } else {
        btn.disabled = false;
        if (btnText) btnText.innerText = btnText.dataset.original || "Proceed";
        loader?.classList.add('hidden');
    }
}

function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth' });
}

function renderTimeline(fragments) {
    const list = document.getElementById('outputTimeline');
    if (!list) return;
    list.innerHTML = '';
    
    let scoreArc = "";
    
    fragments.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'timeline-item';
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">
                <span class="t-title" style="color: var(--accent-gold); font-size: 0.9rem; letter-spacing: 0.2rem; text-transform: uppercase;">SHOT ${index+1}: ${item.role}</span>
                <span style="background: rgba(46, 204, 113, 0.2); color: #2ecc71; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; border: 1px solid #2ecc71; font-weight: bold; letter-spacing: 0.1em;">ACTION: ${item.physicalAction ? item.physicalAction.substring(0, 30) + '...' : 'CINEMATIC'}</span>
            </div>
            <div style="color: #4a90e2; font-size: 0.8rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em;">[SETTING] ${item.locationSetting || 'CINEMATIC ENVIRONMENT'}</div>
            <p style="color: #fff; margin-top: 0.5rem; font-weight: bold; font-family: var(--font-serif); font-size: 1.3rem;">"${item.dialogueLine || 'SILENT CONTINUITY'}"</p>
            <div style="color: #e67e22; font-size: 0.75rem; margin-top: 0.6rem; font-style: italic;">[ORCHESTRAL] ${item.scorePhase}</div>
            <p style="color: #9b59b6; margin-top: 0.4rem; font-size: 1.05rem;">[PERFORMANCE] ${item.actingIntention}</p>
            <p style="color: rgba(255,255,255,0.7); margin-top: 0.3rem;">[DIRECTORIAL SCALE] ${item.framing}</p>
            <p style="font-size: 0.9em; color: #e67e22; margin-top: 1rem; background: rgba(5,5,5,0.5); padding: 0.5rem; border-left: 2px solid #e67e22;">[SCORE PHASE] ${item.scorePhase}</p>
            <p style="font-size: 0.85em; color: #e74c3c; margin-top: 0.5rem; background: rgba(20,5,5,0.3); padding: 0.4rem; border-left: 2px solid #e74c3c;">[INCOMPLETENESS MANDATE] ${item.incompletenessReason}</p>
        `;
        list.appendChild(li);
        scoreArc += `[Shot ${index+1}] ${item.scorePhase}\n\n`;
    });
    
    safeSet('outputSoundArc', scoreArc.trim() || "No score defined.");
}

// --- PHASE 1: THE LOCK ---

async function handleLock() {
    const idea = document.getElementById('videoIdea').value.trim();
    if (!idea) return alert("Please define your vision to initiate the Operational Bible Phase.");

    appState.idea = idea;
    setLoading('lockBtn', true, "Defining Physical DNA & Directorial Mandates...");

    try {
        const data = await fetchAPI('/api/lock_bible', { idea });
        appState.bible = data;

        // V43 BIBLE MAPPING
        safeSet('outputTitle', data.projectTitle);
        safeSet('outputLogline', data.upgradedLogline);
        safeSet('outputThematicCore', data.thematicCore);
        safeSet('outputUnifiedFilmLanguage', data.unifiedFilmLanguage);
        safeSet('outputTeaserPromise', data.teaserPromise);
        safeSet('outputDialogueArchitecture', data.dialogueArchitecture);
        safeSet('outputScoreArchitecture', data.scoreArchitecture);
        safeSet('outputEndingTensionGoal', data.endingTensionGoal);
        safeSet('outputForbiddenMap', Array.isArray(data.forbiddenMap) ? data.forbiddenMap.join(" | ").toUpperCase() : "NONE");

        // Character Locks (DNA)
        if (data.characterIdentityLocks) {
            const main = data.characterIdentityLocks.main || {};
            const supp = data.characterIdentityLocks.supporting || {};
            safeSet('outputMainChar', `NAME: ${main.name || 'N/A'}\nAGE: ${main.age || 'N/A'}\nPHYSICAL: ${main.physical || 'N/A'}\nWARDROBE: ${main.wardrobe || 'N/A'}`);
            safeSet('outputSupportingChar', `NAME: ${supp.name || 'N/A'}\nAGE: ${supp.age || 'N/A'}\nPHYSICAL: ${supp.physical || 'N/A'}\nWARDROBE: ${supp.wardrobe || 'N/A'}`);
        }

        // Forbidden Map
        if (data.forbiddenMap && Array.isArray(data.forbiddenMap)) {
            safeSet('outputForbiddenMap', data.forbiddenMap.join(" | ").toUpperCase());
        }

        showSection('bibleSection');
    } catch (err) {
        alert(`Lock Error: ${err.message}`);
    } finally {
        setLoading('lockBtn', false);
    }
}

// --- PHASE 2: THE EXECUTION ---

/**
 * STAGE 1: STAGING ARCHITECT
 */
async function handleStage() {
    setLoading('stageBtn', true, "Designing Purposeful Teaser Fragments...");

    try {
        const data = await fetchAPI('/api/stage_flow', { 
            bible: appState.bible 
        });
        appState.flow = data;

        // V38 STAGING MAPPING
        renderTimeline(data.selectedFragments || []);
        
        showSection('flowSection');
    } catch (err) {
        alert(`Staging Error: ${err.message}`);
    } finally {
        setLoading('stageBtn', false);
    }
}

/**
 * STAGE 2: PRODUCTION ASSEMBLY (V30)
 */
async function handlePackage() {
    const btn = document.getElementById('packageBtn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Generating Hard-Constraint Blueprints...";

    try {
        const data = await fetchAPI('/api/package_execution', { 
            bible: appState.bible,
            flow: appState.flow
        });
        appState.package = data;

        // Map V38 Locked Blueprints
        if (data.clips && data.clips.length >= 4) {
            safeSet('editClip1', data.clips[0].prompt, 'value');
            safeSet('editClip2', data.clips[1].prompt, 'value');
            safeSet('editClip3', data.clips[2].prompt, 'value');
            safeSet('editClip4', data.clips[3].prompt, 'value');
        }

        showSection('packageSection');
    } catch (err) {
        alert(`Package Error: ${err.message}`);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

/**
 * STAGE 3: CINEMATIC PRODUCTION
 */
async function handleProduceVideo() {
    const btn = document.getElementById('btnProduceVideo');
    if (!btn) return;
    const originalText = btn.innerText;
    
    try {
        btn.disabled = true;
        btn.innerText = "🎬 COMMENCING REALISM PRODUCTION...";

        const videoContainer = document.getElementById('videoContainer');
        const statusText = document.getElementById('productionStatus');
        const videoElement = document.getElementById('finalVideo');
        
        videoContainer.classList.remove('hidden');
        document.querySelector('.production-overlay').classList.remove('hidden');
        statusText.innerText = "EXECUTING PHYSICAL REALISM PIPELINE...";
        
        const { job_id } = await fetchAPI('/api/generate_video', { 
            package: appState.package,
            bible: appState.bible,
            flow: appState.flow
        });

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE}/api/video_status/${job_id}`);
                if (!response.ok) return;
                
                const statusData = await response.json();
                if (statusData.status === 'processing') {
                    const statusMsg = statusData.message || `PRODUCING SHOT ${Math.floor(statusData.progress/20) + 1}...`;
                    document.getElementById('productionStatus').innerText = `${statusMsg} (${statusData.progress}%)`;
                    document.getElementById('productionStatus').style.color = statusMsg.includes("Wait") ? "#f1c40f" : "var(--accent-gold)";
                } else if (statusData.status === 'completed') {
                    clearInterval(pollInterval);
                    statusText.innerText = "V42 THEATRICAL MASTER READY.";
                    
                    videoElement.src = `${API_BASE}${statusData.video_url}`;
                    videoElement.load();

                    // V42 DIRECTORIAL EXPORT ACTIVATION
                    const exportZone = document.getElementById('exportZone');
                    const downloadBtn = document.getElementById('downloadButton');
                    if (exportZone && downloadBtn) {
                        downloadBtn.href = `${API_BASE}${statusData.video_url}`;
                        exportZone.classList.remove('hidden');
                    }

                    videoElement.oncanplay = () => {
                        document.querySelector('.production-overlay').classList.add('hidden');
                        videoElement.play();
                    };
                } else if (statusData.status === 'error') {
                    clearInterval(pollInterval);
                    statusText.innerText = `Production Halted: ${statusData.error}`;
                    btn.disabled = false;
                }
            } catch (err) {
                console.error("Polling Error:", err);
            }
        }, 3000);

    } catch (err) {
        alert(`Production Error: ${err.message}`);
        btn.disabled = false;
    }
}

// --- V44: GEMINI LIVE VOICE DIRECTOR ---
class VoiceDirector {
    constructor() {
        this.socket = null;
        this.audioContext = null;
        this.stream = null;
        this.processor = null;
        this.isActive = false;
    }

    async toggle() {
        if (this.isActive) this.stop();
        else await this.start();
    }

    async start() {
        try {
            const btn = document.getElementById('micBtn');
            const status = document.getElementById('liveStatus');
            const statusText = document.getElementById('liveStatusText');

            const { token } = await (await fetch(`${API_BASE}/api/live_token`)).json();
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`;
            
            this.socket = new WebSocket(url);
            this.socket.binaryType = 'arraybuffer'; // Standard for binary payloads
            this.socket.onopen = () => {
                console.log("🎬 VOICE: WebSocket Connected");
                const setup = {
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        generationConfig: { 
                            responseModalities: ["AUDIO", "TEXT"],
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
                        },
                        systemInstruction: { parts: [{ text: "You are the AuraDirector Omnipotent Voice Controller. You have full control over the browser DOM. Your goal is to guide the user through the video production process. Use your tools to scroll, click, and navigate. When the user gives an idea, use your capabilities to improve it into a cinematic 4K prompt and then use 'set_production_idea' to submit it. Your first action on connection: Greet the user with 'I am your AI Director. Speak to me in order to control the browser.' using your voice (AUDIO). If they speak other languages, help them in those languages." }] },
                        tools: [{ functionDeclarations: DIRECTORIAL_TOOLS }],
                        realtimeInputConfig: {
                            automaticActivityDetection: {
                                disabled: false,
                                silenceDurationMs: 2000,
                                prefixPaddingMs: 500,
                                endOfSpeechSensitivity: "END_SENSITIVITY_UNSPECIFIED",
                                startOfSpeechSensitivity: "START_SENSITIVITY_UNSPECIFIED"
                            }
                        }
                    }
                };
                this.socket.send(JSON.stringify(setup));
                console.log("🎬 VOICE: Setup Sent", setup);
            };

            this.socket.onmessage = async (event) => {
                console.log("🎬 VOICE: MESSAGE ARRIVED!", event.data);
                let rawData;
                if (event.data instanceof Blob) {
                    rawData = await event.data.text();
                } else if (event.data instanceof ArrayBuffer) {
                    rawData = new TextDecoder().decode(event.data);
                } else {
                    rawData = event.data;
                }
                
                try {
                    const data = JSON.parse(rawData);
                    console.log("🎬 VOICE: Msg Received", Object.keys(data));
                
                if (data.setupComplete) {
                    console.log("🎬 VOICE: Msg Received ['setupComplete']");
                    this.isActive = true;
                    btn.classList.add('mic-active');
                    status.classList.remove('hidden');
                    statusText.innerText = "LISTENING";
                    audioPlayer.init().then(() => console.log("🎬 VOICE: AudioPlayer Initialized"));
                    this.initAudio();
                }

                // V45: Handle Audio Output
                if (data.serverContent?.modelTurn?.parts) {
                    console.log("🎬 VOICE: Received Model Turn Parts", data.serverContent.modelTurn.parts.length);
                    for (const part of data.serverContent.modelTurn.parts) {
                        if (part.inlineData) {
                            console.log("🎬 VOICE: Playing Audio Segment");
                            audioPlayer.play(part.inlineData.data);
                        }
                        if (part.text) {
                            console.log("🎬 VOICE: AI Text ->", part.text);
                        }
                    }
                }

                // V45: Handle Tool Calls
                if (data.toolCall?.functionCalls) {
                    console.log("🎬 VOICE: Tool Call Received", data.toolCall.functionCalls);
                    const responses = [];
                    for (const call of data.toolCall.functionCalls) {
                        handleDirectorialTool(call);
                        responses.push({ name: call.name, response: { result: "Action executed successfully" } });
                    }
                    this.socket.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
                }

                    if (data.serverContent?.modelTurn?.parts?.[0]?.text) {
                        const improved = data.serverContent.modelTurn.parts[0].text;
                        const ideaBox = document.getElementById('videoIdea');
                        if (ideaBox) ideaBox.value = improved;
                    }
                } catch (err) {
                    console.error("🎬 VOICE: JSON Parse Error", err, rawData);
                }
            };

        } catch (err) {
            console.error("Voice Error:", err);
            this.stop();
        }
    }

    async initAudio() {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = new AudioContext({ sampleRate: 16000 });
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();
        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

        let frameCount = 0;
        this.processor.onaudioprocess = (e) => {
            if (!this.isActive) return;
            const input = e.inputBuffer.getChannelData(0);
            
            // Diagnostic: Calculate RMS/Peak for better feedback
            if (frameCount++ % 50 === 0) {
                let max = 0;
                for (let i = 0; i < input.length; i++) {
                    const abs = Math.abs(input[i]);
                    if (abs > max) max = abs;
                }
                console.log(`🎬 VOICE: Streaming [Peak: ${max.toFixed(4)}] [Mic: ${this.audioContext.state}]`);
            }

            const pcm16 = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, input[i])) * 0x7FFF;
            }
            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
            this.socket.send(JSON.stringify({ realtimeInput: { audio: { data: base64, mimeType: "audio/pcm" } } }));
        };

        source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
    }

    stop() {
        this.isActive = false;
        if (this.socket) this.socket.close();
        if (this.processor) this.processor.disconnect();
        if (this.audioContext) this.audioContext.close();
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        
        document.getElementById('micBtn').classList.remove('mic-active');
        document.getElementById('liveStatus').classList.add('hidden');
    }
}

const voiceDirector = new VoiceDirector();

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // V44 Voice & Reset
    document.getElementById('micBtn')?.addEventListener('click', () => voiceDirector.toggle());
    document.getElementById('restartBtn')?.addEventListener('click', () => restartDirector());

    // Phase Controllers
    const lockBtn = document.getElementById('lockBtn');
    const stageBtn = document.getElementById('stageBtn');
    const packageBtn = document.getElementById('packageBtn');
    const produceBtn = document.getElementById('btnProduceVideo');

    if (lockBtn) lockBtn.addEventListener('click', handleLock);
    if (stageBtn) stageBtn.addEventListener('click', handleStage);
    if (packageBtn) packageBtn.addEventListener('click', handlePackage);
    if (produceBtn) produceBtn.addEventListener('click', handleProduceVideo);
});
