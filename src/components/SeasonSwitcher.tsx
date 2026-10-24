import clsx from 'clsx';
import { Archive } from 'lucide-react';
import { useStore } from '../store/useStore';

export function SeasonSwitcher() {
  const seasons = useStore((s) => s.seasons);
  const season = useStore((s) => s.season);
  const setSeason = useStore((s) => s.setSeason);

  if (seasons.length < 2) return null;

  return (
    <div role="tablist" aria-label="Temporada" className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-zinc-950/60 p-1">
      {[...seasons].reverse().map((s) => (
        <button
          key={s.id}
          role="tab"
          aria-selected={s.id === season.id}
          onClick={() => setSeason(s.id)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition',
            s.id === season.id ? 'bg-brand-500/25 text-white ring-1 ring-brand-400/40' : 'text-zinc-400 hover:text-zinc-100',
          )}
        >
          {s.archived && <Archive size={12} />}
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function ArchivedBanner() {
  const season = useStore((s) => s.season);
  if (!season.archived) return null;
  return (
    <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
      <Archive size={16} className="mt-0.5 shrink-0" />
      <span>
        Temporada {season.label} archivada: la clasificación real quedó congelada
        {season.snapshotAt
          ? ` el ${new Date(season.snapshotAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
          : ''}
        . Puedes seguir comparando y viendo todo, pero ya no se actualiza.
      </span>
    </div>
  );
}
