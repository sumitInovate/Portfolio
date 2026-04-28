import { createContext, useContext, useState, useCallback } from 'react';
import { getUserProfile, getUserAvatar } from '../utils/userStorage';

/**
 * UserContext — supplies the active user's portfolio data
 * to all section components via useUser().
 *
 * Loading order:
 * 1. Check localStorage (for registered users and seeded profiles like boilerplate)
 * 2. Fallback to dynamically generated profiles for users not yet cached
 *
 * In production, replace the localStorage fallback with a fetch() call to the shared database.
 */

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userData,    setUserData]    = useState(null);
  const [userSlug,    setUserSlug]    = useState(null);
  const [userError,   setUserError]   = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userAvatar,  setUserAvatar]  = useState(null);

  /**
   * Load a user's data by slug.
   * Note: Cache persists for the component lifetime. To invalidate,
   * call clearUserCache() or navigate away and back.
   */
  const fetchUser = useCallback(async (slug) => {
    if (slug === userSlug && userData) {
      // Already loaded this user, skip re-fetch (cache hit)
      return;
    }

    setUserLoading(true);
    setUserError(null);
    setUserAvatar(null);

    // ── 1. Try localStorage exclusively ──────────────────────────
    const localProfile = getUserProfile(slug);
    if (localProfile) {
      const localAvatar = getUserAvatar(slug);
      setUserData(localProfile);
      setUserSlug(slug);
      setUserAvatar(localAvatar ?? localProfile.meta?.avatarUrl ?? null);
    } else {
      setUserError(`No portfolio found for "${slug}".`);
      setUserData(null);
      setUserAvatar(null);
    }

    setUserLoading(false);
  }, [userSlug, userData]);

  /**
   * Clear the current user cache to force a refresh on next fetch.
   * Useful when user's profile has been updated externally.
   */
  const clearUserCache = useCallback(() => {
    setUserData(null);
    setUserSlug(null);
    setUserError(null);
    setUserAvatar(null);
  }, []);


  /**
   * Update the profile data for the current user in state
   * (called after AI generation completes).
   */
  const setLiveProfile = useCallback((profile, avatarDataUrl) => {
    setUserData(profile);
    setUserSlug(profile?.meta?.username ?? null);
    if (avatarDataUrl) setUserAvatar(avatarDataUrl);
  }, []);

  return (
    <UserContext.Provider value={{
      userData,
      userSlug,
      userError,
      userLoading,
      userAvatar,
      fetchUser,
      clearUserCache,
      setLiveProfile,
    }}>
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
