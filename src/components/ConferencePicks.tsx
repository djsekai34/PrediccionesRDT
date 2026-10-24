import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, RotateCcw, X } from 'lucide-react';
import clsx from 'clsx';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { toast } from 'sonner';
import type { Conference, Team } from '../lib/types';
import { CONF_LABEL, TEAMS_BY_ID, teamsOf } from '../data/teams';
import { useStore } from '../store/useStore';
import { TeamLogo } from './TeamLogo';

const SLOTS = 10;

const positionTone = (position: number): string =>
  position <= 6 ? 'text-brand-400' : 'text-rdt-blue-400';

function SortableRow({ team, position, conf }: { team: Team; position: number; conf: Conference }) {
  const removePick = useStore((s) => s.removePick);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: team.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        'flex items-center gap-3 rounded-xl border bg-zinc-900 px-3 py-2',
        isDragging ? 'relative z-10 border-brand-500 shadow-xl shadow-black/50' : 'border-zinc-800',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Mover ${team.name}`}
        className="cursor-grab touch-none text-zinc-600 hover:text-zinc-300 active:cursor-grabbing"
      >
        <GripVertical size={18} />
      </button>
      <span className={clsx('w-7 text-center font-display text-2xl font-bold', positionTone(position))}>
        {position}
      </span>
      <TeamLogo team={team} size={30} />
      <span className="min-w-0 flex-1 truncate font-medium">
        {team.city} <span className="text-zinc-400">{team.name}</span>
      </span>
      <button
        onClick={() => removePick(conf, team.id)}
        aria-label={`Quitar ${team.name}`}
        className="rounded-md p-1 text-zinc-600 transition hover:bg-zinc-800 hover:text-red-400"
      >
        <X size={16} />
      </button>
    </li>
  );
}

export function ConferencePicks({
  conf,
  picks,
  readOnly = false,
}: {
  conf: Conference;
  picks: string[];
  readOnly?: boolean;
}) {
  const setPicks = useStore((s) => s.setPicks);
  const addPick = useStore((s) => s.addPick);
  const [poolRef] = useAutoAnimate<HTMLDivElement>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const available = teamsOf(conf).filter((t) => !picks.includes(t.id));
  const full = picks.length >= SLOTS;

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = picks.indexOf(String(active.id));
    const to = picks.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    setPicks(conf, arrayMove(picks, from, to));
  }

  function add(id: string) {
    addPick(conf, id);
    if (picks.length === SLOTS - 1) toast.success(`Top 10 del ${CONF_LABEL[conf]} completo`);
  }

  if (readOnly) {
    return (
      <section className="card p-4 sm:p-5">
        <header className="mb-4">
          <h2 className="section-title">
            Conferencia {CONF_LABEL[conf]}
          </h2>
          <p className="text-sm text-zinc-500">
            {picks.length}/{SLOTS} equipos
          </p>
        </header>
        <ol className="space-y-1.5">
          {Array.from({ length: SLOTS }, (_, i) => {
            const team = picks[i] ? TEAMS_BY_ID[picks[i]] : undefined;
            return (
              <li
                key={i}
                className={clsx(
                  'flex items-center gap-3 rounded-xl border px-3 py-2',
                  team ? 'border-zinc-800 bg-zinc-900' : 'border-dashed border-zinc-800 text-zinc-700',
                )}
              >
                <span
                  className={clsx(
                    'w-7 text-center font-display text-2xl font-bold',
                    positionTone(i + 1),
                    !team && 'opacity-40',
                  )}
                >
                  {i + 1}
                </span>
                {team ? (
                  <>
                    <TeamLogo team={team} size={30} />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {team.city} <span className="text-zinc-400">{team.name}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-sm">Sin elegir</span>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  return (
    <section className="card p-4 sm:p-5">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="section-title">
            Conferencia {CONF_LABEL[conf]}
          </h2>
          <p className="text-sm text-zinc-500">
            {picks.length}/{SLOTS} equipos · arrastra para ordenar
          </p>
        </div>
        {picks.length > 0 && (
          <button
            onClick={() => setPicks(conf, [])}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <RotateCcw size={13} /> Vaciar
          </button>
        )}
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={picks} strategy={verticalListSortingStrategy}>
          <ol className="space-y-1.5">
            {picks.map((id, i) => {
              const team = TEAMS_BY_ID[id];
              return team ? <SortableRow key={id} team={team} position={i + 1} conf={conf} /> : null;
            })}
          </ol>
        </SortableContext>
      </DndContext>

      {picks.length < SLOTS && (
        <ol className="mt-1.5 space-y-1.5" start={picks.length + 1}>
          {Array.from({ length: SLOTS - picks.length }, (_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-800 px-3 py-2.5 text-zinc-700"
            >
              <span className="w-[18px]" />
              <span className={clsx('w-7 text-center font-display text-2xl font-bold opacity-40', positionTone(picks.length + i + 1))}>
                {picks.length + i + 1}
              </span>
              <span className="text-sm">Elige un equipo</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 border-t border-zinc-800 pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {full ? 'Equipos fuera de tu top 10' : 'Equipos disponibles'}
        </h3>
        <div ref={poolRef} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {available.map((team) => (
            <button
              key={team.id}
              onClick={() => add(team.id)}
              disabled={full}
              className="group flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-left text-sm transition enabled:hover:border-brand-500/60 enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <TeamLogo team={team} size={24} />
              <span className="min-w-0 flex-1 truncate">{team.name}</span>
              {!full && <Plus size={14} className="text-zinc-600 group-hover:text-brand-400" />}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
