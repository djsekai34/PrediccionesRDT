import { LogIn, ShieldCheck, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';

// Solo se usa en la página de admin (#/admin).
export function AdminBar() {
  const userEmail = useStore((s) => s.userEmail);
  const isAdmin = useStore((s) => s.isAdmin);
  const signIn = useStore((s) => s.signIn);
  const signOut = useStore((s) => s.signOut);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!userEmail ? (
        <button
          onClick={signIn}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
        >
          <LogIn size={14} /> Entrar con Google
        </button>
      ) : (
        <>
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
              isAdmin ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300',
            )}
            title={userEmail}
          >
            {isAdmin ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
            {isAdmin ? 'Admin' : 'Sin permisos'}
          </span>
          <button
            onClick={signOut}
            className="rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            Salir
          </button>
        </>
      )}
    </div>
  );
}
