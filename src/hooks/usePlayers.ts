import { useQuery } from '@tanstack/react-query';
import { fetchPlayers, type Player } from '../lib/players';

const DAY = 24 * 60 * 60 * 1000;
const NONE: Player[] = [];

export function usePlayers(): { players: Player[]; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['nba-players'],
    queryFn: fetchPlayers,
    staleTime: DAY,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  return { players: data ?? NONE, loading: isLoading };
}
