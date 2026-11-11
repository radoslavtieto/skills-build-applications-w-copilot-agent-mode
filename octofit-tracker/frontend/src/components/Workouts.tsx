import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = { title: string; reason?: string };
type SuggestionsResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loadItems={() => getJson<SuggestionsResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`).then(({ suggestions }) => suggestions)}
      emptyMessage="No workout suggestions found."
      renderItem={(suggestion) => <>{suggestion.title}{suggestion.reason ? ` - ${suggestion.reason}` : ''}</>}
    />
  );
}
