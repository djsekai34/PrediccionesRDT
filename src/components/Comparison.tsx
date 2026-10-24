import { AlertTriangle, Check, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import type { Conference, Profile, StandingRow } from '../lib/types';
import { CONF_LABEL, TEAMS_BY_ID } from '../data/teams';
import { useStandings } from '../hooks/useStandings';
import { useStore } from '../store/useStore';
import {
  MAX_PER_CONFERENCE,
  POINTS,
  hasStarted,
  scoreAwards,
  scoreConference,
  scoreProfile,
  type TeamScore,
} from '../lib/scoring';
import { AWARDS } from '../data/awards';
import { TeamLogo } from './TeamLogo';
import NumberFlow from '@number-flow/react';

const fmtPct = (n: number): string => n.toFixed(3).replace(/^0/, '');

function ScoreCard({ label, value, max, accent }: { label: string; value: number; max?: number; accent?: boolean }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={clsx('card p-4', accent && 'border-brand-500/50 bg-brand-500/10')}>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 font-display text-5xl font-bold leading-none">
        <NumberFlow value={value} />
        {max !== undefined && <span className="ml-1 text-xl text-zinc-600">/{max}</span>}
      </p>
      {max !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-300 transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function deltaTone(row: TeamScore): string {
  if (row.actual === null) return 'text-zinc-500';
  if (row.diff === 0) return 'text-emerald-400';
  if (row.diff === 1) return 'text-lime-400';
  if (row.diff === 2) return 'text-amber-400';
  return 'text-zinc-400';
}

function PredictedColumn({ name, picks, scores }: { name: string; picks: string[]; scores: TeamScore[] | null }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Predicción de <span className="text-brand-300">{name}</span>
      </h4>
      <ol className="space-y-1.5">
        {picks.map((id, i) => {
          const team = TEAMS_BY_ID[id];
          const score = scores?.[i] ?? null;
          if (!team) return null;
          return (
            <li
              key={id}
              className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5"
            >
              <span className="w-6 text-center font-display text-xl font-bold text-zinc-400">{i + 1}</span>
              <TeamLogo team={team} size={24} />
              <span className="min-w-0 flex-1 truncate text-sm">{team.name}</span>
              {score && (
                <span className={clsx('flex items-center gap-1.5 text-xs font-medium', deltaTone(score))}>
                  {score.diff === 0 ? (
                    <Check size={14} />
                  ) : (
                    <span>{score.actual === null ? '—' : `Real #${score.actual}`}</span>
                  )}
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">+{score.points}</span>
                </span>
              )}
            </li>
          );
        })}
        {picks.length === 0 && <li className="text-sm text-zinc-600">Aún no has elegido equipos.</li>}
      </ol>
    </div>
  );
}

function RealColumn({ rows, picks }: { rows: StandingRow[]; picks: string[] }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Clasificación real</h4>
      <ol className="space-y-1.5">
        {rows.map((row) => {
          const team = TEAMS_BY_ID[row.teamId];
          if (!team) return null;
          const picked = picks.includes(row.teamId);
          return (
            <li
              key={row.teamId}
              className={clsx(
                'flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5',
                picked ? 'border-brand-500/40 bg-brand-500/5' : 'border-zinc-800/70 bg-zinc-900/50',
                row.rank === 6 && 'mb-3',
                row.rank === 10 && 'mb-3',
                row.rank > 10 && 'opacity-50',
              )}
            >
              <span
                className={clsx(
                  'w-6 text-center font-display text-xl font-bold',
                  row.rank <= 6 ? 'text-brand-400' : row.rank <= 10 ? 'text-rdt-blue-400' : 'text-zinc-600',
                )}
              >
                {row.rank}
              </span>
              <TeamLogo team={team} size={24} src={row.logo} />
              <span className="min-w-0 flex-1 truncate text-sm">{team.name}</span>
              <span className="text-xs tabular-nums text-zinc-400">
                {row.wins}-{row.losses}
              </span>
              <span className="hidden w-10 text-right text-xs tabular-nums text-zinc-600 sm:block">
                {fmtPct(row.winPct)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ConferenceCompare({
  name,
  conf,
  picks,
  actual,
  started,
}: {
  name: string;
  conf: Conference;
  picks: string[];
  actual: StandingRow[];
  started: boolean;
}) {
  const result = started ? scoreConference(picks, actual) : null;

  return (
    <section className="card p-4 sm:p-5">
      <header className="mb-4 flex items-end justify-between">
        <h3 className="section-title">
          Conferencia {CONF_LABEL[conf]}
        </h3>
        {result && (
          <p className="text-sm text-zinc-500">
            {result.exact} {result.exact === 1 ? 'exacto' : 'exactos'} · <NumberFlow value={result.total} className="font-semibold text-zinc-200" />/
            {MAX_PER_CONFERENCE} pts
          </p>
        )}
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <PredictedColumn name={name} picks={picks} scores={result?.rows ?? null} />
        <RealColumn rows={actual.slice(0, 15)} picks={picks} />
      </div>
    </section>
  );
}

function AwardsCompare({ profile }: { profile: Profile }) {
  const actualAwards = useStore((s) => s.actualAwards);
  const scores = scoreAwards(profile, actualAwards);

  return (
    <section className="card p-4 sm:p-5">
      <header className="mb-4">
        <h3 className="section-title">Premios</h3>
        <p className="text-sm text-zinc-500">
          No hay API gratuita fiable de premios: el admin apunta aquí el ganador real cuando se anuncie ({POINTS.award} pts
          por acierto).
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-zinc-500">
              <th className="pb-2 font-semibold">Premio</th>
              <th className="pb-2 font-semibold">Tu elección</th>
              <th className="pb-2 font-semibold">Ganador real</th>
              <th className="pb-2 text-right font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {AWARDS.map((award, i) => {
              const s = scores[i];
              return (
                <tr key={award.id}>
                  <td className="py-2 pr-3 font-medium">{award.label}</td>
                  <td className={clsx('py-2 pr-3', s.pick ? '' : 'text-zinc-600')}>{s.pick || 'Sin elegir'}</td>
                  <td className="py-2 pr-3">
                    {actualAwards[award.id] || <span className="text-zinc-600">Pendiente</span>}
                  </td>
                  <td
                    className={clsx(
                      'py-2 text-right font-display text-xl font-bold',
                      s.hit ? 'text-emerald-400' : 'text-zinc-600',
                    )}
                  >
                    {s.decided ? (s.hit ? `+${POINTS.award}` : '0') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Comparison({ profile }: { profile: Profile }) {
  const { data, isLoading, isError, refetch, isFetching, frozen } = useStandings();
  const actualAwards = useStore((s) => s.actualAwards);

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-96 animate-pulse rounded-2xl bg-zinc-900/60" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <AlertTriangle className="text-red-400" />
        <p className="text-sm text-zinc-300">No se pudo cargar la clasificación real de la NBA.</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm transition hover:bg-zinc-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const started = hasStarted(data.standings);
  const totals = scoreProfile(profile, data.standings, actualAwards);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ScoreCard label="Este" value={totals.east.total} max={MAX_PER_CONFERENCE} />
        <ScoreCard label="Oeste" value={totals.west.total} max={MAX_PER_CONFERENCE} />
        <ScoreCard label="Premios" value={totals.awards} max={AWARDS.length * POINTS.award} />
        <ScoreCard label="Total" value={totals.total} max={MAX_PER_CONFERENCE * 2 + AWARDS.length * POINTS.award} accent />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          {data.season && `Temporada ${data.season} · `}
          {frozen ? 'Clasificación final del ' : 'Actualizado '}
          {frozen
            ? new Date(data.fetchedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
            : new Date(data.fetchedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {!frozen && (
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <RefreshCw size={13} className={clsx(isFetching && 'animate-spin')} /> Actualizar
          </button>
        )}
      </div>

      {!started && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm text-sky-200">
          La temporada acaba de empezar y todavía no hay partidos jugados: la puntuación se activará en cuanto
          haya resultados.
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <ConferenceCompare
          name={profile.name}
          conf="east"
          picks={profile.picks.east}
          actual={data.standings.east}
          started={started}
        />
        <ConferenceCompare
          name={profile.name}
          conf="west"
          picks={profile.picks.west}
          actual={data.standings.west}
          started={started}
        />
      </div>

      <AwardsCompare profile={profile} />
    </div>
  );
}
