import type { Conference, StandingRow, Standings, StandingsResult } from './types';

// Endpoint público (no oficial) de ESPN, sin API key.
const ESPN_STANDINGS_URL = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';

interface EspnStat {
  name: string;
  value?: number;
  displayValue?: string;
}

interface EspnEntry {
  team: { id: string; logos?: { href: string }[] };
  stats: EspnStat[];
}

interface EspnChild {
  name: string;
  standings?: { seasonDisplayName?: string; entries: EspnEntry[] };
}

interface EspnResponse {
  children?: EspnChild[];
}

const stat = (entry: EspnEntry, name: string): EspnStat | undefined =>
  entry.stats.find((s) => s.name === name);

const num = (entry: EspnEntry, name: string): number => stat(entry, name)?.value ?? 0;

function parseConference(entries: EspnEntry[]): StandingRow[] {
  const rows = entries.map((e) => ({
    teamId: e.team.id,
    wins: num(e, 'wins'),
    losses: num(e, 'losses'),
    winPct: num(e, 'winPercent'),
    seed: num(e, 'playoffSeed') || 99,
    streak: stat(e, 'streak')?.displayValue ?? '-',
    logo: e.team.logos?.[0]?.href,
  }));

  rows.sort((a, b) => b.winPct - a.winPct || b.wins - a.wins || a.seed - b.seed);

  return rows.map(({ seed: _seed, ...row }, i) => ({ ...row, rank: i + 1 }));
}

export async function fetchStandings(): Promise<StandingsResult> {
  const res = await fetch(ESPN_STANDINGS_URL);
  if (!res.ok) throw new Error(`ESPN respondió ${res.status}`);

  const json = (await res.json()) as EspnResponse;
  const children = json.children ?? [];

  const find = (conf: Conference): EspnChild | undefined =>
    children.find((c) => c.name.toLowerCase().includes(conf === 'east' ? 'east' : 'west'));

  const east = find('east');
  const west = find('west');
  if (!east?.standings || !west?.standings) {
    throw new Error('Formato de clasificación inesperado');
  }

  const standings: Standings = {
    east: parseConference(east.standings.entries),
    west: parseConference(west.standings.entries),
  };

  return {
    standings,
    season: east.standings.seasonDisplayName ?? '',
    fetchedAt: Date.now(),
  };
}
