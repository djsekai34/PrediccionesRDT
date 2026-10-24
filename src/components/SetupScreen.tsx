export function SetupScreen() {
  return (
    <div className="mx-auto mt-12 max-w-xl card p-6">
      <h2 className="font-display text-3xl font-bold uppercase">Falta configurar Firebase</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Copia <code className="rounded bg-zinc-800 px-1.5 py-0.5">.env.example</code> a{' '}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5">.env</code>, rellena los valores de tu proyecto de
        Firebase y reinicia <code className="rounded bg-zinc-800 px-1.5 py-0.5">npm run dev</code>. Los pasos
        completos están en el <b>README.md</b>.
      </p>
    </div>
  );
}
