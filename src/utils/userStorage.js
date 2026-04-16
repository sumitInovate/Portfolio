/**
 * userStorage.js — CodeAether client-side user registry
 *
 * Uses localStorage as the "database" for registered users.
 * Keys:
 *   ca_users     → { [username]: { passwordHash, salt, createdAt } }
 *   ca_profiles  → { [username]: UserProfile JSON }
 *   ca_avatars   → { [username]: base64 data URL }
 *
 * In production, swap these functions for API calls without changing callers.
 */

const USERS_KEY    = 'ca_users';
const PROFILES_KEY = 'ca_profiles';
const AVATARS_KEY  = 'ca_avatars';
const STORAGE_MIGRATION_KEY = 'ca_storage_migration_v2';

import boilerplateProfile from '../data/users/boilerplate.json';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // Provide detailed error messages for different failure modes
    if (e.name === 'QuotaExceededError') {
      console.error('[userStorage] localStorage quota exceeded. Consider clearing old data or using IndexedDB.', e);
      throw new Error('Storage quota exceeded. Unable to save profile. Please clear browser data and try again.');
    }
    if (e.name === 'SecurityError') {
      console.error('[userStorage] localStorage access denied (may be in incognito mode)', e);
      throw new Error('Storage access denied. Incognito/Private mode may not support localStorage.');
    }
    console.error('[userStorage] localStorage write failed:', e);
    throw new Error('Failed to save data. Storage may be unavailable.');
  }
}

function normalizeUsername(username) {
  return String(username ?? '').trim().toLowerCase();
}

