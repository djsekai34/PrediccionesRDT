// Función de Vercel: lee una página de Basketball Reference o Hashtag Basketball (con una tabla de jugadores)
// y devuelve los nombres de la primera tabla con columna "Player". Solo la puede usar un admin.

const ALLOWED_HOSTS = ['basketball-reference.com', 'hashtagbasketball.com'];
const MAX_NAMES = 15;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// El token de Google del admin se comprueba con la API REST de Firebase Auth (sin dependencias extra).
async function isAdmin(request: Request): Promise<boolean> {
  const token = /^Bearer (.+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  const key = process.env.VITE_FIREBASE_API_KEY;
  if (!token || !key) return false;

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });
  if (!res.ok) return false;

  const user = ((await res.json()) as { users?: { email?: string; emailVerified?: boolean }[] }).users?.[0];
  const email = user?.email?.toLowerCase();
  const admins = (process.env.VITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && user?.emailVerified && admins.includes(email));
}

const hostAllowed = (host: string): boolean =>
  ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(text: string): string {
  return text
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

const textOf = (html: string): string => decode(html.replace(/<[^>]*>/g, ''));

// Hashtag Basketball pone el nombre y luego su versión corta ("Yaxel Lendeborg" + "Y.Lendeborg") en la misma
// celda, y al quitar las etiquetas quedan pegados. Nos quedamos con el primer trozo de texto, y si aun así
// llegan pegados se quita la versión corta final.
function nameOf(cellHtml: string): string {
  const first = cellHtml.split(/<[^>]*>/).map(decode).find(Boolean) ?? '';
  const m = /^(.*?[a-z.'’])([A-Z]\.\s?[\p{L}'’ .-]+)$/u.exec(first);
  if (m) {
    const surname = m[2].replace(/^[A-Z]\.\s?/, '');
    if (m[1].startsWith(m[2][0]) && m[1].endsWith(surname)) return m[1].trim();
  }
  return first;
}

const isNameHeader = (s: string): boolean => /^(player|name)$/i.test(s);

// Primera tabla que tenga una columna de jugador. Basketball Reference mete muchas tablas dentro de
// comentarios HTML, así que se quitan las marcas de comentario antes de buscar.
function playersFromHtml(html: string): string[] {
  const tables = html.replace(/<!--|-->/g, '').match(/<table[\s\S]*?<\/table>/gi) ?? [];

  for (const table of tables) {
    const names: string[] = [];
    let col = -1;

    for (const row of table.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
      const cells = [...row.matchAll(/<(t[dh])\b([^>]*)>([\s\S]*?)<\/\1>/gi)].map((m) => ({
        attrs: m[2],
        html: m[3],
        text: textOf(m[3]),
      }));

      if (col < 0) {
        col = cells.findIndex((c) => isNameHeader(c.text));
        continue;
      }

      const byStat = cells.find((c) => /data-stat="(player|name_display|name)"/i.test(c.attrs));
      const cell = byStat ?? cells[col];
      const name = cell ? nameOf(cell.html).replace(/[*†‡]+$/, '').trim() : '';
      if (name && !isNameHeader(name)) names.push(name);
    }

    if (names.length) return [...new Set(names)];
  }
  return [];
}

export async function GET(request: Request): Promise<Response> {
  if (!(await isAdmin(request))) return json({ error: 'Solo para admins. Inicia sesión de nuevo.' }, 403);

  const params = new URL(request.url).searchParams;
  const limit = Math.min(MAX_NAMES, Math.max(1, Number(params.get('limit')) || 10));

  let target: URL;
  try {
    target = new URL(params.get('url') ?? '');
  } catch {
    return json({ error: 'La URL no es válida.' }, 400);
  }
  if (target.protocol !== 'https:' || !hostAllowed(target.hostname)) {
    return json({ error: 'Solo se admiten páginas de basketball-reference.com y hashtagbasketball.com.' }, 400);
  }

  let html: string;
  try {
    const res = await fetch(target, {
      headers: { 'user-agent': 'PrediccionesRDT/1.0 (proyecto personal)', accept: 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (!hostAllowed(new URL(res.url).hostname)) return json({ error: 'La página redirige a otro sitio.' }, 400);
    if (!res.ok) return json({ error: `La web respondió ${res.status}. Pega los nombres a mano.` }, 502);
    html = await res.text();
  } catch {
    return json({ error: 'No se pudo leer la página. Pega los nombres a mano.' }, 502);
  }

  const names = playersFromHtml(html).slice(0, limit);
  if (!names.length) return json({ error: 'No he encontrado una tabla de jugadores. Pega los nombres a mano.' }, 422);
  return json({ names });
}
