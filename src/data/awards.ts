export interface Award {
  id: string;
  label: string;
  description: string;
  kind?: 'coach'; // sin kind = jugador
  suggestions: string[];
}

// Las sugerencias son solo ayuda para escribir: se puede poner cualquier jugador.
export const AWARDS: Award[] = [
  {
    id: 'mvp',
    label: 'MVP',
    description: 'Jugador más valioso de la temporada regular',
    suggestions: [
      'Shai Gilgeous-Alexander',
      'Nikola Jokić',
      'Luka Dončić',
      'Giannis Antetokounmpo',
      'Victor Wembanyama',
      'Anthony Edwards',
      'Jalen Brunson',
      'Jayson Tatum',
      'Cade Cunningham',
      'Stephen Curry',
    ],
  },
  {
    id: 'dpoy',
    label: 'Mejor defensor',
    description: 'Defensive Player of the Year',
    suggestions: [
      'Victor Wembanyama',
      'Evan Mobley',
      'Chet Holmgren',
      'Bam Adebayo',
      'Dyson Daniels',
      'Amen Thompson',
      'Jaren Jackson Jr.',
      'Draymond Green',
    ],
  },
  {
    id: 'roy',
    label: 'Novato del año',
    description: 'Rookie of the Year',
    suggestions: ['AJ Dybantsa', 'Cameron Boozer', 'Darryn Peterson'],
  },
  {
    id: 'smoy',
    label: 'Mejor sexto hombre',
    description: 'Sixth Man of the Year',
    suggestions: ['Naz Reid', 'Payton Pritchard', 'Tyler Herro', 'Jordan Clarkson', 'Ty Jerome'],
  },
  {
    id: 'mip',
    label: 'Mejor progresión',
    description: 'Most Improved Player',
    suggestions: [
      'Jalen Johnson',
      'Alperen Şengün',
      'Amen Thompson',
      'Franz Wagner',
      'Scottie Barnes',
      'Jalen Williams',
    ],
  },
  {
    id: 'coy',
    kind: 'coach',
    label: 'Entrenador del año',
    description: 'Coach of the Year',
    suggestions: [
      'Mark Daigneault',
      'Mike Brown',
      'Kenny Atkinson',
      'J.B. Bickerstaff',
      'Mitch Johnson',
      'Ime Udoka',
      'Joe Mazzulla',
      'Erik Spoelstra',
    ],
  },
];
