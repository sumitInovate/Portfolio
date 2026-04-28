import { useHunterStore } from '../../stores/hunterStore';

export function CompletedVault() {
  const badges = useHunterStore(s => s.badges);
  const completed = badges.filter(b => b.status === 'completed');

  if (!completed.length) {
    return (
      <div className="missions-empty system-panel">
        <span className="missions-empty__icon">🧱</span>
        <p className="missions-empty__title">VAULT EMPTY</p>
        <p className="missions-empty__sub">Complete active badges to archive them here.</p>
      </div>
    );
  }

  return (
    <div className="active-missions">
      {completed.map(badge => (
        <div key={badge.id} className="badge-card system-panel">
          <div className="badge-card__header" style={{ cursor: 'default' }}>
            <span className="badge-card__icon">{badge.icon_emoji || '🏆'}</span>
            <div className="badge-card__info">
              <span className="badge-card__title">{badge.title}</span>
              <span className="badge-card__desc">Completed {badge.completed_at ? new Date(badge.completed_at).toLocaleDateString() : 'Recently'}</span>
            </div>
            <div className="badge-card__meta">
              <span className="badge-card__xp-reward">+{(badge.xp_reward || 0).toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
