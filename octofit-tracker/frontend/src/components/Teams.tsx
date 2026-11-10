import { useEffect, useState } from 'react';
import { apiBaseUrl } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = {
  _id?: string;
  name: string;
  mascot?: string;
  members?: Array<string | { toString(): string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTeams() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/teams`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message ?? 'Unable to load teams');
        }

        if (isMounted) {
          setTeams(payload.teams ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load teams');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadTeams();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={teams.length === 0}
      emptyMessage="No teams"
    >
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={team._id ?? `${team.name}-${index}`} className="list-group-item">
            <strong>{team.name}</strong> {team.mascot ? `(${team.mascot})` : ''} · {team.members?.length ?? 0} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
