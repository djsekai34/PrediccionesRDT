import type { Conference, Team } from '../lib/types';

const t = (id: string, abbr: string, city: string, name: string, conf: Conference): Team => ({
  id,
  abbr,
  city,
  name,
  conf,
});

// Los ids son los de ESPN (los mismos que devuelve la API de clasificación).
export const TEAMS: Team[] = [
  t('1', 'ATL', 'Atlanta', 'Hawks', 'east'),
  t('2', 'BOS', 'Boston', 'Celtics', 'east'),
  t('3', 'NO', 'New Orleans', 'Pelicans', 'west'),
  t('4', 'CHI', 'Chicago', 'Bulls', 'east'),
  t('5', 'CLE', 'Cleveland', 'Cavaliers', 'east'),
  t('6', 'DAL', 'Dallas', 'Mavericks', 'west'),
  t('7', 'DEN', 'Denver', 'Nuggets', 'west'),
  t('8', 'DET', 'Detroit', 'Pistons', 'east'),
  t('9', 'GS', 'Golden State', 'Warriors', 'west'),
  t('10', 'HOU', 'Houston', 'Rockets', 'west'),
  t('11', 'IND', 'Indiana', 'Pacers', 'east'),
  t('12', 'LAC', 'LA', 'Clippers', 'west'),
  t('13', 'LAL', 'Los Angeles', 'Lakers', 'west'),
  t('14', 'MIA', 'Miami', 'Heat', 'east'),
  t('15', 'MIL', 'Milwaukee', 'Bucks', 'east'),
  t('16', 'MIN', 'Minnesota', 'Timberwolves', 'west'),
  t('17', 'BKN', 'Brooklyn', 'Nets', 'east'),
  t('18', 'NY', 'New York', 'Knicks', 'east'),
  t('19', 'ORL', 'Orlando', 'Magic', 'east'),
  t('20', 'PHI', 'Philadelphia', '76ers', 'east'),
  t('21', 'PHX', 'Phoenix', 'Suns', 'west'),
  t('22', 'POR', 'Portland', 'Trail Blazers', 'west'),
  t('23', 'SAC', 'Sacramento', 'Kings', 'west'),
  t('24', 'SA', 'San Antonio', 'Spurs', 'west'),
  t('25', 'OKC', 'Oklahoma City', 'Thunder', 'west'),
  t('26', 'UTAH', 'Utah', 'Jazz', 'west'),
  t('27', 'WSH', 'Washington', 'Wizards', 'east'),
  t('28', 'TOR', 'Toronto', 'Raptors', 'east'),
  t('29', 'MEM', 'Memphis', 'Grizzlies', 'west'),
  t('30', 'CHA', 'Charlotte', 'Hornets', 'east'),
];

export const TEAMS_BY_ID: Record<string, Team> = Object.fromEntries(TEAMS.map((x) => [x.id, x]));

export const teamsOf = (conf: Conference): Team[] => TEAMS.filter((x) => x.conf === conf);

export const teamLogo = (team: Team): string =>
  `https://a.espncdn.com/i/teamlogos/nba/500/${team.abbr.toLowerCase()}.png`;

export const CONF_LABEL: Record<Conference, string> = {
  east: 'Este',
  west: 'Oeste',
};
