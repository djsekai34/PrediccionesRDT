import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';
import { normalizeName } from '../lib/scoring';
import { searchPlayers, type Player } from '../lib/players';
import { Avatar } from './Avatar';

interface Props {
  value: string;
  onChange: (value: string) => void;
  players: Player[];
  suggestions: string[];
  loading?: boolean;
  id: string;
  placeholder?: string;
  kind?: 'coach';
}

export function PlayerCombobox({
  value,
  onChange,
  players,
  suggestions,
  loading = false,
  id,
  kind,
  placeholder = 'Busca cualquier jugador de la NBA',
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Lo que se escribe queda en local; solo se guarda (Firestore) al elegir, con Enter o al salir del campo.
  const [draft, setDraft] = useState(value);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => setDraft(value), [value]);

  const results = useMemo<Player[]>(() => {
    if (!draft.trim()) {
      // Sin texto: las sugerencias del premio. ESPN escribe "Nikola Jokic" sin tilde: se empareja
      // ignorando tildes para tener su foto.
      return suggestions.map((name) => {
        const match = players.find((p) => normalizeName(p.name) === normalizeName(name));
        return match ? { ...match, name } : { id: '', name };
      });
    }
    return searchPlayers(players, draft, 8);
  }, [draft, players, suggestions]);

  useEffect(() => {
    (listRef.current?.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function commit(next: string) {
    setDraft(next);
    if (next !== value) onChange(next);
  }

  function select(p: Player) {
    commit(p.name);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && draft.trim() && results[active]) select(results[active]);
      else {
        commit(draft);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const listId = `${id}-list`;
  const showList = open && results.length > 0;

  return (
    <div className="relative">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
      <input
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          commit(draft);
        }}
        onKeyDown={onKeyDown}
        placeholder={loading ? 'Cargando…' : placeholder}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-9 text-sm outline-none transition focus:border-brand-500"
      />
      {draft && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => commit('')}
          aria-label="Borrar elección"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-200"
        >
          <X size={14} />
        </button>
      )}

      {showList && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl shadow-black/60"
        >
          {results.map((p, i) => (
            <li
              key={p.id || p.name}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                select(p);
              }}
              onMouseEnter={() => setActive(i)}
              className={clsx(
                'flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm',
                i === active ? 'bg-brand-500/15 text-brand-100' : 'text-zinc-300',
              )}
            >
              <Avatar name={p.name} id={p.id} coach={kind === 'coach'} size={28} />
              <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
              {(p.team || p.pos) && (
                <span className="shrink-0 text-xs text-zinc-500">{[p.team, p.pos].filter(Boolean).join(' · ')}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
