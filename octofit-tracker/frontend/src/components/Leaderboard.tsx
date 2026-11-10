import { useEffect, useState } from 'react';
import { apiBaseUrl } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/leaderboard`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message ?? 'Unable to load leaderboard');
        }

        if (isMounted) {
          setEntries(payload.leaderboard ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load leaderboard');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={entries.length === 0}
      emptyMessage="No leaderboard"
    >
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li key={`${entry.teamName}-${entry.rank}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{entry.rank}. {entry.teamName}</span>
            <span>{entry.totalPoints} pts</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
