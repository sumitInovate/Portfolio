/**
 * schemaValidator.js — CodeAether Profile Schema Validation
 *
 * Ensures that user profiles extracted by Agent Alpha conform to
 * the schema defined in data/schema.js before being saved to storage.
 *
 * This layer catches malformed data early and provides clear error messages
 * instead of allowing invalid profiles to persist in localStorage.
 */

import {
  RankEnum,
  StatusEnum,
  ThemeEnum,
  CertVariantEnum,
  CertTypeEnum,
  QuestStatusEnum,
  DEFAULT_XP,
  DEFAULT_RANK,
  DEFAULT_LEVEL,
  DEFAULT_THEME,
} from '../data/schema.js';

/**
 * Validate a complete user profile against the schema.
 * Throws descriptive errors if validation fails.
 *
 * @param {Object} profile - The profile object to validate
 * @returns {boolean} - Always returns true if valid; throws error if invalid
 * @throws {Error} - Descriptive validation error with guidance
 */
export function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('Profile must be a valid object');
  }

  // Validate required top-level sections
  validateMeta(profile.meta);
  validateHero(profile.hero);
  validateAbout(profile.about);
  validateSkills(profile.skills);
  validateExperience(profile.experience);
  validateProjects(profile.projects);
  validateCertifications(profile.certifications);
  validateContact(profile.contact);
  validateGitHub(profile.github);

  return true;
}

/**
 * Validate profile.meta section
 */
function validateMeta(meta) {
  if (!meta || typeof meta !== 'object') {
    throw new Error('Profile.meta must be a valid object');
  }

  const { username, displayName, tagline, status, theme } = meta;

  if (!username || typeof username !== 'string' || username.length === 0) {
    throw new Error('Profile.meta.username must be a non-empty string');
  }

  if (!displayName || typeof displayName !== 'string' || displayName.length === 0) {
    throw new Error('Profile.meta.displayName must be a non-empty string');
  }

  if (!tagline || typeof tagline !== 'string' || tagline.length > 80) {
    throw new Error('Profile.meta.tagline must be a string ≤ 80 characters');
  }

  if (status && !Object.values(StatusEnum).includes(status)) {
    throw new Error(
      `Profile.meta.status must be one of: ${Object.values(StatusEnum).join(', ')} (got "${status}")`
    );
  }

  if (theme && !Object.values(ThemeEnum).includes(theme)) {
    throw new Error(
      `Profile.meta.theme must be one of: ${Object.values(ThemeEnum).join(', ')} (got "${theme}")`
    );
  }
}

/**
 * Validate profile.hero section (RPG rank, level, XP)
 */
function validateHero(hero) {
  if (!hero || typeof hero !== 'object') {
    throw new Error('Profile.hero must be a valid object');
  }

  const { rank, level, xp, firstName, lastName, role, stack, location } = hero;

  if (!rank || !Object.values(RankEnum).includes(rank)) {
    throw new Error(
      `Profile.hero.rank must be one of: ${Object.values(RankEnum).join(', ')} (got "${rank}")`
    );
  }

  if (typeof level !== 'number' || level < 1) {
    throw new Error('Profile.hero.level must be a number ≥ 1');
  }

  validateXPData(xp, 'Profile.hero.xp');

  if (!firstName || typeof firstName !== 'string') {
    throw new Error('Profile.hero.firstName must be a non-empty string');
  }

  if (!lastName || typeof lastName !== 'string') {
    throw new Error('Profile.hero.lastName must be a non-empty string');
  }

  if (!role || typeof role !== 'string') {
    throw new Error('Profile.hero.role must be a non-empty string');
  }

  if (!stack || typeof stack !== 'string') {
    throw new Error('Profile.hero.stack must be a non-empty string');
  }

  if (!location || typeof location !== 'string') {
    throw new Error('Profile.hero.location must be a non-empty string');
  }
}

/**
 * Validate XP data structure { current, max }
 */
