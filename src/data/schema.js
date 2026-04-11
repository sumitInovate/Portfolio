/**
 * CodeAether — Data Schema
 * ========================
 * Single source of truth for all user profile data shapes.
 * These are JSDoc typedefs (no runtime cost) — import this
 * file in any component for IntelliSense / documentation.
 *
 * All enums are exported as plain objects so they can be
 * used as runtime values too (e.g. dropdowns in a future editor).
 */

// ─── Enums ────────────────────────────────────────────────────────────────

/** Hunter rank, E (lowest) → S (highest) */
export const RankEnum = /** @type {const} */ ({
  E: 'E',
  D: 'D',
  C: 'C',
  B: 'B',
  A: 'A',
  S: 'S',
});

/** User availability status */
export const StatusEnum = /** @type {const} */ ({
  AVAILABLE:   'available',
  EMPLOYED:    'employed',
  NOT_LOOKING: 'not-looking',
});

/** Theme variant (future: multiple themes per user) */
export const ThemeEnum = /** @type {const} */ ({
  SOLO_LEVELING: 'solo-leveling',
});

/** Certification badge variant */
export const CertVariantEnum = /** @type {const} */ ({
  GOLD:   'gold',
  PURPLE: 'purple',
});

/** Certification type label */
export const CertTypeEnum = /** @type {const} */ ({
  CERTIFICATION: '[CERTIFICATION]',
  TITLE_EARNED:  '[TITLE EARNED]',
  EDUCATION:     '[EDUCATION]',
});

/** Employment status within an experience entry */
export const QuestStatusEnum = /** @type {const} */ ({
  ACTIVE:    'ACTIVE',
  COMPLETED: 'COMPLETED',
});

// ─── Default / Fallback values ─────────────────────────────────────────────

export const DEFAULT_XP = { current: 0, max: 10000 };
export const DEFAULT_RANK = RankEnum.E;
export const DEFAULT_LEVEL = 1;
export const DEFAULT_THEME = ThemeEnum.SOLO_LEVELING;

// ─── JSDoc Typedefs ────────────────────────────────────────────────────────

/**
 * @typedef {Object} UserMeta
 * @property {string} username        - URL slug, e.g. "sumit-thakur"
 * @property {string} displayName     - Full display name
 * @property {string} tagline         - Short hero tagline (<= 80 chars)
 * @property {string} avatarUrl       - Absolute or root-relative path to avatar image
 * @property {keyof StatusEnum} status
 * @property {keyof ThemeEnum}  theme
 */

/**
 * @typedef {Object} XPData
 * @property {number} current
 * @property {number} max
 */

/**
 * @typedef {Object} UserHero
 * @property {string} alertText       - Typewriter text shown above name
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} role            - e.g. "Full Stack Engineer"
 * @property {string} stack           - Tech stack summary string
 * @property {keyof RankEnum} rank
 * @property {number} level
 * @property {XPData} xp
 * @property {string} location
 */

/**
 * @typedef {{ key: string, val: string }} ProfileField
 *
 * @typedef {Object} UserAbout
 * @property {ProfileField[]} profileFields
 * @property {string[]}       bio           - Array of bio paragraphs
 * @property {Array<{ val: string, label: string }>} quickStats
 */

/**
 * @typedef {Object} Skill
 * @property {string} name
 * @property {string} alias    - RPG ability name
 * @property {number} value    - 0–100 proficiency
 * @property {string} desc
 *
 * @typedef {Object} SkillCategory
 * @property {string}  category  - e.g. "BACKEND"
 * @property {string}  icon      - emoji
 * @property {Skill[]} skills
 */

/**
 * @typedef {Object} ExperienceEntry
 * @property {keyof RankEnum}    rank
 * @property {string}            guild       - Company name
 * @property {string}            role
 * @property {string}            period      - e.g. "Oct 2022 – Present"
 * @property {string}            location
 * @property {keyof QuestStatusEnum} status
 * @property {string[]}          achievements
 */

/**
 * @typedef {Object} ProjectEntry
 * @property {keyof RankEnum} rank
 * @property {string}         title
 * @property {string}         tech
 * @property {string}         desc
 * @property {boolean}        classified
 * @property {string|null}    link
 */

/**
 * @typedef {Object} CertEntry
 * @property {keyof CertVariantEnum} variant
 * @property {keyof CertTypeEnum}    type
 * @property {string}                title
 * @property {string}                year
 */

/**
 * @typedef {Object} UserContact
 * @property {string} email
 * @property {string} whatsappNumber  - E.164 format e.g. "919XXXXXXXXX"
 * @property {string} linkedin        - Full URL
 * @property {string} location
 */

/**
 * @typedef {Object} GitHubData
 * @property {string} username
 * @property {Array<{ label: string, value: string }>} stats
 * @property {number[]} heatmapSeed   - 364 values, 0–4
 */

/**
 * @typedef {Object} UserProfile
 * @property {UserMeta}          meta
 * @property {UserHero}          hero
 * @property {UserAbout}         about
 * @property {SkillCategory[]}   skills
 * @property {ExperienceEntry[]} experience
 * @property {ProjectEntry[]}    projects
 * @property {CertEntry[]}       certifications
 * @property {UserContact}       contact
 * @property {GitHubData}        github
 */
