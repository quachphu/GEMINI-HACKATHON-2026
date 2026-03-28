/**
 * Demoing VEO - 3-Step Cinematic Workflow
 * Logic for Proposal -> Flow -> Final Package
 */

// --- STATE MANAGEMENT ---
let appState = {
    idea: "",
    proposal: null,
    flow: null,
    package: null
};

// --- CONFIGURATION ---
const API_BASE = window.location.port === '8080' ? '' : 'http://localhost:8080';

// --- UTILITIES ---

function safeSet(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof value === 'object' && value !== null) {
        el.innerText = value.description || value.detail || value.summary || value.prompt || JSON.stringify(value);
    } else {
        el.innerText = value || '';
    }
}

/**
 * Fetch helper with CORS and Body-Reading safety
 */
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
            let errorMsg = `Server error: ${response.status}`;
            try {
                const error = JSON.parse(text);
                errorMsg = error.error || errorMsg;
            } catch (e) {
                errorMsg = text || errorMsg;
            }
            throw new Error(errorMsg);
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(`Expected JSON but got: ${text.substring(0, 100)}`);
        }
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

function setLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    const loader = btn.querySelector('.loader');
    if (isLoading) {
        btn.disabled = true;
        loader?.classList.remove('hidden');
    } else {
        btn.disabled = false;
        loader?.classList.add('hidden');
    }
}

function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth' });
}

// --- RENDERING HELPERS ---

function renderTimeline(timeline) {
    const list = document.getElementById('outputTimeline');
    list.innerHTML = '';
    timeline.forEach(item => {
        const li = document.createElement('li');
        li.className = 'timeline-item';
        li.innerHTML = `<span class="time">${item.time}</span> <span class="t-title">${item.title}</span><p>${item.detail}</p>`;
        list.appendChild(li);
    });
}

// --- STEP HANDLERS ---

/**
 * STEP 1: GENERATE PROPOSAL
 */
async function handleStep1() {
    const idea = document.getElementById('videoIdea').value.trim();
    if (!idea) return alert("Please enter a vision first.");

    appState.idea = idea;
    setLoading('step1Btn', true);

    try {
        const data = await fetchAPI('/api/proposal', { idea });
        appState.proposal = data;

        // Populate Proposal
        safeSet('outputTitle', data.title);
        safeSet('outputLogline', data.logline);
        safeSet('outputPitch', data.pitch);
        safeSet('outputArc', data.emotionalArc);
        safeSet('outputTone', data.visualTone);
        safeSet('outputSoul', data.storySoul || 'Meaningful Narrative');
        safeSet('outputArchetype', data.characterArchetype || 'Archetypal');
        safeSet('outputVisualStyle', data.visualStyle || data.environmentDNA || 'Adaptive');
        safeSet('outputCharacterPersonality', data.characterDNA || data.characterPersonality || 'Narrative-driven');
        safeSet('outputTeaserHook', data.teaserHook || data.logline || 'Pivotal Teaser Moment');
        safeSet('outputDirectorStatement', data.directorStatement);

        showSection('proposalSection');
    } catch (err) {
        alert(`Failed to generate proposal: ${err.message}`);
    } finally {
        setLoading('step1Btn', false);
    }
}

/**
 * STEP 2: GENERATE VIDEO FLOW
 */
async function handleStep2() {
    setLoading('step2Btn', true);

    try {
        const data = await fetchAPI('/api/flow', { 
            idea: appState.idea, 
            proposal: JSON.stringify(appState.proposal) 
        });
        appState.flow = data;

        // Populate Flow
        safeSet('outputPivotalScene', data.pivotalTeaserScene || 'Production Focus: Key Teaser Moment');
        renderTimeline(data.timeline);
        safeSet('outputSequence', data.visualSequence);
        safeSet('outputTransitions', data.transitionLogic);
        safeSet('outputCamera', data.cameraDirection);
        safeSet('outputAudioGuidance', `${data.musicDirection} | ${data.soundDesign} | ${data.voiceGuidance}`);

        showSection('flowSection');
    } catch (err) {
        alert(`Failed to generate flow: ${err.message}`);
    } finally {
        setLoading('step2Btn', false);
    }
}

