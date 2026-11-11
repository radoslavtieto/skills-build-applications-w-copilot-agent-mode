import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      loadItems={() => getJson<LeaderboardResponse>('/api/leaderboard').then(({ leaderboard }) => leaderboard)}
      emptyMessage="No leaderboard rankings yet."
      renderItem={(entry) => <>#{entry.rank} {entry.teamName} - {entry.totalPoints} points</>}
    />
  );
}