function validateXPData(xp, path = 'xp') {
  if (!xp || typeof xp !== 'object') {
    throw new Error(`${path} must be a valid object with { current, max }`);
  }

  const { current, max } = xp;

  if (typeof current !== 'number' || current < 0) {
    throw new Error(`${path}.current must be a non-negative number`);
  }

  if (typeof max !== 'number' || max <= 0) {
    throw new Error(`${path}.max must be a positive number`);
  }

  if (current > max) {
    throw new Error(`${path}.current (${current}) cannot exceed ${path}.max (${max})`);
  }
}

/**
 * Validate profile.about section (bio, profile fields, quick stats)
 */
function validateAbout(about) {
  if (!about || typeof about !== 'object') {
    throw new Error('Profile.about must be a valid object');
  }

  const { profileFields, bio, quickStats } = about;

  if (!Array.isArray(profileFields)) {
    throw new Error('Profile.about.profileFields must be an array');
  }

  profileFields.forEach((field, idx) => {
    if (!field.key || typeof field.key !== 'string') {
      throw new Error(`Profile.about.profileFields[${idx}].key must be a non-empty string`);
    }
    if (!field.val || typeof field.val !== 'string') {
      throw new Error(`Profile.about.profileFields[${idx}].val must be a non-empty string`);
    }
  });

  if (!Array.isArray(bio)) {
    throw new Error('Profile.about.bio must be an array of strings');
  }

  bio.forEach((paragraph, idx) => {
    if (typeof paragraph !== 'string' || paragraph.length === 0) {
      throw new Error(`Profile.about.bio[${idx}] must be a non-empty string`);
    }
  });

  if (!Array.isArray(quickStats)) {
    throw new Error('Profile.about.quickStats must be an array');
  }

  quickStats.forEach((stat, idx) => {
    if (!stat.val || typeof stat.val !== 'string') {
      throw new Error(`Profile.about.quickStats[${idx}].val must be a non-empty string`);
    }
    if (!stat.label || typeof stat.label !== 'string') {
      throw new Error(`Profile.about.quickStats[${idx}].label must be a non-empty string`);
    }
  });
}

/**
 * Validate profile.skills array (category, icon, skills with name/alias/value)
 */
function validateSkills(skills) {
  if (!Array.isArray(skills)) {
    throw new Error('Profile.skills must be an array');
  }

  if (skills.length === 0) {
    throw new Error('Profile.skills must contain at least one skill category');
  }

  skills.forEach((category, catIdx) => {
    if (!category.category || typeof category.category !== 'string') {
      throw new Error(`Profile.skills[${catIdx}].category must be a non-empty string`);
    }

    if (!Array.isArray(category.skills)) {
      throw new Error(`Profile.skills[${catIdx}].skills must be an array`);
    }

    if (category.skills.length === 0) {
      throw new Error(`Profile.skills[${catIdx}] must have at least one skill`);
    }

    category.skills.forEach((skill, skillIdx) => {
      if (!skill.name || typeof skill.name !== 'string') {
        throw new Error(`Profile.skills[${catIdx}].skills[${skillIdx}].name must be a non-empty string`);
      }

      if (!skill.alias || typeof skill.alias !== 'string') {
        throw new Error(`Profile.skills[${catIdx}].skills[${skillIdx}].alias must be a non-empty string (e.g. "DOMAIN EXPANSION")`);
      }

      if (typeof skill.value !== 'number' || skill.value < 0 || skill.value > 100) {
        throw new Error(
          `Profile.skills[${catIdx}].skills[${skillIdx}].value ("${skill.name}") must be a number 0-100 (got ${skill.value})`
        );
      }

      if (!skill.desc || typeof skill.desc !== 'string') {
        throw new Error(`Profile.skills[${catIdx}].skills[${skillIdx}].desc must be a non-empty string`);
      }
    });
  });
}

/**
 * Validate profile.experience array (work history)
 */
