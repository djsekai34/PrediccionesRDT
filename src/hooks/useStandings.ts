import { useQuery } from '@tanstack/react-query';
import { fetchStandings } from '../lib/espn';
import type { StandingsResult } from '../lib/types';
import { useStore } from '../store/useStore';

const FIVE_MINUTES = 5 * 60 * 1000;

// Temporada vigente: ESPN en directo. Temporada archivada: la captura guardada, sin llamadas a ESPN.
export function useStandings() {
  const season = useStore((s) => s.season);
  const frozen = season.archived && Boolean(season.standings);

  const query = useQuery({
    queryKey: ['nba-standings'],
    queryFn: fetchStandings,
    enabled: !frozen,
    staleTime: FIVE_MINUTES,
    refetchInterval: frozen ? false : FIVE_MINUTES,
    retry: 2,
  });

  if (frozen && season.standings) {
    const data: StandingsResult = {
      standings: season.standings,
      season: season.label,
      fetchedAt: season.snapshotAt ?? season.createdAt,
    };
    return {
      data,
      isLoading: false,
      isError: false,
      isFetching: false,
      frozen: true,
      refetch: async () => {},
    };
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    frozen: false,
    refetch: query.refetch,
  };
}
