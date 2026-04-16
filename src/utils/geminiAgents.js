/**
 * geminiAgents.js — CodeAether AI Agents
 *
 * Agent Alpha: Profile Agent
 *   Takes resume (PDF/DOCX as base64) + optional LinkedIn URL
 *   → Returns a full UserProfile JSON matching our schema
 *
 * Agent Beta: Avatar Agent
 *   Takes a user photo (as base64)
 *   → Returns an RPG-stylized image (base64 PNG)
 *
 * Improvements:
 *   - Schema validation on extracted profiles
 *   - Robust JSON parsing with multiple fallback strategies
 *   - Retry logic with exponential backoff for transient errors
 *   - Distinct error messages (API, validation, network, quota)
 *   - No silent fallbacks—user sees actual error reasons
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateAndNormalizeProfile } from './schemaValidator.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── Profile schema prompt context ──────────────────────────────────────────

const PROFILE_SCHEMA = `
{
  "meta": {
    "username": "<slug>",
    "displayName": "<Full Name>",
    "tagline": "<Short tagline ≤80 chars>",
    "avatarUrl": "/sumit_avatar.png",
    "status": "available",
    "theme": "solo-leveling"
  },
  "hero": {
    "alertText": "<Exciting RPG announcement like 'A NEW HUNTER HAS AWAKENED!'>",
    "firstName": "<FIRST NAME UPPERCASE>",
    "lastName": "<LAST NAME UPPERCASE>",
    "role": "<Primary job title>",
    "stack": "<Top 4-5 technologies separated by · >",
    "rank": "<E/D/C/B/A/S based on seniority: E=student, S=senior 5+ years>",
    "level": <years of experience as number>,
    "xp": { "current": <random 3000-9500>, "max": 10000 },
    "location": "<City, Country>"
  },
  "about": {
    "profileFields": [
      { "key": "NAME", "val": "<Full Name>" },
      { "key": "CLASS", "val": "<Primary role>" },
      { "key": "LEVEL", "val": "<X+ Years Experience>" },
      { "key": "GUILD", "val": "<Current Company>" },
      { "key": "LOCATION", "val": "<City, Country>" },
      { "key": "STATUS", "val": "Open to Opportunities" }
    ],
    "bio": ["<2 paragraph bio in hunter/RPG tone, 2-3 sentences each>"],
    "quickStats": [
      { "val": "<number>", "label": "<Achievement metric>" }
    ]
  },
  "skills": [
    {
      "category": "BACKEND",
      "icon": "⚔",
      "skills": [
        { "name": "<tech>", "alias": "<RPG ability name>", "value": <0-100>, "desc": "<1 sentence>" }
      ]
    }
  ],
  "experience": [
    {
      "rank": "A",
      "guild": "<Company>",
      "role": "<Job title>",
      "period": "<Month YYYY – Present or Month YYYY>",
      "location": "<City, Country>",
      "status": "ACTIVE",
      "achievements": ["<bullet point 1>", "<bullet point 2>"]
    }
  ],
  "projects": [
    {
      "rank": "A",
      "title": "<Project Name>",
      "tech": "<tech1 · tech2 · tech3>",
      "desc": "<2-3 sentence description>",
      "classified": false,
      "link": null
    }
  ],
  "certifications": [
    { "variant": "gold", "type": "[CERTIFICATION]", "title": "<cert name>", "year": "<year>" }
  ],
  "contact": {
    "email": "",
    "whatsappNumber": "",
    "linkedin": "<linkedinUrl or ''>",
    "location": "<City, Country>"
  },
  "github": {
    "username": "<slug>",
    "stats": [
      { "label": "Experience:", "value": "<X+ Years>" },
      { "label": "Primary Stack:", "value": "<Main tech>" },
      { "label": "Specialization:", "value": "<domain>" },
      { "label": "Languages:", "value": "<lang1, lang2>" }
    ],
    "heatmapSeed": [0,1,2,1,0,2,3,1,0,2,1,3,0,1,2,0,3,1,2,0,1,2,3,0,1,2,0,1,3,2,1,0,2,1,0,3,2,1,0,2,3,1,0,2,1,3,0,1,2,0,1,2,3,1,0,2,1,0,3,2,1,2,3,0,1,2,0,3,1,2,0,1,3,2,1,0,2,1,0,3,2,1,0,2,3,0,1,2,3,0,1,2,0,1,3,2,1,0,2,1,0,3,2,1,0,2,3,1,0,2,1,3,0,1,2,0,1,2,3,1,0,2,1,0,3,2,1,2,0,3,1,2,0,1,3,0,2,1,0,3,2,1,0,2,1,3,0,2,1,0,3,2,1,0,2,3,1,0,2,1,0,3,2,1,3,0,2,1,0,2,3,1,0,2,1,3,0,1,2,0,3,1,2,0,1,3,0,2,1,0,3,2,1,0,2,1,3,0,1,2,0,1,2,3,1,0,2,1,0,3,2,1,0,2,3,1,0,2,1,3,0,2,1,0,3,2,1,0,2,1,0,3,2,1,0,2,3,1,0,2,1,3,0,1,2,0,3,1,2,0,1,3,0,2,1,0,3,2,1,0,2,1,3,0,1,2,0,1,2,3,1,0,2,1,0,3,2,1,2,3,0,1,2,0,3,1,2,0,1,3,0,2,1,0,3,2,1,0,2,1,3,0,1,2,0,1,2,3,1,0,2,1,0,3,2,1,0,2,3,1,0,2,1,3,0,1,2,0,3,1,2,0,1,3,2,1,0,2,1,0,3,2,1,0,2,3,1,0,2,1,3,0,2,1]
  }
}`;

// ─── Progress callback type ────────────────────────────────────────────────
// onProgress({ phase: string, message: string, percent: number })

// ─── Helper Functions ──────────────────────────────────────────────────────

/**
 * Extract JSON from various text formats (with/without markdown, extra whitespace, etc.)
 * 
 * @param {string} text - Raw text response from Gemini
 * @returns {Object} - Parsed JSON object or throws descriptive error
 * @throws {Error} - If JSON extraction/parsing fails
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('extractJSON: Response text is empty or not a string');
  }

  let jsonText = text.trim();

  // Try multiple markdown extraction strategies
  const strategies = [
    // Strategy 1: Triple backticks with optional "json" label
    (t) => t.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, ''),
    // Strategy 2: Single backticks (malformed)
    (t) => t.replace(/^`+\s*(?:json)?\s*\n?/, '').replace(/\n?`+\s*$/, ''),
    // Strategy 3: No markup, assume pure JSON
    (t) => t,
  ];

  let lastError;
  for (const strategy of strategies) {
    try {
      const cleaned = strategy(jsonText);
      // Attempt parse
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (e) {
      lastError = e;
      // Continue to next strategy
    }
  }

  // All strategies failed
  throw new Error(
    `Failed to extract valid JSON from response. Last error: ${lastError?.message}. ` +
    `Response preview: ${jsonText.substring(0, 200)}...`
  );
}

/**
 * Retry a promise-returning function with exponential backoff
 * 
 * @param {Function} fn - Function that returns a Promise
 * @param {number} maxRetries - Maximum retry attempts (default: 2)
 * @param {number} baseDelay - Initial delay in ms (default: 1000)
 * @returns {Promise} - Result of fn, or throws if all retries fail
 */
