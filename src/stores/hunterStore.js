import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { hunterStorage } from '../utils/training/hunterStorage';

const CLASS_FOR_LEVEL = (level) => {
  if (level >= 50) return 'S';
  if (level >= 30) return 'A';
  if (level >= 20) return 'B';
  if (level >= 10) return 'C';
  if (level >= 5) return 'D';
  return 'E';
};

const JOB_TITLE_FOR_LEVEL = (level, cls) => {
  const titles = {
    E: 'Novice Hunter',
    D: 'Awakened Hunter',
    C: 'Shadow Soldier',
    B: 'Shadow Knight',
    A: 'Shadow Marshal',
    S: 'Shadow Monarch',
  };
  return titles[cls] || 'Novice Hunter';
};

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

    dismissLevelUp: () => set({ levelUpData: null }),

    dismissXPFloat: (id) => set(state => ({
      pendingXPFloats: state.pendingXPFloats.filter(f => f.id !== id),
    })),

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
    markVideoComplete: (videoId, badgeId, xpGained) => {
      set(state => ({
        badges: state.badges.map(b => {
          if (b.id !== badgeId) return b;
          return {
            ...b,
            videos_watched: b.videos_watched + 1,
            xp_from_videos: (b.xp_from_videos || 0) + xpGained,
          };
        }),
      }));
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

    // ─── HELPERS ────────────────────────────────────────────────────
    /** Get percentage of XP bar filled */
    getXPPercentage: () => {
      const { profile } = get();
      if (!profile) return 0;
      return Math.min((profile.xp_current / profile.xp_to_next) * 100, 100);
    },

    /** Get active badge cards (not completed) */
    getActiveBadges: () => {
      const { badges } = get();
      return badges.filter(b => b.status === 'active');
    },

    /** Get completed badge cards */
    getCompletedBadges: () => {
      const { badges } = get();
      return badges.filter(b => b.status === 'completed');
    },

    /** Get goals by category */
    getGoalsByCategory: (category) => {
      const { goals } = get();
      return goals.filter(g => g.category === category && g.is_active);
    },

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
