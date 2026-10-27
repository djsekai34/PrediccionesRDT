import { useState } from 'react';
import NumberFlow from '@number-flow/react';
import { motion } from 'motion/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import clsx from 'clsx';
import { Eye, EyeOff, Medal } from 'lucide-react';
import type { Conference, Profile, StandingRow, Standings } from '../lib/types';
import { CONF_LABEL, TEAMS_BY_ID } from '../data/teams';
import { AWARDS } from '../data/awards';
import { useStandings } from '../hooks/useStandings';
import { useStore } from '../store/useStore';
import { MAX_PER_CONFERENCE, POINTS, hasStarted, scoreAwards, scoreConference, scoreProfile } from '../lib/scoring';
import { TeamLogo } from './TeamLogo';

const CONFS: Conference[] = ['east', 'west'];

// Mismos tramos que la puntuación: exacto, a 1, a 2 y 3 o más.
const TONES = {
  exact: 'bg-emerald-500/20 text-emerald-200',
  one: 'bg-lime-500/15 text-lime-200',
  two: 'bg-amber-500/15 text-amber-200',
  far: 'bg-zinc-800/60 text-zinc-300',
} as const;

function tone(position: number, rank: number | undefined): string {
  if (rank === undefined) return '';
  const diff = Math.abs(rank - position);
  if (diff === 0) return TONES.exact;
  if (diff === 1) return TONES.one;
  if (diff === 2) return TONES.two;
  return TONES.far;
}

function Legend() {
  const items: { cls: string; label: string }[] = [
    { cls: TONES.exact, label: `Posición exacta (${POINTS.exact} pts)` },
    { cls: TONES.one, label: `A 1 puesto (${POINTS.exact - 1})` },
    { cls: TONES.two, label: `A 2 puestos (${POINTS.exact - 2})` },
    { cls: TONES.far, label: '3 o más puestos (0)' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
      <span className="font-semibold uppercase tracking-wider text-zinc-500">Leyenda</span>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className={clsx('h-3.5 w-3.5 rounded border border-white/10', i.cls)} />
          {i.label}
        </span>
      ))}
      <span className="text-zinc-600">· Premios: verde = acierto</span>
    </div>
  );
}

