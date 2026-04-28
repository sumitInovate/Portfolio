import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { hunterStorage } from '../utils/training/hunterStorage';

/**
 * useHunterStore — Single source of truth for training page
 *
 * Profile: Hunter's progression (level, XP, class, badges)
 * Badges: Active mission cards with learning paths
 * Goals: User-configured learning interests
 * Animations: XP floats, level-up overlay state
 */
export const useHunterStore = create(
  subscribeWithSelector((set, get) => ({

    // ─── PROFILE STATE ──────────────────────────────────────────────
    profile: null,
    setProfile: (profile) => set({ profile }),
    clearProfile: () => set({
      profile: null,
      badges: [],
      goals: [],
      pendingXPFloats: [],
      levelUpData: null,
    }),

    // Update profile fields (used for optimistic updates)
    updateProfile: (patch) => set(state => ({
      profile: state.profile ? { ...state.profile, ...patch } : null,
    })),

    // ─── XP & LEVEL-UP ANIMATIONS ──────────────────────────────────
    /** Floating XP numbers: [{ id, amount, x, y }] */
    pendingXPFloats: [],

    /** Level-up overlay data: { leveled_up, new_level, new_class, xp_gained } */
    levelUpData: null,

    /**
     * Apply XP gain to profile + show animations
     * Called when video watched or proof submitted
     */
    applyXPGain: (xpGained, serverResponse) => {
      const { profile } = get();
      if (!profile) return;

      // Add floating XP animation
      set(state => ({
        pendingXPFloats: [
          ...state.pendingXPFloats,
          {
            id: Date.now() + Math.random(),
            amount: xpGained,
            x: Math.random() * 200 + 100,
            y: Math.random() * 50 + 200,
          },
        ],
      }));

      // Prefer unified local progression when server response is absent
      const xpResult = serverResponse ?? hunterStorage.awardXP(
        profile.username,
        xpGained,
        'video_watch',
        null,
        'Training XP gained'
      );

      // If progression contains level-up, show overlay and update profile
      if (xpResult?.leveled_up) {
        set({
          levelUpData: xpResult,
          profile: {
            ...profile,
            level: xpResult.new_level,
            class: xpResult.new_class,
            xp_current: xpResult.xp_after,
          },
        });
      } else {
        // Regular XP update (already persisted in unified storage via awardXP)
        set(state => ({
          profile: state.profile
            ? {
                ...state.profile,
                xp_current: xpResult?.xp_after ?? Math.min(
                  state.profile.xp_current + xpGained,
                  state.profile.xp_to_next - 1
                ),
                level: xpResult?.new_level ?? state.profile.level,
                class: xpResult?.new_class ?? state.profile.class,
              }
            : null,
        }));
      }
    },

    // ─── BADGES (ACTIVE MISSIONS) ──────────────────────────────────
    badges: [],
    setBadges: (badges) => set({ badges }),
    addBadge: (badge) => set(state => ({
      badges: [badge, ...state.badges],
    })),
    updateBadge: (id, patch) => set(state => ({
      badges: state.badges.map(b => (b.id === id ? { ...b, ...patch } : b)),
    })),

    /**
     * Mark a badge as completed
     * Increments profile badge counters
     */
    completeBadge: (id) => set(state => {
      const badge = state.badges.find(b => b.id === id);
      if (!badge) return {};

      return {
        badges: state.badges.map(b =>
          b.id === id ? { ...b, status: 'completed', completed_at: new Date().toISOString() } : b
        ),
        profile: state.profile
          ? {
              ...state.profile,
              badges_total: state.profile.badges_total + 1,
              [`badges_${badge.rank.toLowerCase()}`]:
                state.profile[`badges_${badge.rank.toLowerCase()}`] + 1,
            }
          : null,
      };
    }),

    /**
     * Mark a video as watched
     * Updates badge progress counter
     */
    markVideoComplete: (videoId, badgeId, xpGained = 0) => {
      const { profile } = get();
      if (!profile) return false;

      let wasMarked = false;
      let nextBadges = null;

      set(state => {
        nextBadges = state.badges.map((badge) => {
          if (badge.id !== badgeId) return badge;

          const paths = Array.isArray(badge.learning_paths) ? badge.learning_paths : [];
          let touched = false;

          const nextPaths = paths.map((path) => {
            const pathId = path.id || path.youtube_id || path.youtube_url;
            if (pathId !== videoId) return path;
            if (path.watch_status === 'watched') return path;

            touched = true;
            return {
              ...path,
              watch_status: 'watched',
              watched_at: new Date().toISOString(),
            };
          });

          if (!touched) return badge;

          wasMarked = true;
          const watchedCount = nextPaths.filter((path) => path.watch_status === 'watched').length;

          return {
            ...badge,
            learning_paths: nextPaths,
            videos_total: nextPaths.length,
            videos_watched: watchedCount,
            xp_from_videos: (badge.xp_from_videos || 0) + Math.max(0, Number(xpGained) || 0),
          };
        });

        return wasMarked ? { badges: nextBadges } : {};
      });

      if (!wasMarked || !nextBadges) return false;

      hunterStorage.saveHunterBadges(profile.username, nextBadges);

      const safeXP = Math.max(0, Number(xpGained) || 0);
      if (safeXP > 0) {
        const xpResult = hunterStorage.awardXP(
          profile.username,
          safeXP,
          'video_watch',
          badgeId,
          'Learning path video completed'
        );
        get().applyXPGain(safeXP, xpResult);
      }

      return true;
    },

    // ─── GOALS ─────────────────────────────────────────────────────
    goals: [],
    setGoals: (goals) => set({ goals }),
    addGoal: (goal) => set(state => ({
      goals: [...state.goals, goal],
    })),
    removeGoal: (id) => set(state => ({
      goals: state.goals.filter(g => g.id !== id),
    })),
    clearGoals: () => set({ goals: [] }),

    // ─── AGENT STATE ───────────────────────────────────────────────
    agentRunning: false,
    lastAgentRun: null,
    agentError: null,
    setAgentRunning: (val) => set({ agentRunning: val }),
    setLastAgentRun: (ts) => set({ lastAgentRun: ts }),
    setAgentError: (err) => set({ agentError: err }),

    // ─── NOTIFICATIONS/TOASTS ──────────────────────────────────────
    toasts: [],
    addToast: (toast) => set(state => ({
      toasts: [...state.toasts, { id: Date.now() + Math.random(), ...toast }],
    })),
    removeToast: (id) => set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),

    /** Reset all store state (for logout) */
    reset: () => set({
      profile: null,
      badges: [],
      goals: [],
      pendingXPFloats: [],
      levelUpData: null,
      toasts: [],
      agentRunning: false,
      lastAgentRun: null,
      agentError: null,
    }),
  }))
);
