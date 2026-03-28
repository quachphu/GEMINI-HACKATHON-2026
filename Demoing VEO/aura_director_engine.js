/**
 * AuraDirector Engine: Omniscient Unification (V45.50)
 * Protocol: v1alpha (Constrained) | Model: gemini-3.1-flash-live-preview
 */

console.log("🚀 AURA DIRECTOR ENGINE V45.50: OMNISCIENT UNIFICATION");

const API_BASE = window.location.port === '8080' ? '' : 'http://localhost:8080';

// --- STATE MANAGEMENT ---
let appState = {
    idea: "",
    bible: null,
    flow: null,
    package: null
};

const DREAM_EXAMPLES = {
    1: `Make an ultra-cute, fluffy, heart-melting Coca-Cola Christmas advertisement...`,
    2: `Create an ultra-cinematic yet overwhelmingly adorable Spider-Man baby pig...`
};

// --- DIRECTORIAL TOOLS ---
const DIRECTORIAL_TOOLS = [
  {
    name: "scroll_viewport",
    description: "Scroll the viewport up or down based on user request.",
    parameters: {
      type: "object",
      properties: {
        direction: { type: "string", enum: ["up", "down"] },
        amount: { type: "number" }
      },
      required: ["direction", "amount"]
    }
  },
  {
    name: "click_element",
    description: "MANDATORY: Use this when the user says 'CLICK', 'PRESS', 'LOCK', or 'ENTER'. Search for buttons with text.",
    parameters: {
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"]
    }
  },
  {
    name: "set_production_idea",
    description: "USE ONLY when user asks for 'IDEAS', 'HELP', or 'IMPROVED PROMPT'. Updates text box only.",
    parameters: {
      type: "object",
      properties: { improved_prompt: { type: "string" } },
      required: ["improved_prompt"]
    }
  },
  {
    name: "get_page_content",
    description: "ALWAYS call first to see current buttons/labels.",
    parameters: { type: "object", properties: {} }
  }
];

// --- CORE UTILITIES ---
function safeSet(id, value, type = 'innerText') {
    const el = document.getElementById(id); if (!el) return;
    let content = value;
    if (typeof value === 'object' && value !== null) {
        content = value.description || value.detail || value.summary || value.prompt || JSON.stringify(value);
    }
    if (type === 'value') el.value = content || '';
    else el.innerText = content || '';
}

