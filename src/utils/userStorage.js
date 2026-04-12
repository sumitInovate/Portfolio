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

import sumitProfile from '../data/users/sumit-thakur.json';
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
    console.error('[userStorage] localStorage write failed:', e);
  }
}

// ─── Username Registry ───────────────────────────────────────────────────────

/**
 * Check if a username is already taken.
 * Also considers the hard-coded seeded users (sumit-thakur, boilerplate, demo).
 * @param {string} username
 * @returns {boolean}
 */
export function isUsernameTaken(username) {
  const slug = username.trim().toLowerCase();
  const users = getStorage(USERS_KEY);
  return Object.prototype.hasOwnProperty.call(users, slug);
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
 * Store a generated RPG avatar as a base64 data URL.
 * @param {string} username
 * @param {string} dataUrl  — e.g. "data:image/png;base64,..."
 */
export function saveUserAvatar(username, dataUrl) {
  const slug    = username.trim().toLowerCase();
  const avatars = getStorage(AVATARS_KEY);
  avatars[slug] = dataUrl;
  setStorage(AVATARS_KEY, avatars);
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
 * Seed initial mock profiles into localStorage if they don't exist.
 * This guarantees "sumit-thakur" and "boilerplate" exist in local storage.
 */
export function initializeSystemUsers() {
  const profiles = getStorage(PROFILES_KEY);
  const users = getStorage(USERS_KEY);
  let profilesChanged = false;
  let usersChanged = false;

  if (!profiles['sumit-thakur']) {
    profiles['sumit-thakur'] = sumitProfile;
    profilesChanged = true;
  }
  
  if (!profiles['boilerplate']) {
    profiles['boilerplate'] = boilerplateProfile;
    profilesChanged = true;
  }

  // Add mock auth records to reserve usernames
  if (!users['sumit-thakur']) {
    users['sumit-thakur'] = { passwordHash: 'system', salt: 'system', createdAt: Date.now() };
    usersChanged = true;
  }

  if (!users['boilerplate']) {
    users['boilerplate'] = { passwordHash: 'system', salt: 'system', createdAt: Date.now() };
    usersChanged = true;
  }

  if (profilesChanged) setStorage(PROFILES_KEY, profiles);
  if (usersChanged) setStorage(USERS_KEY, users);
}

