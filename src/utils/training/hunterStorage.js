/**
 * hunterStorage.js — unified persistence for Training + User Profile data.
 *
 * Single source of truth:
 *   ca_profiles[username] -> profile JSON
 *
 * Training data is stored under: profile.training
 * Progress mirrors to profile.hero (level/rank/xp) for Lobby consistency.
 */

import { getUserProfile, saveUserProfile } from '../userStorage';

const XP_TO_NEXT = 10000;

const CLASS_META = {
  E: 'Novice Hunter',
  D: 'Awakened Hunter',
  C: 'Shadow Soldier',
  B: 'Shadow Knight',
  A: 'Shadow Marshal',
  S: 'Shadow Monarch',
};

function normalizeUsername(username) {
  return username?.trim()?.toLowerCase() ?? '';
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function toClass(value, level) {
  const normalized = String(value ?? '').trim().toUpperCase();
  return CLASS_META[normalized] ? normalized : classForLevel(level);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function classForLevel(level) {
  if (level >= 50) return 'S';
  if (level >= 30) return 'A';
  if (level >= 20) return 'B';
  if (level >= 10) return 'C';
  if (level >= 5) return 'D';
  return 'E';
}

function ensureTrainingBlock(profile, username) {
  const hero = profile?.hero ?? {};
  const training = (profile?.training && typeof profile.training === 'object') ? profile.training : {};

  const levelFromHero = toPositiveInt(hero.level, 1) || 1;
  const level = toPositiveInt(training.level, levelFromHero) || 1;
  const rank = toClass(training.class ?? hero.rank, level);
  const xpCurrent = toPositiveInt(training.xp_current ?? hero?.xp?.current, 0);
  const xpMax = toPositiveInt(training.xp_to_next ?? hero?.xp?.max, XP_TO_NEXT) || XP_TO_NEXT;

  const normalized = {
    username,
    level,
    xp_current: xpCurrent,
    xp_to_next: xpMax,
    class: rank,
    job_title: CLASS_META[rank] ?? CLASS_META.E,
    resume_summary: '',
    current_role: hero.role ?? 'Software Engineer',
    years_exp: 0,
    tech_skills: [],
    soft_skills: [],
    current_company: '',
    education: '',
    badges_total: 0,
    badges_s: 0,
    badges_a: 0,
    badges_b: 0,
    badges_c: 0,
    badges_d: 0,
    badges_e: 0,
    streak_current: 0,
    streak_last_day: null,
    badges: asArray(training.badges),
    goals: asArray(training.goals),
    xp_ledger: asArray(training.xp_ledger),
    agent_log: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...training,
  };

  return {
    ...normalized,
    class: rank,
    badges: asArray(normalized.badges),
    goals: asArray(normalized.goals),
    xp_ledger: asArray(normalized.xp_ledger),
  };
}

function loadUnifiedProfile(username) {
  const slug = normalizeUsername(username);
  const profile = getUserProfile(slug) ?? { meta: { username: slug }, hero: {} };
  return { slug, profile };
}

function saveUnifiedProfile(username, profile) {
  const slug = normalizeUsername(username);
  saveUserProfile(slug, profile);
}

function persistTraining(username, training) {
  const { profile } = loadUnifiedProfile(username);
  const slug = normalizeUsername(username);
  const normalized = ensureTrainingBlock({
    hero: profile?.hero,
    training,
  }, slug);

  const mirroredClass = normalized.class;
  const mirroredHero = profile.hero
    ? {
        ...profile.hero,
        level: normalized.level,
        rank: mirroredClass,
        role: normalized.current_role ?? profile.hero.role,
        xp: {
          current: normalized.xp_current,
          max: normalized.xp_to_next,
        },
      }
    : {
        level: normalized.level,
        rank: mirroredClass,
        role: normalized.current_role,
        xp: {
          current: normalized.xp_current,
          max: normalized.xp_to_next,
        },
      };

  profile.hero = mirroredHero;
  profile.training = {
    ...normalized,
    class: mirroredClass,
    job_title: normalized.job_title ?? CLASS_META[mirroredClass] ?? CLASS_META.E,
    updated_at: new Date().toISOString(),
  };

  saveUnifiedProfile(username, profile);
}

// ── PROFILE ──────────────────────────────────────────────────────────

/**
 * Get hunter profile from localStorage
 * @param {string} username
 * @returns {object|null}
 */
export function getHunterProfile(username) {
  const { slug, profile } = loadUnifiedProfile(username);
  return ensureTrainingBlock(profile, slug);
}

/**
 * Save or update hunter profile
 * @param {string} username
 * @param {object} profile
 */
export function saveHunterProfile(username, profile) {
  persistTraining(username, {
    ...profile,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Create initial profile for a new hunter
 * @param {string} username
 * @param {object} initialData
 * @returns {object}
 */
export function createHunterProfile(username, initialData = {}) {
  const slug = normalizeUsername(username);
  const profile = ensureTrainingBlock({ training: initialData }, slug);
  saveHunterProfile(slug, profile);
  return profile;
}

/**
 * Merge portfolio-derived values into training profile without overwriting earned progress.
 */
export function upsertHunterProfileFromPortfolio(username, seed = {}) {
  const slug = normalizeUsername(username);
  const current = getHunterProfile(slug);

  const levelFromSeed = toPositiveInt(seed.level, current.level || 1);
  const keepProgress = toPositiveInt(current.level, 1) > 1 || toPositiveInt(current.xp_current, 0) > 0;

  const merged = {
    ...current,
    resume_summary: current.resume_summary || seed.resume_summary || 'Full Stack Developer',
    current_role: current.current_role || seed.current_role || 'Software Engineer',
    current_company: current.current_company || seed.current_company || '',
    years_exp: toPositiveInt(current.years_exp, toPositiveInt(seed.years_exp, 0)),
    level: keepProgress ? current.level : levelFromSeed,
    class: keepProgress ? current.class : toClass(seed.class, levelFromSeed),
    xp_current: keepProgress ? current.xp_current : toPositiveInt(seed.xp_current, 0),
    xp_to_next: toPositiveInt(current.xp_to_next, toPositiveInt(seed.xp_to_next, XP_TO_NEXT)) || XP_TO_NEXT,
  };

  saveHunterProfile(slug, merged);
  return getHunterProfile(slug);
}

// ── BADGES ───────────────────────────────────────────────────────────

/**
 * Get all badges for a hunter
 * @param {string} username
 * @returns {array}
 */
export function getHunterBadges(username) {
  const profile = getHunterProfile(username);
  return Array.isArray(profile.badges) ? profile.badges : [];
}

/**
 * Save badges (replaces entire list)
 * @param {string} username
 * @param {array} badges
 */
export function saveHunterBadges(username, badges) {
  const profile = getHunterProfile(username);
  saveHunterProfile(username, { ...profile, badges: Array.isArray(badges) ? badges : [] });
}

/**
 * Add a single badge
 * @param {string} username
 * @param {object} badge
 */
export function addBadge(username, badge) {
  const badges = getHunterBadges(username);
  const created = {
    ...badge,
    created_at: new Date().toISOString(),
  };
  badges.push(created);
  saveHunterBadges(username, badges);
  return created;
}

/**
 * Update a badge by id
 * @param {string} username
 * @param {string} badgeId
 * @param {object} patch
 */
export function updateBadge(username, badgeId, patch) {
  const badges = getHunterBadges(username);
  const idx = badges.findIndex(b => b.id === badgeId);
  if (idx >= 0) {
    badges[idx] = { ...badges[idx], ...patch };
    saveHunterBadges(username, badges);
  }
}

// ── GOALS ────────────────────────────────────────────────────────────

/**
 * Get all active goals for a hunter
 * @param {string} username
 * @returns {array}
 */
export function getHunterGoals(username) {
  const profile = getHunterProfile(username);
  const goals = profile.goals;
  return Array.isArray(goals) ? goals.filter(g => g.is_active !== false) : [];
}

/**
 * Save goals (replaces entire list)
 * @param {string} username
 * @param {array} goals
 */
export function saveHunterGoals(username, goals) {
  const profile = getHunterProfile(username);
  saveHunterProfile(username, { ...profile, goals: Array.isArray(goals) ? goals : [] });
}

/**
 * Add a single goal
 * @param {string} username
 * @param {object} goal
 */
export function addGoal(username, goal) {
  const goals = getHunterGoals(username);
  const created = {
    id: Math.random().toString(36).substring(7),
    is_active: true,
    created_at: new Date().toISOString(),
    ...goal,
  };
  goals.push(created);
  saveHunterGoals(username, goals);
  return created;
}

/**
 * Deactivate a goal (soft delete)
 * @param {string} username
 * @param {string} goalId
 */
export function removeGoal(username, goalId) {
  const goals = getHunterGoals(username);
  const idx = goals.findIndex(g => g.id === goalId);
  if (idx >= 0) {
    goals[idx].is_active = false;
    saveHunterGoals(username, goals);
  }
}

// ─── XP LEDGER ──────────────────────────────────────────────────────

/**
 * Get immutable XP transaction ledger
 * @param {string} username
 * @returns {array}
 */
export function getXPLedger(username) {
  const profile = getHunterProfile(username);
  const ledger = profile.xp_ledger;
  return Array.isArray(ledger) ? ledger : [];
}

/**
 * Record an XP transaction (immutable)
 * @param {string} username
 * @param {object} transaction
 * @returns {object}
 */
export function recordXPTransaction(username, transaction) {
  const ledger = getXPLedger(username);
  const record = {
    id: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
    ...transaction,
  };
  ledger.push(record);
  const profile = getHunterProfile(username);
  saveHunterProfile(username, { ...profile, xp_ledger: ledger });
  return record;
}

/**
 * Calculate total XP gained today
 * @param {string} username
 * @returns {number}
 */
export function getXPToday(username) {
  const ledger = getXPLedger(username);
  const today = new Date().toDateString();
  return ledger
    .filter(txn => new Date(txn.timestamp).toDateString() === today)
    .reduce((sum, txn) => sum + (txn.amount || 0), 0);
}

// ── STREAK ──────────────────────────────────────────────────────────

/**
 * Get current streak
 * @param {string} username
 * @returns {{ current: number, lastDay: string|null }}
 */
export function getStreak(username) {
  const profile = getHunterProfile(username);
  return {
    current: profile.streak_current ?? 0,
    lastDay: profile.streak_last_day ?? null,
  };
}

/**
 * Update streak (called once per day)
 * @param {string} username
 * @returns {{ current: number, bonus: number }}
 */
export function updateStreak(username) {
  const streak = getStreak(username);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let newCurrent = streak.current || 0;
  let bonus = 0;

  if (streak.lastDay === today) {
    // Already updated today, no change
    return { current: newCurrent, bonus: 0 };
  } else if (streak.lastDay === yesterday) {
    // Consecutive day — increment streak
    newCurrent += 1;
    // Every 7 days, award bonus
    if (newCurrent % 7 === 0) {
      bonus = 200;
    }
  } else {
    // Streak broken — reset to 1
    newCurrent = 1;
  }

  const profile = getHunterProfile(username);
  saveHunterProfile(username, {
    ...profile,
    streak_current: newCurrent,
    streak_last_day: today,
  });

  return { current: newCurrent, bonus };
}

// ── AGENT RUN LOG ───────────────────────────────────────────────────

/**
 * Get last agent run timestamp
 * @param {string} username
 * @returns {string|null}
 */
export function getLastAgentRun(username) {
  const profile = getHunterProfile(username);
  const log = profile.agent_log;
  return log?.lastRun || null;
}

/**
 * Record agent run
 * @param {string} username
 * @param {object} runData
 */
export function recordAgentRun(username, runData) {
  const profile = getHunterProfile(username);
  saveHunterProfile(username, {
    ...profile,
    agent_log: {
      lastRun: new Date().toISOString(),
      trigger: runData.trigger,
      badgesGenerated: runData.badgesGenerated || 0,
    },
  });
}

/**
 * Award XP and persist progression in unified user profile.
 * Mirrors updates to profile.hero so Lobby/Profile stays in sync.
 */
export function awardXP(username, amount, sourceType = 'manual', sourceId = null, sourceLabel = null) {
  const profile = getHunterProfile(username);
  const xpAmount = Math.max(0, Number(amount) || 0);

  let xpAfter = profile.xp_current + xpAmount;
  let newLevel = profile.level;
  let leveledUp = false;

  while (xpAfter >= profile.xp_to_next) {
    xpAfter -= profile.xp_to_next;
    newLevel += 1;
    leveledUp = true;
  }

  const newClass = classForLevel(newLevel);
  const nextProfile = {
    ...profile,
    level: newLevel,
    class: newClass,
    job_title: CLASS_META[newClass] ?? profile.job_title,
    xp_current: xpAfter,
  };

  saveHunterProfile(username, nextProfile);

  recordXPTransaction(username, {
    amount: xpAmount,
    source_type: sourceType,
    source_id: sourceId,
    source_label: sourceLabel,
    xp_before: profile.xp_current,
    xp_after: xpAfter,
    leveled_up: leveledUp,
    new_level: leveledUp ? newLevel : null,
  });

  return {
    leveled_up: leveledUp,
    new_level: newLevel,
    new_class: newClass,
    xp_before: profile.xp_current,
    xp_after: xpAfter,
    xp_gained: xpAmount,
  };
}

// ── EXPORT ALL ───────────────────────────────────────────────────────

export const hunterStorage = {
  getHunterProfile,
  saveHunterProfile,
  createHunterProfile,
  upsertHunterProfileFromPortfolio,
  getHunterBadges,
  saveHunterBadges,
  addBadge,
  updateBadge,
  getHunterGoals,
  saveHunterGoals,
  addGoal,
  removeGoal,
  getXPLedger,
  recordXPTransaction,
  getXPToday,
  getStreak,
  updateStreak,
  getLastAgentRun,
  recordAgentRun,
  awardXP,
};
