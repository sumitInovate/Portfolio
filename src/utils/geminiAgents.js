import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateAndNormalizeProfile } from './schemaValidator.js';
import {
  extractJSON,
  retryWithBackoff,
  buildProfilePrompt,
  buildLinkedInFallbackPrompt,
} from './aiAgentShared.js';
import { setAgentState } from './userStorage.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const DEFAULT_MODEL = 'gemini-2.5-flash';

function createClient() {
  return new GoogleGenerativeAI(API_KEY);
}

function getErrorMessage(err) {
  const message = err.message?.toLowerCase() ?? '';
  const status = err.status;

  if (message.includes('quota') || message.includes('rate limit') || status === 429) {
    return 'API quota exceeded. Please try again in a few minutes.';
  }
  if (status === 503 || message.includes('unavailable')) {
    return 'Gemini API is temporarily unavailable. Please retry shortly.';
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'Network error. Check your internet connection and try again.';
  }
  if (status === 401 || message.includes('unauthorized') || message.includes('invalid api')) {
    return 'Invalid API key. Check your VITE_GEMINI_API_KEY environment variable.';
  }
  if (status === 403 || message.includes('forbidden')) {
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

function extractTextBlocks(response) {
  if (!response.candidates || response.candidates.length === 0) {
    return '';
  }
  const candidate = response.candidates[0];
  // Surface truncation / safety blocks as explicit errors rather than empty/partial JSON.
  const finishReason = candidate.finishReason;
  if (finishReason && finishReason !== 'STOP' && finishReason !== 'MODEL_LENGTH') {
    if (finishReason === 'MAX_TOKENS') {
      throw new Error('Response truncated (MAX_TOKENS). Increase maxOutputTokens or reduce prompt size.');
    }
    if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
      throw new Error(`Response blocked by Gemini safety filter (${finishReason}).`);
    }
    throw new Error(`Response did not finish cleanly (finishReason=${finishReason}).`);
  }
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    return '';
  }
  return candidate.content.parts
    .filter((part) => typeof part?.text === 'string')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

export async function runProfileAgent({
  resumeBase64,
  resumeMimeType,
  linkedinUrl = '',
  username,
  onProgress,
}) {
  const progress = (phase, message, percent) => onProgress?.({ phase, message, percent });

  progress('AGENT_ALPHA', 'Initializing profile extraction protocol...', 5);
  setAgentState('profile_extract', 'pending');

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    const msg = 'Gemini API key not configured. Profile extraction requires a valid API key.';
    progress('AGENT_ALPHA', msg, 100);
    throw new Error(`Profile Extraction Failed: ${msg}`);
  }

  try {
    const genAI = createClient();
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    progress('AGENT_ALPHA', 'Uploading resume to analysis pipeline...', 15);

    const prompt = buildProfilePrompt({ username, linkedinUrl });
    progress('AGENT_ALPHA', 'Scanning resume content with AI...', 30);

    // Step 1: API call — retriable failures (network / HTTP / timeout) bubble up unchanged.
    let response;
    try {
      response = await retryWithBackoff(async () => {
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: resumeMimeType || 'application/pdf',
                    data: resumeBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        return result.response ?? result;
      }, 5, 2000, 60000);
    } catch (err) {
      console.error('[ProfileAgent] API error', err);
      const errorMsg = getErrorMessage(err);
      setAgentState('profile_extract', 'failed', null, errorMsg);
      progress('AGENT_ALPHA', errorMsg, 100);
      const wrapped = new Error(`Profile Extraction Failed: ${errorMsg}`);
      // Retriable: caller should retry until HTTP 200.
      throw wrapped;
    }

    // Step 2: API returned 200 — process response. Failures here are terminal (no retry).
    try {
      progress('AGENT_ALPHA', 'Parsing extracted profile data...', 70);
      const text = extractTextBlocks(response);
      const extracted = extractJSON(text);

      progress('AGENT_ALPHA', 'Validating profile against schema...', 75);
      const normalized = validateAndNormalizeProfile(extracted);
      normalized.meta.username = username;

      setAgentState('profile_extract', 'success', normalized);
      progress('AGENT_ALPHA', 'Profile data extraction complete.', 100);
      return normalized;
    } catch (err) {
      console.error('[ProfileAgent] post-response error', err);
      const errorMsg = getErrorMessage(err);
      setAgentState('profile_extract', 'failed', null, errorMsg);
      progress('AGENT_ALPHA', errorMsg, 100);
      const wrapped = new Error(`Profile Extraction Failed: ${errorMsg}`);
      wrapped.nonRetriable = true;
      throw wrapped;
    }
  } catch (err) {
    // Defensive fallback — shouldn't normally hit this branch.
    if (err?.message?.startsWith('Profile Extraction Failed')) throw err;
    console.error('[ProfileAgent]', err);
    const errorMsg = getErrorMessage(err);
    setAgentState('profile_extract', 'failed', null, errorMsg);
    progress('AGENT_ALPHA', errorMsg, 100);
    throw new Error(`Profile Extraction Failed: ${errorMsg}`);
  }
}

