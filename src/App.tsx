import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster } from 'sonner';
import { ChartColumn, Crown, HelpCircle, ListOrdered, Users } from 'lucide-react';
import clsx from 'clsx';
import { useActiveProfile, useStore } from './store/useStore';
import { isFirebaseConfigured } from './lib/firebase';
import { ProfileBar } from './components/ProfileBar';
import { AdminPage } from './components/AdminPage';
import { ConferencePicks } from './components/ConferencePicks';
import { AwardsPanel } from './components/AwardsPanel';
import { Comparison } from './components/Comparison';
import { Overview } from './components/Overview';
import { ScoringRules } from './components/ScoringRules';
import { SetupScreen } from './components/SetupScreen';
import { Logo } from './components/Logo';
import { ArchivedBanner, SeasonSwitcher } from './components/SeasonSwitcher';
import { useAdminRoute } from './lib/route';
import { AWARDS } from './data/awards';

type Tab = 'picks' | 'awards' | 'compare' | 'overview' | 'rules';

const PERSONAL_TABS: Tab[] = ['picks', 'awards', 'compare'];

export default function App() {
  const profile = useActiveProfile();
  const hasProfiles = useStore((s) => s.profiles.length > 0);
  const adminRoute = useAdminRoute();
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const [tab, setTab] = useState<Tab>('picks');

  // Suscripción en directo a Firestore (perfiles, premios reales) y a la sesión de admin.
  useEffect(() => useStore.getState().init(), []);

  const picksDone = profile ? profile.picks.east.length + profile.picks.west.length : 0;
  const awardsDone = profile ? AWARDS.filter((a) => (profile.awards[a.id] ?? '').trim()).length : 0;

  const tabs: { id: Tab; label: string; icon: typeof Crown; badge?: string }[] = [
    { id: 'picks', label: 'Predicciones', icon: ListOrdered, badge: `${picksDone}/20` },
    { id: 'awards', label: 'Premios', icon: Crown, badge: `${awardsDone}/${AWARDS.length}` },
    { id: 'compare', label: 'Comparativa', icon: ChartColumn },
    { id: 'overview', label: 'Todos', icon: Users },
    { id: 'rules', label: 'Puntuación', icon: HelpCircle },
  ];

  if (adminRoute) {
    return (
      <>
        {isFirebaseConfigured ? (
          <AdminPage />
        ) : (
          <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
            <SetupScreen />
          </div>
        )}
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  function renderBody() {
    if (!isFirebaseConfigured) return <SetupScreen />;

    if (status === 'error') {
      return (
        <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="font-display text-3xl font-bold uppercase">No se pueden leer los datos</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {error.includes('permission')
              ? 'Firestore ha rechazado la lectura: revisa que las reglas de firestore.rules estén publicadas.'
              : error}
          </p>
        </div>
      );
    }

    if (status === 'loading') {
      return <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-900/60" />;
    }

    if (!hasProfiles) {
      return (
        <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
          <h2 className="mb-1 font-display text-3xl font-bold uppercase">Sin participantes</h2>
          <p className="text-sm text-zinc-500">Todavía no hay nadie. En cuanto se añadan aparecerán aquí en directo.</p>
        </div>
      );
    }

    return (
      <>
        <nav className="sticky top-3 z-30 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/70 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx(
                'relative inline-flex shrink-0 items-center rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4',
                tab === id ? 'text-white' : 'text-zinc-400 hover:text-zinc-100',
              )}
            >
              {tab === id && (
                <motion.span
                  layoutId="tab-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-brand-500/35 to-brand-700/25 ring-1 ring-brand-400/40"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-2">
                <Icon size={16} />
                {label}
                {badge && PERSONAL_TABS.includes(id) && (
                  <span className="rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] text-zinc-300">{badge}</span>
                )}
              </span>
            </button>
          ))}
        </nav>

        {PERSONAL_TABS.includes(tab) && (
          <div className="mt-5">
            <ProfileBar />
          </div>
        )}

        <main className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${profile?.id ?? ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {tab === 'picks' && profile && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <ConferencePicks conf="east" picks={profile.picks.east} readOnly />
                  <ConferencePicks conf="west" picks={profile.picks.west} readOnly />
                </div>
              )}
              {tab === 'awards' && profile && <AwardsPanel profile={profile} readOnly />}
              {tab === 'compare' && profile && <Comparison profile={profile} />}
              {tab === 'overview' && <Overview />}
              {tab === 'rules' && <ScoringRules />}
            </motion.div>
          </AnimatePresence>
        </main>
      </>
    );
  }

  return (
    <div
      className={clsx(
        'mx-auto px-4 pb-16 pt-8 sm:px-6',
        tab === 'overview' && hasProfiles ? 'max-w-[96rem]' : 'max-w-6xl',
      )}
    >
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Logo size={64} className="drop-shadow-[0_0_18px_rgba(11,154,70,0.55)]" />
        <div className="mr-auto">
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-wide">
            Predicciones<span className="text-rdt-red-400">RDT</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Las predicciones de RDT de conferencias, premios y la clasificación real
          </p>
        </div>
        {isFirebaseConfigured && <SeasonSwitcher />}
      </header>
      <div className="mb-6 h-1 rounded-full bg-linear-to-r from-rdt-red-500 via-white to-rdt-blue-500 shadow-[0_0_22px_rgba(4,25,245,0.45)]" />

      <ArchivedBanner />

      {renderBody()}

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
