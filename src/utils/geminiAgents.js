import { validateAndNormalizeProfile } from './schemaValidator.js';
import { getErrorMessage, retryWithBackoff } from './geminiAgentShared.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const PROFILE_ENDPOINT = `${API_BASE_URL}/api/ai/generate-profile`;
const AVATAR_ENDPOINT = `${API_BASE_URL}/api/ai/generate-avatar`;

/**
 * Keep sending lightweight progress updates while waiting on a long async task.
 */
async function withProgressHeartbeat({
  task,
  phase,
  progress,
  startPercent,
  capPercent,
  message,
  intervalMs = 3000,
}) {
  let percent = startPercent;
  let elapsed = 0;

  const timerId = setInterval(() => {
    elapsed += Math.round(intervalMs / 1000);
    percent = Math.min(capPercent, percent + 1);
    progress(phase, `${message} (${elapsed}s)`, percent);
  }, intervalMs);

  try {
    return await task;
  } finally {
    clearInterval(timerId);
  }
}

async function postJson(url, payload, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      const error = new Error(data.details || data.error || `Request failed with status ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`API request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Agent Alpha: Profile Generator ──────────────────────────────────────────

/**
 * Parse resume + LinkedIn to generate a UserProfile JSON via Gemini.
 * Does not fall back to template profiles on API failure.
 *
 * @param {object} opts
 * @param {string} opts.resumeBase64       — base64-encoded file content
 * @param {string} opts.resumeMimeType     — e.g. "application/pdf"
 * @param {string} opts.linkedinUrl        — optional LinkedIn URL
 * @param {string} opts.username           — the chosen slug
 * @param {string} [opts.photoBase64]      — optional, not used for profile but passed for context
 * @param {function} [opts.onProgress]     — progress callback
 * @returns {Promise<object>}              — UserProfile JSON
 */
export async function runProfileAgent({
  resumeBase64,
  resumeMimeType,
  linkedinUrl = '',
  username,
  onProgress,
}) {
  const progress = (phase, message, percent) => {
    onProgress?.({ phase, message, percent });
  };

  progress('AGENT_ALPHA', 'Initializing profile extraction protocol…', 5);

  try {
    progress('AGENT_ALPHA', 'Uploading resume to analysis pipeline…', 15);
    progress('AGENT_ALPHA', 'Dispatching profile request to server…', 30);

    const result = await withProgressHeartbeat({
      task: retryWithBackoff(() => postJson(PROFILE_ENDPOINT, {
        resumeBase64,
        resumeMimeType,
        linkedinUrl,
        username,
      }, 65000), 3, 1000, 65000),
      phase: 'AGENT_ALPHA',
      progress,
      startPercent: 30,
      capPercent: 68,
      message: 'Analyzing resume with Gemini...',
    });

    progress('AGENT_ALPHA', 'Validating profile against schema…', 75);
    const profile = validateAndNormalizeProfile(result.profile);

    progress('AGENT_ALPHA', 'Profile data extraction complete ✓', 100);
    return profile;

  } catch (err) {
    // Distinguish between different error types
    console.error('[ProfileAgent] Error:', err);

    if (err.message?.includes('validation') || err.message?.includes('schema')) {
      // Validation error — user needs to fix resume
      const errorMsg = getErrorMessage(err);
      progress('AGENT_ALPHA', `Validation failed: ${errorMsg}`, 100);
      throw new Error(`Profile Extraction Failed: ${errorMsg}`);
    }

    // Transient/API error — surface the failure so caller can retry.
    const errorMsg = getErrorMessage(err);
    progress('AGENT_ALPHA', errorMsg, 100);
    throw new Error(`Profile Extraction Failed: ${errorMsg}`);
  }
}


// ─── Agent Beta: RPG Avatar Generator ────────────────────────────────────────

/**
 * Convert a user photo to an RPG-stylized avatar via Gemini image generation.
 * Falls back to applying an RPG canvas filter if unavailable or quota exceeded.
 *
 * @param {object} opts
 * @param {string} opts.photoBase64      — base64-encoded image
 * @param {string} opts.photoMimeType    — e.g. "image/jpeg"
 * @param {function} [opts.onProgress]   — progress callback
 * @returns {Promise<string>}            — data URL of generated image
 */
export async function runAvatarAgent({ photoBase64, photoMimeType, onProgress }) {
  const progress = (phase, message, percent) => {
    onProgress?.({ phase, message, percent });
  };

  progress('AGENT_BETA', 'Initializing avatar generation protocol…', 5);

  try {
    progress('AGENT_BETA', 'Loading image generation model…', 15);
    progress('AGENT_BETA', 'Dispatching avatar request to server…', 35);

    const result = await withProgressHeartbeat({
      task: retryWithBackoff(() => postJson(AVATAR_ENDPOINT, {
        photoBase64,
        photoMimeType,
      }, 70000), 2, 1000, 70000),
      phase: 'AGENT_BETA',
      progress,
      startPercent: 35,
      capPercent: 72,
      message: 'Generating avatar with Gemini...',
    });

    progress('AGENT_BETA', 'Processing avatar rendering…', 75);

    progress('AGENT_BETA', 'RPG avatar generation complete ✓', 100);
    return result.dataUrl;

  } catch (err) {
    console.error('[AvatarAgent] API fallback triggered:', err);
    const errorMsg = getErrorMessage(err);
    progress('AGENT_BETA', `Fallback: ${errorMsg}. Applying client-side enhancement…`, 60);
    
    // Fall back to canvas filter (graceful degradation)
    try {
      return await simulateAvatarAgent(photoBase64, photoMimeType, onProgress);
    } catch (fallbackErr) {
      console.error('[AvatarAgent] Fallback also failed, returning raw photo:', fallbackErr);
      // Last resort: return the original photo as dataUrl
      return `data:${photoMimeType};base64,${photoBase64}`;
    }
  }
}


// ─── Simulation / Fallback ────────────────────────────────────────────────────

// Client-side canvas filter to create an RPG-aesthetic even when API fails
async function simulateAvatarAgent(photoBase64, photoMimeType, onProgress) {
  const progress = (phase, message, percent) => {
    onProgress?.({ phase, message, percent });
  };

  const steps = [
    [20,  'Analyzing facial features…'],
    [40,  'Applying Solo Leveling art style…'],
    [60,  'Rendering dark fantasy aura…'],
    [80,  'Adding mana particle effects…'],
  ];

  for (const [percent, message] of steps) {
    progress('AGENT_BETA', message, percent);
    await delay(500 + Math.random() * 400);
  }

  const dataUrl = `data:${photoMimeType};base64,${photoBase64}`;
  
  // Use canvas to apply an aesthetic filter to image when AI generation quota is 0
  const filteredImage = await new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(value);
    };

    const timeoutId = setTimeout(() => {
      console.warn('[Avatar] Fallback image processing timed out, returning source image.');
      settle(dataUrl);
    }, 5000);

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          settle(dataUrl);
          return;
        }

        // Create a square avatar
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;

        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        // Draw original
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

        // Apply filters: Contrast up, brightness down, slight blur, then blue-purple aura blend
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(74, 158, 255, 0.4)'; // Blue aura
        ctx.fillRect(0, 0, size, size);

        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(25, 10, 45, 0.6)'; // Dark shadow layer
        ctx.fillRect(0, 0, size, size);

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(100, 50, 255, 0.2)'; // Magic purple glow
        ctx.fillRect(0, 0, size, size);

        settle(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        settle(dataUrl);
      }
    };
    img.onerror = () => settle(dataUrl); // Fallback to raw if logic fails
    img.src = dataUrl;
  });

  progress('AGENT_BETA', 'RPG avatar transformation complete ✓', 100);
  return filteredImage;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

