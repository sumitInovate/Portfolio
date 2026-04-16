import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AVATAR_PROMPT,
  createHttpError,
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

    const { photoBase64, photoMimeType } = req.body ?? {};

    if (!photoBase64 || typeof photoBase64 !== 'string') {
      throw createHttpError('Missing photoBase64 payload.', 400);
    }

    if (!photoMimeType || typeof photoMimeType !== 'string' || !photoMimeType.startsWith('image/')) {
      throw createHttpError('Invalid or missing photoMimeType payload.', 400);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const dataUrl = await retryWithBackoff(async () => {
      const result = await model.generateContent({
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
              { text: AVATAR_PROMPT },
            ],
          },
        ],
      });

      const parts = result.response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      throw createHttpError('No image generated in response', 502);
    }, 2, 1000, 60000);

    return res.status(200).json({ success: true, dataUrl });
  } catch (error) {
    console.error('[generate-avatar]', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: getErrorMessage(error),
      details: error.message || 'Unknown error',
    });
  }
}