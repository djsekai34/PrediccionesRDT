import { TEAMS } from '../data/teams';
import { normalizeName } from './scoring';

export interface Player {
  id: string;
  name: string;
  team?: string;
  pos?: string;
}

export const headshotUrl = (id: string): string =>
  `https://a.espncdn.com/i/headshots/nba/players/full/${id}.png`;

const rosterUrl = (teamId: string): string =>
  `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`;

interface EspnAthlete {
  id: string;
  displayName?: string;
  fullName?: string;
  position?: { abbreviation?: string };
}

interface EspnCoach {
  id: string;
  firstName?: string;
  lastName?: string;
}

interface EspnRoster {
  athletes?: EspnAthlete[];
  coach?: EspnCoach[];
}

export const COACH_POS = 'Entrenador';

export const isCoach = (p: Player): boolean => p.pos === COACH_POS;

// Lista para un premio: entrenadores para el de entrenador, jugadores para el resto.
export const listFor = (all: Player[], kind?: 'coach'): Player[] =>
  all.filter((p) => isCoach(p) === (kind === 'coach'));

const CACHE_KEY = 'nba-players-v2';
const DAY = 24 * 60 * 60 * 1000;

interface Cache {
  at: number;
  players: Player[];
}

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch {
    return null;
  }
}

function writeCache(players: Player[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), players } satisfies Cache));
  } catch {
    // sin caché, no pasa nada
  }
}

// Todas las plantillas de la NBA (30 peticiones en paralelo), cacheadas 24 h en el navegador.
export async function fetchPlayers(): Promise<Player[]> {
  const cached = readCache();
  if (cached && Date.now() - cached.at < DAY) return cached.players;

  const results = await Promise.allSettled(
    TEAMS.map(async (team): Promise<Player[]> => {
      const res = await fetch(rosterUrl(team.id));
      if (!res.ok) throw new Error(`ESPN respondió ${res.status}`);
      const json = (await res.json()) as EspnRoster;
      const players = (json.athletes ?? []).flatMap((a) => {
        const name = a.displayName ?? a.fullName;
        return name ? [{ id: a.id, name, team: team.abbr, pos: a.position?.abbreviation }] : [];
      });
      const coaches = (json.coach ?? []).flatMap((c) => {
        const name = [c.firstName, c.lastName].filter(Boolean).join(' ');
        return name ? [{ id: `coach-${c.id}`, name, team: team.abbr, pos: COACH_POS }] : [];
      });
      return [...players, ...coaches];
    }),
  );

  const byId = new Map<string, Player>();
  for (const r of results) {
    if (r.status === 'fulfilled') r.value.forEach((p) => byId.set(p.id, p));
  }
  const players = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));

  if (players.length < 100) {
    if (cached) return cached.players;
    throw new Error('Plantillas no disponibles');
  }

  writeCache(players);
  return players;
}

function lev(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

// Menor es mejor; null = no coincide. Tolera tildes, mayúsculas y erratas ("mickey conely" -> Mike Conley).
function score(name: string, q: string, qTokens: string[]): number | null {
  if (name.startsWith(q)) return 0;
  if (name.includes(q)) return 1;

  const nTokens = name.split(' ');
  let total = 0;
  for (const qt of qTokens) {
    const allowed = Math.max(1, Math.floor(qt.length / 3));
    let best = Infinity;
    for (const nt of nTokens) best = Math.min(best, lev(qt, nt.slice(0, qt.length)), lev(qt, nt));
    if (best > allowed) return null;
    total += best;
  }
  return 2 + total;
}

export function searchPlayers(players: Player[], query: string, limit = 8): Player[] {
  const q = normalizeName(query);
  if (!q) return [];
  const qTokens = q.split(' ');

  return players
    .flatMap((p) => {
      const s = score(normalizeName(p.name), q, qTokens);
      return s === null ? [] : [{ p, s }];
    })
    .sort((a, b) => a.s - b.s || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}