function PeoplePicker({
  profiles,
  excluded,
  onToggle,
  onAll,
  onNone,
}: {
  profiles: Profile[];
  excluded: string[];
  onToggle: (id: string) => void;
  onAll: () => void;
  onNone: () => void;
}) {
  const [chipsRef] = useAutoAnimate<HTMLDivElement>();
  return (
    <div ref={chipsRef} className="flex flex-wrap items-center gap-2">
      <button onClick={onAll} className="rounded-full px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-brand-500/10">
        Todos
      </button>
      <button onClick={onNone} className="rounded-full px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
        Ninguno
      </button>
      <span className="mx-1 h-4 w-px bg-zinc-800" />
      {profiles.map((p) => {
        const on = !excluded.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            aria-pressed={on}
            className={clsx(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition',
              on
                ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300',
            )}
          >
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

function Bar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={clsx('h-2 overflow-hidden rounded-full bg-white/5', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-300 transition-[width] duration-700"
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

const PODIUM = [
  { box: 'border-amber-300/50 from-amber-300/15', medal: 'text-amber-300' },
  { box: 'border-zinc-300/40 from-zinc-300/10', medal: 'text-zinc-300' },
  { box: 'border-orange-400/40 from-orange-400/10', medal: 'text-orange-400' },
] as const;

function Leaderboard({
  people,
  standings,
  actualAwards,
}: {
  people: Profile[];
  standings: Standings;
  actualAwards: Record<string, string>;
}) {
  const rows = people
    .map((p) => ({ p, t: scoreProfile(p, standings, actualAwards) }))
    .sort((a, b) => b.t.total - a.t.total);

  const maxTotal = MAX_PER_CONFERENCE * 2 + AWARDS.length * POINTS.award;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <section className="card w-full p-4 sm:p-5">
      <h3 className="section-title mb-4">Ranking</h3>

      <div
        className={clsx(
          'grid gap-3',
          podium.length >= 3 ? 'md:grid-cols-3' : podium.length === 2 ? 'md:grid-cols-2' : 'grid-cols-1',
        )}
      >
        {podium.map(({ p, t }, i) => (
          <motion.div
            key={p.id}
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className={clsx('rounded-2xl border bg-gradient-to-b to-transparent p-4', PODIUM[i].box)}
          >
            <div className="flex items-center justify-between">
              <span className={clsx('inline-flex items-center gap-1.5 font-display text-xl font-bold', PODIUM[i].medal)}>
                <Medal size={18} /> {i + 1}º
              </span>
              <span className="text-xs text-zinc-500">
                {t.east.exact + t.west.exact} {t.east.exact + t.west.exact === 1 ? 'exacto' : 'exactos'}
              </span>
            </div>
            <p className="mt-2 truncate text-lg font-semibold">{p.name}</p>
            <p className="flex items-baseline gap-1">
              <NumberFlow value={t.total} className="font-display text-6xl font-bold leading-none text-white" />
              <span className="text-sm text-zinc-500">pts</span>
            </p>
            <Bar pct={(t.total / maxTotal) * 100} className="mt-3" />
            <p className="mt-2 flex gap-4 text-xs text-zinc-400">
              <span>Este <b className="text-zinc-200">{t.east.total}</b></span>
              <span>Oeste <b className="text-zinc-200">{t.west.total}</b></span>
              <span>Premios <b className="text-zinc-200">{t.awards}</b></span>
            </p>
          </motion.div>
        ))}
      </div>

      {rest.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {rest.map(({ p, t }, i) => (
            <motion.li
              key={p.id}
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 sm:flex-nowrap"
            >
              <span className="w-7 font-display text-xl font-bold text-zinc-500">{i + 4}</span>
              <span className="w-28 shrink-0 truncate font-medium sm:w-44">{p.name}</span>
              <Bar pct={(t.total / maxTotal) * 100} className="flex-1" />
              <span className="order-last flex w-full gap-4 pl-10 text-xs text-zinc-400 sm:order-none sm:w-auto sm:pl-0">
                <span>
                  Este <b className="tabular-nums text-zinc-200">{t.east.total}</b>
                </span>
                <span>
                  Oeste <b className="tabular-nums text-zinc-200">{t.west.total}</b>
                </span>
                <span>
                  Premios <b className="tabular-nums text-zinc-200">{t.awards}</b>
                </span>
              </span>
              <NumberFlow value={t.total} className="w-12 text-right font-display text-2xl font-bold text-brand-300" />
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TeamCell({ teamId, className }: { teamId?: string; className?: string }) {
  const team = teamId ? TEAMS_BY_ID[teamId] : undefined;
  if (!team) return <td className="px-1 py-1 text-zinc-800">·</td>;
  return (
    <td className={clsx('px-1 py-1', className)}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="flex cursor-default items-center gap-1.5">
            <TeamLogo team={team} size={18} />
            <span className="text-xs font-semibold">{team.abbr}</span>
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={6}
            className="z-50 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 shadow-xl"
          >
            {team.city} {team.name}
            <Tooltip.Arrow className="fill-zinc-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </td>
  );
}

function ConferenceGrid({
  conf,
  people,
  real,
  started,
}: {
  conf: Conference;
  people: Profile[];
  real: StandingRow[] | null;
  started: boolean;
}) {
  const rowCount = real ? 15 : 10;
  const rankOf = new Map((real ?? []).map((r) => [r.teamId, r.rank]));

  return (
    <section className="card min-w-0 p-3 sm:p-4">
      <h3 className="mb-2 section-title">
        Conferencia {CONF_LABEL[conf]}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] table-fixed border-separate border-spacing-y-0.5 text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="w-7 px-1 pb-1 font-semibold">#</th>
              {people.map((p) => (
                <th key={p.id} title={p.name} className="truncate px-1 pb-1 font-semibold">
                  {p.name}
                </th>
              ))}
              {real && (
                <th className="w-[6.5rem] border-l border-zinc-800 px-1.5 pb-1 font-semibold text-brand-300">Real</th>
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, i) => {
              const pos = i + 1;
              const realRow = real?.[i];
              return (
                <tr key={pos} className={clsx(pos > 10 && 'opacity-50')}>
                  <td className="px-1 py-1 font-display text-base font-bold text-zinc-500">{pos}</td>
                  {people.map((p) => {
                    const id = pos <= 10 ? p.picks[conf][i] : undefined;
                    return (
                      <TeamCell
                        key={p.id}
                        teamId={id}
                        className={clsx('rounded-md', started && id && tone(pos, rankOf.get(id)))}
                      />
                    );
                  })}
                  {real && (
                    <td className="border-l border-zinc-800 px-1.5 py-1">
                      {realRow && TEAMS_BY_ID[realRow.teamId] && (
                        <span className="flex items-center gap-1.5">
                          <TeamLogo team={TEAMS_BY_ID[realRow.teamId]} size={18} src={realRow.logo} />
                          <span className="text-xs font-semibold">{TEAMS_BY_ID[realRow.teamId].abbr}</span>
                          <span className="text-[11px] tabular-nums text-zinc-500">
                            {realRow.wins}-{realRow.losses}
                          </span>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {real && started && (
            <tfoot>
              <tr className="text-sm tabular-nums">
                <td className="px-1 pt-2 text-[11px] uppercase tracking-wider text-zinc-500">Pts</td>
                {people.map((p) => (
                  <td key={p.id} className="px-1 pt-2 font-display text-xl font-bold">
                    <NumberFlow value={scoreConference(p.picks[conf], real).total} />
                  </td>
                ))}
                <td className="border-l border-zinc-800" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}

function AwardsGrid({
  people,
  showReal,
  actualAwards,
}: {
  people: Profile[];
  showReal: boolean;
  actualAwards: Record<string, string>;
}) {
  const scoresByPerson = people.map((p) => scoreAwards(p, actualAwards));

  return (
    <section className="card min-w-0 p-4 sm:p-5">
      <h3 className="mb-3 section-title">Premios</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] border-separate border-spacing-y-1 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-2 pb-1 font-semibold">Premio</th>
              {people.map((p) => (
                <th key={p.id} className="px-2 pb-1 font-semibold">
                  {p.name}
                </th>
              ))}
              {showReal && <th className="border-l border-zinc-800 px-2 pb-1 font-semibold text-brand-300">Real</th>}
            </tr>
          </thead>
          <tbody>
            {AWARDS.map((award, ai) => (
              <tr key={award.id}>
                <td className="px-2 py-1.5 font-medium">{award.label}</td>
                {people.map((p, pi) => {
                  const s = scoresByPerson[pi][ai];
                  return (
                    <td
                      key={p.id}
                      className={clsx(
                        'rounded-md px-2 py-1.5',
                        !s.pick && 'text-zinc-700',
                        showReal && s.decided && (s.hit ? 'bg-emerald-500/20 text-emerald-200' : 'text-zinc-500'),
                      )}
                    >
                      {s.pick || '·'}
                    </td>
                  );
                })}
                {showReal && (
                  <td className="border-l border-zinc-800 px-2 py-1.5">
                    {actualAwards[award.id] || <span className="text-zinc-600">Pendiente</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Overview() {
  const profiles = useStore((s) => s.profiles);
  const actualAwards = useStore((s) => s.actualAwards);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [showReal, setShowReal] = useState(true);
  const { data, isLoading, isError } = useStandings();

  const people = profiles.filter((p) => !excluded.includes(p.id));
  const standings = showReal ? (data?.standings ?? null) : null;
  const started = standings ? hasStarted(standings) : false;

  const toggle = (id: string) =>
    setExcluded((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeoplePicker
          profiles={profiles}
          excluded={excluded}
          onToggle={toggle}
          onAll={() => setExcluded([])}
          onNone={() => setExcluded(profiles.map((p) => p.id))}
        />
        <button
          onClick={() => setShowReal((v) => !v)}
          aria-pressed={showReal}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition',
            showReal
              ? 'border-brand-500 bg-brand-500/15 text-brand-300'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200',
          )}
        >
          {showReal ? <Eye size={15} /> : <EyeOff size={15} />}
          {showReal ? 'Con clasificación real' : 'Sin clasificación real'}
        </button>
      </div>

      {standings && started && <Legend />}

      {showReal && isLoading &&<p className="text-sm text-zinc-500">Cargando clasificación real…</p>}
      {showReal && isError && (
        <p className="text-sm text-red-400">No se pudo cargar la clasificación real; se muestran solo las predicciones.</p>
      )}
      {showReal && standings && !started && (
        <p className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm text-sky-200">
          Todavía no hay partidos jugados: aún no se colorea ni se puntúa.
        </p>
      )}

      {people.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
          Selecciona al menos una persona.
        </p>
      ) : (
        <>
          {standings && started && (
            <Leaderboard people={people} standings={standings} actualAwards={actualAwards} />
          )}
          <div className="grid gap-5 xl:grid-cols-2">
            {CONFS.map((conf) => (
              <ConferenceGrid
                key={conf}
                conf={conf}
                people={people}
                real={standings ? standings[conf] : null}
                started={started}
              />
            ))}
          </div>
          <AwardsGrid people={people} showReal={showReal} actualAwards={actualAwards} />
        </>
      )}
    </div>
  );
}
