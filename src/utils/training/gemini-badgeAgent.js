import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractJSON, retryWithBackoff } from '../aiAgentShared';
import { setAgentState } from '../userStorage.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const RANK_XP = {
  E: 300,
  D: 400,
  C: 500,
  B: 700,
  A: 1000,
  S: 1500,
};

const CATEGORY_ICON = {
  technology: '⚙️',
  domain: '🌐',
  skill: '🧠',
  designation: '🛡️',
  subject: '📘',
};

const FALLBACK_VIDEOS = {
  technology: [
    { url: 'https://www.youtube.com/watch?v=3JluqTojuME', title: 'Kubernetes Explained in 100 Seconds', duration: 360 },
    { url: 'https://www.youtube.com/watch?v=S7XpTAnSDL4', title: 'TypeScript Tutorial for Beginners', duration: 2700 },
    { url: 'https://www.youtube.com/watch?v=3dHNOWTI7H8', title: 'Docker Crash Course', duration: 1800 },
  ],
  domain: [
    { url: 'https://www.youtube.com/watch?v=U4w4T9S9Nms', title: 'System Design Basics', duration: 2400 },
    { url: 'https://www.youtube.com/watch?v=bUHFg8CZFws', title: 'Distributed Systems in 15 Minutes', duration: 900 },
    { url: 'https://www.youtube.com/watch?v=im7Q6h8j4K4', title: 'FinTech Architecture Overview', duration: 1500 },
  ],
  skill: [
    { url: 'https://www.youtube.com/watch?v=9fIFh45Q4iA', title: 'Communication Skills for Engineers', duration: 1200 },
    { url: 'https://www.youtube.com/watch?v=2fKmj7Yx0tA', title: 'Technical Leadership Fundamentals', duration: 1800 },
    { url: 'https://www.youtube.com/watch?v=VfGW0Qiy2I0', title: 'Problem Solving Frameworks', duration: 2100 },
  ],
  designation: [
    { url: 'https://www.youtube.com/watch?v=y4xv4vQ5s4U', title: 'How to Become a Tech Lead', duration: 1500 },
    { url: 'https://www.youtube.com/watch?v=l3sS9QJ-5Xk', title: 'Engineering Manager Roadmap', duration: 1800 },
    { url: 'https://www.youtube.com/watch?v=JQx8h9Jv7k4', title: 'CTO Skills and Responsibilities', duration: 1200 },
  ],
  subject: [
    { url: 'https://www.youtube.com/watch?v=aircAruvnKk', title: 'Machine Learning Basics', duration: 900 },
    { url: 'https://www.youtube.com/watch?v=inWWhr5tnEA', title: 'Cyber Security Foundations', duration: 2100 },
    { url: 'https://www.youtube.com/watch?v=2ePf9rue1Ao', title: 'Data Structures and Algorithms', duration: 2400 },
  ],
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function extractYouTubeId(url) {
  if (!url) return '';

  const patterns = [
    /(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match) return match[1];
  }

  return '';
}

function goalPriorityToLabel(priority) {
  if (priority === 1) return 'HIGH';
  if (priority === 2) return 'MEDIUM';
  return 'LOW';
}

function inferRank(level, priority) {
  if (priority === 1 && level >= 30) return 'A';
  if (priority === 1 && level >= 20) return 'B';
  if (priority === 2 && level >= 10) return 'C';
  if (priority === 3 && level >= 5) return 'D';
  return 'E';
}

function normalizeLearningPath(path, index) {
  const youtubeUrl = path.youtube_url || path.url || '';
  const xpValue = Number(path.xp_value) || 100;

  return {
    id: randomId(),
    youtube_url: youtubeUrl,
    youtube_id: extractYouTubeId(youtubeUrl),
    title: String(path.title || `Learning video ${index + 1}`).slice(0, 100),
    duration_seconds: Number(path.duration_seconds) || 1200,
    xp_value: xpValue,
    why_this_video: String(path.why_this_video || path.rationale || ''),
    sequence_order: index + 1,
    watch_status: 'unwatched',
  };
}

function normalizeBadge(rawBadge, index, profile, fallbackGoal) {
  const level = Number(profile?.level) || 1;
  const preferredRank = inferRank(level, fallbackGoal?.priority || 2);
  const rank = String(rawBadge.rank || preferredRank).trim().toUpperCase();
  const safeRank = RANK_XP[rank] ? rank : preferredRank;

  const learningPaths = Array.isArray(rawBadge.learning_paths)
    ? rawBadge.learning_paths
    : [];

  const normalizedPaths = learningPaths
    .filter((path) => Boolean(path?.youtube_url || path?.url))
    .slice(0, 8)
    .map(normalizeLearningPath);

  const baseXp = Number(rawBadge.xp_reward) || RANK_XP[safeRank];

  return {
    id: randomId(),
    title: String(rawBadge.title || fallbackGoal?.value || `Mission ${index + 1}`).slice(0, 50),
    description: String(rawBadge.description || `Level up in ${fallbackGoal?.value || 'your chosen focus'} through guided training.`).slice(0, 200),
    icon_emoji: rawBadge.icon_emoji || CATEGORY_ICON[fallbackGoal?.category] || '🏆',
    rank: safeRank,
    xp_reward: Math.max(300, Math.min(baseXp, 2000)),
    category: rawBadge.category || fallbackGoal?.category || 'technology',
    agent_rationale: String(rawBadge.rationale || `Generated for ${profile?.username || 'hunter'} based on active goals.`),
    learning_paths: normalizedPaths,
    videos_total: normalizedPaths.length,
    videos_watched: 0,
    status: 'active',
    created_at: new Date().toISOString(),
  };
}

function buildPrompt(profile, goals) {
  const goalsSummary = goals
    .map((goal) => `- [${goalPriorityToLabel(goal.priority)}] (${goal.category}) ${goal.value}`)
    .join('\n');

  return `You are an expert career coach designing learning missions for a hunter-themed learning platform.

HUNTER PROFILE:
- Username: ${profile.username}
- Level: ${profile.level}
- Class: ${profile.class}-RANK
- Current Role: ${profile.current_role || 'Software Engineer'}

ACTIVE GOALS:
${goalsSummary}

Generate 3 to 5 training badges based on these goals.
Return ONLY JSON array in this format:
[
  {
    "title": "Short title",
    "description": "One sentence mission objective",
    "icon_emoji": "Single emoji",
    "rank": "E|D|C|B|A|S",
    "xp_reward": 500,
    "category": "technology|domain|skill|designation|subject",
    "rationale": "Why this mission fits",
    "learning_paths": [
      {
        "youtube_url": "https://www.youtube.com/watch?v=...",
        "title": "Video title",
        "duration_seconds": 1200,
        "xp_value": 100,
        "why_this_video": "Reason"
      }
    ]
  }
]

Rules:
- 3 to 5 badges only.
- 3 to 5 videos per badge.
- Ensure rank difficulty scales with the hunter level.
- Use concise and practical mission wording.
- youtube_url values must be valid YouTube links.
- No markdown, no explanation text, only JSON array.`;
}

function buildFallbackBadges(profile, goals) {
  const activeGoals = goals.filter((goal) => goal.is_active !== false);
  const sourceGoals = activeGoals.length > 0 ? activeGoals : [{ value: 'Core engineering growth', category: 'skill', priority: 2 }];

  return sourceGoals.slice(0, 5).map((goal, index) => {
    const rank = inferRank(Number(profile?.level) || 1, goal.priority || 2);
    const videos = (FALLBACK_VIDEOS[goal.category] || FALLBACK_VIDEOS.skill)
      .slice(0, 3)
      .map((video, videoIndex) => normalizeLearningPath({
        youtube_url: video.url,
        title: `${goal.value}: ${video.title}`,
        duration_seconds: video.duration,
        xp_value: 80 + (videoIndex * 20),
        why_this_video: `Builds practical capability for ${goal.value}.`,
      }, videoIndex));

    return normalizeBadge({
      title: `${goal.value}`,
      description: `Complete this mission to advance your ${goal.value} mastery.`,
      icon_emoji: CATEGORY_ICON[goal.category] || '🏆',
      rank,
      xp_reward: RANK_XP[rank],
      category: goal.category,
      rationale: `Generated from ${goalPriorityToLabel(goal.priority)} priority goal.`,
      learning_paths: videos,
    }, index, profile, goal);
  });
}

export async function runBadgeAgent({ profile, goals, onProgress }) {
  const report = (message, percent) => {
    onProgress?.({ message, percent });
  };

  const activeGoals = goals.filter((goal) => goal.is_active !== false);
  if (activeGoals.length === 0) {
    return [];
  }

  report('Initializing mission generation protocol...', 10);
  setAgentState('mission_generation', 'pending');

  // In frontend-only mode we allow deterministic fallback so training is always usable.
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    report('Gemini key missing. Generating local mission set...', 45);
    const fallback = buildFallbackBadges(profile, activeGoals);
    report('Local mission set generated.', 100);
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = buildPrompt(profile, activeGoals);

    report('Sending goals to mission planner...', 35);

    const responseText = await retryWithBackoff(async () => {
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
          temperature: 0.4,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const response = result.response ?? result;
      return (response.candidates ?? [])
        .flatMap((candidate) => candidate.content?.parts ?? [])
        .filter((part) => typeof part?.text === 'string')
        .map((part) => part.text)
        .join('\n')
        .trim();
    }, 4, 1500, 60000);

    report('Parsing mission payload...', 70);

    const parsed = extractJSON(responseText);
    const candidateBadges = Array.isArray(parsed)
      ? parsed
      : (Array.isArray(parsed.badges) ? parsed.badges : []);

    const normalized = candidateBadges
      .slice(0, 5)
      .map((badge, index) => normalizeBadge(badge, index, profile, activeGoals[index % activeGoals.length]))
      .filter((badge) => badge.title && badge.learning_paths.length > 0);

    if (normalized.length === 0) {
      report('AI returned empty missions. Switching to local generation...', 85);
      const fallback = buildFallbackBadges(profile, activeGoals);
      report('Local mission set generated.', 100);
      setAgentState('mission_generation', 'success', fallback);
      return fallback;
    }

    report('Mission generation complete.', 100);
    setAgentState('mission_generation', 'success', normalized);
    return normalized;
  } catch (_error) {
    report('AI mission generation failed. Using local fallback...', 85);
    const fallback = buildFallbackBadges(profile, activeGoals);
    report('Local mission set generated.', 100);
    const errorMsg = _error?.message || 'API request failed';
    setAgentState('mission_generation', 'failed', fallback, errorMsg);
    return fallback;
  }
}