function validateExperience(experience) {
  if (!Array.isArray(experience)) {
    throw new Error('Profile.experience must be an array');
  }

  // Experience can be empty (student/intern with no work history)
  experience.forEach((job, idx) => {
    if (!job.rank || !Object.values(RankEnum).includes(job.rank)) {
      throw new Error(
        `Profile.experience[${idx}].rank must be one of: ${Object.values(RankEnum).join(', ')} (got "${job.rank}")`
      );
    }

    if (!job.guild || typeof job.guild !== 'string') {
      throw new Error(`Profile.experience[${idx}].guild (company name) must be a non-empty string`);
    }

    if (!job.role || typeof job.role !== 'string') {
      throw new Error(`Profile.experience[${idx}].role must be a non-empty string`);
    }

    if (!job.period || typeof job.period !== 'string') {
      throw new Error(`Profile.experience[${idx}].period must be a non-empty string (e.g. "Jan 2020 - Present")`);
    }

    if (job.status && !Object.values(QuestStatusEnum).includes(job.status)) {
      throw new Error(
        `Profile.experience[${idx}].status must be one of: ${Object.values(QuestStatusEnum).join(', ')} (got "${job.status}")`
      );
    }

    if (!Array.isArray(job.achievements)) {
      throw new Error(`Profile.experience[${idx}].achievements must be an array`);
    }

    job.achievements.forEach((achievement, achIdx) => {
      if (typeof achievement !== 'string') {
        throw new Error(`Profile.experience[${idx}].achievements[${achIdx}] must be a string`);
      }
    });
  });
}

/**
 * Validate profile.projects array (portfolio projects)
 */
function validateProjects(projects) {
  if (!Array.isArray(projects)) {
    throw new Error('Profile.projects must be an array');
  }

  // Projects can be empty if user has no projects to showcase
  projects.forEach((project, idx) => {
    if (!project.rank || !Object.values(RankEnum).includes(project.rank)) {
      throw new Error(
        `Profile.projects[${idx}].rank must be one of: ${Object.values(RankEnum).join(', ')} (got "${project.rank}")`
      );
    }

    if (!project.title || typeof project.title !== 'string') {
      throw new Error(`Profile.projects[${idx}].title must be a non-empty string`);
    }

    if (!project.tech || typeof project.tech !== 'string') {
      throw new Error(`Profile.projects[${idx}].tech must be a non-empty string`);
    }

    if (!project.desc || typeof project.desc !== 'string') {
      throw new Error(`Profile.projects[${idx}].desc must be a non-empty string`);
    }
  });
}

/**
 * Validate profile.certifications array (badges and achievements)
 */
function validateCertifications(certifications) {
  if (!Array.isArray(certifications)) {
    throw new Error('Profile.certifications must be an array');
  }

  // Certifications can be empty
  certifications.forEach((cert, idx) => {
    if (!cert.variant || !Object.values(CertVariantEnum).includes(cert.variant)) {
      throw new Error(
        `Profile.certifications[${idx}].variant must be one of: ${Object.values(CertVariantEnum).join(', ')} (got "${cert.variant}")`
      );
    }

    if (!cert.type || !Object.values(CertTypeEnum).includes(cert.type)) {
      throw new Error(
        `Profile.certifications[${idx}].type must be one of: ${Object.values(CertTypeEnum).join(', ')} (got "${cert.type}")`
      );
    }

    if (!cert.title || typeof cert.title !== 'string') {
      throw new Error(`Profile.certifications[${idx}].title must be a non-empty string`);
    }

    if (cert.year && (typeof cert.year !== 'string' && typeof cert.year !== 'number')) {
      throw new Error(`Profile.certifications[${idx}].year must be a string or number`);
    }
  });
}

/**
 * Validate profile.contact section (email, phone, linkedin, etc.)
 */