async function fetchAPI(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

function showSection(sectionId, shouldScroll = true) {
    const section = document.getElementById(sectionId);
    if (section) { 
        section.classList.remove('hidden'); 
        if (shouldScroll) section.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
    }
}

// --- CINEMATIC PRODUCTION LOGIC ---
function fillExample(id) {
    const ideaBox = document.getElementById('videoIdea');
    if (ideaBox) {
        ideaBox.value = DREAM_EXAMPLES[id] || "";
        ideaBox.classList.add('reveal-anim');
        setTimeout(() => ideaBox.classList.remove('reveal-anim'), 500);
    }
}

async function handleLock() {
    console.log("🎬 PRODUCTION: Starting Lock Bible Sequence...");
    const ideaBox = document.getElementById('videoIdea');
    const idea = ideaBox?.value.trim();
    if (!idea) { console.warn("🎬 PRODUCTION: Idea empty."); return; }
    appState.idea = idea;
    try {
        const data = await fetchAPI('/api/lock_bible', { idea });
        console.log("🎬 PRODUCTION: Bible Locked.", data.projectTitle);
        appState.bible = data;
        safeSet('outputTitle', data.projectTitle);
        safeSet('outputLogline', data.upgradedLogline);
        if (data.characterIdentityLocks) {
            const m = data.characterIdentityLocks.main || {};
            const s = data.characterIdentityLocks.supporting || {};
            safeSet('outputMainChar', `NAME: ${m.name}\nAGE: ${m.age}\nPHYSICAL: ${m.physical}`);
            safeSet('outputSupportingChar', `NAME: ${s.name}\nAGE: ${s.age}\nPHYSICAL: ${s.physical}`);
        }
        showSection('bibleSection');
    } catch (err) { console.error("🎬 PRODUCTION: Lock Error:", err); }
}

async function handleStage() {
    console.log("🎬 PRODUCTION: Starting Stage Flow...");
    try {
        const data = await fetchAPI('/api/stage_flow', { bible: appState.bible });
        appState.flow = data;
        const list = document.getElementById('outputTimeline');
        if (list) {
            list.innerHTML = (data.selectedFragments || []).map((f, i) => `
                <li class="timeline-item"><span class="t-title">SHOT ${i+1}: ${f.role}</span><p class="t-dialogue">"${f.dialogueLine || 'SILENT'}"</p></li>`).join('');
        }
        showSection('flowSection');
    } catch (err) { console.error("🎬 PRODUCTION: Stage Error:", err); }
}

async function handlePackage() {
    console.log("🎬 PRODUCTION: Starting Package Execution...");
    try {
        const data = await fetchAPI('/api/package_execution', { bible: appState.bible, flow: appState.flow });
        appState.package = data;
        if (data.clips) data.clips.forEach((c, i) => safeSet(`editClip${i+1}`, c.prompt, 'value'));
        showSection('packageSection');
    } catch (err) { console.error("🎬 PRODUCTION: Package Error:", err); }
}

async function handleProduceVideo() {
    console.log("🎬 PRODUCTION: Starting Job...");
    try {
        const { job_id } = await fetchAPI('/api/generate_video', { 
            package: appState.package, bible: appState.bible, flow: appState.flow 
        });
        const statusText = document.getElementById('productionStatus');
        document.getElementById('videoContainer')?.classList.remove('hidden');
        const poll = setInterval(async () => {
            const res = await fetch(`${API_BASE}/api/video_status/${job_id}`);
            const data = await res.json();
            if (data.status === 'processing') statusText.innerText = `PRODUCING... (${data.progress}%)`;
            else if (data.status === 'completed') {
                clearInterval(poll);
                const vid = document.getElementById('finalVideo');
                vid.src = `${API_BASE}${data.video_url}`; vid.load();
                statusText.innerText = "PRODUCTION COMPLETE.";
                document.querySelector('.production-overlay')?.classList.add('hidden');
                document.getElementById('exportZone')?.classList.remove('hidden');
                document.getElementById('downloadButton').href = `${API_BASE}${data.video_url}`;
            }
        }, 3000);
    } catch (err) { console.error("🎬 PRODUCTION: Produce Error:", err); }
}

// --- COMMAND TOOLS ---
function handleDirectorialTool(call) {
    const { name, args } = call;
    console.log(`🎬 MASTER: [${name}]`, args);
    
    if (name === "scroll_viewport") {
        window.scrollBy({ top: (args.direction === 'up' ? -1 : 1) * args.amount, behavior: 'smooth' });
        return { result: "scrolled" };
    } 
    else if (name === "click_element") {
        const selectors = 'button, a, .suggestion-card, .launch-btn, [role="button"], .glass';
        const btns = Array.from(document.querySelectorAll(selectors));
        const target = btns
            .filter(b => b.innerText.toLowerCase().includes(args.text.toLowerCase()))
            .sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0];
            
        if (target) {
            console.log(`🎬 CLICKING: ${target.innerText.trim()}`);
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.click(); // Using standard robust click
            return { result: `clicked: ${target.innerText.trim()}` };
        }
        return { error: `Button '${args.text}' not found.` };
    } 
    else if (name === "set_production_idea") {
        const box = document.getElementById('videoIdea');
        if (box) { 
            box.value = args.improved_prompt; 
            console.log("🎬 VISION BOARD UPDATED.");
            box.classList.add('reveal-anim');
            setTimeout(() => box.classList.remove('reveal-anim'), 1000);
            return { result: "Prompt updated. Ask user to 'LOCK' it." };
        }
    }
    else if (name === "get_page_content") {
        const interactives = Array.from(document.querySelectorAll('button, a, .suggestion-card, textarea, h1, h2, label, span'))
            .map(el => ({ 
                tag: el.tagName, 
                text: (el.innerText || el.placeholder || el.value || "").trim().substring(0, 100),
                visible: el.offsetParent !== null
            }))
            .filter(i => i.text && i.visible);
        return { elements: interactives };
    }
}

