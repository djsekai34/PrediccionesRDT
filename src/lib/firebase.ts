import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import * as firestore from 'firebase/firestore';

const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

// Caché persistente: la app sigue mostrando datos si se corta internet y se sincroniza al volver.
// Se importa como "namespace" para que, si el SDK instalado es antiguo y no trae
// persistentLocalCache, la app arranque igual usando la caché en memoria.
function createDb(app: FirebaseApp): firestore.Firestore {
  if (typeof firestore.persistentLocalCache === 'function') {
    try {
      return firestore.initializeFirestore(app, {
        localCache: firestore.persistentLocalCache({
          tabManager: firestore.persistentMultipleTabManager(),
        }),
      });
    } catch {
      // sin soporte de caché persistente: se usa la de memoria
    }
  }
  return firestore.getFirestore(app);
}

const app = isFirebaseConfigured ? initializeApp(config) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? createDb(app) : null;

// Solo para decidir qué botones se muestran. La seguridad real está en firestore.rules.
const ADMIN_EMAILS: string[] = String(import.meta.env.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email: string | null | undefined): boolean =>
  Boolean(email) && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(String(email).toLowerCase()));
