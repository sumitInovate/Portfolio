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
  const [activeVideoId, setActiveVideoId] = useState(null);
  const profile = useHunterStore(s => s.profile);
  const badges = useHunterStore(s => s.badges);
  const setBadges = useHunterStore(s => s.setBadges);
  const applyXPGain = useHunterStore(s => s.applyXPGain);
  const markVideoComplete = useHunterStore(s => s.markVideoComplete);
  const addToast = useHunterStore(s => s.addToast);

  const learningPaths = Array.isArray(badge.learning_paths) ? badge.learning_paths : [];

  const rankColor = RANK_COLORS[badge.rank] ?? '#4A9EFF';
  const progressPct = badge.videos_total > 0
    ? Math.round((badge.videos_watched / badge.videos_total) * 100)
    : 0;

  const canComplete = useMemo(
    () => (badge.videos_watched || 0) >= (badge.videos_total || 0) && (badge.videos_total || 0) > 0,
    [badge.videos_watched, badge.videos_total]
  );

  const firstVideo = learningPaths[0] || null;
  const resolvedActiveVideoId = activeVideoId || (firstVideo?.id || firstVideo?.youtube_id || firstVideo?.youtube_url || null);

  const activeVideo = learningPaths.find((video) => {
    const key = video.id || video.youtube_id || video.youtube_url;
    return key === resolvedActiveVideoId;
  }) || null;

  const extractYouTubeId = (video) => {
    const candidate = video?.youtube_id || '';
    if (candidate) return candidate;

    const source = video?.youtube_url || '';
    const patterns = [
      /(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(source);
      if (match) return match[1];
    }

    return '';
  };

  const getWatchUrl = (video) => {
    if (video?.youtube_url) return video.youtube_url;
    const id = extractYouTubeId(video);
    return id ? `https://www.youtube.com/watch?v=${id}` : '#';
  };

  const getEmbedUrl = (video) => {
    const id = extractYouTubeId(video);
    if (!id) return '';
    return `https://www.youtube.com/embed/${id}`;
  };

  const handleMarkWatched = (video) => {
    const videoId = video.id || video.youtube_id || video.youtube_url;
    if (!videoId) return;

    const marked = markVideoComplete(videoId, badge.id, Number(video.xp_value) || 0);
    if (marked) {
      addToast({
        type: 'success',
        message: `+${Number(video.xp_value) || 0} XP awarded for watched video`,
      });
    }
  };

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

          {learningPaths.length > 0 ? (
            <div className="badge-videos">
              <div className="badge-video-list">
                {learningPaths.slice(0, 5).map((video, i) => {
                  const videoKey = video.id || video.youtube_id || video.youtube_url || `${badge.id}-${i}`;
                  const watched = video.watch_status === 'watched';

                  return (
                    <div key={videoKey} className="badge-video-item">
                      <button
                        type="button"
                        className={`badge-video-select ${resolvedActiveVideoId === videoKey ? 'badge-video-select--active' : ''}`}
                        onClick={() => setActiveVideoId(videoKey)}
                      >
                        {video.title || `Learning video ${i + 1}`}
                      </button>

                      <div className="badge-video-actions">
                        <a
                          href={getWatchUrl(video)}
                          target="_blank"
                          rel="noreferrer"
                          className="badge-video-link"
                        >
                          OPEN ON YOUTUBE
                        </a>
                        <button
                          type="button"
                          className="badge-video-watch"
                          onClick={() => handleMarkWatched(video)}
                          disabled={watched}
                        >
                          {watched ? 'WATCHED' : `MARK WATCHED (+${Number(video.xp_value) || 0} XP)`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeVideo && getEmbedUrl(activeVideo) ? (
                <div className="badge-video-embed-wrap">
                  <iframe
                    className="badge-video-embed"
                    src={getEmbedUrl(activeVideo)}
                    title={activeVideo.title || 'Learning video'}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </div>
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
