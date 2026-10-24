import { useState } from 'react';
import { ArrowLeft, CalendarPlus, Crown, ListOrdered, Medal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchStandings } from '../lib/espn';
import { ArchivedBanner, SeasonSwitcher } from './SeasonSwitcher';
import { Logo } from './Logo';
import { href, navigate } from '../lib/route';
import clsx from 'clsx';
import { useActiveProfile, useStore } from '../store/useStore';
import { AWARDS } from '../data/awards';
import { usePlayers } from '../hooks/usePlayers';
import { listFor } from '../lib/players';
import { AdminBar } from './AdminBar';
import { NewProfileForm, ProfileBar } from './ProfileBar';
import { ConferencePicks } from './ConferencePicks';
import { AwardsPanel } from './AwardsPanel';
import { PlayerCombobox } from './PlayerCombobox';

type Tab = 'picks' | 'awards' | 'winners' | 'seasons';

function WinnersPanel() {
  const actualAwards = useStore((s) => s.actualAwards);
  const setActualAward = useStore((s) => s.setActualAward);
  const { players, loading } = usePlayers();

  return (
    <section className="mx-auto max-w-2xl card p-5">
      <h2 className="section-title">Ganadores reales</h2>
      <p className="mb-4 mt-1 text-sm text-zinc-500">
        Apunta aquí quién gana cada premio cuando se anuncie. Es común a todas las personas y puntúa al instante.
      </p>
      <ul className="space-y-3">
        {AWARDS.map((award) => (
          <li key={award.id}>
            <p className="mb-1 text-sm font-medium">{award.label}</p>
            <PlayerCombobox
              id={`winner-${award.id}`}
              value={actualAwards[award.id] ?? ''}
              onChange={(v) => setActualAward(award.id, v)}
              players={listFor(players, award.kind)}
              kind={award.kind}
              suggestions={award.suggestions}
              loading={loading}
              placeholder={award.kind === 'coach' ? 'Busca un entrenador' : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function nextLabel(label: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(label);
  if (!m) return '';
  const y = Number(m[1]) + 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

function StartSeasonModal({
  label,
  names,
  busy,
  onCancel,
  onConfirm,
}: {
  label: string;
  names: string[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: (names: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>(names);
  const toggle = (n: string) => setPicked((c) => (c.includes(n) ? c.filter((x) => x !== n) : [...c, n]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div role="dialog" aria-modal="true" className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="section-title">Nueva temporada {label}</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Se congelará la clasificación actual. ¿Quién repite? Se crearán con las predicciones vacías.
        </p>

        {names.length > 0 ? (
          <>
            <div className="mb-2 mt-4 flex items-center justify-between text-xs text-zinc-500">
              <span>
                {picked.length}/{names.length} participantes
              </span>
              <span className="flex gap-3">
                <button onClick={() => setPicked(names)} className="hover:text-zinc-200">Todos</button>
                <button onClick={() => setPicked([])} className="hover:text-zinc-200">Ninguno</button>
              </span>
            </div>
            <ul className="max-h-64 space-y-1.5 overflow-y-auto">
              {names.map((n) => (
                <li key={n}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 px-3 py-2 text-sm transition hover:border-zinc-600">
                    <input type="checkbox" checked={picked.includes(n)} onChange={() => toggle(n)} className="accent-brand-500" />
                    {n}
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No hay participantes en la temporada vigente.</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(picked)}
            disabled={busy}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-50"
          >
            {busy ? 'Creando…' : 'Crear temporada'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SeasonsPanel() {
  const seasons = useStore((s) => s.seasons);
  const season = useStore((s) => s.season);
  const allProfiles = useStore((s) => s.allProfiles);
  const startSeason = useStore((s) => s.startSeason);
  const unarchiveSeason = useStore((s) => s.unarchiveSeason);
  const deleteSeason = useStore((s) => s.deleteSeason);
  const list = seasons.length ? seasons : [season];
  const current = [...list].reverse().find((x) => !x.archived);
  const [label, setLabel] = useState(nextLabel(current?.label ?? ''));
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const names = current
    ? allProfiles.filter((p) => (p.season ?? list[0].id) === current.id).sort((a, b) => a.createdAt - b.createdAt).map((p) => p.name)
    : [];

  function ask() {
    if (!/^\d{4}-\d{2}$/.test(label.trim())) return toast.error('Usa el formato 2027-28.');
    setOpen(true);
  }

  async function start(chosen: string[]) {
    const id = label.trim();
    setBusy(true);
    try {
      const { standings } = await fetchStandings();
      if (await startSeason(id, standings, chosen)) {
        toast.success(`Temporada ${id} creada`);
        setOpen(false);
      }
    } catch {
      toast.error('No se pudo leer la clasificación de ESPN; no se ha cambiado nada.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl card p-5">
      <h2 className="section-title">Temporadas</h2>
      <p className="mb-4 mt-1 text-sm text-zinc-500">
        Al crear una temporada nueva, la vigente se archiva con su clasificación final (como una captura): se sigue
        viendo y comparando, pero ya no se actualiza. La nueva empieza con las predicciones vacías.
      </p>
      <ul className="mb-5 space-y-1.5 text-sm">
        {[...list].reverse().map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 px-3 py-2">
            <span className="font-medium">{s.label}</span>
            <span className="flex items-center gap-3 text-xs text-zinc-500">
              {s.archived ? 'Archivada' : 'Vigente'}
              {s.archived && (
                <button
                  onClick={() => {
                    if (window.confirm(`Se reabrirá ${s.label} y volverá a usar la clasificación en directo de ESPN. ¿Seguir?`)) unarchiveSeason(s.id);
                  }}
                  className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  Desarchivar
                </button>
              )}
              {seasons.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Se eliminará la temporada ${s.label} con todos sus participantes, predicciones y premios. No se puede deshacer. ¿Seguro?`)) void deleteSeason(s.id);
                  }}
                  aria-label={`Eliminar ${s.label}`}
                  className="rounded-md border border-red-500/30 p-1.5 text-red-400 transition hover:bg-red-500/10"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="2027-28"
          className="w-32 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <button
          onClick={ask}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          <CalendarPlus size={15} /> Archivar vigente y crear nueva
        </button>
      </div>
      {open && (
        <StartSeasonModal label={label.trim()} names={names} busy={busy} onCancel={() => !busy && setOpen(false)} onConfirm={start} />
      )}
    </section>
  );
}

export function AdminPage() {
  const userEmail = useStore((s) => s.userEmail);
  const isAdmin = useStore((s) => s.isAdmin);
  const status = useStore((s) => s.status);
  const hasProfiles = useStore((s) => s.profiles.length > 0);
  const profile = useActiveProfile();
  const season = useStore((s) => s.season);
  const [tab, setTab] = useState<Tab>('picks');

  const tabs: { id: Tab; label: string; icon: typeof Crown }[] = [
    { id: 'picks', label: 'Predicciones', icon: ListOrdered },
    { id: 'awards', label: 'Premios', icon: Crown },
    { id: 'winners', label: 'Ganadores reales', icon: Medal },
    { id: 'seasons', label: 'Temporadas', icon: CalendarPlus },
  ];

  function body() {
    if (!userEmail) {
      return (
        <div className="mx-auto mt-12 max-w-sm card p-6">
          <h2 className="mb-1 font-display text-3xl font-bold uppercase">Zona admin</h2>
          <p className="text-sm text-zinc-500">Entra con la cuenta de Google autorizada para editar.</p>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="mb-1 font-display text-3xl font-bold uppercase">Sin permisos</h2>
          <p className="text-sm text-zinc-400">
            La cuenta <b>{userEmail}</b> no es admin. Usa la que pusiste en <code>firestore.rules</code>.
          </p>
        </div>
      );
    }

    if (status === 'loading') return <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-900/60" />;

    if (!hasProfiles) {
      return (
        <div className="mx-auto mt-12 max-w-sm card p-6">
          <h2 className="mb-1 font-display text-3xl font-bold uppercase">Primera persona</h2>
          <p className="mb-4 text-sm text-zinc-500">Añade a la primera persona para empezar.</p>
          <NewProfileForm autoFocus />
        </div>
      );
    }

    return (
      <>
        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx(
                'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition sm:px-4',
                tab === id
                  ? 'border-brand-500 text-brand-300'
                  : 'border-transparent text-zinc-500 hover:text-zinc-200',
              )}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SeasonSwitcher />
          <span className="text-xs text-zinc-500">Editando la temporada {season.label}</span>
        </div>
        <div className="mt-4">
          <ArchivedBanner />
        </div>

        {tab !== 'winners' && tab !== 'seasons' && (
          <div className="mt-5">
            <ProfileBar manage />
          </div>
        )}

        <main className="mt-6">
          {tab === 'picks' && profile && (
            <div className="grid gap-5 lg:grid-cols-2">
              <ConferencePicks conf="east" picks={profile.picks.east} />
              <ConferencePicks conf="west" picks={profile.picks.west} />
            </div>
          )}
          {tab === 'awards' && profile && <AwardsPanel profile={profile} />}
          {tab === 'winners' && <WinnersPanel />}
          {tab === 'seasons' && <SeasonsPanel />}
        </main>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Logo size={52} />
        <div className="mr-auto">
          <h1 className="font-display text-4xl font-extrabold leading-none tracking-wide">
            Admin <span className="text-rdt-red-400">RDT</span>
          </h1>
          <a href={href('/')} onClick={(e) => { e.preventDefault(); navigate('/'); }} className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-200">
            <ArrowLeft size={13} /> Volver a la app
          </a>
        </div>
        <AdminBar />
      </header>

      {body()}
    </div>
  );
}
