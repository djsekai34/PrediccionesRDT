import { useState, type FormEvent } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import clsx from 'clsx';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useStore } from '../store/useStore';

export function NewProfileForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const addProfile = useStore((s) => s.addProfile);
  const [name, setName] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addProfile(name);
    setName('');
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        autoFocus={autoFocus}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        maxLength={24}
        className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-brand-500"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={16} /> Crear
      </button>
    </form>
  );
}

// manage = solo en la página de admin: permite crear y borrar personas.
export function ProfileBar({ manage = false }: { manage?: boolean }) {
  const profiles = useStore((s) => s.profiles);
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const removeProfile = useStore((s) => s.removeProfile);
  const isAdmin = useStore((s) => s.isAdmin) && manage;
  const [adding, setAdding] = useState(false);
  const [barRef] = useAutoAnimate<HTMLDivElement>();

  const active = profiles.find((p) => p.id === activeId);

  function remove() {
    if (!active) return;
    if (window.confirm(`¿Borrar el perfil de ${active.name} y todas sus predicciones?`)) {
      removeProfile(active.id);
    }
  }

  return (
    <div ref={barRef} className="flex flex-wrap items-center gap-2">
      {profiles.map((p) => (
        <button
          key={p.id}
          onClick={() => setActive(p.id)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
            p.id === activeId
              ? 'border-brand-500 bg-brand-500/15 text-brand-300'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
          )}
        >
          <User size={14} /> {p.name}
        </button>
      ))}

      {isAdmin && (adding ? (
        <div className="w-60" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setAdding(false)}>
          <NewProfileForm autoFocus />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
        >
          <Plus size={14} /> Persona
        </button>
      ))}

      {isAdmin && active && (
        <button
          onClick={remove}
          title="Borrar perfil"
          className="ml-auto rounded-lg p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
