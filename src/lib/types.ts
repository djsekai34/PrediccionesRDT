export type Conference = 'east' | 'west';

export interface Team {
  id: string;
  abbr: string;
  city: string;
  name: string;
  conf: Conference;
}

export interface StandingRow {
  teamId: string;
  rank: number;
  wins: number;
  losses: number;
  winPct: number;
  streak: string;
  logo?: string;
}

export type Standings = Record<Conference, StandingRow[]>;

export interface StandingsResult {
  standings: Standings;
  season: string;
  fetchedAt: number;
}

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
  picks: Record<Conference, string[]>;
  awards: Record<string, string>;
  /** Temporada a la que pertenece. Sin valor = la primera temporada (datos anteriores). */
  season?: string;
}

export interface Season {
  id: string;
  label: string;
  createdAt: number;
  archived: boolean;
  actualAwards: Record<string, string>;
  /** Clasificación final congelada al archivar (la "captura"). */
  standings?: Standings;
  snapshotAt?: number;
}
