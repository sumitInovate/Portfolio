import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateAndNormalizeProfile } from '../../src/utils/schemaValidator.js';
import {
  buildProfilePrompt,
  createHttpError,
  extractJSON,
  getErrorMessage,
  retryWithBackoff,
} from '../../src/utils/geminiAgentShared.js';

function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  withCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw createHttpError('Gemini API key not configured on server.', 500);
    }

    const {
      resumeBase64,
      resumeMimeType,
      linkedinUrl = '',
      username,
    } = req.body ?? {};

    if (!resumeBase64 || typeof resumeBase64 !== 'string') {
      throw createHttpError('Missing resumeBase64 payload.', 400);
    }

    if (!resumeMimeType || typeof resumeMimeType !== 'string') {
      throw createHttpError('Missing resumeMimeType payload.', 400);
    }

    if (!username || typeof username !== 'string') {
      throw createHttpError('Missing username payload.', 400);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = buildProfilePrompt({ username, linkedinUrl });

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

      const extracted = extractJSON(result.response.text().trim());
      const normalized = validateAndNormalizeProfile(extracted);
      normalized.meta.username = username;
      if (!normalized.contact.linkedin && linkedinUrl) {
        normalized.contact.linkedin = linkedinUrl;
      }

      return normalized;
    }, 3, 1000, 45000);

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error('[generate-profile]', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: getErrorMessage(error),
      details: error.message || 'Unknown error',
    });
  }
}