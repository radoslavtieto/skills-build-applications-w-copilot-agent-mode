import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; members: unknown[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      loadItems={() => getJson<TeamsResponse>('/api/teams').then(({ teams }) => teams)}
      emptyMessage="No teams found."
      renderItem={(team) => <>{team.name} - {team.members.length} members</>}
    />
  );
}
