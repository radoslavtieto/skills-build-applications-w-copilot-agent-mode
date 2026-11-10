import { useEffect, useState } from 'react';
import { apiBaseUrl } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = {
  _id?: string;
  type: string;
  minutes: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/activities`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message ?? 'Unable to load activities');
        }

        if (isMounted) {
          setActivities(payload.activities ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load activities');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadActivities();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      empty={activities.length === 0}
      emptyMessage="No activities"
    >
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={activity._id ?? `${activity.type}-${index}`} className="list-group-item">
            <strong>{activity.type}</strong> · {activity.minutes} minutes · {activity.points ?? 0} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
