import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: unknown[] };

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      dataKey="teams"
      emptyMessage="No teams found."
      renderItem={(team) => <>{team.name} - {team.members.length} members</>}
    />
  );
}