async function retryWithBackoff(fn, maxRetries = 2, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === maxRetries - 1;

      // Don't retry on validation errors or client errors
      if (
        err.message?.includes('INVALID') ||
        err.message?.includes('validation') ||
        err.message?.includes('schema') ||
        err.statusCode === 400 ||
        err.statusCode === 401 ||
        isLastAttempt
      ) {
        throw err;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay_ms = baseDelay * Math.pow(2, attempt);
      console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay_ms}ms:`, err.message);
      await delay(delay_ms);
    }
  }

  throw lastError;
}

/**
 * Categorize API errors for user-friendly messages
 */
function getErrorMessage(err) {
  const message = err.message?.toLowerCase() ?? '';
  const status = err.statusCode || err.status;

  if (message.includes('quota') || message.includes('rate limit') || status === 429) {
    return 'API quota exceeded. Please try again in a few minutes.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'Network error. Check your internet connection and try again.';
  }

  if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api')) {
    return 'Invalid API key. Check your VITE_GEMINI_API_KEY environment variable.';
  }

  if (message.includes('403') || message.includes('forbidden')) {
    return 'Access forbidden. Your API key may not have permission for this model.';
  }

  if (message.includes('validation') || message.includes('schema')) {
    return 'Profile validation failed. The extracted data did not match the expected format.';
  }

  if (message.includes('resume') || message.includes('document')) {
    return 'Could not parse resume. Please ensure it is a valid PDF or DOCX file (< 25MB).';
  }

  // Generic error
  return `API Error: ${err.message ?? 'Unknown error'}`;
}

// ─── Agent Alpha: Profile Generator ──────────────────────────────────────────

/**
 * Parse resume + LinkedIn to generate a UserProfile JSON via Gemini.
 * Throws when API is unavailable or extraction fails.
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

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    const configError = 'Gemini API key not configured. Profile extraction requires a valid API key.';
    progress('AGENT_ALPHA', configError, 100);
    throw new Error(`Profile Extraction Failed: ${configError}`);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    progress('AGENT_ALPHA', 'Uploading resume to analysis pipeline…', 15);

    const linkedinContext = linkedinUrl
      ? `The candidate's LinkedIn profile URL is: ${linkedinUrl}. Use this as additional context for their professional history.`
      : '';

    const prompt = `You are an expert profile extraction AI for a developer portfolio platform called CodeAether.
Analyze the provided resume document and extract ALL professional information.
${linkedinContext}

The username/slug for this user is: "${username}"

Generate a complete JSON profile in EXACTLY this schema format (no markdown, no code blocks, just raw JSON):
${PROFILE_SCHEMA}

Rules:
- Assign RPG rank based on seniority: E (student/intern), D (<1yr), C (1-2yr), B (2-4yr), A (4-6yr), S (6+ yr)
- Create creative Solo Leveling–style RPG ability names for each skill (e.g. "SHADOW EXTRACTION", "DOMAIN EXPANSION")
- Write bio in an epic hunter/RPG tone while remaining professional
- Include ALL work experience found in the resume
- Include ALL skills mentioned (group into BACKEND, FRONTEND, CLOUD & DEVOPS, TOOLS, etc.)
- Set avatarUrl to "/sumit_avatar.png" (will be replaced later)
- Keep contact.email and contact.whatsappNumber empty (privacy)
- The heatmapSeed array must have EXACTLY 364 numbers, each 0-3

Output ONLY valid JSON, nothing else.`;

    progress('AGENT_ALPHA', 'Scanning resume content with AI…', 30);

    // Retry on transient failures (network, rate limit, etc.)
    const profile = await retryWithBackoff(async () => {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: resumeMimeType,
            data: resumeBase64,
          },
        },
        prompt,
      ]);

      progress('AGENT_ALPHA', 'Parsing extracted profile data…', 70);

      // Extract JSON with robust error handling
      const text = result.response.text().trim();
      const extracted = extractJSON(text);

      // Validate against schema and normalize
      progress('AGENT_ALPHA', 'Validating profile against schema…', 75);
      const normalized = validateAndNormalizeProfile(extracted);

      // Set correct username
      normalized.meta.username = username;

      return normalized;
    }, 2, 1000);

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

    // Transient error (network, quota, API issue) — throw so caller can retry/fail.
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

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    const configError = 'Gemini API key not configured. Avatar generation requires a valid API key.';
    progress('AGENT_BETA', configError, 100);
    throw new Error(`Avatar Generation Failed: ${configError}`);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    progress('AGENT_BETA', 'Loading image generation model…', 15);

    // Use gemini-2.0-flash for better image generation support
    // (gemini-2.5-flash-image is deprecated; use gemini-2.0-flash with native image support)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    progress('AGENT_BETA', 'Rendering RPG transformation via API…', 35);

    // Retry on transient failures
    const result = await retryWithBackoff(async () => {
      return await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: photoMimeType,
                  data: photoBase64,
                },
              },
              {
                text: `Transform this person's photo into an RPG fantasy anime portrait in the exact style of "Solo Leveling" manhwa.
The character should:
- Have the same face and features as the person in the photo
- Be rendered in a dark, dramatic Solo Leveling manhwa art style
- Wear sleek, dark hunter armor with blue/purple glowing runes
- Have dramatic blue/purple aura particles around them  
- Background: dark void with faint blue magic circles
- Pose: confident three-quarter view, slight upward gaze
- Art style: High quality manhwa illustration, cinematic lighting, dark fantasy

Output ONLY the transformed image.`,
              },
            ],
          },
        ],
      });
    }, 2, 1000);

    progress('AGENT_BETA', 'Processing avatar rendering…', 75);

    // Extract image from response
    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        progress('AGENT_BETA', 'RPG avatar generation complete ✓', 100);
        return dataUrl;
      }
    }

    throw new Error('No image generated in response');

  } catch (err) {
    console.error('[AvatarAgent] Error:', err);
    const errorMsg = getErrorMessage(err);
    progress('AGENT_BETA', errorMsg, 100);
    throw new Error(`Avatar Generation Failed: ${errorMsg}`);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

