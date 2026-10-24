import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { toast } from 'sonner';
import type { Conference, Profile, Season, Standings } from '../lib/types';
import { auth, db, isAdminEmail } from '../lib/firebase';

type Status = 'loading' | 'ready' | 'error';

interface Store {
  // Datos compartidos: viven en Firestore y llegan en directo a todos los navegadores.
  allProfiles: Profile[];
  seasons: Season[];
  legacyAwards: Record<string, string>;
  // Derivados de la temporada seleccionada
  season: Season;
  profiles: Profile[];
  actualAwards: Record<string, string>;
  status: Status;
  error: string;

  // Local de cada navegador
  activeId: string | null;
  seasonId: string | null;
  userEmail: string | null;
  isAdmin: boolean;

  init: () => () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;

  setActive: (id: string) => void;
  setSeason: (id: string) => void;
  startSeason: (label: string, standings: Standings, names: string[]) => Promise<boolean>;
  unarchiveSeason: (id: string) => void;
  deleteSeason: (id: string) => Promise<void>;
  addProfile: (name: string) => void;
  removeProfile: (id: string) => void;

  setPicks: (conf: Conference, ids: string[]) => void;
  addPick: (conf: Conference, id: string) => void;
  removePick: (conf: Conference, id: string) => void;
  setAward: (awardId: string, value: string) => void;

  setActualAward: (awardId: string, value: string) => void;
}

const profilesCol = () => collection(db!, 'profiles');
const profileDoc = (id: string) => doc(db!, 'profiles', id);
const actualAwardsDoc = () => doc(db!, 'settings', 'actualAwards');
const seasonsCol = () => collection(db!, 'seasons');
const seasonDoc = (id: string) => doc(db!, 'seasons', id);

export const DEFAULT_SEASON_LABEL = '2026-27';
const DEFAULT_SEASON: Season = {
  id: DEFAULT_SEASON_LABEL,
  label: DEFAULT_SEASON_LABEL,
  createdAt: 0,
  archived: false,
  actualAwards: {},
};

function toSeason(id: string, d: DocumentData): Season {
  return {
    id,
    label: String(d.label ?? id),
    createdAt: Number(d.createdAt ?? 0),
    archived: Boolean(d.archived),
    actualAwards: d.actualAwards ?? {},
    standings: d.standings,
    snapshotAt: d.snapshotAt,
  };
}

interface Raw {
  allProfiles: Profile[];
  seasons: Season[];
  legacyAwards: Record<string, string>;
  seasonId: string | null;
  activeId: string | null;
}

