import { createContext, useContext, useState, useCallback } from 'react';

/**
 * UserContext — supplies the active user's portfolio data
 * to all section components via useUser().
 *
 * Data is loaded from /src/data/users/{slug}.json.
 * In production, replace the dynamic import with a fetch() call.
 */

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [userSlug, setUserSlug] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  /**
   * Load a user's data by slug.
   * Cached: re-calling with the same slug is a no-op.
   */
  const fetchUser = useCallback(async (slug) => {
    if (slug === userSlug && userData) return; // already loaded
    setUserLoading(true);
    setUserError(null);

    try {
      // Vite dynamic imports for JSON — bundled at build time
      const module = await import(`../data/users/${slug}.json`);
      setUserData(module.default);
      setUserSlug(slug);
    } catch {
      setUserError(`No portfolio found for "${slug}".`);
      setUserData(null);
    } finally {
      setUserLoading(false);
    }
  }, [userSlug, userData]);

  return (
    <UserContext.Provider value={{ userData, userSlug, userError, userLoading, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

/** Access the active user's portfolio data */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}
