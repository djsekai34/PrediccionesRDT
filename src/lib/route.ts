import { useEffect, useState } from 'react';

// Rutas sin librería: "/" es la página pública y "/admin" la zona de admin.
// (En hosting hay que redirigir todo a index.html: ver firebase.json y public/_redirects.)
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const href = (path: string): string => `${base}${path}`;

const isAdminPath = (): boolean =>
  window.location.pathname.slice(base.length).replace(/\/+$/, '').startsWith('/admin');

export function navigate(path: string): void {
  window.history.pushState(null, '', href(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useAdminRoute(): boolean {
  const [admin, setAdmin] = useState(isAdminPath);

  useEffect(() => {
    const sync = () => {
      // Compatibilidad con el enlace antiguo (#/admin)
      if (window.location.hash.startsWith('#/admin')) {
        window.history.replaceState(null, '', href('/admin'));
      }
      setAdmin(isAdminPath());
    };
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  return admin;
}
