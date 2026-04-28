import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { SignJWT, jwtVerify } from 'jose';
import {
  isUsernameTaken,
  registerUser,
  getAuthRecord,
} from '../utils/userStorage';

/**
 * AuthContext — CodeAether full authentication system
 *
 * Features:
 * - Password hashing via Web Crypto (PBKDF2 + SHA-256, no external deps)
 * - JWT signing/verification via `jose` (browser-compatible)
 * - Session persistence: JWT stored in localStorage + httpOnly-style cookie
 * - signUp, signIn (username+password), signOut, checkUsername
 * - Real-time username availability checking
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const AuthContext   = createContext(null);
const JWT_SECRET    = import.meta.env.VITE_JWT_SECRET ?? 'codeaether-default-secret';
const SESSION_KEY   = 'ca_session';
const COOKIE_NAME   = 'ca_auth';
const PBKDF2_ITERS  = 100_000;

// ─── Crypto Helpers ───────────────────────────────────────────────────────────

/** Convert hex string to Uint8Array */
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Convert Uint8Array to hex string */
function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a cryptographically random salt (32 bytes) */
function generateSalt() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

/** Hash a password using PBKDF2-SHA256 */
async function hashPassword(password, saltHex) {
  const enc      = new TextEncoder();
  const keyMat   = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived  = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    keyMat,
    256,
  );
  return bytesToHex(new Uint8Array(derived));
}

/** Verify a password against a stored hash + salt */
async function verifyPassword(password, storedHash, saltHex) {
  const hash = await hashPassword(password, saltHex);
  return hash === storedHash;
}

// ─── JWT Helpers (using jose) ─────────────────────────────────────────────────

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecretKey());
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie Helpers ────────────────────────────────────────────────────────────

function setCookie(name, value, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const cookiePattern = new RegExp(`(?:^|; )${name}=([^;]*)`);
  const match = cookiePattern.exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ─── Seeded users (no password required — verify by existence) ────────────────

const SEEDED_USERS = {
  // Boilerplate demo user accessible via /demo route (no auth needed)
  'boilerplate': { password: 'demo' },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [authUser,  setAuthUser]  = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // starts true — restore session

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function restoreSession() {
      try {
        // Try cookie first, then localStorage
        const token = getCookie(COOKIE_NAME) || localStorage.getItem(SESSION_KEY);
        if (token) {
          const payload = await verifyToken(token);
          if (payload?.username) {
            setAuthUser({ username: payload.username });
          }
        }
      } catch {
        // Invalid token — clear it
        deleteCookie(COOKIE_NAME);
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  // ── Real-time username availability ─────────────────────────────────────
  /**
   * Check if a username is available (not taken).
   * Simulates a small network delay for realism.
   * @param {string} username
   * @returns {Promise<{ available: boolean, reason?: string }>}
   */
  const checkUsername = useCallback(async (username) => {
    const slug = username.trim().toLowerCase();
    if (!slug) return { available: false, reason: 'Username cannot be empty' };
    if (slug.length < 3) return { available: false, reason: 'At least 3 characters required' };
    if (!/^[a-z0-9-]+$/.test(slug)) return { available: false, reason: 'Only lowercase letters, numbers, and hyphens' };

    // Small delay to simulate debounced DB lookup
    await new Promise(r => setTimeout(r, 300));
    const taken = isUsernameTaken(slug);
    return taken
      ? { available: false, reason: 'Username already taken' }
      : { available: true };
  }, []);

  // ── Sign Up ──────────────────────────────────────────────────────────────
  /**
   * Register a new user with username + password.
   * Does NOT set auth state — caller should redirect to processing screen.
   * @returns {{ success: boolean, username?: string, error?: string }}
   */
  const signUp = useCallback(async ({ username, password }) => {
    setIsLoading(true);
    setAuthError(null);

    const slug = username.trim().toLowerCase();

    // Final uniqueness check
    const check = await checkUsername(slug);
    if (!check.available) {
      const err = check.reason ?? 'Username not available';
      setAuthError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    // Hash password
    const salt         = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    // Store in localStorage registry
    registerUser(slug, passwordHash, salt);

    // Issue JWT + store session
    const token = await signToken({ username: slug });
    setCookie(COOKIE_NAME, token, 30);
    localStorage.setItem(SESSION_KEY, token);
    setAuthUser({ username: slug });
    setIsLoading(false);

    return { success: true, username: slug };
  }, [checkUsername]);

  // ── Sign In ──────────────────────────────────────────────────────────────
  /**
   * Sign in with username + password.
   * @returns {{ success: boolean, username?: string, error?: string }}
   */
  const signIn = useCallback(async ({ username, password }) => {
    setIsLoading(true);
    setAuthError(null);

    await new Promise(r => setTimeout(r, 500)); // realism delay

    const slug = username.trim().toLowerCase();

    // Check seeded users first (demo accounts)
    if (SEEDED_USERS[slug]) {
      if (!password || password !== SEEDED_USERS[slug].password) {
        const err = 'Incorrect password.';
        setAuthError(err);
        setIsLoading(false);
        return { success: false, error: err };
      }
      const token = await signToken({ username: slug });
      setCookie(COOKIE_NAME, token, 30);
      localStorage.setItem(SESSION_KEY, token);
      setAuthUser({ username: slug });
      setIsLoading(false);
      return { success: true, username: slug };
    }

    // Check registered users in localStorage
    const record = getAuthRecord(slug);
    if (!record) {
      const err = 'User not found. Check your username or register a new account.';
      setAuthError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    const valid = await verifyPassword(password, record.passwordHash, record.salt);
    if (!valid) {
      const err = 'Incorrect password. Try again.';
      setAuthError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    const token = await signToken({ username: slug });
    setCookie(COOKIE_NAME, token, 30);
    localStorage.setItem(SESSION_KEY, token);
    setAuthUser({ username: slug });
    setIsLoading(false);
    return { success: true, username: slug };
  }, []);

  // ── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    deleteCookie(COOKIE_NAME);
    localStorage.removeItem(SESSION_KEY);
    setAuthUser(null);
    setAuthError(null);
  }, []);

  const contextValue = useMemo(() => ({
    authUser,
    isAuthenticated: !!authUser,
    authError,
    isLoading,
    signIn,
    signUp,
    signOut,
    checkUsername,
  }), [authUser, authError, isLoading, signIn, signUp, signOut, checkUsername]);

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
