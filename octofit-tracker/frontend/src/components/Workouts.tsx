import { useEffect, useState } from 'react';
import { apiBaseUrl } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  reason?: string;
  minutes?: number;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkouts() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/workouts/suggestions/mona@example.com`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message ?? 'Unable to load workout suggestions');
        }

        if (isMounted) {
          setSuggestions(payload.suggestions ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load workout suggestions');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadWorkouts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={suggestions.length === 0}
      emptyMessage="No workout suggestions"
    >
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title}-${index}`} className="list-group-item">
            <strong>{suggestion.title}</strong>
            {suggestion.focus ? <div>{suggestion.focus}</div> : null}
            {suggestion.reason ? <small className="text-body-secondary">{suggestion.reason}</small> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
