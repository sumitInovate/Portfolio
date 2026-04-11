import { motion } from 'framer-motion';

// Deterministic contribution heatmap — 52 weeks × 7 days
// Values: 0=none, 1=low, 2=mid, 3=high, 4=peak
function generateHeatmap() {
  const seed = [
    0,0,1,0,2,0,0, 0,1,0,2,3,1,0, 0,0,2,1,0,2,0, 1,2,3,2,1,0,0,
    0,2,1,3,2,0,1, 1,0,2,0,3,2,0, 0,1,0,2,1,0,2, 2,3,1,0,2,1,0,
    0,0,3,2,1,2,0, 1,2,0,3,2,1,0, 0,1,2,0,1,3,2, 3,2,1,0,2,1,0,
    1,0,2,1,3,0,2, 0,2,1,0,2,3,1, 1,3,2,0,1,2,0, 0,1,3,2,1,0,2,
    2,0,1,3,0,2,1, 0,2,0,3,1,2,0, 1,0,2,1,3,0,2, 0,3,2,1,0,2,1,
    1,2,0,3,1,0,2, 2,1,3,0,2,1,0, 0,2,1,0,3,2,1, 1,0,2,3,0,1,2,
    0,1,2,0,3,1,0, 2,3,0,1,2,0,1, 1,2,3,0,1,2,0, 0,1,0,2,3,1,2,
    3,0,2,1,0,2,3, 1,2,0,3,2,1,0, 0,2,3,1,0,2,1, 2,1,0,3,2,0,1,
    0,1,2,3,0,1,2, 1,0,3,2,1,0,2, 2,3,0,1,2,0,1, 0,2,1,3,0,2,1,
    1,0,2,0,3,1,2, 3,1,2,0,1,3,0, 2,0,1,2,3,0,1, 1,2,0,3,1,2,0,
    0,3,2,1,2,0,1, 2,1,3,0,2,1,0, 1,2,0,3,1,0,2, 0,1,2,0,3,1,2,
    3,2,0,1,2,3,0, 1,0,2,3,1,0,2, 2,3,1,0,2,1,3, 0,2,1,3,0,2,1,
    2,1,0,3,2,1,0, 3,2,1,0,3,2,1,
  ];
  // Fill remaining with 0s  
  while (seed.length < 364) seed.push(0);
  // Build 52×7 grid
  const grid = [];
  for (let w = 0; w < 52; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(seed[w * 7 + d] || 0);
    }
    grid.push(week);
  }
  return grid;
}

const HEATMAP = generateHeatmap();
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Sep', 'Nov'];
// Which column (week) each month label sits at
const MONTH_COLS = [0, 4, 9, 13, 22, 34];

const STATS = [
  { label: 'Global Developer Rating:', value: 'TOP 1%', highlight: true },
  { label: 'Commits (Last 12 Mos):', value: '450+', highlight: true },
  { label: 'Open Source Contributions:', value: '15+', highlight: true },
  { label: 'Languages:', value: 'C#, JS, TS', highlight: true },
];

export function GitHubStatsPanel() {
  return (
    <motion.div
      className="gh-stats-panel glass-panel"
      initial={{ x: -60, opacity: 0, filter: 'blur(8px)' }}
      animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1.0, delay: 0.5, type: 'spring', stiffness: 65, damping: 18 }}
    >
      {/* Panel corner brackets */}
      <div className="panel-corner panel-corner--tl" />
      <div className="panel-corner panel-corner--br" />

      {/* Header row */}
      <div className="gh-header">
        {/* GitHub icon SVG */}
        <svg className="gh-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.03-.02-2.03-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.08 1.85 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.3 0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"
          />
        </svg>
        <span className="gh-header-label">GITHUB STATS</span>
      </div>

      {/* Stats list */}
      <ul className="gh-stat-list" aria-label="GitHub developer statistics">
        {STATS.map(({ label, value }) => (
          <li key={label} className="gh-stat-row">
            <span className="gh-stat-label">{label}</span>
            <span className="gh-stat-value">{value}</span>
          </li>
        ))}
      </ul>

      {/* Heatmap */}
      <div className="gh-heatmap-wrap" aria-label="GitHub contribution heatmap">
        {/* Month labels */}
        <div className="gh-heatmap-months">
          {MONTHS.map((m, i) => (
            <span
              key={m}
              className="gh-heatmap-month"
              style={{ gridColumn: MONTH_COLS[i] + 1 }}
            >
              {m}
            </span>
          ))}
        </div>
        {/* Grid */}
        <div className="gh-heatmap-grid" role="img" aria-label="Contribution activity grid">
          {HEATMAP.map((week, wi) =>
            week.map((level, di) => (
              <div
                key={`${wi}-${di}`}
                className={`gh-cell gh-cell--${level}`}
                title={`Week ${wi + 1}, ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][di]}: ${level === 0 ? 'no' : level === 1 ? 'low' : level === 2 ? 'medium' : level === 3 ? 'high' : 'peak'} activity`}
              />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
