import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * /api/agent/run
 * Generates 3-5 training badges using Gemini based on user profile + goals
 * Called when: user saves goals, levels up, or requests badge regeneration
 *
 * Request body:
 *   {
 *     username: string,
 *     level: number,
 *     class: string (E-S),
 *     goals: [{ value, category, priority }, ...],
 *     trigger: 'goals_changed' | 'level_up' | 'manual'
 *   }
 *
 * Response:
 *   {
 *     success: boolean,
 *     badges: [ { id, title, description, rank, xp_reward, icon_emoji, videos_urls, ... } ],
 *     badgesGenerated: number,
 *     error?: string
 *   }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, level, class: hunterClass, goals } = req.body;

    if (!username || !goals) {
      return res.status(400).json({ error: 'Missing username or goals' });
    }

    // Build prompt for Gemini
    const goalsSummary = goals
      .map(g => `• [${g.priority === 1 ? 'HIGH' : g.priority === 2 ? 'MEDIUM' : 'LOW'}] ${g.value}`)
      .join('\n');

    const prompt = `You are an expert career coach designing learning missions for a hunter-themed learning platform.

HUNTER PROFILE:
- Username: ${username}
- Level: ${level}
- Class: ${hunterClass}-RANK
- Current Goals:
${goalsSummary}

GENERATE EXACTLY 3-5 TRAINING BADGES based on this hunter's goals and level.

For each badge, provide a response in this exact JSON format (return ONLY a JSON array, no markdown):
[
  {
    "title": "Short Badge Title (max 30 chars)",
    "description": "One-sentence description of what this badge teaches",
    "icon_emoji": "Single emoji that represents this badge",
    "rank": "E|D|C|B|A|S (higher rank = harder)",
    "xp_reward": 500,
    "category": "tech_skill|soft_skill|domain|leadership|certification",
    "rationale": "Why this badge is perfect for this hunter's goals",
    "learning_paths": [
      {
        "youtube_url": "https://youtube.com/watch?v=...",
        "title": "Video Title",
        "duration_seconds": 1800,
        "xp_value": 100,
        "why_this_video": "Explanation of why this video teaches a key part of the badge"
      }
    ]
  }
]

IMPORTANT RULES:
1. Each badge should teach a SPECIFIC skill from the hunter's goals
2. Ranks should be appropriate: E-D for beginner, C-B for intermediate, A-S for advanced
3. Include 3-5 YouTube learning videos per badge
4. The youtube_url MUST be a real, working YouTube URL
5. XP rewards should scale with rank (E=300, D=400, C=500, B=700, A=1000, S=1500)
6. Return ONLY the JSON array, no other text
7. If the hunter profile doesn't provide enough info, infer from the goals

Generate the badges now:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    let badges;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      badges = JSON.parse(jsonMatch[0]);
    } catch (_parseErr) {
      console.error('Failed to parse Gemini response:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate badges. Invalid response format.',
      });
    }

    // Validate and normalize badges
    const validated = badges
      .filter(b => b.title && b.description && b.rank && b.xp_reward)
      .map(b => ({
        id: Math.random().toString(36).substring(7),
        title: b.title.substring(0, 50),
        description: b.description.substring(0, 200),
        icon_emoji: b.icon_emoji || '🏆',
        rank: (b.rank || 'C').toUpperCase(),
        xp_reward: Math.max(300, Math.min(b.xp_reward, 2000)),
        category: b.category || 'tech_skill',
        agent_rationale: b.rationale || '',
        learning_paths: (b.learning_paths || [])
          .filter(lp => lp.youtube_url && lp.title)
          .map((lp, idx) => ({
            id: Math.random().toString(36).substring(7),
            youtube_url: lp.youtube_url,
            youtube_id: extractYouTubeId(lp.youtube_url),
            title: lp.title.substring(0, 100),
            duration_seconds: lp.duration_seconds || 1800,
            xp_value: lp.xp_value || 100,
            why_this_video: lp.why_this_video || '',
            sequence_order: idx + 1,
            watch_status: 'unwatched',
          }))
          .slice(0, 8), // Max 8 videos per badge
        videos_total: Math.min(b.learning_paths?.length || 0, 8),
        videos_watched: 0,
        status: 'active',
        created_at: new Date().toISOString(),
      }))
      .slice(0, 5); // Max 5 badges

    return res.status(200).json({
      success: true,
      badges: validated,
      badgesGenerated: validated.length,
    });
  } catch (error) {
    console.error('Agent error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeId(url) {
  if (!url) return '';
  try {
    const patterns = [
      /(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return '';
  } catch {
    return '';
  }
}
