import { auth } from './firebase';

/** Pide a la función de Vercel los jugadores de la tabla de esa página (solo funciona con sesión de admin). */
export async function fetchSuggestionsFromUrl(url: string, limit = 10): Promise<string[]> {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Inicia sesión como admin.');

  const res = await fetch(`/api/suggestions?${new URLSearchParams({ url, limit: String(limit) })}`, {
    headers: { authorization: `Bearer ${token}` },
  });

  let data: { names?: string[]; error?: string } | null = null;
  try {
    data = await res.json();
  } catch {
    // En local (`npm run dev`) no existe /api y devuelve HTML.
  }
  if (!res.ok || !data?.names) {
    throw new Error(data?.error ?? 'La lectura automática solo funciona en la web publicada. Pega los nombres a mano.');
  }
  return data.names;
}

/** Un nombre por línea, sin vacíos ni repetidos. */
export function parseNames(text: string, max = 15): string[] {
  const names = text
    .split(/\r?\n/)
    .map((n) => n.trim())
    .filter(Boolean);
  return [...new Set(names)].slice(0, max);
}
