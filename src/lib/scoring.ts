import type { Profile, StandingRow, Standings } from './types';
import { AWARDS } from '../data/awards';

export const POINTS = {
  exact: 3, // posición exacta
  oneOff: 2, // a 1 puesto
  twoOff: 1, // a 2 puestos
  award: 5, // premio acertado
} as const;

export const MAX_PER_CONFERENCE = 10 * POINTS.exact;

export interface TeamScore {
  teamId: string;
  predicted: number;
  actual: number | null;
  diff: number | null;
  points: number;
}

export interface ConferenceScore {
  rows: TeamScore[];
  total: number;
  exact: number;
}

export function hasStarted(standings: Standings): boolean {
  return [...standings.east, ...standings.west].some((r) => r.wins + r.losses > 0);
}

export function scoreConference(picks: string[], actual: StandingRow[]): ConferenceScore {
  const rankOf = new Map(actual.map((r) => [r.teamId, r.rank]));

  const rows = picks.map<TeamScore>((teamId, i) => {
    const predicted = i + 1;
    const rank = rankOf.get(teamId) ?? null;
    const diff = rank === null ? null : Math.abs(rank - predicted);
    const points = diff === null ? 0 : Math.max(0, POINTS.exact - diff);
    return { teamId, predicted, actual: rank, diff, points };
  });

  return {
    rows,
    total: rows.reduce((sum, r) => sum + r.points, 0),
    exact: rows.filter((r) => r.diff === 0).length,
  };
}

export const normalizeName = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export interface AwardScore {
  awardId: string;
  pick: string;
  winner: string;
  decided: boolean;
  hit: boolean;
}

export function scoreAwards(profile: Profile, actualAwards: Record<string, string>): AwardScore[] {
  return AWARDS.map((award) => {
    const pick = profile.awards[award.id] ?? '';
    const winner = actualAwards[award.id] ?? '';
    const decided = winner.trim() !== '';
    const hit = decided && pick.trim() !== '' && normalizeName(pick) === normalizeName(winner);
    return { awardId: award.id, pick, winner, decided, hit };
  });
}

export const awardsTotal = (scores: AwardScore[]): number =>
  scores.filter((s) => s.hit).length * POINTS.award;

export interface ProfileTotals {
  east: ConferenceScore;
  west: ConferenceScore;
  awards: number;
  total: number;
}

export function scoreProfile(
  profile: Profile,
  standings: Standings,
  actualAwards: Record<string, string>,
): ProfileTotals {
  const started = hasStarted(standings);
  const empty: ConferenceScore = { rows: [], total: 0, exact: 0 };
  const east = started ? scoreConference(profile.picks.east, standings.east) : empty;
  const west = started ? scoreConference(profile.picks.west, standings.west) : empty;
  const awards = awardsTotal(scoreAwards(profile, actualAwards));
  return { east, west, awards, total: east.total + west.total + awards };
}