function validateContact(contact) {
  if (!contact || typeof contact !== 'object') {
    throw new Error('Profile.contact must be a valid object');
  }

  const { email, whatsappNumber, linkedin } = contact;

  // Email validation (optional, but if provided must be valid format)
  if (email && typeof email === 'string' && email.length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Profile.contact.email must be a valid email address (got "${email}")`);
    }
  }

  // WhatsApp validation (optional, but if provided should be numeric)
  if (whatsappNumber && typeof whatsappNumber === 'string' && whatsappNumber.length > 0) {
    if (!/^\+?[0-9]{10,15}$/.test(whatsappNumber.replace(/[\s\-()]/g, ''))) {
      throw new Error(`Profile.contact.whatsappNumber must be a valid phone number`);
    }
  }

  // LinkedIn URL validation (optional)
  if (linkedin && typeof linkedin === 'string' && linkedin.length > 0) {
    if (!linkedin.toLowerCase().includes('linkedin')) {
      console.warn('Profile.contact.linkedin looks unusual (should be a LinkedIn URL)');
    }
  }
}

/**
 * Validate profile.github section (username, stats, heatmap)
 */
function validateGitHub(github) {
  if (!github || typeof github !== 'object') {
    throw new Error('Profile.github must be a valid object');
  }

  const { username, stats, heatmapSeed } = github;

  if (!username || typeof username !== 'string') {
    throw new Error('Profile.github.username must be a non-empty string');
  }

  if (!Array.isArray(stats)) {
    throw new Error('Profile.github.stats must be an array');
  }

  stats.forEach((stat, idx) => {
    if (!stat.label || typeof stat.label !== 'string') {
      throw new Error(`Profile.github.stats[${idx}].label must be a non-empty string`);
    }
    if (!stat.value || typeof stat.value !== 'string') {
      throw new Error(`Profile.github.stats[${idx}].value must be a non-empty string`);
    }
  });

  // Validate heatmap seed - EXACTLY 364 numbers, each 0-3
  if (!Array.isArray(heatmapSeed)) {
    throw new Error('Profile.github.heatmapSeed must be an array');
  }

  if (heatmapSeed.length !== 364) {
    throw new Error(
      `Profile.github.heatmapSeed must have exactly 364 elements (got ${heatmapSeed.length})`
    );
  }

  heatmapSeed.forEach((val, idx) => {
    if (typeof val !== 'number' || val < 0 || val > 3) {
      throw new Error(
        `Profile.github.heatmapSeed[${idx}] must be a number 0-3 (got ${val})`
      );
    }
  });
}

/**
 * Sanitize and normalize a profile to ensure consistency.
 * Coerces known Gemini output quirks so validation never fails on a real response:
 *   - Trims all string values
 *   - Truncates tagline to ≤ 80 chars
 *   - Defaults invalid rank / status / theme enums to safe values
 *   - Fixes heatmapSeed: pads/trims to exactly 364, clamps values 0–3
 *   - Clears contact fields that don't pass format checks
 *
 * @param {Object} profile - The profile to normalize
 * @returns {Object} - Normalized profile
 */
export function normalizeProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }

  // Trim all string fields recursively
  const trimObject = (obj) => {
    if (typeof obj === 'string') return obj.trim();
    if (Array.isArray(obj)) return obj.map(trimObject);
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) result[key] = trimObject(value);
      return result;
    }
    return obj;
  };

  const p = trimObject(profile);

  // ── meta ──────────────────────────────────────────────────────────────────
  if (p.meta) {
    // Truncate tagline to 80 chars
    if (typeof p.meta.tagline === 'string' && p.meta.tagline.length > 80) {
      p.meta.tagline = p.meta.tagline.slice(0, 77) + '…';
    }
    // Coerce status enum
    const validStatuses = Object.values(StatusEnum);
    if (p.meta.status && !validStatuses.includes(p.meta.status)) {
      p.meta.status = StatusEnum.AVAILABLE;
    }
    // Coerce theme enum
    const validThemes = Object.values(ThemeEnum);
    if (p.meta.theme && !validThemes.includes(p.meta.theme)) {
      p.meta.theme = DEFAULT_THEME ?? 'solo-leveling';
    }
  }

  // ── hero ──────────────────────────────────────────────────────────────────
  if (p.hero) {
    // Coerce rank enum
    const validRanks = Object.values(RankEnum);
    if (!p.hero.rank || !validRanks.includes(p.hero.rank)) {
      p.hero.rank = DEFAULT_RANK ?? RankEnum.B;
    }
    // Clamp level to a positive number
    if (typeof p.hero.level !== 'number' || p.hero.level < 0) {
      p.hero.level = DEFAULT_LEVEL ?? 1;
    }
    // Normalise XP
    if (!p.hero.xp || typeof p.hero.xp !== 'object') {
      p.hero.xp = { current: DEFAULT_XP?.current ?? 5000, max: DEFAULT_XP?.max ?? 10000 };
    }
    p.hero.xp.current = Math.max(0, Math.min(Number(p.hero.xp.current) || 0, p.hero.xp.max ?? 10000));
  }

  // ── experience ────────────────────────────────────────────────────────────
  if (Array.isArray(p.experience)) {
    const validQuestStatuses = Object.values(QuestStatusEnum);
    const statusMap = {
      INACTIVE: QuestStatusEnum.COMPLETED,
      CURRENT: QuestStatusEnum.ACTIVE,
      PRESENT: QuestStatusEnum.ACTIVE,
      PAST: QuestStatusEnum.COMPLETED,
    };

    p.experience = p.experience.map((job) => {
      if (!job || typeof job !== 'object') return job;

      const normalizedJob = { ...job };

      // Normalize status aliases from LLM outputs.
      if (typeof normalizedJob.status === 'string') {
        const upper = normalizedJob.status.toUpperCase();
        if (statusMap[upper]) {
          normalizedJob.status = statusMap[upper];
        }
      }

      if (!normalizedJob.status || !validQuestStatuses.includes(normalizedJob.status)) {
        const period = String(normalizedJob.period ?? '').toLowerCase();
        normalizedJob.status = period.includes('present') ? QuestStatusEnum.ACTIVE : QuestStatusEnum.COMPLETED;
      }

      return normalizedJob;
    });
  }

  // ── certifications ────────────────────────────────────────────────────────
  if (Array.isArray(p.certifications)) {
    const validVariants = Object.values(CertVariantEnum);
    const validTypes = Object.values(CertTypeEnum);

    p.certifications = p.certifications.map((cert) => {
      if (!cert || typeof cert !== 'object') return cert;

      const normalizedCert = { ...cert };
      const variant = String(normalizedCert.variant ?? '').toLowerCase();
      const type = String(normalizedCert.type ?? '').toUpperCase();

      // Map common variants emitted by Gemini to supported schema variants.
      if (!validVariants.includes(normalizedCert.variant)) {
        if (variant === 'silver') normalizedCert.variant = CertVariantEnum.PURPLE;
        else if (variant === 'bronze') normalizedCert.variant = CertVariantEnum.PURPLE;
        else normalizedCert.variant = CertVariantEnum.GOLD;
      }

      if (!validTypes.includes(normalizedCert.type)) {
        if (type.includes('AWARD')) normalizedCert.type = CertTypeEnum.TITLE_EARNED;
        else if (type.includes('EDUCATION')) normalizedCert.type = CertTypeEnum.EDUCATION;
        else normalizedCert.type = CertTypeEnum.CERTIFICATION;
      }

      return normalizedCert;
    });
  }

  // ── contact ───────────────────────────────────────────────────────────────
  if (p.contact) {
    // Clear email if it doesn't look valid (don't throw, just blank it)
    if (p.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contact.email)) {
      p.contact.email = '';
    }
    // Clear phone if it doesn't look valid
    if (p.contact.whatsappNumber) {
      const stripped = p.contact.whatsappNumber.replace(/[\s\-()]/g, '');
      if (!/^\+?[0-9]{10,15}$/.test(stripped)) {
        p.contact.whatsappNumber = '';
      }
    }
  }

  // ── github.heatmapSeed ────────────────────────────────────────────────────
  if (p.github) {
    const seed = Array.isArray(p.github.heatmapSeed) ? p.github.heatmapSeed : [];
    // Clamp existing values to 0–3
    const clamped = seed.map(v => {
      const n = typeof v === 'number' ? v : parseInt(v, 10);
      return isNaN(n) ? 0 : Math.max(0, Math.min(3, Math.round(n)));
    });
    // Pad to 364 if too short, trim if too long
    while (clamped.length < 364) clamped.push(Math.floor(Math.random() * 4));
    p.github.heatmapSeed = clamped.slice(0, 364);
  }

  return p;
}

/**
 * Validate and normalize a profile in one operation.
 * Returns normalized profile if valid, throws error if invalid.
 *
 * @param {Object} profile - The profile to validate
 * @returns {Object} - Normalized, valid profile
 * @throws {Error} - If validation fails
 */
export function validateAndNormalizeProfile(profile) {
  const normalized = normalizeProfile(profile);
  validateProfile(normalized);
  return normalized;
}
