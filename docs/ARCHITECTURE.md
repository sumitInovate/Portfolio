# CodeAether Architecture

Version: 1.1
Date: April 16, 2026
Mode: Frontend-only

## 1) System Overview

CodeAether is a React + Vite single-page app that stores user, profile, avatar, and training progression data in browser localStorage.

Current runtime characteristics:
- No active backend/API dependency.
- AI generation runs in the frontend using Gemini client SDK.
- Training missions are generated client-side with fallback mission generation when Gemini is unavailable.

## 2) Runtime Topology

- Frontend app: React 19 + Vite
- Client state:
  - React Context: auth, user, audio
  - Zustand: hunter training store
- Persistence:
  - ca_users: auth registry
  - ca_profiles: portfolio and training data
  - ca_avatars: avatar image payloads
- External services (optional):
  - Gemini API for profile/avatar/mission generation
  - CallMeBot for WhatsApp contact relay

## 3) Module Boundaries

### Entry and Routing
- src/main.jsx: app bootstrapping
- src/App.jsx: provider composition and lazy route tree

### Context Providers
- src/context/AuthContext.jsx
  - Username checks, signup/signin/signout, JWT in localStorage + cookie
- src/context/UserContext.jsx
  - Active user profile and avatar loading
- src/context/AudioContext.jsx
  - Ambient audio controls

### Pages
- src/pages/LandingPage.jsx
- src/pages/RegisterPage.jsx
- src/pages/PortfolioPage.jsx
- src/pages/Training.jsx
- src/pages/legal/*.jsx

### Feature Components
- Layout: src/components/layout/*
- Portfolio sections: src/components/sections/*
- Training: src/components/training/*
- Shared UI: src/components/ui/*

### Client AI Layer
- src/utils/geminiAgents.js
  - Agent Alpha (resume -> profile)
  - Agent Beta (photo -> avatar)
- src/utils/training/badgeAgent.js
  - Mission badge generation from hunter goals
  - Deterministic fallback generation when Gemini key/API is unavailable
- src/utils/geminiAgentShared.js
  - Retry, timeout, JSON extraction, shared prompts/utilities

### Data and Persistence
- src/utils/userStorage.js
- src/utils/training/hunterStorage.js
- src/stores/hunterStore.js
- src/data/schema.js
- src/data/users/boilerplate.json

## 4) Key Flows

### Registration
1. User enters credentials in RegisterPage.
2. AuthContext creates account and session.
3. Resume + photo are converted to base64.
4. Agent Alpha builds profile JSON.
5. Agent Beta builds avatar image.
6. Data is persisted via userStorage.
7. User is redirected to /:username.

### Portfolio View
1. Router resolves /:username.
2. UserContext loads profile and avatar from localStorage.
3. Portfolio sections render from profile JSON.

### Training Missions
1. User edits goals in GoalsEditor.
2. Goals are persisted to training storage.
3. Badge agent generates mission cards client-side.
4. Missions are saved to profile.training.badges.
5. Completing missions awards XP via hunterStorage and updates hero mirror fields.

## 5) Data Contracts

### localStorage keys
- ca_users: { username: { passwordHash, salt, createdAt } }
- ca_profiles: { username: UserProfileWithTraining }
- ca_avatars: { username: dataUrl }

### Badge Mission shape (normalized)
- id
- title
- description
- icon_emoji
- rank
- xp_reward
- category
- agent_rationale
- learning_paths[]
- videos_total
- videos_watched
- status
- created_at

## 6) Security Notes (Current Mode)

Frontend-only mode currently uses VITE_GEMINI_API_KEY, which is exposed in browser bundles.
This is acceptable only as a temporary tradeoff for frontend-only operation.

If backend is reintroduced later, move Gemini calls behind server routes and keep the AI call boundary in utils to avoid page-level rewrites.

## 7) Removed in v1.1

- api/agent/run.js
- api/ai/generate-profile.js
- api/ai/generate-avatar.js
- src/hooks/useActiveSection.js (unused)
- src/components/ui/CharacterDisplay.jsx (unused)
- src/assets/hero.png, src/assets/react.svg, src/assets/vite.svg (unused)
