export function RankBadge({ rank = 'S' }) {
  const lowercaseRank = rank.toLowerCase();
  
  return (
    <span className={`rank-badge ${lowercaseRank}`}>
      {rank}-RANK
    </span>
  );
}
