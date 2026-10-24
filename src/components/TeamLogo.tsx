import { useState } from 'react';
import type { Team } from '../lib/types';
import { teamLogo } from '../data/teams';

interface Props {
  team: Team;
  size?: number;
  src?: string;
}

export function TeamLogo({ team, size = 32, src }: Props) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (failed) {
    return (
      <span
        style={style}
        className="grid shrink-0 place-items-center rounded-full bg-zinc-800 font-display text-xs font-bold text-zinc-300"
      >
        {team.abbr}
      </span>
    );
  }

  return (
    <img
      src={src ?? teamLogo(team)}
      alt={team.name}
      loading="lazy"
      style={style}
      className="shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}
