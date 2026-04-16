# ⚔️ TRAINING_V2.md — Hunter Training Ground
### ANTIGRAVITY · Complete Implementation Spec
### Authenticated Learning OS · Agentic Badge Engine · XP System · Career Level-Up

> *"From the ashes of the weakest hunter, the Shadow Monarch was born."*
> This is the **complete, implementation-ready** spec for `/training`. Every component, every hook, every SQL function, every API route — written to be followed line by line.

---

## 📋 TABLE OF CONTENTS

1. [System Mental Model](#1-system-mental-model)
2. [Full Architecture & Data Flow](#2-full-architecture--data-flow)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Database Schema — Complete SQL](#4-database-schema--complete-sql)
5. [Environment Variables](#5-environment-variables)
6. [Supabase Client & Auth Setup](#6-supabase-client--auth-setup)
7. [Zustand Global Store](#7-zustand-global-store)
8. [Page Layout & Complete Training.jsx](#8-page-layout--complete-trainingjsx)
9. [Section A — Hunter Stats Dashboard](#9-section-a--hunter-stats-dashboard)
10. [Section B — Goals & Interests Editor](#10-section-b--goals--interests-editor)
11. [Section C — Active Missions (Badge Engine Output)](#11-section-c--active-missions-badge-engine-output)
12. [Section D — Video Player & XP Tracker](#12-section-d--video-player--xp-tracker)
13. [Section E — Proof of Work Submission](#13-section-e--proof-of-work-submission)
14. [Section F — Completed Badges Vault](#14-section-f--completed-badges-vault)
15. [Level-Up Overlay & XP Float Animation](#15-level-up-overlay--xp-float-animation)
16. [Agentic Badge Engine — Full Server Implementation](#16-agentic-badge-engine--full-server-implementation)
17. [XP Award Edge Functions](#17-xp-award-edge-functions)
18. [Level-Up Agent Re-trigger System](#18-level-up-agent-re-trigger-system)
19. [Realtime Subscriptions](#19-realtime-subscriptions)
20. [All Custom Hooks](#20-all-custom-hooks)
21. [Complete CSS — Training Page](#21-complete-css--training-page)
22. [Login Page](#22-login-page)
23. [File & Folder Structure](#23-file--folder-structure)
24. [Build Roadmap — Step by Step](#24-build-roadmap--step-by-step)
25. [Security Checklist](#25-security-checklist)

---

## 1. SYSTEM MENTAL MODEL

### The Core Loop (Never Breaks)

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE TRAINING LOOP                           │
│                                                                 │
│  1. USER PROFILE          Resume data + Goals entered           │
│         ↓                                                       │
│  2. AI AGENT RUNS         Claude analyzes profile + goals       │
│         ↓                 Generates 3-5 custom badges           │
│  3. BADGES CREATED        Each badge = 1 career skill to master │
│         ↓                 Each badge = 3-6 YouTube videos       │
│  4. USER WATCHES          Video opens in embedded player        │
│         ↓                 YouTube iframe API fires on END       │
│  5. XP AWARDED            Server-side atomic XP increment       │
│         ↓                 XP logged in xp_transactions          │
│  6. PROOF SUBMITTED       GitHub repo (tech) / YouTube (soft)   │
│         ↓                 Badge marked complete → XP bonus      │
│  7. LEVEL CHECK           xp_current >= 10,000 → LEVEL UP       │
│         ↓                 Class promoted at milestone levels     │
│  8. AGENT RE-TRIGGERS     New level → harder badges generated   │
│         ↓                 Realtime pushes new missions to UI    │
│  ∞ LOOP CONTINUES         Career grows globally, never plateaus │
└─────────────────────────────────────────────────────────────────┘
```

### Class Progression Table

| Level Range | Class | Color | Title Unlocked |
|---|---|---|---|
| 1–4 | E | `#7BA8D0` | Novice Hunter |
| 5–9 | D | `#00CC44` | Awakened Hunter |
| 10–19 | C | `#0080FF` | Shadow Soldier |
| 20–29 | B | `#4A9EFF` | Shadow Knight |
| 30–49 | A | `#9F00FF` | Shadow Marshal |
| 50+ | S | `#FFD700` | Shadow Monarch |

### XP Per Action

| Action | XP Awarded |
|---|---|
| Watch video (< 15 min) | 75 XP |
| Watch video (15–30 min) | 150 XP |
| Watch video (30–60 min) | 250 XP |
| Watch video (> 60 min) | 400 XP |
| Submit GitHub proof | 300 XP |
| Submit YouTube proof | 300 XP |
| Badge fully completed | badge.xp_reward (200–2000 XP) |
| Daily login streak (×7) | 200 XP |

---

## 2. FULL ARCHITECTURE & DATA FLOW

```
┌──────────────────────────────────────────────────────────────────────┐
│  BROWSER (React SPA)                                                 │
│                                                                      │
│  /login ──→ Supabase Auth ──→ /training (protected)                 │
│                                                                      │
│  TrainingPage.jsx                                                    │
│  ├── useHunterStore (Zustand)  ← single source of truth             │
│  ├── HunterStatsBar            ← reads store                        │
│  ├── GoalsEditor               ← reads/writes hunter_goals          │
│  ├── ActiveMissions            ← reads badges (Realtime sub)        │
│  │   └── BadgeMissionCard                                           │
│  │       └── LearningPathList                                       │
│  │           └── VideoItem    ← YouTube iframe + XP logic           │
│  │       └── ProofSubmission                                        │
│  └── CompletedVault            ← reads completed badges             │
│                                                                      │
└──────────┬──────────────────────────┬───────────────────────────────┘
           │ fetch()                  │ Supabase Realtime
           ▼                          ▼
┌──────────────────────┐   ┌────────────────────────────────────────┐
│  VERCEL EDGE         │   │  SUPABASE                              │
│  FUNCTIONS           │   │                                        │
│                      │   │  Tables:                               │
│  /api/agent/run      │   │  • hunter_profiles                     │
│  ├── Claude API      │   │  • hunter_goals                        │
│  ├── YouTube API     │   │  • badges                              │
│  └── Supabase admin  │   │  • learning_paths                      │
│                      │   │  • xp_transactions                     │
│  /api/xp/video       │   │  • agent_runs                          │
│  └── award_xp() RPC  │   │                                        │
│                      │   │  Functions:                            │
│  /api/xp/proof       │   │  • award_xp()                          │
│  └── badge complete  │   │  • complete_badge()                    │
│                      │   │  • get_streak()                        │
└──────────────────────┘   └────────────────────────────────────────┘
```

---

## 3. TECH STACK & DEPENDENCIES

### 3.1 Install Commands

```bash
# Core new dependencies
npm install @supabase/supabase-js
npm install zustand
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install react-youtube
npm install date-fns

# Already in project (from main README)
# framer-motion, react-hook-form, zod, @hookform/resolvers, lucide-react
```

### 3.2 Full Stack at a Glance

| Layer | Choice | Why |
|---|---|---|
| Auth + DB | Supabase | Auth, Postgres, Realtime, RLS all in one |
| AI Agent | Anthropic `claude-sonnet-4-6` | Best instruction following for JSON output |
| Video | `react-youtube` | Clean wrapper for YouTube IFrame API |
| Video Meta | YouTube Data API v3 | Duration, title, thumbnail (server-side only) |
| Global State | Zustand | Lightweight, no boilerplate, persists XP state |
| Server State | TanStack Query | Cache badges/videos, background refetch |
| Serverless | Vercel Edge Functions | Under `/api/`, access env vars safely |
| Animation | Framer Motion | Level-up overlay, XP floats, stagger |

---

## 4. DATABASE SCHEMA — COMPLETE SQL

> Run in Supabase SQL Editor → **in this exact order**

```sql
-- ════════════════════════════════════════════════════════
-- 0. EXTENSIONS
-- ════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ════════════════════════════════════════════════════════
-- 1. hunter_profiles
--    One row per authenticated user. Source of truth for
--    level, xp, class, and denormalized badge counts.
-- ════════════════════════════════════════════════════════
CREATE TABLE public.hunter_profiles (
  id              UUID        PRIMARY KEY
                              REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT        NOT NULL,
  email           TEXT        NOT NULL UNIQUE,

  -- ── Progression ──
  level           INTEGER     NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp_current      INTEGER     NOT NULL DEFAULT 0 CHECK (xp_current >= 0),
  xp_to_next      INTEGER     NOT NULL DEFAULT 10000,
  class           TEXT        NOT NULL DEFAULT 'E'
                              CHECK (class IN ('E','D','C','B','A','S')),
  job_title       TEXT        DEFAULT 'Novice Hunter',

  -- ── Resume snapshot (populated on first login) ──
  resume_summary  TEXT,
  current_role    TEXT        DEFAULT 'Software Engineer',
  years_exp       NUMERIC(4,1) DEFAULT 0 CHECK (years_exp >= 0),
  tech_skills     TEXT[]      DEFAULT '{}',
  soft_skills     TEXT[]      DEFAULT '{}',
  current_company TEXT        DEFAULT '',
  education       TEXT        DEFAULT '',

  -- ── Badge counts (denormalized for O(1) stat bar reads) ──
  badges_total    INTEGER     NOT NULL DEFAULT 0,
  badges_s        INTEGER     NOT NULL DEFAULT 0,
  badges_a        INTEGER     NOT NULL DEFAULT 0,
  badges_b        INTEGER     NOT NULL DEFAULT 0,
  badges_c        INTEGER     NOT NULL DEFAULT 0,
  badges_d        INTEGER     NOT NULL DEFAULT 0,
  badges_e        INTEGER     NOT NULL DEFAULT 0,

  -- ── Streak ──
  streak_current  INTEGER     NOT NULL DEFAULT 0,
  streak_last_day DATE,

  -- ── Agent metadata ──
  agent_last_run  TIMESTAMPTZ,
  agent_version   INTEGER     DEFAULT 0,  -- increments on each run

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hunter_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.hunter_profiles
  FOR ALL USING (auth.uid() = id);


-- ════════════════════════════════════════════════════════
-- 2. hunter_goals
--    User-curated goals, editable at any time.
--    Each save triggers the agent to re-evaluate.
-- ════════════════════════════════════════════════════════
CREATE TABLE public.hunter_goals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL
                          REFERENCES public.hunter_profiles(id) ON DELETE CASCADE,
  category    TEXT        NOT NULL
                          CHECK (category IN (
                            'technology','domain','skill',
                            'designation','subject'
                          )),
  value       TEXT        NOT NULL CHECK (char_length(value) BETWEEN 1 AND 100),
  priority    SMALLINT    NOT NULL DEFAULT 1
                          CHECK (priority BETWEEN 1 AND 3),
                          -- 1 = High, 2 = Medium, 3 = Low
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hunter_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.hunter_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_goals_user_active
  ON public.hunter_goals(user_id) WHERE is_active = TRUE;


-- ════════════════════════════════════════════════════════
-- 3. badges
--    Agent-generated badge definitions. Each badge is
--    a career skill milestone with an attached learning path.
-- ════════════════════════════════════════════════════════
CREATE TABLE public.badges (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL
                                REFERENCES public.hunter_profiles(id) ON DELETE CASCADE,

  -- ── Identity ──
  title             TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 50),
  description       TEXT        NOT NULL,
  icon_emoji        TEXT        NOT NULL DEFAULT '🏆',
  rank              TEXT        NOT NULL
                                CHECK (rank IN ('E','D','C','B','A','S')),
  category          TEXT        NOT NULL
                                CHECK (category IN (
                                  'tech_skill','soft_skill',
                                  'domain','leadership','certification'
                                )),
  color_hex         TEXT        NOT NULL DEFAULT '#1E6FE8',
  xp_reward         INTEGER     NOT NULL DEFAULT 500
                                CHECK (xp_reward BETWEEN 100 AND 5000),

  -- ── Agent provenance ──
  agent_rationale   TEXT,       -- why the AI generated this badge for this user
  agent_run_id      UUID,       -- FK → agent_runs.id (set after insert)

  -- ── Status ──
  status            TEXT        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active','completed','archived')),
  completed_at      TIMESTAMPTZ,

  -- ── Progress (denormalized counters) ──
  videos_total      INTEGER     NOT NULL DEFAULT 0,
  videos_watched    INTEGER     NOT NULL DEFAULT 0,
  xp_from_videos    INTEGER     NOT NULL DEFAULT 0,
  proof_required    BOOLEAN     NOT NULL DEFAULT TRUE,
  proof_submitted   BOOLEAN     NOT NULL DEFAULT FALSE,
  proof_url         TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.badges
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_badges_user_status
  ON public.badges(user_id, status);
CREATE INDEX idx_badges_user_rank
  ON public.badges(user_id, rank);


-- ════════════════════════════════════════════════════════
-- 4. learning_paths
--    Individual YouTube videos attached to a badge.
--    One row = one video in the learning sequence.
-- ════════════════════════════════════════════════════════
CREATE TABLE public.learning_paths (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id          UUID        NOT NULL
                                REFERENCES public.badges(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL
                                REFERENCES public.hunter_profiles(id) ON DELETE CASCADE,

  -- ── Video metadata (fetched from YouTube Data API) ──
  youtube_url       TEXT        NOT NULL,
  youtube_id        TEXT        NOT NULL,     -- e.g. "dQw4w9WgXcQ"
  title             TEXT        NOT NULL,
  channel_name      TEXT,
  duration_seconds  INTEGER,                  -- total video duration
  duration_label    TEXT,                     -- e.g. "42 min"
  thumbnail_url     TEXT,

  -- ── XP & ordering ──
  xp_value          INTEGER     NOT NULL DEFAULT 100
                                CHECK (xp_value BETWEEN 25 AND 500),
  sequence_order    SMALLINT    NOT NULL DEFAULT 1,
  why_this_video    TEXT,       -- agent's reason for including this video

  -- ── Watch tracking ──
  watch_status      TEXT        NOT NULL DEFAULT 'unwatched'
                                CHECK (watch_status IN (
                                  'unwatched','in_progress','completed'
                                )),
  watch_started_at  TIMESTAMPTZ,
  watch_completed_at TIMESTAMPTZ,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON public.learning_paths
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_lp_badge_order
  ON public.learning_paths(badge_id, sequence_order);
CREATE INDEX idx_lp_user_status
  ON public.learning_paths(user_id, watch_status);


-- ════════════════════════════════════════════════════════
-- 5. xp_transactions
--    Immutable ledger — every XP event ever.
--    Never delete rows from this table.
-- ════════════════════════════════════════════════════════
CREATE TABLE public.xp_transactions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL
                            REFERENCES public.hunter_profiles(id) ON DELETE CASCADE,
  amount        INTEGER     NOT NULL,         -- positive only; adjustments use separate type
  source_type   TEXT        NOT NULL
                            CHECK (source_type IN (
                              'video_watch','badge_complete',
                              'proof_submit','level_bonus',
                              'streak_bonus','admin_grant'
                            )),
  source_id     UUID,                         -- badge_id or learning_path_id
  source_label  TEXT,                         -- human-readable e.g. "Watched: Docker 101"
  xp_before     INTEGER     NOT NULL,
  xp_after      INTEGER     NOT NULL,
  leveled_up    BOOLEAN     NOT NULL DEFAULT FALSE,
  new_level     INTEGER,                      -- set if leveled_up = true
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON public.xp_transactions
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT only via SECURITY DEFINER functions — never direct from client

CREATE INDEX idx_xp_user_time
  ON public.xp_transactions(user_id, created_at DESC);


-- ════════════════════════════════════════════════════════
-- 6. agent_runs
--    Audit log for every AI agent execution.
-- ════════════════════════════════════════════════════════
CREATE TABLE public.agent_runs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL
                                REFERENCES public.hunter_profiles(id) ON DELETE CASCADE,
  trigger_reason    TEXT        NOT NULL
                                CHECK (trigger_reason IN (
                                  'initial_setup','level_up',
                                  'goals_changed','manual'
                                )),
  level_at_run      INTEGER     NOT NULL,
  goals_snapshot    JSONB,
  profile_snapshot  JSONB,
  prompt_sent       TEXT,                    -- full prompt for debugging
  raw_response      TEXT,                    -- raw Claude output for debugging
  badges_created    INTEGER     DEFAULT 0,
  videos_created    INTEGER     DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN (
                                  'pending','running','completed','failed'
                                )),
  error_message     TEXT,
  duration_ms       INTEGER,                 -- how long the agent took
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON public.agent_runs
  FOR SELECT USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════
-- FUNCTION 1: award_xp
--    Atomic XP update with level-up detection.
--    Called ONLY from Edge Functions (SECURITY DEFINER).
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id     UUID,
  p_amount      INTEGER,
  p_source_type TEXT,
  p_source_id   UUID    DEFAULT NULL,
  p_label       TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile       hunter_profiles%ROWTYPE;
  v_xp_before     INTEGER;
  v_xp_after      INTEGER;
  v_leveled_up    BOOLEAN := FALSE;
  v_new_level     INTEGER;
  v_new_class     TEXT;
  v_class_changed BOOLEAN := FALSE;
BEGIN
  -- Lock row to prevent concurrent XP races
  SELECT * INTO v_profile
  FROM hunter_profiles
  WHERE id = p_user_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  v_xp_before := v_profile.xp_current;
  v_xp_after  := v_xp_before + p_amount;
  v_new_level := v_profile.level;
  v_new_class := v_profile.class;

  -- ── Level-up check ──
  -- XP threshold is fixed at 10,000 per level (as per design spec)
  IF v_xp_after >= v_profile.xp_to_next THEN
    v_leveled_up := TRUE;
    v_new_level  := v_profile.level + 1;
    v_xp_after   := v_xp_after - v_profile.xp_to_next; -- carry remainder

    -- Determine new class
    v_new_class := CASE
      WHEN v_new_level >= 50 THEN 'S'
      WHEN v_new_level >= 30 THEN 'A'
      WHEN v_new_level >= 20 THEN 'B'
      WHEN v_new_level >= 10 THEN 'C'
      WHEN v_new_level >= 5  THEN 'D'
      ELSE 'E'
    END;

    v_class_changed := (v_new_class != v_profile.class);
  END IF;

  -- ── Write XP transaction (immutable) ──
  INSERT INTO xp_transactions(
    user_id, amount, source_type, source_id, source_label,
    xp_before, xp_after, leveled_up, new_level
  ) VALUES (
    p_user_id, p_amount, p_source_type, p_source_id, p_label,
    v_xp_before, v_xp_after, v_leveled_up,
    CASE WHEN v_leveled_up THEN v_new_level ELSE NULL END
  );

  -- ── Update profile ──
  UPDATE hunter_profiles SET
    xp_current = v_xp_after,
    level      = v_new_level,
    class      = v_new_class,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'leveled_up',    v_leveled_up,
    'class_changed', v_class_changed,
    'new_level',     v_new_level,
    'new_class',     v_new_class,
    'xp_before',     v_xp_before,
    'xp_after',      v_xp_after,
    'xp_gained',     p_amount
  );
END;
$$;


-- ════════════════════════════════════════════════════════
-- FUNCTION 2: complete_badge
--    Marks badge as completed, awards xp_reward,
--    increments badge count on profile.
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.complete_badge(
  p_badge_id  UUID,
  p_user_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge   badges%ROWTYPE;
  v_xp_res  JSONB;
BEGIN
  SELECT * INTO v_badge FROM badges
  WHERE id = p_badge_id AND user_id = p_user_id AND status = 'active'
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Badge not found or already completed: %', p_badge_id;
  END IF;

  -- Mark badge complete
  UPDATE badges SET
    status       = 'completed',
    completed_at = NOW()
  WHERE id = p_badge_id;

  -- Award badge XP
  v_xp_res := award_xp(
    p_user_id   := p_user_id,
    p_amount    := v_badge.xp_reward,
    p_source_type := 'badge_complete',
    p_source_id := p_badge_id,
    p_label     := 'Badge completed: ' || v_badge.title || ' (' || v_badge.rank || '-Rank)'
  );

  -- Increment profile badge counters
  EXECUTE format(
    'UPDATE hunter_profiles
       SET badges_total = badges_total + 1,
           badges_%s    = badges_%s + 1,
           updated_at   = NOW()
     WHERE id = $1',
    lower(v_badge.rank), lower(v_badge.rank)
  ) USING p_user_id;

  RETURN jsonb_build_object(
    'badge_id',   p_badge_id,
    'badge_rank', v_badge.rank,
    'xp_result',  v_xp_res
  );
END;
$$;


-- ════════════════════════════════════════════════════════
-- FUNCTION 3: get_streak
--    Returns current streak and updates if today is new.
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile   hunter_profiles%ROWTYPE;
  v_today     DATE := CURRENT_DATE;
  v_streak    INTEGER;
BEGIN
  SELECT * INTO v_profile FROM hunter_profiles WHERE id = p_user_id FOR UPDATE;

  IF v_profile.streak_last_day = v_today THEN
    -- Already recorded today
    RETURN v_profile.streak_current;

  ELSIF v_profile.streak_last_day = v_today - INTERVAL '1 day' THEN
    -- Consecutive day — increment streak
    v_streak := v_profile.streak_current + 1;
    UPDATE hunter_profiles SET
      streak_current = v_streak,
      streak_last_day = v_today
    WHERE id = p_user_id;

    -- Every 7 days give a streak bonus
    IF v_streak % 7 = 0 THEN
      PERFORM award_xp(p_user_id, 200, 'streak_bonus', NULL,
                       'Streak bonus: ' || v_streak || ' day streak!');
    END IF;

    RETURN v_streak;

  ELSE
    -- Streak broken — reset to 1
    UPDATE hunter_profiles SET
      streak_current  = 1,
      streak_last_day = v_today
    WHERE id = p_user_id;
    RETURN 1;
  END IF;
END;
$$;
```

---

## 5. ENVIRONMENT VARIABLES

```bash
# .env.local (frontend — VITE_ prefix means it's bundled into client)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# .env (server / Vercel Edge Functions — NEVER prefix with VITE_)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-api03-...
YOUTUBE_API_KEY=AIzaSy...
VERCEL_URL=https://antigravity.vercel.app
```

> ⚠️ **CRITICAL:** `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` must NEVER appear in any `VITE_*` variable. They bypass Row Level Security and would expose your entire database if leaked.

---

## 6. SUPABASE CLIENT & AUTH SETUP

### 6.1 Supabase Singleton

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession:    true,    // store in localStorage
      autoRefreshToken:  true,
      detectSessionInUrl: true,   // for OAuth redirects
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);
```

### 6.2 Auth Context

```jsx
// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useHunterStore } from '../stores/hunterStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const setProfile            = useHunterStore(s => s.setProfile);
  const clearProfile          = useHunterStore(s => s.clearProfile);

  const fetchAndStoreProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('hunter_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist yet — first login, create it
      await createInitialProfile(userId);
      return fetchAndStoreProfile(userId);
    }

    if (data) setProfile(data);
  }, [setProfile]);

  const createInitialProfile = async (userId) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('hunter_profiles').insert({
      id:       userId,
      username: user.user_metadata?.user_name || user.email?.split('@')[0],
      email:    user.email,
      // Resume data — pre-populate from Sumit's resume
      current_role:    'Software Engineer',
      current_company: 'Ingram Micro',
      years_exp:       3.5,
      tech_skills:     ['C#', '.NET Core', 'React.js', 'SQL Server', 'GCP', 'JWT', 'OAuth 2.0', 'Dynamics 365'],
      soft_skills:     ['Problem Solving', 'Agile', 'Code Review', 'Technical Leadership'],
      resume_summary:  'Full Stack .NET Core & React.js Developer with 3+ years at Ingram Micro. GCP ACE Certified.',
    });

    // Trigger initial agent run (fire-and-forget)
    fetch('/api/agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, trigger: 'initial_setup' }),
    }).catch(console.error);
  };

  useEffect(() => {
    // Restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchAndStoreProfile(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchAndStoreProfile(session.user.id);
        } else {
          clearProfile();
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchAndStoreProfile, clearProfile]);

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 6.3 Protected Route

```jsx
// src/components/layout/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SystemBootLoader } from '../ui/SystemBootLoader';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SystemBootLoader message="AUTHENTICATING HUNTER..." />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
```

---

## 7. ZUSTAND GLOBAL STORE

The store is the **single source of truth** for the training page. All components read from here; only the Edge Functions write to the DB (the store reflects DB state).

```js
// src/stores/hunterStore.js
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const CLASS_FOR_LEVEL = (level) => {
  if (level >= 50) return 'S';
  if (level >= 30) return 'A';
  if (level >= 20) return 'B';
  if (level >= 10) return 'C';
  if (level >= 5)  return 'D';
  return 'E';
};

export const useHunterStore = create(
  subscribeWithSelector((set, get) => ({

    // ── Profile state ──
    profile: null,
    setProfile: (profile) => set({ profile }),
    clearProfile: () => set({ profile: null, badges: [], activeMissions: [] }),

    // ── XP animation state ──
    pendingXPFloats: [],  // [{ id, amount, x, y }]
    levelUpData:     null,  // set when leveled_up=true from server

    // ── Optimistic XP update (before server confirms) ──
    applyXPGain: (xpGained, serverResponse) => {
      const { profile } = get();
      if (!profile) return;

      // Add floating XP animation
      set(state => ({
        pendingXPFloats: [
          ...state.pendingXPFloats,
          { id: Date.now(), amount: xpGained, x: Math.random() * 200 + 100, y: Math.random() * 50 + 200 }
        ]
      }));

      // If server confirmed level-up, show overlay
      if (serverResponse?.leveled_up) {
        set({
          levelUpData: serverResponse,
          profile: {
            ...profile,
            level:      serverResponse.new_level,
            class:      serverResponse.new_class,
            xp_current: serverResponse.xp_after,
          }
        });
      } else {
        // Optimistic XP update
        set(state => ({
          profile: state.profile ? {
            ...state.profile,
            xp_current: Math.min(
              (state.profile.xp_current + xpGained),
              state.profile.xp_to_next - 1
            )
          } : null
        }));
      }
    },

    dismissLevelUp: () => set({ levelUpData: null }),
    dismissXPFloat: (id) => set(state => ({
      pendingXPFloats: state.pendingXPFloats.filter(f => f.id !== id)
    })),

    // ── Badges ──
    badges: [],            // all badges for user
    setBadges:      (badges) => set({ badges }),
    addBadge:       (badge)  => set(state => ({ badges: [badge, ...state.badges] })),
    updateBadge:    (id, patch) => set(state => ({
      badges: state.badges.map(b => b.id === id ? { ...b, ...patch } : b)
    })),
    completeBadge:  (id) => set(state => ({
      badges: state.badges.map(b => b.id === id ? { ...b, status: 'completed' } : b),
      profile: state.profile ? {
        ...state.profile,
        badges_total: state.profile.badges_total + 1,
      } : null,
    })),

    // ── Video progress ──
    markVideoComplete: (videoId, badgeId, xpGained) => {
      // Update badge progress counter in store
      set(state => ({
        badges: state.badges.map(b => {
          if (b.id !== badgeId) return b;
          return { ...b, videos_watched: b.videos_watched + 1, xp_from_videos: b.xp_from_videos + xpGained };
        })
      }));
    },

    // ── Goals ──
    goals: [],
    setGoals:   (goals) => set({ goals }),
    addGoal:    (goal)  => set(state => ({ goals: [...state.goals, goal] })),
    removeGoal: (id)    => set(state => ({ goals: state.goals.filter(g => g.id !== id) })),

    // ── Agent state ──
    agentRunning: false,
    lastAgentRun: null,
    setAgentRunning: (val) => set({ agentRunning: val }),
    setLastAgentRun: (ts)  => set({ lastAgentRun: ts }),

    // ── Toast notifications ──
    toasts: [],
    addToast: (toast) => set(state => ({
      toasts: [...state.toasts, { id: Date.now(), ...toast }]
    })),
    removeToast: (id) => set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    })),
  }))
);
```

---

## 8. PAGE LAYOUT & COMPLETE TRAINING.JSX

```jsx
// src/pages/Training.jsx
import { useEffect, Suspense } from 'react';
import { useAuth }             from '../contexts/AuthContext';
import { useHunterStore }      from '../stores/hunterStore';
import { supabase }            from '../lib/supabase';
import { useBadgesRealtime }   from '../hooks/training/useBadgesRealtime';
import { useStreakCheck }       from '../hooks/training/useStreakCheck';

import { SystemTopBar }        from '../components/layout/SystemTopBar';
import { Navigation }          from '../components/layout/Navigation';
import { HunterStatsBar }      from '../components/training/HunterStatsBar';
import { GoalsEditor }         from '../components/training/GoalsEditor';
import { ActiveMissions }      from '../components/training/ActiveMissions';
import { CompletedVault }      from '../components/training/CompletedVault';
import { LevelUpOverlay }      from '../components/training/LevelUpOverlay';
import { XPFloatLayer }        from '../components/training/XPFloatLayer';
import { NewBadgeToast }       from '../components/training/NewBadgeToast';
import { AgentStatusBar }      from '../components/training/AgentStatusBar';
import { SystemBootLoader }    from '../components/ui/SystemBootLoader';

import '../styles/training.css';

export default function TrainingPage() {
  const { user }       = useAuth();
  const profile        = useHunterStore(s => s.profile);
  const levelUpData    = useHunterStore(s => s.levelUpData);
  const dismissLevelUp = useHunterStore(s => s.dismissLevelUp);
  const setGoals       = useHunterStore(s => s.setGoals);

  // Load goals once on mount
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('hunter_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .then(({ data }) => setGoals(data ?? []));
  }, [user?.id, setGoals]);

  // Check and update daily streak
  useStreakCheck(user?.id);

  // Realtime badge subscription
  useBadgesRealtime(user?.id);

  if (!profile) return <SystemBootLoader message="LOADING HUNTER DATA..." />;

  return (
    <div className="training-page">
      <SystemTopBar />
      <Navigation />

      {/* XP floating numbers layer — positioned fixed, z-index 1000 */}
      <XPFloatLayer />

      {/* Level-up full-screen overlay */}
      {levelUpData && (
        <LevelUpOverlay data={levelUpData} onDismiss={dismissLevelUp} />
      )}

      {/* New badge slide-in toast (bottom right) */}
      <NewBadgeToast />

      <main className="training-main">

        {/* ── SECTION A: Stats ── */}
        <section className="training-section" id="stats">
          <HunterStatsBar />
        </section>

        {/* ── SECTION B: Goals ── */}
        <section className="training-section" id="goals">
          <GoalsEditor />
        </section>

        {/* ── Agent Status Bar ── */}
        <AgentStatusBar />

        {/* ── SECTION C: Active Missions ── */}
        <section className="training-section" id="missions">
          <div className="section-header">
            <span className="section-tag">// ACTIVE MISSIONS</span>
            <h2 className="section-title">BADGE TRAINING GROUND</h2>
          </div>
          <Suspense fallback={<SystemBootLoader message="LOADING MISSIONS..." />}>
            <ActiveMissions userId={user.id} />
          </Suspense>
        </section>

        {/* ── SECTION D: Completed Vault ── */}
        <section className="training-section" id="vault">
          <div className="section-header">
            <span className="section-tag">// COMPLETED BADGES</span>
            <h2 className="section-title">BADGE VAULT</h2>
          </div>
          <CompletedVault userId={user.id} />
        </section>

      </main>
    </div>
  );
}
```

---

## 9. SECTION A — HUNTER STATS DASHBOARD

### 9.1 Visual Wireframe

```
╔══ HUNTER STATUS ═══════════════════════════════════════════════════╗
║  [LV.7]  CLASS: B-RANK  ·  SHADOW MONARCH (IN TRAINING)           ║
║                                                                     ║
║  XP  ▐████████████████████░░░░░░░░░░░░░░░░░░▌  7,240 / 10,000    ║
║       Milestone──────────┘ ┌──────────────── Next Level           ║
║                                                                     ║
║  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         ║
║  │  BADGES   │ │   CLASS   │ │ XP TODAY  │ │  STREAK   │         ║
║  │    12     │ │   B-RANK  │ │   +580    │ │  7 Days 🔥│         ║
║  └───────────┘ └───────────┘ └───────────┘ └───────────┘         ║
╚════════════════════════════════════════════════════════════════════╝
```

### 9.2 HunterStatsBar Component

```jsx
// src/components/training/HunterStatsBar.jsx
import { useEffect, useRef } from 'react';
import { motion }            from 'framer-motion';
import { useHunterStore }    from '../../stores/hunterStore';
import { useXPToday }        from '../../hooks/training/useXPToday';
import { useStreak }         from '../../hooks/training/useStreak';

const CLASS_META = {
  E: { color: '#7BA8D0', label: 'E-RANK', title: 'Novice Hunter' },
  D: { color: '#00CC44', label: 'D-RANK', title: 'Awakened Hunter' },
  C: { color: '#0080FF', label: 'C-RANK', title: 'Shadow Soldier' },
  B: { color: '#4A9EFF', label: 'B-RANK', title: 'Shadow Knight' },
  A: { color: '#9F00FF', label: 'A-RANK', title: 'Shadow Marshal' },
  S: { color: '#FFD700', label: 'S-RANK', title: 'Shadow Monarch' },
};

export function HunterStatsBar() {
  const profile        = useHunterStore(s => s.profile);
  const { xpToday }    = useXPToday(profile?.id);
  const { streak }     = useStreak();
  const xpBarRef       = useRef(null);

  if (!profile) return null;

  const cls      = CLASS_META[profile.class] ?? CLASS_META.E;
  const xpPct    = Math.min((profile.xp_current / profile.xp_to_next) * 100, 100);
  const milestones = [25, 50, 75]; // XP milestone markers

  return (
    <div className="hunter-stats-bar system-panel">

      {/* Row 1 — Level + Class + Title */}
      <div className="hsb-identity">
        <span className="hsb-level">LV.{profile.level}</span>
        <span className="hsb-class-badge" style={{ color: cls.color, borderColor: cls.color }}>
          {cls.label}
        </span>
        <span className="hsb-title">{profile.job_title ?? cls.title}</span>
        <span className="hsb-company">{profile.current_company}</span>
      </div>

      {/* Row 2 — XP Bar */}
      <div className="hsb-xp-section">
        <span className="hsb-xp-tag">XP</span>
        <div className="hsb-xp-track" ref={xpBarRef}>
          <motion.div
            className="hsb-xp-fill"
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Milestone tick marks */}
          {milestones.map(m => (
            <div
              key={m}
              className={`hsb-xp-milestone ${xpPct >= m ? 'hsb-xp-milestone--passed' : ''}`}
              style={{ left: `${m}%` }}
            />
          ))}
        </div>
        <span className="hsb-xp-numbers">
          {profile.xp_current.toLocaleString()}
          <span className="hsb-xp-sep"> / </span>
          {profile.xp_to_next.toLocaleString()}
        </span>
      </div>

      {/* Row 3 — Stat Cards */}
      <div className="hsb-stat-cards">
        {[
          {
            label: 'BADGES',
            value: profile.badges_total,
            sub:   `${profile.badges_s}× S  ${profile.badges_a}× A`,
            color: '#4A9EFF',
          },
          {
            label: 'CLASS',
            value: cls.label,
            sub:   cls.title,
            color: cls.color,
          },
          {
            label: 'XP TODAY',
            value: `+${xpToday.toLocaleString()}`,
            sub:   'earned today',
            color: '#00CC44',
          },
          {
            label: 'STREAK',
            value: `${streak}`,
            sub:   streak >= 7 ? '🔥 ON FIRE' : streak > 0 ? 'days active' : 'Start today!',
            color: streak >= 7 ? '#FF8C00' : '#FFD700',
          },
        ].map(card => (
          <div key={card.label} className="hsb-stat-card system-panel">
            <span className="hsb-stat-label">{card.label}</span>
            <span className="hsb-stat-value" style={{ color: card.color }}>
              {card.value}
            </span>
            <span className="hsb-stat-sub">{card.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 10. SECTION B — GOALS & INTERESTS EDITOR

### 10.1 Visual Wireframe

```
╔══ HUNTER GOALS & INTERESTS ════════════════════════════════════════╗
║  "Set your path. The System will forge your destiny."              ║
║                                                                     ║
║  TECHNOLOGIES   [ C# × ] [ React.js × ] [ Docker × ] [ + Add ]   ║
║  DOMAINS        [ Enterprise Systems × ] [ Cloud × ] [ + Add ]    ║
║  SKILLS         [ System Design × ] [ Team Leadership × ]         ║
║  DESIGNATIONS   [ Tech Lead × ] [ Solutions Architect × ]         ║
║  SUBJECTS       [ Distributed Systems × ] [ + Add ]               ║
║                                                                     ║
║  PRIORITY: ● HIGH  ○ MED  ○ LOW                                   ║
║                                                                     ║
║  ⚡ Goals changed — save to regenerate missions                    ║
║  [  SAVE GOALS & UPDATE MISSIONS  ]                                ║
╚════════════════════════════════════════════════════════════════════╝
```

### 10.2 GoalsEditor Component

```jsx
// src/components/training/GoalsEditor.jsx
import { useState }             from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase }             from '../../lib/supabase';
import { useAuth }              from '../../contexts/AuthContext';
import { useHunterStore }       from '../../stores/hunterStore';

const CATEGORIES = [
  { key: 'technology',  label: 'TECHNOLOGIES', placeholder: 'e.g. Kubernetes, TypeScript' },
  { key: 'domain',      label: 'DOMAINS',      placeholder: 'e.g. FinTech, Distributed Systems' },
  { key: 'skill',       label: 'SKILLS',       placeholder: 'e.g. System Design, Mentoring' },
  { key: 'designation', label: 'DESIGNATIONS', placeholder: 'e.g. Tech Lead, CTO' },
  { key: 'subject',     label: 'SUBJECTS',     placeholder: 'e.g. Machine Learning, Security' },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: 'HIGH',   color: '#FF4444' },
  { value: 2, label: 'MED',    color: '#FFD700' },
  { value: 3, label: 'LOW',    color: '#7BA8D0' },
];

export function GoalsEditor() {
  const { user }        = useAuth();
  const goals           = useHunterStore(s => s.goals);
  const addGoal         = useHunterStore(s => s.addGoal);
  const removeGoal      = useHunterStore(s => s.removeGoal);
  const setAgentRunning = useHunterStore(s => s.setAgentRunning);
  const addToast        = useHunterStore(s => s.addToast);

  const [addingFor,   setAddingFor]   = useState(null);
  const [newValue,    setNewValue]    = useState('');
  const [newPriority, setNewPriority] = useState(1);
  const [isDirty,     setIsDirty]     = useState(false);
  const [saving,      setSaving]      = useState(false);

  const handleAddGoal = async (category) => {
    const trimmed = newValue.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from('hunter_goals')
      .insert({ user_id: user.id, category, value: trimmed, priority: newPriority })
      .select()
      .single();

    if (!error && data) {
      addGoal(data);
      setNewValue('');
      setAddingFor(null);
      setIsDirty(true);
    }
  };

  const handleRemoveGoal = async (goalId) => {
    await supabase.from('hunter_goals').update({ is_active: false }).eq('id', goalId);
    removeGoal(goalId);
    setIsDirty(true);
  };

  const handleSaveAndRunAgent = async () => {
    setSaving(true);
    setIsDirty(false);
    setAgentRunning(true);

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, trigger: 'goals_changed' }),
      });
      const data = await res.json();

      if (data.success) {
        addToast({
          type: 'success',
          message: `⚡ System updated — ${data.badgesCreated} new missions generated`,
        });
      } else {
        addToast({ type: 'error', message: 'Agent failed. Try again in a moment.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Network error. Please retry.' });
    } finally {
      setSaving(false);
      setAgentRunning(false);
    }
  };

  return (
    <div className="system-panel goals-editor">
      <div className="goals-editor__header">
        <h2 className="panel-title">HUNTER GOALS & INTERESTS</h2>
        <p className="panel-subtitle">
          Configure your path. The System adapts your missions to your ambitions.
        </p>
      </div>

      <div className="goals-grid">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="goals-category">
            <span className="goals-category__label">{cat.label}</span>
            <div className="goals-category__chips">

              {/* Existing goal chips */}
              <AnimatePresence>
                {goals
                  .filter(g => g.category === cat.key)
                  .map(goal => (
                    <motion.span
                      key={goal.id}
                      className={`goal-chip goal-chip--p${goal.priority}`}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      layout
                    >
                      {goal.value}
                      <button
                        className="goal-chip__remove"
                        onClick={() => handleRemoveGoal(goal.id)}
                        aria-label={`Remove ${goal.value}`}
                      >×</button>
                    </motion.span>
                  ))
                }
              </AnimatePresence>

              {/* Inline add input */}
              <AnimatePresence mode="wait">
                {addingFor === cat.key ? (
                  <motion.div
                    className="goal-add-row"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                  >
                    <input
                      autoFocus
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  handleAddGoal(cat.key);
                        if (e.key === 'Escape') { setAddingFor(null); setNewValue(''); }
                      }}
                      placeholder={cat.placeholder}
                      className="goal-add-input"
                      maxLength={60}
                    />
                    {/* Priority selector */}
                    <div className="goal-priority-row">
                      {PRIORITY_OPTIONS.map(p => (
                        <button
                          key={p.value}
                          className={`priority-btn ${newPriority === p.value ? 'priority-btn--active' : ''}`}
                          style={{ '--p-color': p.color }}
                          onClick={() => setNewPriority(p.value)}
                        >{p.label}</button>
                      ))}
                    </div>
                    <button className="goal-add-confirm" onClick={() => handleAddGoal(cat.key)}>
                      ADD ✓
                    </button>
                  </motion.div>
                ) : (
                  <button
                    className="goal-chip goal-chip--add"
                    onClick={() => setAddingFor(cat.key)}
                  >+ ADD</button>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Save row — visible when dirty */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            className="goals-save-banner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <span className="goals-save-hint">⚡ Goals updated — save to regenerate your missions</span>
            <button
              className="glow-btn"
              onClick={handleSaveAndRunAgent}
              disabled={saving}
            >
              {saving ? 'SYSTEM PROCESSING...' : 'SAVE & UPDATE MISSIONS'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 11. SECTION C — ACTIVE MISSIONS (BADGE ENGINE OUTPUT)

### 11.1 ActiveMissions Container

```jsx
// src/components/training/ActiveMissions.jsx
import { useHunterStore }       from '../../stores/hunterStore';
import { BadgeMissionCard }     from './BadgeMissionCard';
import { motion }               from 'framer-motion';

export function ActiveMissions({ userId }) {
  const badges  = useHunterStore(s => s.badges);
  const active  = badges.filter(b => b.status === 'active');

  if (active.length === 0) {
    return (
      <div className="missions-empty system-panel">
        <span className="missions-empty__icon">⚔️</span>
        <p className="missions-empty__title">NO ACTIVE MISSIONS</p>
        <p className="missions-empty__sub">
          Set your goals above and the System will generate your training path.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="active-missions"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show:   { transition: { staggerChildren: 0.08 } }
      }}
    >
      {active.map(badge => (
        <motion.div
          key={badge.id}
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        >
          <BadgeMissionCard badge={badge} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 11.2 BadgeMissionCard

```jsx
// src/components/training/BadgeMissionCard.jsx
import { useState }               from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LearningPathList }       from './LearningPathList';
import { ProofSubmission }        from './ProofSubmission';
import { useHunterStore }         from '../../stores/hunterStore';

const RANK_COLORS = {
  E: '#7BA8D0', D: '#00CC44', C: '#0080FF',
  B: '#4A9EFF', A: '#9F00FF', S: '#FFD700',
};

export function BadgeMissionCard({ badge }) {
  const [open, setOpen] = useState(false);
  const applyXPGain     = useHunterStore(s => s.applyXPGain);
  const updateBadge     = useHunterStore(s => s.updateBadge);
  const markVideoComplete = useHunterStore(s => s.markVideoComplete);

  const rankColor = RANK_COLORS[badge.rank] ?? '#4A9EFF';
  const progressPct = badge.videos_total > 0
    ? Math.round((badge.videos_watched / badge.videos_total) * 100)
    : 0;

  const handleVideoXP = ({ xpGained, serverResponse }) => {
    markVideoComplete(null, badge.id, xpGained);
    applyXPGain(xpGained, serverResponse);
    updateBadge(badge.id, { videos_watched: badge.videos_watched + 1 });
  };

  return (
    <div
      className="badge-card system-panel"
      style={{ '--rank-color': rankColor }}
    >
      {/* ── Card Header (always visible) ── */}
      <button
        className="badge-card__header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="badge-card__icon">{badge.icon_emoji}</span>

        <div className="badge-card__info">
          <span className="badge-card__title">{badge.title}</span>
          <span className="badge-card__desc">{badge.description}</span>
        </div>

        <div className="badge-card__meta">
          <span
            className="badge-card__rank"
            style={{ color: rankColor, borderColor: rankColor }}
          >
            {badge.rank}-RANK
          </span>
          <span className="badge-card__xp-reward">
            +{badge.xp_reward.toLocaleString()} XP
          </span>
        </div>

        <span className="badge-card__chevron">{open ? '▲' : '▼'}</span>
      </button>

      {/* ── Thin XP progress bar (always visible) ── */}
      <div className="badge-card__progress-track">
        <motion.div
          className="badge-card__progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <span className="badge-card__progress-label">
          {badge.videos_watched}/{badge.videos_total} · {progressPct}%
          {badge.proof_required && !badge.proof_submitted
            ? ' · Proof required'
            : badge.proof_submitted
            ? ' · ✔ Proof submitted'
            : ''
          }
        </span>
      </div>

      {/* ── Expandable body ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="badge-card__body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="badge-card__body-inner">
              {/* Agent rationale */}
              {badge.agent_rationale && (
                <div className="badge-card__rationale">
                  <span className="badge-card__rationale-label">// SYSTEM ASSESSMENT</span>
                  <p>{badge.agent_rationale}</p>
                </div>
              )}

              {/* Video learning path */}
              <LearningPathList
                badgeId={badge.id}
                category={badge.category}
                onVideoComplete={handleVideoXP}
              />

              {/* Proof of work */}
              <ProofSubmission
                badge={badge}
                progressPct={progressPct}
                onProofXP={handleVideoXP}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 12. SECTION D — VIDEO PLAYER & XP TRACKER

### 12.1 LearningPathList

```jsx
// src/components/training/LearningPathList.jsx
import { useQuery }       from '@tanstack/react-query';
import { supabase }       from '../../lib/supabase';
import { VideoItem }      from './VideoItem';

export function LearningPathList({ badgeId, category, onVideoComplete }) {
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['learning-path', badgeId],
    queryFn: async () => {
      const { data } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('badge_id', badgeId)
        .order('sequence_order');
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,  // 5 min cache
  });

  if (isLoading) return <div className="lpl-loading">Loading path...</div>;

  return (
    <div className="learning-path-list">
      <div className="lpl-header">
        <span className="lpl-title">LEARNING PATH</span>
        <span className="lpl-count">{videos.length} VIDEOS</span>
        {category === 'tech_skill' && (
          <span className="lpl-proof-hint">⚡ Tech skill — GitHub proof required</span>
        )}
        {category === 'soft_skill' && (
          <span className="lpl-proof-hint">🎥 Soft skill — YouTube video proof required</span>
        )}
      </div>
      <div className="lpl-videos">
        {videos.map((video, i) => (
          <VideoItem
            key={video.id}
            video={video}
            index={i}
            isLocked={i > 0 && videos[i - 1].watch_status !== 'completed'}
            onComplete={onVideoComplete}
          />
        ))}
      </div>
    </div>
  );
}
```

### 12.2 VideoItem — Full YouTube Embed with XP Tracking

```jsx
// src/components/training/VideoItem.jsx
import { useState, useRef, useCallback }  from 'react';
import YouTube                            from 'react-youtube';
import { motion, AnimatePresence }        from 'framer-motion';
import { useAuth }                        from '../../contexts/AuthContext';
import { supabase }                       from '../../lib/supabase';

// XP calculation by video duration
function calcXP(durationSeconds) {
  const mins = (durationSeconds ?? 0) / 60;
  if (mins > 60)  return 400;
  if (mins > 30)  return 250;
  if (mins > 15)  return 150;
  return 75;
}

export function VideoItem({ video, index, isLocked, onComplete }) {
  const { user }         = useAuth();
  const [open, setOpen]  = useState(false);
  const [status, setStatus] = useState(video.watch_status);
  const [xpAwarding, setXpAwarding] = useState(false);
  const hasAwarded       = useRef(video.watch_status === 'completed');

  // ── YouTube player state change handler ──
  const handleStateChange = useCallback(async (event) => {
    const state = event.data;
    // YouTube states: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued

    if (state === 1 && status === 'unwatched') {
      // Started playing → mark in_progress
      setStatus('in_progress');
      await supabase.from('learning_paths').update({
        watch_status: 'in_progress',
        watch_started_at: new Date().toISOString(),
      }).eq('id', video.id);
    }

    if (state === 0 && !hasAwarded.current) {
      // Video ENDED → award XP (idempotent — guard with ref)
      hasAwarded.current = true;
      setXpAwarding(true);

      const xpAmount = video.xp_value || calcXP(video.duration_seconds);

      try {
        const res = await fetch('/api/xp/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId:     user.id,
            videoId:    video.id,
            badgeId:    video.badge_id,
            xpAmount,
            videoTitle: video.title,
          }),
        });
        const data = await res.json();

        if (data.success) {
          setStatus('completed');
          onComplete?.({ xpGained: xpAmount, serverResponse: data });
        }
      } catch (err) {
        console.error('XP award failed:', err);
        hasAwarded.current = false; // allow retry
      } finally {
        setXpAwarding(false);
      }
    }
  }, [user.id, video, status, onComplete]);

  const statusIcon  = { unwatched: '○', in_progress: '◐', completed: '✔' };
  const statusColor = { unwatched: '#3A5570', in_progress: '#4A9EFF', completed: '#00CC44' };
  const xpAmount    = video.xp_value || calcXP(video.duration_seconds);

  return (
    <motion.div
      className={`video-item video-item--${status} ${isLocked ? 'video-item--locked' : ''}`}
      layout
    >
      {/* ── Row header ── */}
      <div
        className="vi-row"
        onClick={() => !isLocked && setOpen(o => !o)}
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-disabled={isLocked}
      >
        <span className="vi-seq">{String(index + 1).padStart(2, '0')}</span>

        <span
          className="vi-status"
          style={{ color: isLocked ? '#3A5570' : statusColor[status] }}
        >
          {isLocked ? '🔒' : statusIcon[status]}
        </span>

        {/* Thumbnail */}
        {video.thumbnail_url && (
          <img
            src={video.thumbnail_url}
            alt=""
            className="vi-thumb"
            loading="lazy"
          />
        )}

        <div className="vi-info">
          <span className="vi-title">
            {isLocked ? '— COMPLETE PREVIOUS VIDEO TO UNLOCK —' : video.title}
          </span>
          {!isLocked && (
            <span className="vi-meta">
              {video.channel_name}
              {video.duration_label ? ` · ${video.duration_label}` : ''}
            </span>
          )}
          {video.why_this_video && !isLocked && (
            <span className="vi-why">// {video.why_this_video}</span>
          )}
        </div>

        <div className="vi-right">
          <span className={`vi-xp ${status === 'completed' ? 'vi-xp--earned' : ''}`}>
            {status === 'completed' ? `✔ +${xpAmount} XP` : `+${xpAmount} XP`}
          </span>
          {!isLocked && (
            <span className="vi-chevron">{open ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {/* ── YouTube embed (only when open and unlocked) ── */}
      <AnimatePresence>
        {open && !isLocked && (
          <motion.div
            className="vi-embed"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <YouTube
              videoId={video.youtube_id}
              className="vi-player"
              opts={{
                width:  '100%',
                height: '360',
                playerVars: { autoplay: 0, modestbranding: 1, rel: 0 },
              }}
              onStateChange={handleStateChange}
            />

            {/* XP awarding overlay */}
            {xpAwarding && (
              <div className="vi-xp-overlay">
                <span>⚡ AWARDING XP...</span>
              </div>
            )}

            {/* Completed state overlay */}
            {status === 'completed' && !xpAwarding && (
              <div className="vi-complete-bar">
                ✔ &nbsp; WATCHED · +{xpAmount} XP AWARDED
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

## 13. SECTION E — PROOF OF WORK SUBMISSION

```jsx
// src/components/training/ProofSubmission.jsx
import { useState }               from 'react';
import { useForm }                from 'react-hook-form';
import { z }                      from 'zod';
import { zodResolver }            from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth }                from '../../contexts/AuthContext';
import { useHunterStore }         from '../../stores/hunterStore';
import { supabase }               from '../../lib/supabase';

const GITHUB_SCHEMA = z.object({
  proof_url: z.string()
    .url('Must be a valid URL')
    .refine(v => v.includes('github.com'), 'Must be a GitHub repository URL'),
  notes: z.string()
    .min(30, 'Describe what you built (min 30 characters)')
    .max(500),
});

const YOUTUBE_SCHEMA = z.object({
  proof_url: z.string()
    .url('Must be a valid URL')
    .refine(v => /youtu\.?be/.test(v), 'Must be a YouTube URL'),
  notes: z.string()
    .min(30, 'Describe what you demonstrated (min 30 characters)')
    .max(500),
});

export function ProofSubmission({ badge, progressPct, onProofXP }) {
  const { user }      = useAuth();
  const updateBadge   = useHunterStore(s => s.updateBadge);
  const completeBadge = useHunterStore(s => s.completeBadge);
  const applyXPGain   = useHunterStore(s => s.applyXPGain);
  const addToast      = useHunterStore(s => s.addToast);

  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(badge.proof_submitted);

  const isTech     = badge.category === 'tech_skill';
  const isUnlocked = progressPct >= 100;
  const schema     = isTech ? GITHUB_SCHEMA : YOUTUBE_SCHEMA;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ proof_url, notes }) => {
    setSubmitting(true);
    try {
      // 1. Save proof URL to badge
      await supabase.from('badges').update({
        proof_submitted: true,
        proof_url,
      }).eq('id', badge.id);

      // 2. Award proof XP + potentially complete badge
      const res = await fetch('/api/xp/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:     user.id,
          badgeId:    badge.id,
          proofUrl:   proof_url,
          badgeTitle: badge.title,
        }),
      });
      const data = await res.json();

      // 3. Update store
      updateBadge(badge.id, { proof_submitted: true, proof_url });

      if (data.badge_completed) {
        completeBadge(badge.id);
        applyXPGain(badge.xp_reward, data.xp_result);
        addToast({
          type: 'badge',
          message: `🏆 Badge Earned: ${badge.title} (${badge.rank}-Rank)`,
          badgeData: badge,
        });
      } else {
        applyXPGain(300, data.xp_result);
      }

      setSubmitted(true);
    } catch {
      addToast({ type: 'error', message: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!badge.proof_required) return null;

  return (
    <div className={`proof-box system-panel ${!isUnlocked ? 'proof-box--locked' : ''}`}>
      <div className="proof-box__header">
        <span className="proof-box__title">
          {isTech ? '⚡ PROOF OF WORK — GITHUB REPOSITORY' : '🎥 PROOF OF WORK — VIDEO SUBMISSION'}
        </span>
        {!isUnlocked && (
          <span className="proof-box__lock">
            🔒 Complete all {badge.videos_total} videos to unlock
            ({progressPct}% / 100%)
          </span>
        )}
      </div>

      {submitted ? (
        <div className="proof-box__done">
          <span className="proof-box__done-icon">✔</span>
          <div>
            <p className="proof-box__done-label">PROOF ACCEPTED</p>
            <a
              href={badge.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="proof-box__done-link"
            >
              {badge.proof_url}
            </a>
          </div>
        </div>
      ) : (
        <AnimatePresence>
          {isUnlocked && (
            <motion.form
              className="proof-form"
              onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="proof-form__field">
                <label className="proof-form__label">
                  {isTech ? 'GITHUB REPO URL' : 'YOUTUBE VIDEO URL'}
                </label>
                <input
                  {...register('proof_url')}
                  placeholder={isTech
                    ? 'https://github.com/S-Techofficial/project-name'
                    : 'https://youtu.be/your-video-id'
                  }
                  className="proof-form__input"
                />
                {errors.proof_url && (
                  <span className="proof-form__error">{errors.proof_url.message}</span>
                )}
                <p className="proof-form__hint">
                  {isTech
                    ? 'Submit a GitHub repository that demonstrates this skill. Must have a README, meaningful commits, and working code.'
                    : 'Record a 3–10 min video demonstrating this skill. Upload to YouTube (Unlisted is fine), then paste the link here.'
                  }
                </p>
              </div>

              <div className="proof-form__field">
                <label className="proof-form__label">DESCRIPTION / NOTES</label>
                <textarea
                  {...register('notes')}
                  placeholder="Describe what you built or demonstrated, what you learned, and how it relates to this badge..."
                  className="proof-form__textarea"
                  rows={4}
                />
                {errors.notes && (
                  <span className="proof-form__error">{errors.notes.message}</span>
                )}
              </div>

              <div className="proof-form__submit-row">
                <span className="proof-form__xp-note">
                  +300 XP for submission · +{badge.xp_reward.toLocaleString()} XP on badge completion
                </span>
                <button
                  type="submit"
                  className="glow-btn"
                  disabled={submitting}
                >
                  {submitting ? 'SUBMITTING...' : 'SUBMIT PROOF OF WORK'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
```

---

## 14. SECTION F — COMPLETED BADGES VAULT

```jsx
// src/components/training/CompletedVault.jsx
import { useHunterStore }     from '../../stores/hunterStore';
import { motion }             from 'framer-motion';

const RANK_COLORS = {
  E:'#7BA8D0', D:'#00CC44', C:'#0080FF', B:'#4A9EFF', A:'#9F00FF', S:'#FFD700'
};

export function CompletedVault() {
  const badges    = useHunterStore(s => s.badges);
  const completed = badges.filter(b => b.status === 'completed');
  const profile   = useHunterStore(s => s.profile);

  if (completed.length === 0) {
    return (
      <div className="vault-empty system-panel">
        <span className="vault-empty__icon">🏺</span>
        <p>No badges collected yet. Complete your first mission.</p>
      </div>
    );
  }

  return (
    <div className="vault system-panel">
      <div className="vault__summary">
        <span className="vault__total">{completed.length} BADGES COLLECTED</span>
        <div className="vault__rank-row">
          {['S','A','B','C','D','E'].map(r => (
            profile?.[`badges_${r.toLowerCase()}`] > 0 && (
              <span
                key={r}
                className="vault__rank-count"
                style={{ color: RANK_COLORS[r] }}
              >
                {r}: ×{profile[`badges_${r.toLowerCase()}`]}
              </span>
            )
          ))}
        </div>
      </div>

      <motion.div
        className="vault__grid"
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        initial="hidden"
        animate="show"
      >
        {completed.map(badge => (
          <motion.div
            key={badge.id}
            className="vault-badge"
            style={{ '--rank-color': RANK_COLORS[badge.rank] }}
            variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
            whileHover={{ scale: 1.05, y: -4 }}
          >
            <span className="vault-badge__icon">{badge.icon_emoji}</span>
            <span className="vault-badge__title">{badge.title}</span>
            <span className="vault-badge__rank">{badge.rank}-RANK</span>
            {badge.proof_url && (
              <a
                href={badge.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="vault-badge__link"
                title="View proof of work"
              >⬡</a>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
```

---

## 15. LEVEL-UP OVERLAY & XP FLOAT ANIMATION

### 15.1 LevelUpOverlay

```jsx
// src/components/training/LevelUpOverlay.jsx
import { useEffect, useRef }       from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CLASS_PROMOTIONS = {
  5:  { from: 'E', to: 'D', label: 'RANK UP: E → D-CLASS', color: '#00CC44' },
  10: { from: 'D', to: 'C', label: 'RANK UP: D → C-CLASS', color: '#0080FF' },
  20: { from: 'C', to: 'B', label: 'RANK UP: C → B-CLASS', color: '#4A9EFF' },
  30: { from: 'B', to: 'A', label: 'RANK UP: B → A-CLASS', color: '#9F00FF' },
  50: { from: 'A', to: 'S', label: 'RANK UP: A → S-CLASS ★', color: '#FFD700' },
};

export function LevelUpOverlay({ data, onDismiss }) {
  const promotion = CLASS_PROMOTIONS[data.new_level];
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      className="levelup-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      {/* Particle ring — CSS animation */}
      <div className="levelup-particles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="levelup-particle"
            style={{
              '--angle': `${i * 30}deg`,
              '--delay': `${i * 0.06}s`,
              '--color': promotion?.color ?? '#4A9EFF',
            }}
          />
        ))}
      </div>

      <motion.div
        className="levelup-panel system-panel"
        initial={{ scale: 0.6, y: 60, opacity: 0 }}
        animate={{ scale: 1,   y: 0,  opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="levelup-flash">⚡</div>

        <p className="levelup-label">LEVEL UP</p>

        <div className="levelup-number">
          <span className="levelup-number__prev">LV.{data.new_level - 1}</span>
          <span className="levelup-number__arrow">→</span>
          <span className="levelup-number__new">LV.{data.new_level}</span>
        </div>

        {promotion && (
          <motion.p
            className="levelup-rank"
            style={{ color: promotion.color }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            {promotion.label}
          </motion.p>
        )}

        <div className="levelup-xp-row">
          <span className="levelup-xp-prev">{data.xp_before.toLocaleString()} XP</span>
          <span className="levelup-xp-arrow">→</span>
          <span className="levelup-xp-next">{data.xp_after.toLocaleString()} XP</span>
        </div>

        <p className="levelup-sub">New missions are being forged by the System...</p>

        <button className="glow-btn levelup-arise" onClick={onDismiss}>
          ARISE →
        </button>
      </motion.div>
    </motion.div>
  );
}
```

### 15.2 XPFloatLayer — Floating XP Numbers

```jsx
// src/components/training/XPFloatLayer.jsx
import { useEffect }               from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHunterStore }          from '../../stores/hunterStore';

export function XPFloatLayer() {
  const floats       = useHunterStore(s => s.pendingXPFloats);
  const dismissFloat = useHunterStore(s => s.dismissXPFloat);

  return (
    <div className="xp-float-layer" aria-hidden="true">
      <AnimatePresence>
        {floats.map(f => (
          <motion.div
            key={f.id}
            className="xp-float"
            style={{ left: f.x, top: f.y }}
            initial={{ opacity: 0, y: 0,   scale: 0.7 }}
            animate={{ opacity: 1, y: -60, scale: 1.1 }}
            exit={{ opacity: 0, y: -120, scale: 0.9 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            onAnimationComplete={() => dismissFloat(f.id)}
          >
            +{f.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### 15.3 NewBadgeToast

```jsx
// src/components/training/NewBadgeToast.jsx
import { useEffect }               from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHunterStore }          from '../../stores/hunterStore';

export function NewBadgeToast() {
  const toasts      = useHunterStore(s => s.toasts);
  const removeToast = useHunterStore(s => s.removeToast);

  return (
    <div className="toast-layer">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <span className="toast__msg">{toast.message}</span>
            <button
              className="toast__close"
              onClick={() => removeToast(toast.id)}
            >×</button>
            {/* Auto-dismiss */}
            <AutoDismiss id={toast.id} delay={6000} onDismiss={removeToast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AutoDismiss({ id, delay, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), delay);
    return () => clearTimeout(t);
  }, [id, delay, onDismiss]);
  return null;
}
```

---

## 16. AGENTIC BADGE ENGINE — FULL SERVER IMPLEMENTATION

```js
// api/agent/run.js  — Vercel Edge Function
import Anthropic    from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Rate limit: max 1 agent run per user per 10 minutes ──
const RATE_LIMIT_MINUTES = 10;

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { userId, trigger } = await req.json();
  if (!userId || !trigger) return Response.json({ error: 'Missing params' }, { status: 400 });

  // ── Rate limit check ──
  const { data: recentRun } = await supabase
    .from('agent_runs')
    .select('started_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (recentRun) {
    const minsAgo = (Date.now() - new Date(recentRun.started_at).getTime()) / 60000;
    if (minsAgo < RATE_LIMIT_MINUTES && trigger !== 'initial_setup') {
      return Response.json({
        success: false,
        reason:  'rate_limited',
        retry_after_mins: Math.ceil(RATE_LIMIT_MINUTES - minsAgo),
      });
    }
  }

  // ── Fetch profile + active goals ──
  const [{ data: profile }, { data: goals }] = await Promise.all([
    supabase.from('hunter_profiles').select('*').eq('id', userId).single(),
    supabase.from('hunter_goals').select('*').eq('user_id', userId).eq('is_active', true),
  ]);

  if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

  // ── Fetch existing badge titles (avoid duplicates) ──
  const { data: existingBadges } = await supabase
    .from('badges')
    .select('title, rank, status')
    .eq('user_id', userId);

  // ── Create agent run record ──
  const prompt = buildPrompt({ profile, goals: goals ?? [], existingBadges: existingBadges ?? [], trigger });

  const { data: run } = await supabase.from('agent_runs').insert({
    user_id:          userId,
    trigger_reason:   trigger,
    level_at_run:     profile.level,
    goals_snapshot:   goals,
    profile_snapshot: { level: profile.level, class: profile.class, years_exp: profile.years_exp },
    prompt_sent:      prompt,
    status:           'running',
  }).select().single();

  const startTime = Date.now();

  try {
    // ── Call Claude ──
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 4096,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].text.trim();

    // ── Parse Claude's JSON response ──
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Try stripping markdown fences if Claude accidentally added them
      const clean = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      parsed = JSON.parse(clean);
    }

    let badgesCreated = 0;
    let videosCreated = 0;

    // ── Persist each badge + its learning path ──
    for (const badge of parsed.badges) {
      const { data: newBadge } = await supabase.from('badges').insert({
        user_id:          userId,
        title:            badge.title,
        description:      badge.description,
        icon_emoji:       badge.icon_emoji,
        rank:             badge.rank,
        category:         badge.category,
        color_hex:        badge.color_hex,
        xp_reward:        badge.xp_reward,
        agent_rationale:  badge.rationale,
        agent_run_id:     run.id,
        videos_total:     badge.learning_path.length,
        proof_required:   badge.category === 'tech_skill' || badge.category === 'soft_skill',
      }).select().single();

      badgesCreated++;

      // ── Fetch YouTube metadata for each video & insert ──
      for (let i = 0; i < badge.learning_path.length; i++) {
        const v   = badge.learning_path[i];
        const ytId = extractYouTubeId(v.url);
        const meta = ytId ? await fetchYouTubeMeta(ytId) : null;
        const durSec = meta?.durationSeconds ?? 0;

        await supabase.from('learning_paths').insert({
          badge_id:         newBadge.id,
          user_id:          userId,
          youtube_url:      v.url,
          youtube_id:       ytId ?? '',
          title:            meta?.title        ?? v.title,
          channel_name:     meta?.channelTitle ?? '',
          duration_seconds: durSec,
          duration_label:   meta?.durationLabel ?? '',
          thumbnail_url:    meta?.thumbnail ?? '',
          xp_value:         calcXPForDuration(durSec),
          sequence_order:   i + 1,
          why_this_video:   v.why,
        });

        videosCreated++;
      }
    }

    const duration = Date.now() - startTime;

    // ── Update agent run record ──
    await supabase.from('agent_runs').update({
      status:          'completed',
      raw_response:    rawText,
      badges_created:  badgesCreated,
      videos_created:  videosCreated,
      duration_ms:     duration,
      completed_at:    new Date().toISOString(),
    }).eq('id', run.id);

    // ── Update profile agent metadata ──
    await supabase.from('hunter_profiles').update({
      agent_last_run: new Date().toISOString(),
      agent_version:  profile.agent_version + 1,
    }).eq('id', userId);

    return Response.json({ success: true, badgesCreated, videosCreated });

  } catch (err) {
    await supabase.from('agent_runs').update({
      status:        'failed',
      error_message: err.message,
      duration_ms:   Date.now() - startTime,
    }).eq('id', run.id);

    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}


// ── System Prompt ──
const SYSTEM_PROMPT = `
You are the Solo Leveling SYSTEM AI — an intelligent career development agent.
Your purpose: analyze a hunter's (developer's) profile and goals, then generate
personalized badge missions with curated YouTube learning paths.

ABSOLUTE RULES:
1. Respond ONLY with valid JSON — zero preamble, zero markdown fences, zero explanation.
2. Generate exactly 3-5 badges. Never more, never less.
3. Every YouTube URL must be a real, verifiable video. Do not invent URLs.
4. Each learning path must contain 3-6 YouTube videos, ordered from foundation to advanced.
5. Never duplicate a badge title from the "EXISTING BADGES" list.
6. XP values must be proportional: harder/longer content = more XP.
7. Personalize rationale to the specific user — reference their company, projects, and experience.

RESPONSE SCHEMA (strict):
{
  "badges": [
    {
      "title":         "string — max 40 chars, clear skill name",
      "description":   "string — 1-2 sentences, why this badge for THIS user",
      "icon_emoji":    "string — single relevant emoji",
      "rank":          "E" | "D" | "C" | "B" | "A" | "S",
      "category":      "tech_skill" | "soft_skill" | "domain" | "leadership" | "certification",
      "color_hex":     "string — #rrggbb matching rank/theme",
      "xp_reward":     number (200–3000),
      "rationale":     "string — system assessment for the user",
      "learning_path": [
        {
          "url":   "full YouTube URL (must be real)",
          "title": "video title",
          "why":   "1 sentence: why this specific video for this badge"
        }
      ]
    }
  ]
}

RANK ASSIGNMENT GUIDE:
- E: Foundational gaps, refresh basics
- D: Core skills at junior/mid level
- C: Intermediate skills to fill gaps
- B: Advanced skills for senior trajectory  
- A: Expert-level for lead/architect track
- S: Elite, rare, globally differentiating (max 1 per run, only if hunter level >= 15)
`.trim();


// ── Prompt Builder ──
function buildPrompt({ profile, goals, existingBadges, trigger }) {
  const byCategory = goals.reduce((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push({ value: g.value, priority: g.priority });
    return acc;
  }, {});

  const activeCount    = existingBadges.filter(b => b.status === 'active').length;
  const completedCount = existingBadges.filter(b => b.status === 'completed').length;
  const existingTitles = existingBadges.map(b => `${b.title} (${b.rank}, ${b.status})`);

  const levelUpContext = trigger === 'level_up' ? `
⚠️ LEVEL UP TRIGGERED — GENERATE HARDER CONTENT:
The hunter just reached Level ${profile.level}. Previous missions were appropriate for Level ${profile.level - 1}.
NOW generate missions that push further: more complex, more advanced, closer to their designation goals.
Include at least one badge of rank ${profile.level >= 30 ? 'A' : profile.level >= 15 ? 'B or higher' : 'C or higher'}.
` : '';

  return `${levelUpContext}
HUNTER PROFILE:
- Level: ${profile.level} | Class: ${profile.class}-Rank
- Current Role: ${profile.current_role} at ${profile.current_company}
- Experience: ${profile.years_exp} years
- Tech Stack: ${profile.tech_skills?.join(', ')}
- Soft Skills: ${profile.soft_skills?.join(', ')}
- Summary: ${profile.resume_summary}

GOALS (priority: 1=High, 2=Med, 3=Low):
${Object.entries(byCategory).map(([cat, items]) =>
  `  ${cat.toUpperCase()}: ${items.map(i => `${i.value}[P${i.priority}]`).join(', ')}`
).join('\n')}

EXISTING BADGES (${activeCount} active, ${completedCount} completed — DO NOT REPEAT):
${existingTitles.join('\n') || 'None yet'}

Generate the next ${activeCount < 2 ? '5' : '3'} badge missions.
The missions must build a career ladder from their current position
toward: ${byCategory.designation?.map(g => g.value).join(', ') || 'senior engineering leadership'}.

Respond with ONLY the JSON object. No other text.
`.trim();
}


// ── Helpers ──
function extractYouTubeId(url) {
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

async function fetchYouTubeMeta(videoId) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos`
      + `?part=snippet,contentDetails`
      + `&id=${videoId}`
      + `&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    const dur   = item.contentDetails.duration; // ISO 8601 e.g. PT1H23M45S
    const secs  = parseISO8601(dur);
    const mins  = Math.round(secs / 60);
    const label = mins >= 60
      ? `${Math.floor(mins/60)}h ${mins%60}m`
      : `${mins}m`;

    return {
      title:           item.snippet.title,
      channelTitle:    item.snippet.channelTitle,
      thumbnail:       item.snippet.thumbnails?.high?.url,
      durationSeconds: secs,
      durationLabel:   label,
    };
  } catch { return null; }
}

function parseISO8601(dur) {
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1]??0)*3600) + (+(m[2]??0)*60) + +(m[3]??0);
}

function calcXPForDuration(seconds) {
  const mins = seconds / 60;
  if (mins > 60)  return 400;
  if (mins > 30)  return 250;
  if (mins > 15)  return 150;
  return 75;
}
```

---

## 17. XP AWARD EDGE FUNCTIONS

### 17.1 `/api/xp/video`

```js
// api/xp/video.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { userId, videoId, badgeId, xpAmount, videoTitle } = await req.json();

  // ── Idempotency check ──
  const { data: video } = await supabase
    .from('learning_paths')
    .select('watch_status')
    .eq('id', videoId)
    .single();

  if (video?.watch_status === 'completed') {
    return Response.json({ success: false, reason: 'already_completed' });
  }

  // ── Mark video complete ──
  await supabase.from('learning_paths').update({
    watch_status:        'completed',
    watch_completed_at:  new Date().toISOString(),
  }).eq('id', videoId);

  // ── Award XP atomically ──
  const { data: xpResult, error } = await supabase.rpc('award_xp', {
    p_user_id:     userId,
    p_amount:      xpAmount,
    p_source_type: 'video_watch',
    p_source_id:   badgeId,
    p_label:       `Watched: ${videoTitle}`,
  });

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  // ── Update badge progress counter ──
  await supabase.rpc('increment', {  // use raw SQL update instead:
  });
  await supabase.from('badges')
    .update({
      videos_watched:  supabase.rpc('badges_watched_increment'),  // workaround:
    });
  // Simpler approach — just run a raw increment:
  await supabase.from('badges')
    .update({ xp_from_videos: supabase.sql`xp_from_videos + ${xpAmount}` })
    .eq('id', badgeId);

  // ── If leveled up, fire agent asynchronously ──
  if (xpResult?.leveled_up) {
    fetch(`${process.env.VERCEL_URL}/api/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, trigger: 'level_up' }),
    }).catch(() => {}); // fire-and-forget
  }

  return Response.json({ success: true, ...xpResult });
}
```

> **Note on badge counter increment:** Supabase doesn't support server-side arithmetic directly in the JS client. Use a small stored procedure:

```sql
-- Add to your SQL migrations:
CREATE OR REPLACE FUNCTION public.increment_badge_videos(p_badge_id UUID, p_xp INTEGER)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE badges
  SET videos_watched = videos_watched + 1,
      xp_from_videos = xp_from_videos + p_xp
  WHERE id = p_badge_id;
$$;
```

Then call: `await supabase.rpc('increment_badge_videos', { p_badge_id: badgeId, p_xp: xpAmount })`

### 17.2 `/api/xp/proof`

```js
// api/xp/proof.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { userId, badgeId, proofUrl, badgeTitle } = await req.json();

  // ── Idempotency check ──
  const { data: badge } = await supabase
    .from('badges')
    .select('proof_submitted, videos_total, videos_watched, status')
    .eq('id', badgeId)
    .single();

  if (badge?.proof_submitted) {
    return Response.json({ success: false, reason: 'proof_already_submitted' });
  }

  // ── Award proof XP (+300 flat) ──
  const { data: xpResult } = await supabase.rpc('award_xp', {
    p_user_id:     userId,
    p_amount:      300,
    p_source_type: 'proof_submit',
    p_source_id:   badgeId,
    p_label:       `Proof submitted: ${badgeTitle}`,
  });

  // ── Check if badge is now completable ──
  const allWatched    = badge.videos_watched >= badge.videos_total;
  const badgeComplete = allWatched; // proof just submitted = both conditions met

  let badgeCompletionResult = null;

  if (badgeComplete && badge.status === 'active') {
    const { data } = await supabase.rpc('complete_badge', {
      p_badge_id: badgeId,
      p_user_id:  userId,
    });
    badgeCompletionResult = data;
  }

  // ── Fire agent if level-up occurred from badge completion ──
  const leveledUp = xpResult?.leveled_up || badgeCompletionResult?.xp_result?.leveled_up;
  if (leveledUp) {
    fetch(`${process.env.VERCEL_URL}/api/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, trigger: 'level_up' }),
    }).catch(() => {});
  }

  return Response.json({
    success:         true,
    badge_completed: badgeComplete,
    xp_result:       xpResult,
    leveled_up:      leveledUp ?? false,
  });
}
```

---

## 18. LEVEL-UP AGENT RE-TRIGGER SYSTEM

### Trigger Points (all fire-and-forget, non-blocking)

| Where | When | Trigger value |
|---|---|---|
| `AuthContext.createInitialProfile` | First login ever | `initial_setup` |
| `GoalsEditor.handleSaveAndRunAgent` | User saves new goals | `goals_changed` |
| `api/xp/video.js` | `xpResult.leveled_up === true` | `level_up` |
| `api/xp/proof.js` | Badge completes and causes level-up | `level_up` |
| Manual (future) | User clicks "Refresh Missions" button | `manual` |

### Agent Scaling by Level

The `buildPrompt` function escalates difficulty per level:

```
Level 1-4  (E-Class): Foundation — core skill gaps from resume, beginner videos OK
Level 5-9  (D-Class): Building — intermediate concepts, 1x B-rank badge per run
Level 10-19(C-Class): Advancing — senior engineering patterns, system design
Level 20-29(B-Class): Specialized — architecture, leadership, cloud-native
Level 30-49(A-Class): Expert — distributed systems, team leadership, OSS contribution
Level 50+  (S-Class): Elite — 1x S-rank per run, global-standard content only
```

---

## 19. REALTIME SUBSCRIPTIONS

```js
// src/hooks/training/useBadgesRealtime.js
import { useEffect }         from 'react';
import { supabase }          from '../../lib/supabase';
import { useHunterStore }    from '../../stores/hunterStore';

export function useBadgesRealtime(userId) {
  const setBadges = useHunterStore(s => s.setBadges);
  const addBadge  = useHunterStore(s => s.addBadge);
  const addToast  = useHunterStore(s => s.addToast);

  // ── Initial load ──
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setBadges(data ?? []));
  }, [userId, setBadges]);

  // ── Realtime: new badge inserted (from agent run) ──
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`badges-insert-${userId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'badges',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        addBadge(payload.new);
        addToast({
          type:    'new_mission',
          message: `⚔️ NEW MISSION: ${payload.new.title} (${payload.new.rank}-Rank)`,
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, addBadge, addToast]);
}
```

---

## 20. ALL CUSTOM HOOKS

```js
// src/hooks/training/useXPToday.js
import { useQuery }    from '@tanstack/react-query';
import { supabase }    from '../../lib/supabase';

export function useXPToday(userId) {
  const { data: xpToday = 0 } = useQuery({
    queryKey: ['xp-today', userId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('xp_transactions')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00Z`)
        .gt('amount', 0);
      return data?.reduce((s, t) => s + t.amount, 0) ?? 0;
    },
    enabled:        !!userId,
    refetchInterval: 30_000,
  });
  return { xpToday };
}


// src/hooks/training/useStreak.js
import { useHunterStore } from '../../stores/hunterStore';
export function useStreak() {
  const profile = useHunterStore(s => s.profile);
  return { streak: profile?.streak_current ?? 0 };
}


// src/hooks/training/useStreakCheck.js
import { useEffect } from 'react';
import { supabase }  from '../../lib/supabase';

export function useStreakCheck(userId) {
  useEffect(() => {
    if (!userId) return;
    // Call Postgres function to update streak (runs once per session)
    supabase.rpc('get_streak', { p_user_id: userId }).then(({ data }) => {
      if (data !== null) {
        // Update store via supabase profile refetch handled by AuthContext
      }
    });
  }, [userId]);
}


// src/hooks/training/useAgentStatus.js
import { useQuery }    from '@tanstack/react-query';
import { supabase }    from '../../lib/supabase';

export function useAgentStatus(userId) {
  return useQuery({
    queryKey: ['agent-status', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('agent_runs')
        .select('status, started_at, badges_created, trigger_reason')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!userId,
    refetchInterval: 5_000,  // poll every 5s while agent might be running
  });
}
```

---

## 21. COMPLETE CSS — TRAINING PAGE

```css
/* src/styles/training.css */
/* ── Imports all Solo Leveling design tokens from globals.css ── */

/* ══════════════════════════════════════
   PAGE SHELL
══════════════════════════════════════ */
.training-page {
  min-height: 100vh;
  background: var(--color-abyss);
}

.training-main {
  max-width: 900px;
  margin: 0 auto;
  padding: calc(var(--topbar-height) + var(--space-8)) var(--space-8) var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.training-section { display: flex; flex-direction: column; gap: var(--space-4); }

/* ══════════════════════════════════════
   HUNTER STATS BAR
══════════════════════════════════════ */
.hunter-stats-bar {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.hsb-identity {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.hsb-level {
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 28px;
  color: #fff;
  letter-spacing: -0.02em;
}
.hsb-class-badge {
  font-family: var(--font-system);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.2em;
  padding: 3px 10px;
  border: 1px solid currentColor;
  border-radius: 2px;
}
.hsb-title {
  font-family: var(--font-system);
  font-size: 13px;
  letter-spacing: 0.12em;
  color: var(--color-text-secondary);
  flex: 1;
}
.hsb-company {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}

/* XP bar */
.hsb-xp-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.hsb-xp-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--color-text-muted);
  flex-shrink: 0;
  width: 22px;
}
.hsb-xp-track {
  flex: 1;
  height: 8px;
  background: rgba(74, 158, 255, 0.1);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}
.hsb-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #1E6FE8, #4A9EFF, #7B4FFF);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
}
.hsb-xp-milestone {
  position: absolute;
  top: 0; bottom: 0;
  width: 1px;
  background: rgba(255,255,255,0.15);
  transform: translateX(-50%);
}
.hsb-xp-milestone--passed { background: rgba(74, 158, 255, 0.5); }
.hsb-xp-numbers {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  white-space: nowrap;
}
.hsb-xp-sep { color: var(--color-text-muted); }

/* Stat cards */
.hsb-stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}
.hsb-stat-card {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hsb-stat-label {
  font-family: var(--font-system);
  font-size: 9px;
  letter-spacing: 0.22em;
  color: var(--color-text-muted);
}
.hsb-stat-value {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
}
.hsb-stat-sub {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--color-text-muted);
}

/* ══════════════════════════════════════
   GOALS EDITOR
══════════════════════════════════════ */
.goals-editor {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.goals-editor__header { display: flex; flex-direction: column; gap: var(--space-1); }
.panel-subtitle {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}
.goals-grid { display: flex; flex-direction: column; gap: var(--space-4); }
.goals-category { display: flex; flex-direction: column; gap: var(--space-2); }
.goals-category__label {
  font-family: var(--font-system);
  font-size: 10px;
  letter-spacing: 0.22em;
  color: var(--color-text-muted);
}
.goals-category__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}
.goal-chip {
  font-family: var(--font-system);
  font-size: 12px;
  letter-spacing: 0.1em;
  padding: 4px 12px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
  background: var(--color-dungeon);
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: default;
}
.goal-chip--p1 { border-color: rgba(255,68,68,0.5);  color: #FFAAAA; }
.goal-chip--p2 { border-color: rgba(255,215,0,0.4);  color: #FFE87A; }
.goal-chip--p3 { border-color: var(--color-border);  }
.goal-chip--add {
  border-style: dashed;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: border-color 0.2s, color 0.2s;
}
.goal-chip--add:hover { border-color: var(--color-system-400); color: var(--color-system-400); }
.goal-chip__remove {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted); padding: 0;
  font-size: 15px; line-height: 1;
  transition: color 0.15s;
}
.goal-chip__remove:hover { color: #FF4444; }
.goal-add-row {
  display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;
}
.goal-add-input {
  background: rgba(4,11,26,0.8);
  border: 1px solid var(--color-system-400);
  border-radius: 3px;
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-primary);
  width: 200px;
}
.goal-add-input:focus { outline: none; box-shadow: 0 0 8px var(--color-system-glow); }
.goal-priority-row { display: flex; gap: var(--space-1); }
.priority-btn {
  font-family: var(--font-system);
  font-size: 10px;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: none;
  color: var(--color-text-muted);
  border-radius: 2px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.priority-btn--active { border-color: var(--p-color); color: var(--p-color); }
.goal-add-confirm {
  font-family: var(--font-system);
  font-size: 11px;
  letter-spacing: 0.1em;
  padding: 4px 12px;
  background: rgba(30,111,232,0.2);
  border: 1px solid var(--color-system-400);
  color: var(--color-system-100);
  border-radius: 3px;
  cursor: pointer;
}
.goals-save-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: rgba(30,111,232,0.08);
  border: 1px solid rgba(74,158,255,0.3);
  border-radius: 4px;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.goals-save-hint {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-system-400);
}

/* ══════════════════════════════════════
   BADGE MISSION CARDS
══════════════════════════════════════ */
.badge-card {
  margin-bottom: 0;
  overflow: hidden;
  border-color: rgba(var(--rank-color), 0.2);
}
.badge-card__header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}
.badge-card__header:hover { background: rgba(255,255,255,0.02); }
.badge-card__icon { font-size: 2rem; flex-shrink: 0; }
.badge-card__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.badge-card__title {
  font-family: var(--font-system);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.08em;
  color: var(--color-text-primary);
}
.badge-card__desc {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-muted);
}
.badge-card__meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.badge-card__rank {
  font-family: var(--font-system);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.18em;
  padding: 2px 8px;
  border: 1px solid currentColor;
  border-radius: 2px;
}
.badge-card__xp-reward {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #00CC44;
}
.badge-card__chevron {
  font-size: 11px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.badge-card__progress-track {
  height: 3px;
  background: rgba(255,255,255,0.05);
  position: relative;
}
.badge-card__progress-fill {
  height: 100%;
  background: var(--rank-color, #4A9EFF);
  box-shadow: 0 0 6px var(--rank-color, #4A9EFF);
}
.badge-card__progress-label {
  position: absolute;
  right: var(--space-4);
  top: 4px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.badge-card__body-inner {
  padding: var(--space-4) var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.badge-card__rationale {
  padding: var(--space-3) var(--space-4);
  background: rgba(74,158,255,0.04);
  border-left: 2px solid rgba(74,158,255,0.3);
  border-radius: 2px;
}
.badge-card__rationale-label {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--color-text-muted);
  letter-spacing: 0.15em;
  display: block;
  margin-bottom: var(--space-1);
}
.badge-card__rationale p {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

/* ══════════════════════════════════════
   LEARNING PATH LIST
══════════════════════════════════════ */
.lpl-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}
.lpl-title {
  font-family: var(--font-system);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.22em;
  color: var(--color-text-primary);
}
.lpl-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-muted);
}
.lpl-proof-hint {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-system-400);
}
.lpl-videos { display: flex; flex-direction: column; gap: var(--space-2); }

/* ══════════════════════════════════════
   VIDEO ITEMS
══════════════════════════════════════ */
.video-item {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.video-item--in_progress { border-color: rgba(74,158,255,0.45); }
.video-item--completed   { border-color: rgba(0,204,68,0.35); background: rgba(0,204,68,0.025); }
.video-item--locked      { opacity: 0.45; }

.vi-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: background 0.2s;
}
.vi-row:hover:not([aria-disabled="true"]) { background: rgba(255,255,255,0.025); }
.vi-seq {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  width: 22px;
}
.vi-status { font-size: 14px; flex-shrink: 0; width: 18px; }
.vi-thumb {
  width: 60px;
  height: 34px;
  object-fit: cover;
  border-radius: 2px;
  flex-shrink: 0;
}
.vi-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vi-title {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vi-meta {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-muted);
}
.vi-why {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(74,158,255,0.6);
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vi-right { display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0; }
.vi-xp {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}
.vi-xp--earned { color: #00CC44; }
.vi-chevron { font-size: 10px; color: var(--color-text-muted); }
.vi-embed { padding: var(--space-3) var(--space-4) var(--space-4); position: relative; }
.vi-player { width: 100% !important; border-radius: 3px; display: block; }
.vi-xp-overlay, .vi-complete-bar {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(4,11,26,0.85);
  text-align: center;
  padding: var(--space-2);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.12em;
}
.vi-xp-overlay { color: #4A9EFF; }
.vi-complete-bar { color: #00CC44; }

/* ══════════════════════════════════════
   PROOF BOX
══════════════════════════════════════ */
.proof-box {
  padding: var(--space-4);
  margin-top: var(--space-2);
}
.proof-box--locked { opacity: 0.5; pointer-events: none; filter: grayscale(0.5); }
.proof-box__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
  gap: var(--space-2);
}
.proof-box__title {
  font-family: var(--font-system);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.15em;
  color: var(--color-text-primary);
}
.proof-box__lock {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}
.proof-box__done {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: rgba(0,204,68,0.06);
  border: 1px solid rgba(0,204,68,0.3);
  border-radius: 4px;
}
.proof-box__done-icon { font-size: 1.4rem; color: #00CC44; }
.proof-box__done-label {
  font-family: var(--font-system);
  font-size: 12px;
  letter-spacing: 0.15em;
  color: #00CC44;
  display: block;
}
.proof-box__done-link {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-system-400);
  text-decoration: none;
  word-break: break-all;
}
.proof-box__done-link:hover { text-decoration: underline; }
.proof-form { display: flex; flex-direction: column; gap: var(--space-4); }
.proof-form__field { display: flex; flex-direction: column; gap: var(--space-2); }
.proof-form__label {
  font-family: var(--font-system);
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--color-text-muted);
}
.proof-form__input, .proof-form__textarea {
  width: 100%;
  background: rgba(4,11,26,0.85);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;
}
.proof-form__input:focus,
.proof-form__textarea:focus {
  outline: none;
  border-color: var(--color-system-400);
  box-shadow: 0 0 12px var(--color-system-glow);
}
.proof-form__error {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #FF5555;
  display: block;
}
.proof-form__hint {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-muted);
}
.proof-form__submit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.proof-form__xp-note {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #00CC44;
}

/* ══════════════════════════════════════
   COMPLETED VAULT
══════════════════════════════════════ */
.vault { padding: var(--space-5); }
.vault__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}
.vault__total {
  font-family: var(--font-system);
  font-size: 12px;
  letter-spacing: 0.18em;
  color: var(--color-text-secondary);
}
.vault__rank-row { display: flex; gap: var(--space-3); }
.vault__rank-count {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
}
.vault__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: var(--space-3);
}
.vault-badge {
  background: var(--color-dungeon);
  border: 1px solid var(--rank-color, var(--color-border));
  border-radius: 4px;
  padding: var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  position: relative;
  box-shadow: 0 0 16px color-mix(in srgb, var(--rank-color, #4A9EFF) 20%, transparent);
}
.vault-badge__icon   { font-size: 1.8rem; }
.vault-badge__title  { font-family: var(--font-system); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: var(--color-text-primary); text-align: center; }
.vault-badge__rank   { font-family: var(--font-mono); font-size: 9px; color: var(--rank-color, var(--color-text-muted)); letter-spacing: 0.1em; }
.vault-badge__link   { position: absolute; top: 6px; right: 8px; font-size: 12px; color: var(--color-text-muted); text-decoration: none; }
.vault-badge__link:hover { color: var(--color-system-400); }

/* ══════════════════════════════════════
   LEVEL-UP OVERLAY
══════════════════════════════════════ */
.levelup-overlay {
  position: fixed; inset: 0;
  z-index: 9999;
  background: rgba(4,11,26,0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}
.levelup-panel {
  text-align: center;
  padding: var(--space-12) var(--space-16);
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  position: relative;
  z-index: 2;
}
.levelup-flash { font-size: 3rem; filter: drop-shadow(0 0 20px #4A9EFF); }
.levelup-label {
  font-family: var(--font-system);
  letter-spacing: 0.45em;
  color: var(--color-text-secondary);
  font-size: 12px;
}
.levelup-number {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.levelup-number__prev {
  font-family: 'Exo 2', sans-serif;
  font-weight: 900;
  font-size: 2.5rem;
  color: var(--color-text-muted);
}
.levelup-number__arrow { color: var(--color-text-muted); font-size: 1.5rem; }
.levelup-number__new {
  font-family: 'Exo 2', sans-serif;
  font-weight: 900;
  font-size: 5rem;
  color: #fff;
  line-height: 1;
  text-shadow: 0 0 50px rgba(74,158,255,0.7);
}
.levelup-rank {
  font-family: var(--font-system);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.12em;
  margin: 0;
}
.levelup-xp-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
}
.levelup-xp-next { color: #00CC44; font-weight: 700; }
.levelup-sub {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}
.levelup-arise { min-width: 160px; }

/* Particle burst */
.levelup-particles {
  position: absolute; inset: 0;
  pointer-events: none;
  display: flex; align-items: center; justify-content: center;
}
.levelup-particle {
  position: absolute;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color, #4A9EFF);
  animation: particle-burst 1.2s var(--delay, 0s) ease-out forwards;
  transform-origin: center;
}
@keyframes particle-burst {
  0%   { transform: rotate(var(--angle)) translateY(0) scale(1); opacity: 1; }
  100% { transform: rotate(var(--angle)) translateY(-180px) scale(0); opacity: 0; }
}

/* ══════════════════════════════════════
   XP FLOAT LAYER
══════════════════════════════════════ */
.xp-float-layer {
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: 1000;
}
.xp-float {
  position: absolute;
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: #00CC44;
  text-shadow: 0 0 14px #00CC44;
  pointer-events: none;
  white-space: nowrap;
}

/* ══════════════════════════════════════
   TOAST LAYER
══════════════════════════════════════ */
.toast-layer {
  position: fixed;
  bottom: var(--space-8);
  right: var(--space-8);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 360px;
}
.toast {
  background: var(--color-dungeon);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  box-shadow: var(--shadow-panel);
}
.toast--new_mission { border-color: rgba(74,158,255,0.5); }
.toast--success { border-color: rgba(0,204,68,0.5); }
.toast--error   { border-color: rgba(255,85,85,0.5); }
.toast--badge   { border-color: rgba(255,215,0,0.5); }
.toast__msg {
  font-family: var(--font-system);
  font-size: 13px;
  color: var(--color-text-primary);
  flex: 1;
  letter-spacing: 0.06em;
}
.toast__close {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted); font-size: 18px; padding: 0; line-height: 1;
}
.toast__close:hover { color: var(--color-text-primary); }

/* ══════════════════════════════════════
   EMPTY STATES
══════════════════════════════════════ */
.missions-empty, .vault-empty {
  padding: var(--space-12);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
.missions-empty__icon, .vault-empty__icon { font-size: 3rem; opacity: 0.4; }
.missions-empty__title {
  font-family: var(--font-system);
  font-size: 14px;
  letter-spacing: 0.2em;
  color: var(--color-text-secondary);
}
.missions-empty__sub, .vault-empty p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-muted);
  max-width: 360px;
}

/* ══════════════════════════════════════
   AGENT STATUS BAR
══════════════════════════════════════ */
.agent-status-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: rgba(4,11,26,0.5);
}
.agent-status-bar--running { border-color: rgba(74,158,255,0.4); background: rgba(30,111,232,0.06); }
.agent-status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.agent-status-dot--idle    { background: var(--color-text-muted); }
.agent-status-dot--running { background: #4A9EFF; animation: pulse-dot 1s ease-in-out infinite; }
.agent-status-dot--done    { background: #00CC44; }
.agent-status-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  flex: 1;
}
.agent-status-bar--running .agent-status-label { color: var(--color-system-400); }

/* ══════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════ */
@media (max-width: 768px) {
  .training-main { padding: calc(var(--topbar-height) + var(--space-4)) var(--space-4) var(--space-12); }
  .hsb-stat-cards { grid-template-columns: repeat(2, 1fr); }
  .vault__grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  .toast-layer { bottom: var(--space-4); right: var(--space-4); left: var(--space-4); max-width: none; }
  .levelup-panel { padding: var(--space-8); }
  .levelup-number__new { font-size: 3.5rem; }
  .vi-thumb { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .hsb-xp-fill, .badge-card__progress-fill { transition: none !important; }
  .levelup-particle { animation: none !important; }
  .xp-float, .levelup-panel { animation: none !important; }
}
```

---

## 22. LOGIN PAGE

```jsx
// src/pages/Login.jsx
import { useState }       from 'react';
import { useNavigate }    from 'react-router-dom';
import { motion }         from 'framer-motion';
import { supabase }       from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState('login'); // 'login' | 'signup'

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) { setError(error.message); setLoading(false); }
    else navigate('/training');
  };

  const handleGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/training` },
    });
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-blob login-blob--blue" />
        <div className="login-blob login-blob--purple" />
      </div>

      <motion.div
        className="login-panel system-panel"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="login-panel__header">
          <span className="login-panel__tag">// SYSTEM ACCESS</span>
          <h1 className="login-panel__title">HUNTER IDENTIFICATION REQUIRED</h1>
        </div>

        {error && (
          <div className="login-error">⚠ {error}</div>
        )}

        <form className="login-form" onSubmit={handleEmailAuth}>
          <div className="login-field">
            <label className="login-label">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="login-input"
              placeholder="hunter@example.com"
              required
            />
          </div>
          <div className="login-field">
            <label className="login-label">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="login-input"
              placeholder="••••••••••"
              required
            />
          </div>
          <button type="submit" className="glow-btn login-submit" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'ENTER THE GATE →' : 'REGISTER HUNTER →'}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>

        <button className="login-github" onClick={handleGitHub}>
          <span>⬡</span> AUTHENTICATE WITH GITHUB GUILD
        </button>

        <button
          className="login-mode-toggle"
          onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? 'New hunter? Register here' : 'Already registered? Log in'}
        </button>
      </motion.div>
    </div>
  );
}
```

```css
/* Add to training.css or a login.css file */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-void);
  position: relative;
  overflow: hidden;
}
.login-bg { position: absolute; inset: 0; pointer-events: none; }
.login-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}
.login-blob--blue   { width: 400px; height: 400px; top: 10%; left: 10%; background: radial-gradient(circle, rgba(30,80,200,0.2) 0%, transparent 70%); }
.login-blob--purple { width: 500px; height: 500px; bottom: 10%; right: 5%;  background: radial-gradient(circle, rgba(100,40,180,0.18) 0%, transparent 70%); }

.login-panel {
  width: 100%;
  max-width: 420px;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  position: relative;
  z-index: 1;
}
.login-panel__tag   { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: var(--color-text-muted); }
.login-panel__title { font-family: var(--font-system); font-size: 14px; letter-spacing: 0.18em; color: var(--color-text-primary); margin: var(--space-1) 0 0; }
.login-error        { padding: var(--space-2) var(--space-3); background: rgba(255,85,85,0.1); border: 1px solid rgba(255,85,85,0.4); border-radius: 3px; font-family: var(--font-mono); font-size: 12px; color: #FF8888; }
.login-form         { display: flex; flex-direction: column; gap: var(--space-4); }
.login-field        { display: flex; flex-direction: column; gap: var(--space-2); }
.login-label        { font-family: var(--font-system); font-size: 10px; letter-spacing: 0.22em; color: var(--color-text-muted); }
.login-input        { background: rgba(4,11,26,0.9); border: 1px solid var(--color-border); border-radius: 3px; padding: var(--space-3); font-family: var(--font-mono); font-size: 13px; color: var(--color-text-primary); }
.login-input:focus  { outline: none; border-color: var(--color-system-400); box-shadow: 0 0 12px var(--color-system-glow); }
.login-submit       { width: 100%; margin-top: var(--space-2); }
.login-divider      { text-align: center; position: relative; }
.login-divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--color-border); }
.login-divider span { position: relative; background: var(--color-dungeon); padding: 0 var(--space-3); font-family: var(--font-mono); font-size: 11px; color: var(--color-text-muted); }
.login-github       { width: 100%; padding: var(--space-3); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); border-radius: 3px; font-family: var(--font-system); font-size: 12px; letter-spacing: 0.15em; color: var(--color-text-secondary); cursor: pointer; transition: background 0.2s, border-color 0.2s; }
.login-github:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.25); }
.login-mode-toggle  { background: none; border: none; cursor: pointer; font-family: var(--font-mono); font-size: 11px; color: var(--color-system-400); text-decoration: underline; }
```

---

## 23. FILE & FOLDER STRUCTURE

```
src/
├── pages/
│   ├── Training.jsx              ← /training (protected)
│   └── Login.jsx                 ← /login
│
├── stores/
│   └── hunterStore.js            ← Zustand global state
│
├── contexts/
│   └── AuthContext.jsx           ← Session + profile hydration
│
├── components/
│   ├── layout/
│   │   └── ProtectedRoute.jsx    ← Auth gate wrapper
│   │
│   └── training/
│       ├── HunterStatsBar.jsx    ← XP bar, level, class, streak
│       ├── GoalsEditor.jsx       ← Goals CRUD + agent trigger
│       ├── AgentStatusBar.jsx    ← Shows agent run status
│       ├── ActiveMissions.jsx    ← Badge list container
│       ├── BadgeMissionCard.jsx  ← Expandable badge card
│       ├── LearningPathList.jsx  ← Video list for a badge
│       ├── VideoItem.jsx         ← YouTube embed + XP logic
│       ├── ProofSubmission.jsx   ← GitHub/YouTube proof form
│       ├── CompletedVault.jsx    ← Completed badges grid
│       ├── LevelUpOverlay.jsx    ← Full-screen level-up
│       ├── XPFloatLayer.jsx      ← Floating +XP numbers
│       └── NewBadgeToast.jsx     ← Slide-in toast system
│
├── hooks/
│   └── training/
│       ├── useBadgesRealtime.js  ← Supabase Realtime badges
│       ├── useXPToday.js         ← Today's XP total
│       ├── useStreak.js          ← Current streak from store
│       ├── useStreakCheck.js     ← Daily streak update
│       └── useAgentStatus.js    ← Latest agent run state
│
├── lib/
│   └── supabase.js               ← Supabase client singleton
│
└── styles/
    └── training.css              ← All training page styles

api/                              ← Vercel Edge Functions
├── agent/
│   └── run.js                    ← Claude badge generator
└── xp/
    ├── video.js                  ← Award XP for video watch
    └── proof.js                  ← Award XP for proof submit
```

---

## 24. BUILD ROADMAP — STEP BY STEP

### Week 1 — Database & Auth
```
Day 1: Create Supabase project. Run all SQL migrations from §4 in order.
Day 2: Set up Supabase Auth. Enable GitHub OAuth in Supabase Dashboard.
Day 3: Build supabase.js, AuthContext.jsx, ProtectedRoute.jsx.
Day 4: Build Login.jsx. Test login → /training redirect. Test profile auto-creation.
Day 5: Verify RLS policies work (try accessing other user's data — should fail).
```

### Week 2 — Store & Stats UI
```
Day 1: Build hunterStore.js (Zustand). Wire into AuthContext.
Day 2: Build HunterStatsBar. Verify XP bar animates on load.
Day 3: Build useXPToday, useStreak, useStreakCheck hooks.
Day 4: Build Training.jsx page shell. Wire Navigation + SystemTopBar.
Day 5: Deploy to Vercel. Verify env vars. Test on staging.
```

### Week 3 — Goals + Agent
```
Day 1: Build GoalsEditor. Test add/remove/save goals.
Day 2: Set up Anthropic API + YouTube API keys in Vercel.
Day 3: Build api/agent/run.js. Test prompt → Claude → JSON parse.
Day 4: Wire YouTube metadata fetch. Test full run: goals → badges → DB.
Day 5: Build useBadgesRealtime. Test Realtime: new badge appears live.
       Build AgentStatusBar + NewBadgeToast.
```

### Week 4 — Video Player + XP
```
Day 1: Build LearningPathList + VideoItem with react-youtube embed.
Day 2: Wire onStateChange → video_ended detection.
Day 3: Build api/xp/video.js. Test: watch video → XP awarded → bar updates.
Day 4: Test idempotency: re-watch same video → XP NOT awarded twice.
Day 5: Build XPFloatLayer. Test floating +XP animation on completion.
       Build LevelUpOverlay. Test level-up detection → overlay shown.
```

### Week 5 — Proof + Completion + Re-trigger
```
Day 1: Build ProofSubmission for tech_skill (GitHub URL).
Day 2: Build ProofSubmission for soft_skill (YouTube URL).
Day 3: Build api/xp/proof.js. Test: proof → badge complete → XP → vault.
Day 4: Test level-up agent re-trigger: level up → new badges appear in 30s.
Day 5: Build CompletedVault. Test full loop: mission → videos → proof → vault.
```

### Week 6 — Polish & Hardening
```
Day 1: Mobile responsiveness pass (all panels stack cleanly on 375px).
Day 2: Error states — agent failure, network errors, form validation.
Day 3: prefers-reduced-motion CSS. Keyboard navigation for all interactive elements.
Day 4: Security audit (§25). Performance: React Query staleTime tuning.
Day 5: End-to-end test: First login → goals set → agent runs → 3 videos watched
       → proof submitted → badge earned → level up → new missions appear.
```

---

## 25. SECURITY CHECKLIST

### Before Going Live — Verify Every Item

```
KEYS & SECRETS
□ SUPABASE_SERVICE_ROLE_KEY is only in server .env, NOT in VITE_* vars
□ ANTHROPIC_API_KEY is only in server .env
□ YOUTUBE_API_KEY is only in server .env
□ No API keys appear in git history (check with: git log --all -p | grep "sk-ant")

DATABASE
□ RLS enabled on ALL 6 tables (run: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public')
□ award_xp() is SECURITY DEFINER — users cannot call it from browser
□ complete_badge() is SECURITY DEFINER
□ xp_transactions INSERT only via server functions — no client INSERT policy
□ agent_runs INSERT only via server — no client INSERT policy

API ROUTES
□ All Edge Functions check req.method === 'POST'
□ award_xp idempotency check: same video cannot earn XP twice
□ proof idempotency check: same badge cannot receive proof twice
□ Agent rate limit: max 1 run per 10 minutes per user
□ YouTube URL regex validation before storing
□ GitHub URL validation (.includes('github.com')) before storing

FRONTEND
□ Protected route redirects unauthenticated users to /login
□ No raw supabase.from('xp_transactions').insert() calls in frontend
□ YouTube embed uses modestbranding + rel=0 (no ads/recommendations)
□ All external links have rel="noopener noreferrer"
```

---

*"The System has chosen you. Now prove you deserve it."*
*The gates are open. Train hard. Level up. Arise.* ⚔️

---
*TRAINING_V2.md | ANTIGRAVITY Portfolio | Companion to ANTIGRAVITY_PORTFOLIO_README.md*
