# CodeAether

RPG-themed developer portfolio and training platform built with React + Vite.

Current project mode: frontend-only (no backend runtime dependency).

## Tech Stack

- React 19
- Vite 8
- Framer Motion
- React Router
- Zustand
- React Hook Form + Zod
- jose (JWT)
- @google/generative-ai

## Quick Start

Prerequisites:
- Node.js 18+
- npm 9+

Install and run:

```bash
npm install
cp .env.example .env
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Environment

Use .env based on .env.example:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_JWT_SECRET=change_this_in_production
VITE_MY_WHATSAPP_NUMBER=91XXXXXXXXXX
VITE_CALLMEBOT_API_KEY=your_callmebot_key
VITE_APP_MODE=development
```

Note:
- VITE_GEMINI_API_KEY is exposed to client bundles.
- This is a temporary frontend-only tradeoff.

## Routes

- / -> Landing page
- /register -> Registration workflow
- /demo -> Demo portfolio
- /training -> Training missions (auth required)
- /privacy-policy
- /terms-of-use
- /cookie-policy
- /:username -> Portfolio view

## Core Architecture

- Context layer
  - src/context/AuthContext.jsx
  - src/context/UserContext.jsx
  - src/context/AudioContext.jsx

- Training state
  - src/stores/hunterStore.js
  - src/utils/training/hunterStorage.js
  - src/utils/training/badgeAgent.js

- AI generation
  - src/utils/geminiAgents.js
  - src/utils/geminiAgentShared.js

- Persistence
  - localStorage keys: ca_users, ca_profiles, ca_avatars

See docs/ARCHITECTURE.md for full details.

## Current Behavior

- Registration:
  - Resume + photo processed by client-side Gemini agents.
  - Profile/avatar persisted in localStorage.

- Training:
  - Goals are saved locally.
  - Mission badges are generated in frontend (Gemini + local fallback).

- Portfolio:
  - Data is rendered from localStorage profile records.

## Cleanup Applied (April 16, 2026)

Removed unused or backend-only files:
- src/hooks/useActiveSection.js
- src/components/ui/CharacterDisplay.jsx
- src/assets/hero.png
- src/assets/react.svg
- src/assets/vite.svg
- api/agent/run.js
- api/ai/generate-profile.js
- api/ai/generate-avatar.js

## License

MIT (see LICENSE.txt)
