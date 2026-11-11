import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  return (
    <CapabilityCard<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      loadItems={() => getJson<ActivitiesResponse>('/api/activities').then(({ activities }) => activities)}
      emptyMessage="No activities found."
      renderItem={(activity) => <>{activity.type} - {activity.minutes} minutes, {activity.points} points</>}
    />
  );
}
