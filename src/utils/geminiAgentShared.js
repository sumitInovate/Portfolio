export const PROFILE_SCHEMA = `
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

export function buildProfilePrompt({ username, linkedinUrl = '' }) {
  const linkedinContext = linkedinUrl
    ? `The candidate's LinkedIn profile URL is: ${linkedinUrl}. Use this as additional context for their professional history.`
    : '';

  return `You are an expert profile extraction AI for a developer portfolio platform called CodeAether.
Analyze the provided resume document and extract ALL professional information.
${linkedinContext}

The username/slug for this user is: "${username}"

Generate a complete JSON profile in EXACTLY this schema format (no markdown, no code blocks, just raw JSON):
${PROFILE_SCHEMA}

Rules:
- Assign RPG rank based on seniority: E (student/intern), D (<1yr), C (1-2yr), B (2-4yr), A (4-6yr), S (6+ yr)
- Create creative Solo Leveling-style RPG ability names for each skill (e.g. "SHADOW EXTRACTION", "DOMAIN EXPANSION")
- Write bio in an epic hunter/RPG tone while remaining professional
- Include ALL work experience found in the resume
- Include ALL skills mentioned (group into BACKEND, FRONTEND, CLOUD & DEVOPS, TOOLS, etc.)
- Set avatarUrl to "/sumit_avatar.png" (will be replaced later)
- Keep contact.email and contact.whatsappNumber empty (privacy)
- The heatmapSeed array must have EXACTLY 364 numbers, each 0-3

Output ONLY valid JSON, nothing else.`;
}

export const AVATAR_PROMPT = `Transform this person's photo into an RPG fantasy anime portrait in the exact style of "Solo Leveling" manhwa.
The character should:
- Have the same face and features as the person in the photo
- Be rendered in a dark, dramatic Solo Leveling manhwa art style
- Wear sleek, dark hunter armor with blue/purple glowing runes
- Have dramatic blue/purple aura particles around them
- Background: dark void with faint blue magic circles
- Pose: confident three-quarter view, slight upward gaze
- Art style: High quality manhwa illustration, cinematic lighting, dark fantasy

Output ONLY the transformed image.`;

export function extractJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('extractJSON: Response text is empty or not a string');
  }

  const jsonText = text.trim();
  const strategies = [
    (value) => value.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, ''),
    (value) => value.replace(/^`+\s*(?:json)?\s*\n?/, '').replace(/\n?`+\s*$/, ''),
    (value) => value,
  ];

  let lastError;
  for (const strategy of strategies) {
    try {
      return JSON.parse(strategy(jsonText));
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Failed to extract valid JSON from response. Last error: ${lastError?.message}. ` +
    `Response preview: ${jsonText.substring(0, 200)}...`
  );
}

export function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, timeoutMs = 45000) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await withTimeout(
        fn(),
        timeoutMs,
        `API request timeout after ${timeoutMs}ms (attempt ${attempt + 1})`
      );
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries - 1;

      if (
        error.message?.includes('INVALID') ||
        error.message?.includes('validation') ||
        error.message?.includes('schema') ||
        error.statusCode === 400 ||
        error.statusCode === 401 ||
        isLastAttempt
      ) {
        throw error;
      }

      const delayMs = baseDelay * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }

  throw lastError;
}

export function getErrorMessage(error) {
  const message = error.message?.toLowerCase() ?? '';
  const status = error.statusCode || error.status;

  if (message.includes('quota') || message.includes('rate limit') || status === 429) {
    return 'API quota exceeded. Please try again in a few minutes.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'Network error. Check your internet connection and try again.';
  }

  if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api')) {
    return 'Invalid Gemini service configuration. Check the server GEMINI_API_KEY.';
  }

  if (message.includes('403') || message.includes('forbidden')) {
    return 'Access forbidden. The Gemini service key may not have permission for this model.';
  }

  if (message.includes('validation') || message.includes('schema')) {
    return 'Profile validation failed. The extracted data did not match the expected format.';
  }

  if (message.includes('resume') || message.includes('document')) {
    return 'Could not parse resume. Please ensure it is a valid PDF or DOCX file (< 25MB).';
  }

  return `API Error: ${error.message ?? 'Unknown error'}`;
}

export function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}