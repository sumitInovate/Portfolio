import { useMemo, useState } from 'react';
import { useHunterStore } from '../../stores/hunterStore';
import { hunterStorage } from '../../utils/training/hunterStorage';

const RANK_COLORS = {
  E: '#7BA8D0',
  D: '#00CC44',
  C: '#0080FF',
  B: '#4A9EFF',
  A: '#9F00FF',
  S: '#FFD700',
};

export function BadgeMissionCard({ badge }) {
  const [open, setOpen] = useState(false);
  const profile = useHunterStore(s => s.profile);
  const badges = useHunterStore(s => s.badges);
  const setBadges = useHunterStore(s => s.setBadges);
  const applyXPGain = useHunterStore(s => s.applyXPGain);

  const rankColor = RANK_COLORS[badge.rank] ?? '#4A9EFF';
  const progressPct = badge.videos_total > 0
    ? Math.round((badge.videos_watched / badge.videos_total) * 100)
    : 0;

  const canComplete = useMemo(
    () => (badge.videos_watched || 0) >= (badge.videos_total || 0) && (badge.videos_total || 0) > 0,
    [badge.videos_watched, badge.videos_total]
  );

  const handleComplete = () => {
    if (!profile || !canComplete) return;

    const result = hunterStorage.awardXP(
      profile.username,
      badge.xp_reward || 0,
      'badge_complete',
      badge.id,
      `Badge completed: ${badge.title}`
    );

    const next = badges.map(b =>
      b.id === badge.id
        ? { ...b, status: 'completed', completed_at: new Date().toISOString() }
        : b
    );

    hunterStorage.saveHunterBadges(profile.username, next);
    setBadges(next);
    applyXPGain(0, result);
  };

  return (
    <div className="badge-card system-panel" style={{ '--rank-color': rankColor }}>
      <button
        className="badge-card__header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        type="button"
      >
        <span className="badge-card__icon">{badge.icon_emoji || '🏆'}</span>

        <div className="badge-card__info">
          <span className="badge-card__title">{badge.title}</span>
          <span className="badge-card__desc">{badge.description}</span>
        </div>

        <div className="badge-card__meta">
          <span className="badge-card__rank" style={{ color: rankColor, borderColor: rankColor }}>
            {badge.rank}-RANK
          </span>
          <span className="badge-card__xp-reward">+{(badge.xp_reward || 0).toLocaleString()} XP</span>
        </div>

        <span className="badge-card__chevron">{open ? '▲' : '▼'}</span>
      </button>

      <div className="badge-card__progress-track">
        <div className="badge-card__progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {open && (
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="hsb-stat-sub">Progress</span>
            <span className="hsb-stat-sub">{badge.videos_watched || 0} / {badge.videos_total || 0} videos</span>
          </div>

          {Array.isArray(badge.learning_paths) && badge.learning_paths.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--color-text-muted)' }}>
              {badge.learning_paths.slice(0, 5).map((video, i) => (
                <li key={video.id || `${badge.id}-${i}`} style={{ marginBottom: 6 }}>
                  {video.title || `Learning video ${i + 1}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="missions-empty__sub" style={{ marginBottom: 12 }}>No video path generated yet.</p>
          )}

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="glow-btn"
              type="button"
              disabled={!canComplete}
              onClick={handleComplete}
              title={canComplete ? 'Complete badge and claim XP' : 'Watch all videos first'}
            >
              COMPLETE BADGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
