// ESPN no publica foto de los entrenadores en sus plantillas: se busca la foto del artículo de
// Wikipedia (API pública con CORS) y se guarda en el navegador para no repetir la petición.

const KEY = 'nba-coach-photos-v1';

function readAll(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function save(name: string, url: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [name]: url }));
  } catch {
    // sin caché, no pasa nada
  }
}

interface WikiResponse {
  query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
}

// Devuelve la URL de la foto, o '' si no hay.
export async function fetchCoachPhoto(name: string): Promise<string> {
  const cached = readAll()[name];
  if (cached !== undefined) return cached;

  const search = encodeURIComponent(`${name} NBA head coach`);
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&generator=search' +
    `&gsrsearch=${search}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=200&format=json&origin=*`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wikipedia respondió ${res.status}`);

  const json = (await res.json()) as WikiResponse;
  const page = Object.values(json.query?.pages ?? {})[0];
  const src = page?.thumbnail?.source ?? '';
  save(name, src);
  return src;
}
