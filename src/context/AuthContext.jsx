import { createContext, useContext, useState, useCallback } from 'react';

/**
 * AuthContext — mock authentication for CodeAether.
 *
 * For now: sign-in looks up a user by username/slug locally.
 * Swap `mockSignIn` for a real API call (Supabase, Firebase, etc.)
 * in the future without changing any consumer code.
 */

const AuthContext = createContext(null);

/**
 * Available mock users. In production replace with API lookup.
 * Key = username slug, value = { password } (or just existence check).
 */
const MOCK_USERS = {
  'sumit-thakur': { password: 'hunter2025' },
};

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(() => {
    // Restore session from sessionStorage on page load
    try {
      const stored = sessionStorage.getItem('ca_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Sign in with a username slug (and optionally password).
   * Returns { success: boolean, username?: string, error?: string }
   */
  const signIn = useCallback(async ({ username, password }) => {
    setIsLoading(true);
    setAuthError(null);

    // Simulate network latency
    await new Promise((r) => setTimeout(r, 600));

    const slug = username?.trim().toLowerCase();

    if (!MOCK_USERS[slug]) {
      const err = 'User not found. Check your username and try again.';
      setAuthError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    // Password check (optional — remove for passwordless demo mode)
    // Uncomment the block below to enforce passwords:
    // if (MOCK_USERS[slug].password && MOCK_USERS[slug].password !== password) {
    //   const err = 'Incorrect password.';
    //   setAuthError(err);
    //   setIsLoading(false);
    //   return { success: false, error: err };
    // }

    const user = { username: slug };
    sessionStorage.setItem('ca_user', JSON.stringify(user));
    setAuthUser(user);
    setIsLoading(false);
    return { success: true, username: slug };
  }, []);

  /** Sign out and clear session */
  const signOut = useCallback(() => {
    sessionStorage.removeItem('ca_user');
    setAuthUser(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        isAuthenticated: !!authUser,
        authError,
        isLoading,
        signIn,
        signOut,
      }}
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