function parseJSONSafe(raw) {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function preferArray(primary, fallback) {
  if (Array.isArray(primary) && primary.length > 0) return primary;
  return Array.isArray(fallback) ? fallback : [];
}

// ─── Username Registry ───────────────────────────────────────────────────────

/**
 * Check if a username is already taken.
 * Also reserves the boilerplate demo user.
 * @param {string} username
 * @returns {boolean}
 */
export function isUsernameTaken(username) {
  const slug = username.trim().toLowerCase();
  const users = getStorage(USERS_KEY);
  return Object.hasOwn(users, slug);
}

/**
 * Register a new user (store auth record only — profile stored separately).
 * @param {string} username
 * @param {string} passwordHash  — hex-encoded PBKDF2 hash
 * @param {string} salt          — hex-encoded random salt
 */
export function registerUser(username, passwordHash, salt) {
  const slug  = username.trim().toLowerCase();
  const users = getStorage(USERS_KEY);
  users[slug] = { passwordHash, salt, createdAt: Date.now() };
  setStorage(USERS_KEY, users);
}

/**
 * Retrieve auth record for a username.
 * @param {string} username
 * @returns {{ passwordHash: string, salt: string, createdAt: number } | null}
 */
export function getAuthRecord(username) {
  const slug  = username.trim().toLowerCase();
  const users = getStorage(USERS_KEY);
  return users[slug] ?? null;
}

/**
 * Remove all persisted data for a partially registered user.
 * Keeps seeded demo users intact.
 * @param {string} username
 */
export function rollbackUserRegistration(username) {
  const slug = normalizeUsername(username);
  if (!slug || slug === 'boilerplate') {
    return;
  }

  const users = getStorage(USERS_KEY);
  if (Object.hasOwn(users, slug)) {
    delete users[slug];
    setStorage(USERS_KEY, users);
  }

  const profiles = getStorage(PROFILES_KEY);
  if (Object.hasOwn(profiles, slug)) {
    delete profiles[slug];
    setStorage(PROFILES_KEY, profiles);
  }

  const avatars = getStorage(AVATARS_KEY);
  if (Object.hasOwn(avatars, slug)) {
    delete avatars[slug];
    setStorage(AVATARS_KEY, avatars);
  }
}

// ─── Profile Storage ─────────────────────────────────────────────────────────

/**
 * Persist a generated UserProfile JSON for a username.
 * @param {string} username
 * @param {object} profile
 */
export function saveUserProfile(username, profile) {
  const slug     = username.trim().toLowerCase();
  const profiles = getStorage(PROFILES_KEY);
  profiles[slug] = profile;
  setStorage(PROFILES_KEY, profiles);
}

/**
 * Retrieve a UserProfile JSON from localStorage.
 * Returns null if not found (caller should fall back to bundled JSON).
 * @param {string} username
 * @returns {object | null}
 */
export function getUserProfile(username) {
  const slug     = username.trim().toLowerCase();
  const profiles = getStorage(PROFILES_KEY);
  return profiles[slug] ?? null;
}

// ─── Avatar Storage ───────────────────────────────────────────────────────────

/**
 * Estimate the size of a data URL in bytes (rough calculation).
 * Base64 encoding increases size by ~33%, plus overhead for data URL prefix.
 * @param {string} dataUrl - e.g. "data:image/png;base64,iVBORw0KGgo..."
 * @returns {number} - Approximate size in bytes
 */
function estimateDataUrlSize(dataUrl) {
  if (typeof dataUrl !== 'string') return 0;
  // Base64 size ≈ (string length * 3/4), plus prefix overhead
  return Math.round(dataUrl.length * 0.75);
}

/**
 * Compress an image (stored as base64 data URL) if it exceeds a size limit.
 * Uses canvas to resize and re-encode at lower quality.
 *
 * @param {string} dataUrl - Input image data URL
 * @param {number} maxSizeKB - Maximum size in KB (default: 300KB)
 * @returns {Promise<string>} - Optimized data URL or original if optimization fails
 */
async function compressAvatarIfNeeded(dataUrl, maxSizeKB = 300) {
  const maxBytes = maxSizeKB * 1024;
  const currentSize = estimateDataUrlSize(dataUrl);

  if (currentSize <= maxBytes) {
    console.log(`[Avatar] Size ${Math.round(currentSize / 1024)}KB is within limit, no compression needed`);
    return dataUrl;
  }

  console.log(`[Avatar] Size ${Math.round(currentSize / 1024)}KB exceeds ${maxSizeKB}KB, attempting compression...`);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Start with original dimensions, target 512x512 max
        let width = img.width;
        let height = img.height;
        const maxDim = 512;

        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Compress with progressive quality reduction until size is acceptable
        let quality = 0.85;
        let compressed = canvas.toDataURL('image/jpeg', quality);

        while (estimateDataUrlSize(compressed) > maxBytes && quality > 0.3) {
          quality -= 0.1;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }

        const compressedSize = estimateDataUrlSize(compressed);
        console.log(`[Avatar] Compressed from ${Math.round(currentSize / 1024)}KB to ${Math.round(compressedSize / 1024)}KB`);

        resolve(compressed);
      } catch (e) {
        console.warn('[Avatar] Compression failed, keeping original:', e);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      console.warn('[Avatar] Could not load image for compression, keeping original');
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Store a generated RPG avatar as a base64 data URL.
 * Automatically compresses if exceeds size limit.
 *
 * @param {string} username
 * @param {string} dataUrl  — e.g. "data:image/png;base64,..."
 * @returns {Promise<void>}
 * @throws {Error} - If storage operation fails
 */
export async function saveUserAvatar(username, dataUrl) {
  try {
    // Compress if needed
    const optimized = await compressAvatarIfNeeded(dataUrl, 300);

    const slug    = username.trim().toLowerCase();
    const avatars = getStorage(AVATARS_KEY);
    avatars[slug] = optimized;

    setStorage(AVATARS_KEY, avatars);
    console.log(`[Avatar] Saved successfully for ${slug}`);
  } catch (err) {
    console.error('[Avatar] Failed to save avatar:', err);
    throw new Error(`Failed to save avatar: ${err.message}`);
  }
}

/**
 * Retrieve stored avatar data URL, or null if not found.
 * @param {string} username
 * @returns {string | null}
 */
export function getUserAvatar(username) {
  const slug    = username.trim().toLowerCase();
  const avatars = getStorage(AVATARS_KEY);
  return avatars[slug] ?? null;
}

// ─── System Initialization ────────────────────────────────────────────────────

/**
 * Seed initial boilerplate profile into localStorage as demo.
 * All other users are managed through the shared database.
 */
export function initializeSystemUsers() {
  const profiles = getStorage(PROFILES_KEY);
  const users = getStorage(USERS_KEY);
  let profilesChanged = false;
  let usersChanged = false;

  // Seed boilerplate demo profile only
  if (!profiles['boilerplate']) {
    profiles['boilerplate'] = boilerplateProfile;
    profilesChanged = true;
  }

  // Add mock auth record to reserve username
  if (!users['boilerplate']) {
    users['boilerplate'] = { passwordHash: 'system', salt: 'system', createdAt: Date.now() };
    usersChanged = true;
  }

  if (profilesChanged) setStorage(PROFILES_KEY, profiles);
  if (usersChanged) setStorage(USERS_KEY, users);

  migrateLegacyHunterStorage();
}

/**
 * One-time migration for old hunter_* localStorage keys.
 * Canonical storage is now ca_profiles[username].training.
 */
export function migrateLegacyHunterStorage() {
  if (localStorage.getItem(STORAGE_MIGRATION_KEY) === '1') {
    return;
  }

  const profiles = getStorage(PROFILES_KEY);
  const keysToDelete = [];
  const usernames = new Set();

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith('hunter_profile_')) {
      usernames.add(normalizeUsername(key.slice('hunter_profile_'.length)));
      keysToDelete.push(key);
    } else if (key.startsWith('hunter_badges_')) {
      usernames.add(normalizeUsername(key.slice('hunter_badges_'.length)));
      keysToDelete.push(key);
    } else if (key.startsWith('hunter_goals_')) {
      usernames.add(normalizeUsername(key.slice('hunter_goals_'.length)));
      keysToDelete.push(key);
    } else if (key.startsWith('hunter_xp_ledger_')) {
      usernames.add(normalizeUsername(key.slice('hunter_xp_ledger_'.length)));
      keysToDelete.push(key);
    }
  }

  if (usernames.size === 0) {
    localStorage.setItem(STORAGE_MIGRATION_KEY, '1');
    return;
  }

  const nowISO = new Date().toISOString();
  let profilesChanged = false;

  usernames.forEach((username) => {
    if (!username) return;

    const existingProfile = profiles[username] ?? { meta: { username }, hero: {} };
    const existingTraining = (existingProfile?.training && typeof existingProfile.training === 'object')
      ? existingProfile.training
      : {};

    const profileKey = `hunter_profile_${username}`;
    const badgesKey = `hunter_badges_${username}`;
    const goalsKey = `hunter_goals_${username}`;
    const ledgerKey = `hunter_xp_ledger_${username}`;

    const legacyProfile = parseJSONSafe(localStorage.getItem(profileKey));
    const legacyBadges = parseJSONSafe(localStorage.getItem(badgesKey));
    const legacyGoals = parseJSONSafe(localStorage.getItem(goalsKey));
    const legacyLedger = parseJSONSafe(localStorage.getItem(ledgerKey));

    const legacyTraining = (legacyProfile && typeof legacyProfile === 'object') ? legacyProfile : {};
    const mergedTraining = {
      ...legacyTraining,
      ...existingTraining,
      username,
      badges: preferArray(existingTraining.badges, preferArray(legacyBadges, legacyTraining.badges)),
      goals: preferArray(existingTraining.goals, preferArray(legacyGoals, legacyTraining.goals)),
      xp_ledger: preferArray(existingTraining.xp_ledger, preferArray(legacyLedger, legacyTraining.xp_ledger)),
      updated_at: nowISO,
    };

    const level = Number(mergedTraining.level ?? 1) || 1;
    const clazz = String(mergedTraining.class ?? existingProfile?.hero?.rank ?? 'E').toUpperCase();
    const xpCurrent = Number(mergedTraining.xp_current ?? existingProfile?.hero?.xp?.current ?? 0) || 0;
    const xpToNext = Number(mergedTraining.xp_to_next ?? existingProfile?.hero?.xp?.max ?? 10000) || 10000;

    const existingMeta = existingProfile?.meta;
    const existingHero = existingProfile?.hero;

    profiles[username] = {
      ...existingProfile,
      meta: existingMeta
        ? { ...existingMeta, username }
        : { username },
      hero: existingHero
        ? {
            ...existingHero,
            level,
            rank: clazz,
            xp: {
              current: xpCurrent,
              max: xpToNext,
            },
          }
        : {
            level,
            rank: clazz,
            xp: {
              current: xpCurrent,
              max: xpToNext,
            },
        },
      training: {
        ...mergedTraining,
        level,
        class: clazz,
        xp_current: xpCurrent,
        xp_to_next: xpToNext,
      },
    };

    profilesChanged = true;
  });

  if (profilesChanged) {
    setStorage(PROFILES_KEY, profiles);
  }

  keysToDelete.forEach((key) => {
    localStorage.removeItem(key);
  });

  localStorage.setItem(STORAGE_MIGRATION_KEY, '1');
}

