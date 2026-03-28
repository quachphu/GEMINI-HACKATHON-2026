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

// --- CONFIGURATION ---
const API_BASE = window.location.port === '8080' ? '' : 'http://localhost:8080';

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
                <span style="color: #3498db; font-size: 0.8rem; letter-spacing: 0.1rem;">CAST: [${item.castCount} PEOPLE]</span>
            </div>
            <p style="color: #fff; margin-top: 0.5rem; font-weight: bold; font-family: var(--font-serif); font-size: 1.3rem;">"${item.dialogueLine || 'SILENT CONTINUITY'}"</p>
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

        // V39 BIBLE MAPPING
        safeSet('outputTitle', data.projectTitle);
        safeSet('outputLogline', data.upgradedLogline);
        safeSet('outputThematicCore', data.thematicCore);
        safeSet('outputUnifiedFilmLanguage', data.unifiedFilmLanguage);
        safeSet('outputTeaserPromise', data.teaserPromise);
        safeSet('outputDialogueArchitecture', data.dialogueArchitecture);
        safeSet('outputScoreArchitecture', data.scoreArchitecture);
        safeSet('outputEndingTensionGoal', data.endingTensionGoal);

        // Character Locks (DNA)
        if (data.characterIdentityLocks) {
            const main = data.characterIdentityLocks.main || {};
            const supp = data.characterIdentityLocks.supporting || {};
            safeSet('outputMainChar', `NAME: ${main.name || 'N/A'}\nPHYSICAL: ${main.physical || 'N/A'}\nWARDROBE: ${main.wardrobe || 'N/A'}`);
            safeSet('outputSupportingChar', `NAME: ${supp.name || 'N/A'}\nPHYSICAL: ${supp.physical || 'N/A'}\nWARDROBE: ${supp.wardrobe || 'N/A'}`);
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
                    statusText.innerText = "V30 PERFORMANCE CUT COMPLETE.";
                    
                    videoElement.src = `${API_BASE}${statusData.video_url}`;
                    videoElement.load();
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

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    const lockBtn = document.getElementById('lockBtn');
    const stageBtn = document.getElementById('stageBtn');
    const packageBtn = document.getElementById('packageBtn');
    const produceBtn = document.getElementById('btnProduceVideo');

    if (lockBtn) lockBtn.addEventListener('click', handleLock);
    if (stageBtn) stageBtn.addEventListener('click', handleStage);
    if (packageBtn) packageBtn.addEventListener('click', handlePackage);
    if (produceBtn) produceBtn.addEventListener('click', handleProduceVideo);
});