// Calcula lo que ve la app: la temporada elegida (por defecto la vigente), sus personas y sus premios reales.
function derive(r: Raw): Pick<Store, 'season' | 'profiles' | 'actualAwards' | 'activeId'> {
  const list = r.seasons.length ? r.seasons : [DEFAULT_SEASON];
  const current = [...list].reverse().find((x) => !x.archived) ?? list[list.length - 1];
  const season = list.find((x) => x.id === r.seasonId) ?? current;
  const first = list[0];
  const profiles = r.allProfiles
    .filter((p) => (p.season ?? first.id) === season.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  const actualAwards = { ...(season.id === first.id ? r.legacyAwards : {}), ...season.actualAwards };
  const activeId = profiles.some((p) => p.id === r.activeId) ? r.activeId : (profiles[0]?.id ?? null);
  return { season, profiles, actualAwards, activeId };
}

function toProfile(id: string, d: DocumentData): Profile {
  return {
    id,
    name: String(d.name ?? ''),
    createdAt: Number(d.createdAt ?? 0),
    picks: { east: d.picks?.east ?? [], west: d.picks?.west ?? [] },
    awards: d.awards ?? {},
    season: d.season ? String(d.season) : undefined,
  };
}

// Las escrituras se reflejan al instante en local (Firestore) y se sincronizan en segundo plano.
function write(promise: Promise<unknown>): void {
  promise.catch((e: unknown) => {
    const code = (e as { code?: string }).code;
    toast.error(
      code === 'permission-denied'
        ? 'Sin permiso: tu cuenta no es admin en las reglas de Firestore.'
        : 'No se pudo guardar. Revisa la conexión.',
    );
  });
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      // Aplica un cambio en los datos crudos y recalcula lo derivado.
      const apply = (patch: Partial<Raw> & { status?: Status }) =>
        set((s) => ({ ...patch, ...derive({ ...s, ...patch }) }));

      const activeProfile = (): Profile | undefined => {
        const s = get();
        return s.profiles.find((p) => p.id === s.activeId);
      };

      return {
        allProfiles: [],
        seasons: [],
        legacyAwards: {},
        ...derive({ allProfiles: [], seasons: [], legacyAwards: {}, seasonId: null, activeId: null }),
        status: 'loading',
        error: '',
        activeId: null,
        seasonId: null,
        userEmail: null,
        isAdmin: false,

        init: () => {
          if (!db || !auth) return () => {};

          const fail = (e: Error) => set({ status: 'error', error: e.message });

          const unsubAuth = onAuthStateChanged(auth, (user) =>
            set({ userEmail: user?.email ?? null, isAdmin: Boolean(user) && isAdminEmail(user?.email) }),
          );

          const unsubProfiles = onSnapshot(
            profilesCol(),
            (snap) => {
              apply({ allProfiles: snap.docs.map((d) => toProfile(d.id, d.data())), status: 'ready' });
            },
            fail,
          );

          const unsubSeasons = onSnapshot(
            seasonsCol(),
            (snap) =>
              apply({
                seasons: snap.docs.map((d) => toSeason(d.id, d.data())).sort((a, b) => a.createdAt - b.createdAt),
              }),
            // Si las reglas aún no incluyen `seasons`, la app sigue funcionando con la temporada por defecto.
            (e) => console.warn('No se pueden leer las temporadas (¿reglas sin publicar?):', e.message),
          );

          const unsubAwards = onSnapshot(
            actualAwardsDoc(),
            (snap) => apply({ legacyAwards: (snap.data() ?? {}) as Record<string, string> }),
            fail,
          );

          return () => {
            unsubAuth();
            unsubProfiles();
            unsubSeasons();
            unsubAwards();
          };
        },

        signIn: async () => {
          if (!auth) return;
          try {
            await signInWithPopup(auth, new GoogleAuthProvider());
          } catch (e) {
            const code = (e as { code?: string }).code;
            if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
              toast.error('No se pudo iniciar sesión con Google.');
            }
          }
        },

        signOut: async () => {
          if (auth) await firebaseSignOut(auth);
        },

        setActive: (id) => set({ activeId: id }),

        setSeason: (id) => apply({ seasonId: id }),

        // Archiva la temporada vigente con su clasificación final (captura) y abre una nueva.
        startSeason: async (label, standings, names) => {
          const s = get();
          const id = label.trim();
          if (!s.isAdmin || !id) return false;
          const list = s.seasons.length ? s.seasons : [DEFAULT_SEASON];
          if (list.some((x) => x.id === id)) {
            toast.error(`La temporada ${id} ya existe.`);
            return false;
          }
          const current = [...list].reverse().find((x) => !x.archived);
          try {
            const batch = writeBatch(db!);
            if (current) {
              batch.set(
                seasonDoc(current.id),
                {
                  label: current.label,
                  createdAt: current.createdAt,
                  archived: true,
                  // JSON para quitar los undefined, que Firestore no admite.
                  standings: JSON.parse(JSON.stringify(standings)) as Standings,
                  snapshotAt: Date.now(),
                },
                { merge: true },
              );
            }
            batch.set(seasonDoc(id), { label: id, createdAt: Date.now(), archived: false, actualAwards: {} });
            // Mismos participantes, con las predicciones vacías.
            const now = Date.now();
            names.forEach((name, i) =>
              batch.set(profileDoc(crypto.randomUUID()), {
                name,
                createdAt: now + i,
                picks: { east: [], west: [] },
                awards: {},
                season: id,
              }),
            );
            await batch.commit();
            apply({ seasonId: id });
            return true;
          } catch {
            toast.error('No se pudo crear la temporada.');
            return false;
          }
        },

        addProfile: (name) => {
          if (!get().isAdmin || !name.trim()) return;
          const id = crypto.randomUUID();
          set({ activeId: id });
          write(
            setDoc(profileDoc(id), {
              name: name.trim(),
              createdAt: Date.now(),
              picks: { east: [], west: [] },
              awards: {},
              season: get().season.id,
            }),
          );
        },

        removeProfile: (id) => {
          if (!get().isAdmin) return;
          write(deleteDoc(profileDoc(id)));
        },

        setPicks: (conf, ids) => {
          const p = activeProfile();
          if (!get().isAdmin || !p) return;
          write(updateDoc(profileDoc(p.id), { [`picks.${conf}`]: ids.slice(0, 10) }));
        },

        addPick: (conf, id) => {
          const p = activeProfile();
          if (!get().isAdmin || !p) return;
          const current = p.picks[conf];
          if (current.length >= 10 || current.includes(id)) return;
          write(updateDoc(profileDoc(p.id), { [`picks.${conf}`]: [...current, id] }));
        },

        removePick: (conf, id) => {
          const p = activeProfile();
          if (!get().isAdmin || !p) return;
          write(updateDoc(profileDoc(p.id), { [`picks.${conf}`]: p.picks[conf].filter((x) => x !== id) }));
        },

        setAward: (awardId, value) => {
          const p = activeProfile();
          if (!get().isAdmin || !p) return;
          write(updateDoc(profileDoc(p.id), { [`awards.${awardId}`]: value }));
        },

        unarchiveSeason: (id) => {
          if (!get().isAdmin) return;
          // Se conserva la captura guardada; solo se reabre la temporada.
          write(setDoc(seasonDoc(id), { archived: false }, { merge: true }));
        },

        // Borra la temporada con todas sus personas y premios reales.
        deleteSeason: async (id) => {
          const s = get();
          if (!s.isAdmin || s.seasons.length < 2) return;
          const first = s.seasons[0];
          try {
            const batch = writeBatch(db!);
            s.allProfiles
              .filter((p) => (p.season ?? first.id) === id)
              .forEach((p) => batch.delete(profileDoc(p.id)));
            batch.delete(seasonDoc(id));
            // Los premios antiguos sin temporada pertenecían a la primera: que no pasen a otra.
            if (id === first.id) batch.delete(actualAwardsDoc());
            await batch.commit();
            if (get().seasonId === id) apply({ seasonId: null });
            toast.success('Temporada eliminada');
          } catch {
            toast.error('No se pudo eliminar la temporada.');
          }
        },

        setActualAward: (awardId, value) => {
          if (!get().isAdmin) return;
          write(setDoc(seasonDoc(get().season.id), { actualAwards: { [awardId]: value } }, { merge: true }));
        },
      };
    },
    {
      name: 'nba-predictor-ui',
      version: 1,
      // Solo se recuerda qué persona estabas mirando; los datos viven en Firestore.
      partialize: (s) => ({ activeId: s.activeId, seasonId: s.seasonId }),
    },
  ),
);

export const useActiveProfile = (): Profile | null =>
  useStore((s) => s.profiles.find((p) => p.id === s.activeId) ?? s.profiles[0] ?? null);
