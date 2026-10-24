import clsx from 'clsx';
import type { Profile } from '../lib/types';
import { AWARDS } from '../data/awards';
import { useStore } from '../store/useStore';
import { normalizeName } from '../lib/scoring';
import { usePlayers } from '../hooks/usePlayers';
import { listFor } from '../lib/players';
import { PlayerCombobox } from './PlayerCombobox';
import { Avatar } from './Avatar';
import { Logo } from './Logo';

export function AwardsPanel({ profile, readOnly = false }: { profile: Profile; readOnly?: boolean }) {
  const setAward = useStore((s) => s.setAward);
  const { players, loading } = usePlayers();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {AWARDS.map((award) => {
        const value = profile.awards[award.id] ?? '';
        const list = listFor(players, award.kind);
        const selected = value ? list.find((p) => normalizeName(p.name) === normalizeName(value)) : undefined;

        return (
          <section
            key={award.id}
            className={clsx(
              'rounded-2xl border p-4 transition sm:p-5',
              value ? 'border-brand-500/40 bg-brand-500/5' : 'border-zinc-800/80 bg-zinc-900/40',
            )}
          >
            <header className="mb-3 flex items-center gap-3">
              {value ? (
                <Avatar
                  name={value}
                  id={selected?.id}
                  coach={award.kind === 'coach'}
                  size={48}
                  className="ring-2 ring-brand-500/70"
                />
              ) : (
                <Logo size={48} className="shrink-0" />
              )}
              <div>
                <h3 className="font-display text-2xl font-bold uppercase leading-none tracking-wide">
                  {award.label}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{award.description}</p>
              </div>
            </header>

            {readOnly ? (
              <p className={clsx('rounded-lg bg-zinc-900 px-3 py-2 text-sm', value ? 'font-medium' : 'text-zinc-600')}>
                {value || 'Sin elegir'}
              </p>
            ) : (
              <>
                <PlayerCombobox
                  id={`award-${award.id}`}
                  value={value}
                  onChange={(v) => setAward(award.id, v)}
                  players={list}
                  kind={award.kind}
                  suggestions={award.suggestions}
                  loading={loading}
                  placeholder={award.kind === 'coach' ? 'Busca un entrenador' : undefined}
                />

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {award.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setAward(award.id, s)}
                      className={clsx(
                        'rounded-full border px-2.5 py-1 text-xs transition',
                        normalizeName(value) === normalizeName(s)
                          ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