export async function runLinkedInFallbackAgent({
  linkedinUrl = '',
  linkedinData,
  username,
  onProgress,
}) {
  const progress = (phase, message, percent) => onProgress?.({ phase, message, percent });

  progress('AGENT_ALPHA', 'Initializing LinkedIn fallback protocol...', 5);
  setAgentState('profile_linkedin', 'pending');

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    const msg = 'Gemini API key not configured. Profile generation requires a valid API key.';
    progress('AGENT_ALPHA', msg, 100);
    throw new Error(`Profile Extraction Failed: ${msg}`);
  }

  try {
    const genAI = createClient();
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    progress('AGENT_ALPHA', 'Building profile from LinkedIn data...', 15);

    const prompt = buildLinkedInFallbackPrompt({ username, linkedinUrl, linkedinData });
    progress('AGENT_ALPHA', 'Generating profile from LinkedIn information...', 30);

    // Step 1: API call — retriable.
    let response;
    try {
      response = await retryWithBackoff(async () => {
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        return result.response ?? result;
      }, 5, 2000, 60000);
    } catch (err) {
      console.error('[LinkedInFallbackAgent] API error', err);
      const errorMsg = getErrorMessage(err);
      setAgentState('profile_linkedin', 'failed', null, errorMsg);
      progress('AGENT_ALPHA', errorMsg, 100);
      throw new Error(`Profile Extraction Failed: ${errorMsg}`);
    }

    // Step 2: API returned 200 — non-retriable processing.
    try {
      progress('AGENT_ALPHA', 'Parsing generated profile data...', 70);
      const text = extractTextBlocks(response);
      const extracted = extractJSON(text);

      progress('AGENT_ALPHA', 'Validating profile against schema...', 75);
      const normalized = validateAndNormalizeProfile(extracted);
      normalized.meta.username = username;

      setAgentState('profile_linkedin', 'success', normalized);
      progress('AGENT_ALPHA', 'LinkedIn-based profile generation complete.', 100);
      return normalized;
    } catch (err) {
      console.error('[LinkedInFallbackAgent] post-response error', err);
      const errorMsg = getErrorMessage(err);
      setAgentState('profile_linkedin', 'failed', null, errorMsg);
      progress('AGENT_ALPHA', errorMsg, 100);
      const wrapped = new Error(`Profile Extraction Failed: ${errorMsg}`);
      wrapped.nonRetriable = true;
      throw wrapped;
    }
  } catch (err) {
    if (err?.message?.startsWith('Profile Extraction Failed')) throw err;
    console.error('[LinkedInFallbackAgent]', err);
    const errorMsg = getErrorMessage(err);
    setAgentState('profile_linkedin', 'failed', null, errorMsg);
    progress('AGENT_ALPHA', errorMsg, 100);
    throw new Error(`Profile Extraction Failed: ${errorMsg}`);
  }
}

export async function runAvatarAgent({ photoBase64, photoMimeType, onProgress }) {
  const progress = (phase, message, percent) => onProgress?.({ phase, message, percent });

  progress('AGENT_BETA', 'Initializing avatar processing protocol...', 5);
  setAgentState('avatar_process', 'pending');
  progress('AGENT_BETA', 'Using uploaded photo as profile avatar...', 45);

  if (!photoBase64) {
    const msg = 'No photo data was provided for avatar processing.';
    setAgentState('avatar_process', 'failed', null, msg);
    progress('AGENT_BETA', msg, 100);
    throw new Error(`Avatar Generation Failed: ${msg}`);
  }

  const mimeType = photoMimeType || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${photoBase64}`;

  setAgentState('avatar_process', 'success', { dataUrl });
  progress('AGENT_BETA', 'Avatar processing complete.', 100);
  return dataUrl;
}