// --- GEMINI LIVE API ---
class GeminiLiveAPI {
  constructor(token, model) {
    this.token = token; this.model = model;
    this.serviceUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${this.token}`;
    this.webSocket = null;
  }
  async connect() {
    this.webSocket = new WebSocket(this.serviceUrl);
    this.webSocket.onopen = () => { console.log("🎬 WS: Open."); this.sendInitialSetup(); };
    this.webSocket.onmessage = async (e) => {
        let raw = e.data; if (e.data instanceof Blob) raw = await e.data.text();
        try { this.handleServerMessage(JSON.parse(raw)); } catch (err) {}
    };
  }
  sendInitialSetup() {
    const setup = {
      setup: {
        model: `models/${this.model}`,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
        },
        systemInstruction: { parts: [{ text: `You are AuraDirector. Precision Focus.
- If user says 'LOCK', 'CLICK', or 'PRESS', you MUST use 'click_element'.
- Use 'get_page_content' often.
- Greet with 'I am your AI Director. Tell me your vision.' immediately.` }] },
        tools: [{ functionDeclarations: DIRECTORIAL_TOOLS }],
        realtimeInputConfig: {
          automaticActivityDetection: { disabled: false, silenceDurationMs: 2000, prefixPaddingMs: 500 },
          turnCoverage: "TURN_INCLUDES_ONLY_ACTIVITY"
        }
      }
    };
    this.webSocket.send(JSON.stringify(setup));
  }
  handleServerMessage(data) {
    if (data.serverContent?.modelTurn?.parts) {
        for (const p of data.serverContent.modelTurn.parts) if (p.inlineData) audioPlayer.play(p.inlineData.data);
    }
    if (data.toolCall?.functionCalls) {
        for (const c of data.toolCall.functionCalls) { 
            const result = handleDirectorialTool(c); 
            this.webSocket.send(JSON.stringify({ toolResponse: { functionResponses: [{ name: c.name, response: { result: result || "ok" } }] } })); 
        }
    }
  }
  sendAudio(base64) {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
        this.webSocket.send(JSON.stringify({ realtimeInput: { audio: { data: base64, mimeType: "audio/pcm" } } }));
    }
  }
}

// --- AUDIO ---
class AudioStreamer {
    constructor(client) { this.client = client; this.ctx = null; this.stream = null; this.node = null; }
    async start() {
        if (!this.ctx) this.ctx = new AudioContext({ sampleRate: 16000 });
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        if (!this.stream) this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        await this.ctx.audioWorklet.addModule("/static/audio-processors/capture.worklet.js");
        this.node = new AudioWorkletNode(this.ctx, "audio-capture-processor");
        this.node.port.onmessage = (e) => {
            const pcm16 = new Int16Array(e.data.data.length);
            for (let i = 0; i < e.data.data.length; i++) pcm16[i] = Math.max(-1, Math.min(1, e.data.data[i])) * 0x7FFF;
            this.client.sendAudio(btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer))));
        };
        this.ctx.createMediaStreamSource(this.stream).connect(this.node);
    }
}
class AudioPlayer {
    constructor() { this.ctx = null; this.worklet = null; }
    async init() {
        if (!this.ctx) this.ctx = new AudioContext({ sampleRate: 24000 });
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        await this.ctx.audioWorklet.addModule("/static/audio-processors/playback.worklet.js");
        this.worklet = new AudioWorkletNode(this.ctx, "pcm-processor");
        this.worklet.connect(this.ctx.destination);
    }
    play(b64) {
        if (!this.worklet) return;
        const bin = atob(b64); const pcm16 = new Int16Array(bin.length/2);
        for (let i = 0; i < bin.length/2; i++) pcm16[i] = (bin.charCodeAt(i*2) | (bin.charCodeAt(i*2+1) << 8));
        const f32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 32768.0;
        this.worklet.port.postMessage(f32);
    }
}
const audioPlayer = new AudioPlayer();

// --- DIRECTOR ---
class VoiceDirector {
    constructor() { this.api = null; this.streamer = null; this.isActive = false; }
    async start() {
        if (audioPlayer.ctx?.state === 'suspended') await audioPlayer.ctx.resume();
        if (this.isActive) return;
        console.log("🎬 VOICE: Awakening V45.49 SELF-HEALING...");
        const resp = await (await fetch(`${API_BASE}/api/live_token`)).json();
        this.api = new GeminiLiveAPI(resp.access_token || resp.token, "gemini-3.1-flash-live-preview");
        this.api.connect();
        await audioPlayer.init();
        this.streamer = new AudioStreamer(this.api);
        setTimeout(async () => { await this.streamer.start(); this.isActive = true; this.updateUI(); }, 1000);
    }
    updateUI() {
        document.querySelectorAll('#ai_awakening').forEach(o => o.style.display = 'none');
        document.getElementById('micBtn')?.classList.add('mic-active');
        document.getElementById('liveStatus')?.classList.remove('hidden');
    }
}
const voiceDirector = new VoiceDirector();

// --- OMNISCIENT EVENT DELEGATOR ---
document.addEventListener('click', e => {
    const target = e.target.closest('button, a, .suggestion-card');
    if (!target) return;
    
    const text = (target.innerText || '').toUpperCase();
    const id = target.id;

    if (text.includes('ENTER LABORATORY')) {
        e.preventDefault();
        loadLaboratory();
    } 
    else if (id === 'lockBtn' || text.includes('LOCK CINEMATIC BIBLE')) {
        console.log("🎬 UI EVENT: Click Lock.");
        handleLock();
    } 
    else if (id === 'stageBtn' || text.includes('STAGE TEASER ARC')) {
        console.log("🎬 UI EVENT: Click Stage.");
        handleStage();
    } 
    else if (id === 'packageBtn' || text.includes('ASSEMBLE PRODUCTION PACKAGE')) {
        console.log("🎬 UI EVENT: Click Package.");
        handlePackage();
    } 
    else if (id === 'btnProduceVideo' || text.includes('COMMENCE PRODUCTION')) {
        console.log("🎬 UI EVENT: Click Produce.");
        handleProduceVideo();
    } 
    else if (id === 'micBtn' || target.closest('#micBtn')) {
        voiceDirector.start();
    } 
    else if (target.classList.contains('suggestion-card')) {
        const index = Array.from(document.querySelectorAll('.suggestion-card')).indexOf(target);
        if (index >= 0) fillExample(index + 1);
    }
});

// Intercept specific UI elements that aren't buttons
document.addEventListener('click', e => {
    const awakeningOverlay = e.target.closest('#ai_awakening');
    if (awakeningOverlay) {
        awakeningOverlay.style.opacity = '0';
        setTimeout(() => awakeningOverlay.style.display = 'none', 1000);
        voiceDirector.start();
    }
});

// --- BOOTSTRAP ---
async function loadLaboratory() {
    try {
        const html = await (await fetch('app.html')).text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        document.querySelector('main').innerHTML = doc.querySelector('main').innerHTML;
        document.querySelector('header').innerHTML = doc.querySelector('header').innerHTML;
        document.body.className = doc.body.className;
        if (voiceDirector.isActive) { voiceDirector.updateUI(); if (audioPlayer.ctx) audioPlayer.ctx.resume(); }
        window.history.pushState({}, '', 'app.html');
    } catch (err) { window.location.href = 'app.html'; }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("🎬 ENGINE V45.50 READY.");
    
    // Auto-trigger the awakening overlay bypass (Unified for index.html and app.html)
    const awakeningOverlay = document.getElementById('ai_awakening');
    if (awakeningOverlay) {
        setTimeout(() => {
            awakeningOverlay.click(); // Triggers the intercept above
            awakeningOverlay.style.display = 'none';
        }, 500);
    }
    
    setTimeout(() => voiceDirector.start(), 800);
});
window.fillExample = fillExample;
