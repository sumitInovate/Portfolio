import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useHunterStore } from '../../stores/hunterStore';
import { hunterStorage } from '../../utils/training/hunterStorage';

const CLASS_META = {
  E: { color: '#7BA8D0', label: 'E-RANK', title: 'Novice Hunter' },
  D: { color: '#00CC44', label: 'D-RANK', title: 'Awakened Hunter' },
  C: { color: '#0080FF', label: 'C-RANK', title: 'Shadow Soldier' },
  B: { color: '#4A9EFF', label: 'B-RANK', title: 'Shadow Knight' },
  A: { color: '#9F00FF', label: 'A-RANK', title: 'Shadow Marshal' },
  S: { color: '#FFD700', label: 'S-RANK', title: 'Shadow Monarch' },
};

/**
 * HunterStatsBar — displays level, class, XP progress, badges, streak
 */
export function HunterStatsBar({ username: _username }) {
  const profile = useHunterStore(s => s.profile);
  const xpBarRef = useRef(null);

  // Calculate today's XP
  const xpToday = profile ? hunterStorage.getXPToday(profile.username) : 0;

  // Get current streak
  const streakData = profile ? hunterStorage.getStreak(profile.username) : { current: 0 };

  if (!profile) return null;

  const cls = CLASS_META[profile.class] ?? CLASS_META.E;
  const xpPct = Math.min((profile.xp_current / profile.xp_to_next) * 100, 100);
  const milestones = [25, 50, 75];

  return (
    <div className="hunter-stats-bar system-panel">
      {/* Row 1 — Level + Class + Title */}
      <div className="hsb-identity">
        <span className="hsb-level">LV.{profile.level}</span>
        <span className="hsb-class-badge" style={{ color: cls.color, borderColor: cls.color }}>
          {cls.label}
        </span>
        <span className="hsb-title">{profile.job_title ?? cls.title}</span>
        {profile.current_company && <span className="hsb-company">{profile.current_company}</span>}
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
            sub: `${profile.badges_s ?? 0}× S  ${profile.badges_a ?? 0}× A`,
            color: '#4A9EFF',
          },
          {
            label: 'CLASS',
            value: cls.label,
            sub: cls.title,
            color: cls.color,
          },
          {
            label: 'XP TODAY',
            value: `+${xpToday.toLocaleString()}`,
            sub: 'earned today',
            color: '#00CC44',
          },
          {
            label: 'STREAK',
            value: `${streakData.current}`,
            sub:
              streakData.current >= 7
                ? '🔥 ON FIRE'
                : streakData.current > 0
                  ? 'days active'
                  : 'Start today!',
            color: streakData.current >= 7 ? '#FF8C00' : '#FFD700',
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
