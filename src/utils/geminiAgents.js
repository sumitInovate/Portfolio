import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateAndNormalizeProfile } from './schemaValidator.js';
import {
  extractJSON,
  retryWithBackoff,
  buildProfilePrompt,
  buildLinkedInFallbackPrompt,
  AVATAR_PROMPT,
} from './geminiAgentShared.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─ Error categorization ─

function getErrorMessage(err) {
  const message = err.message?.toLowerCase() ?? '';
  const status  = err.statusCode || err.status;

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
    return 'Could not parse resume. Ensure it is a valid PDF or DOCX file (< 25MB).';
  }
  return `API Error: ${err.message ?? 'Unknown error'}`;
}

// ─ Agent Alpha: Profile Extractor ─

export async function runProfileAgent({
  resumeBase64,
  resumeMimeType,
  linkedinUrl = '',
  username,
  onProgress,
}) {
  const progress = (phase, message, percent) => onProgress?.({ phase, message, percent });

  progress('AGENT_ALPHA', 'Initializing profile extraction protocol...', 5);
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    const msg = 'Gemini API key not configured. Profile extraction requires a valid API key.';
    progress('AGENT_ALPHA', msg, 100);
    throw new Error(`Profile Extraction Failed: ${msg}`);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    progress('AGENT_ALPHA', 'Uploading resume to analysis pipeline...', 15);

    const prompt = buildProfilePrompt({ username, linkedinUrl });

    progress('AGENT_ALPHA', 'Scanning resume content with AI...', 30);

    const profile = await retryWithBackoff(async () => {
      const result = await model.generateContent([
        { inlineData: { mimeType: resumeMimeType, data: resumeBase64 } },
        prompt,
      ]);

      progress('AGENT_ALPHA', 'Parsing extracted profile data...', 70);

      const text = result.response.text().trim();
      const extracted = extractJSON(text);

      progress('AGENT_ALPHA', 'Validating profile against schema...', 75);
      const normalized = validateAndNormalizeProfile(extracted);
      normalized.meta.username = username;
      return normalized;
    }, 2, 2000);
    progress('AGENT_ALPHA', 'Profile data extraction complete.', 100);
    return profile;

  } catch (err) {
    console.error('[ProfileAgent]', err);
    const errorMsg = getErrorMessage(err);
    progress('AGENT_ALPHA', errorMsg, 100);
    throw new Error(`Profile Extraction Failed: ${errorMsg}`);
  }
}

// ─ Agent Alpha Fallback: LinkedIn Text-based Profile Generator ─

/**
 * When resume extraction fails and a LinkedIn URL is present, this agent
 * generates a valid profile from structured text fields the user provides
 * manually (no scraping — frontend-only, CORS-safe).
 */
export async function runLinkedInFallbackAgent({
  linkedinUrl = '',
  linkedinData,
  username,
  onProgress,
}) {
  const progress = (phase, message, percent) => onProgress?.({ phase, message, percent });

  progress('AGENT_ALPHA', 'Initializing LinkedIn fallback protocol...', 5);

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    const msg = 'Gemini API key not configured. Profile generation requires a valid API key.';
    progress('AGENT_ALPHA', msg, 100);
    throw new Error(`Profile Extraction Failed: ${msg}`);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    progress('AGENT_ALPHA', 'Building profile from LinkedIn data...', 15);

    const prompt = buildLinkedInFallbackPrompt({ username, linkedinUrl, linkedinData });

    progress('AGENT_ALPHA', 'Generating profile from LinkedIn information...', 30);

    const profile = await retryWithBackoff(async () => {
      const result = await model.generateContent(prompt);

      progress('AGENT_ALPHA', 'Parsing generated profile data...', 70);

      const text = result.response.text().trim();
      const extracted = extractJSON(text);

      progress('AGENT_ALPHA', 'Validating profile against schema...', 75);
      const normalized = validateAndNormalizeProfile(extracted);
      normalized.meta.username = username;
      return normalized;
    }, 2, 2000);

    progress('AGENT_ALPHA', 'LinkedIn-based profile generation complete.', 100);
    return profile;

  } catch (err) {
    console.error('[LinkedInFallbackAgent]', err);
    const errorMsg = getErrorMessage(err);
    progress('AGENT_ALPHA', errorMsg, 100);
    throw new Error(`Profile Extraction Failed: ${errorMsg}`);
  }
}

// ─ Agent Beta: RPG Avatar Generator ─

export async function runAvatarAgent({ photoBase64, photoMimeType, onProgress }) {
  const progress = (phase, message, percent) => onProgress?.({ phase, message, percent });

  progress('AGENT_BETA', 'Initializing avatar generation protocol...', 5);

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    const msg = 'Gemini API key not configured. Avatar generation requires a valid API key.';
    progress('AGENT_BETA', msg, 100);
    throw new Error(`Avatar Generation Failed: ${msg}`);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // gemini-2.0-flash-preview-image-generation is the correct model for image output.
    // responseModalities: ['IMAGE'] is required to get inlineData image parts back.
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-preview-image-generation',
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    });

    progress('AGENT_BETA', 'Loading image generation model...', 15);
    progress('AGENT_BETA', 'Rendering RPG transformation via API...', 35);

    const result = await retryWithBackoff(async () => {
      return await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: photoMimeType, data: photoBase64 } },
              { text: AVATAR_PROMPT },
            ],
          },
        ],
      });
    }, 2, 2000);

    progress('AGENT_BETA', 'Processing avatar rendering...', 75);

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        progress('AGENT_BETA', 'RPG avatar generation complete.', 100);
        return dataUrl;
      }
    }

    throw new Error('No image returned — model may not support image output for this request');

  } catch (err) {
    console.error('[AvatarAgent]', err);
    const errorMsg = getErrorMessage(err);
    progress('AGENT_BETA', errorMsg, 100);
    throw new Error(`Avatar Generation Failed: ${errorMsg}`);
  }
}