/**
 * STEP 3: FINAL PACKAGE & VIDEO GENERATION
 */
async function handleStep3() {
    const btn = document.getElementById('step3Btn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Assembling Final Package...";

    try {
        // Phase 1: Generate the textual package
        const data = await fetchAPI('/api/package', { 
            idea: appState.idea, 
            proposal: JSON.stringify(appState.proposal),
            flow: JSON.stringify(appState.flow)
        });
        appState.package = data;

        // Populate Package UI
        safeSet('outputMasterPrompt', data.masterPrompt);
        safeSet('outputMasterCharacter', data.masterCharacter);
        safeSet('outputMasterEnvironment', data.masterEnvironment);
        safeSet('outputMusicPrompt', data.musicPrompt);
        safeSet('outputVoicePrompt', data.voicePrompt);
        safeSet('outputEditingInstructions', data.editingInstructions);

        // Populate Act Editors for Director's Review
        if (data.clipPrompts && data.clipPrompts.length >= 3) {
            safeSet('editClip1', data.clipPrompts[0].prompt, 'value');
            safeSet('editClip2', data.clipPrompts[1].prompt, 'value');
            safeSet('editClip3', data.clipPrompts[2].prompt, 'value');
        }

        showSection('packageSection');

    } catch (err) {
        alert(`Failed to prepare package: ${err.message}`);
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function handleProduceVideo() {
    const btn = document.getElementById('btnProduceVideo');
    if (!btn) return;
    const originalText = btn.innerText;
    
    try {
        btn.disabled = true;
        btn.innerText = "🎬 INITIATING PRODUCTION...";

        // Capture Director's refinements
        appState.package.clipPrompts[0].prompt = document.getElementById('editClip1').value;
        appState.package.clipPrompts[1].prompt = document.getElementById('editClip2').value;
        appState.package.clipPrompts[2].prompt = document.getElementById('editClip3').value;

        // Prepare UI for production
        const videoContainer = document.getElementById('videoContainer');
        const statusText = document.getElementById('productionStatus');
        const videoElement = document.getElementById('finalVideo');
        
        videoContainer.classList.remove('hidden');
        document.querySelector('.production-overlay').classList.remove('hidden');
        statusText.innerText = "Syncing Director's Cut...";
        
        const { job_id } = await fetchAPI('/api/generate_video', { 
            package: appState.package 
        });

        // Polling loop
        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                try {
                    const response = await fetch(`${API_BASE}/api/video_status/${job_id}`);
                    if (!response.ok) return;
                    
                    const statusData = await response.json();
                    if (!statusData) return;
                    
                    if (statusData.status === 'processing') {
                        statusText.innerText = `Rendering 24s Cinematic Sequence (${statusData.progress}%)...`;
                    } else if (statusData.status === 'completed') {
                        clearInterval(pollInterval);
                        statusText.innerText = "Production Complete! Loading...";
                        
                        videoElement.src = `${API_BASE}${statusData.video_url}`;
                        videoElement.load();
                        
                        videoElement.oncanplay = () => {
                            document.querySelector('.production-overlay').classList.add('hidden');
                            videoElement.play();
                            resolve();
                        };
                    } else if (statusData.status === 'error') {
                        clearInterval(pollInterval);
                        statusText.innerText = `Production Failed: ${statusData.error}`;
                        reject(new Error(statusData.error));
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 3000);
        });

    } catch (err) {
        alert(`Production Error: ${err.message}`);
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    const s1Btn = document.getElementById('step1Btn');
    const s2Btn = document.getElementById('step2Btn');
    const s3Btn = document.getElementById('step3Btn');
    const produceBtn = document.getElementById('btnProduceVideo');
    const backBtn = document.getElementById('backBtn');

    if (s1Btn) s1Btn.addEventListener('click', handleStep1);
    if (s2Btn) s2Btn.addEventListener('click', handleStep2);
    if (s3Btn) s3Btn.addEventListener('click', handleStep3);
    if (produceBtn) produceBtn.addEventListener('click', handleProduceVideo);
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('flowSection').classList.add('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
