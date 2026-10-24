import { AWARDS } from '../data/awards';
import { MAX_PER_CONFERENCE, POINTS } from '../lib/scoring';

const MAX_AWARDS = AWARDS.length * POINTS.award;
const MAX_TOTAL = MAX_PER_CONFERENCE * 2 + MAX_AWARDS;

const rows: { label: string; detail: string; points: string }[] = [
  { label: 'Posición exacta', detail: 'Pones al equipo 3º y es 3º', points: `${POINTS.exact}` },
  { label: 'A 1 puesto', detail: 'Lo pones 3º y es 2º o 4º', points: `${POINTS.exact - 1}` },
  { label: 'A 2 puestos', detail: 'Lo pones 3º y es 1º o 5º', points: `${POINTS.exact - 2}` },
  { label: 'A 3 o más puestos', detail: 'Lo pones 3º y es 6º o peor', points: '0' },
  { label: 'Premio acertado', detail: 'Tu jugador seleccionado coincide con el ganador real', points: `${POINTS.award}` },
];

export function ScoringRules() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="card p-5">
        <h2 className="section-title">Cómo se puntúa</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Cada equipo de tu top 10 se compara con su puesto real en la clasificación de su conferencia. Cuanto más
          cerca, más puntos.        </p>

        <ul className="mt-4 divide-y divide-zinc-800/70">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.label}</p>
                <p className="text-xs text-zinc-500">{r.detail}</p>
              </div>
              <span className="font-display text-3xl font-bold text-brand-400">{r.points}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h3 className="font-display text-2xl font-bold uppercase tracking-wide">Ejemplos</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          <li>
            Pones a los Celtics 2º y acaban 2º: <b className="text-emerald-400">{POINTS.exact} pts</b>.
          </li>
          <li>
            Pones a los Knicks 4º y van 5º: <b className="text-lime-400">{POINTS.exact - 1} pts</b>.
          </li>
          <li>
            Pones a los Heat 3º y van 5º: <b className="text-amber-400">{POINTS.exact - 2} pt</b>.
          </li>
          <li>
            Pones a los Bulls 3º y van 8º: <b className="text-zinc-300">0 pts</b>.
          </li>
          <li>
            Pones a los Lakers 5º y van 13º: <b className="text-red-400">0 pts</b>.
          </li>
        </ul>
      </section>

      <section className="card p-5">
        <h3 className="font-display text-2xl font-bold uppercase tracking-wide">Máximos</h3>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-zinc-900 p-3">
            <p className="font-display text-3xl font-bold">{MAX_PER_CONFERENCE}</p>
            <p className="text-xs text-zinc-500">por conferencia</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3">
            <p className="font-display text-3xl font-bold">{MAX_AWARDS}</p>
            <p className="text-xs text-zinc-500">premios ({AWARDS.length})</p>
          </div>
          <div className="rounded-xl bg-brand-500/10 p-3">
            <p className="font-display text-3xl font-bold text-brand-300">{MAX_TOTAL}</p>
            <p className="text-xs text-zinc-500">total</p>
          </div>
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-zinc-500">
          <li>La clasificación se actualiza sola: los puntos cambian según avanza la temporada.</li>
          <li>Hasta que no haya partidos jugados, las conferencias no puntúan.</li>
          <li>Los ganadores reales de los premios los apunta el admin cuando se anuncian.</li>
        </ul>
      </section>
    </div>
  );
}
