// Lightweight firebase-admin shim for Vercel edge/node runtimes
import type { ServiceAccount } from 'firebase-admin';
import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

function getCredFromEnv(): admin.credential.Credential | null {
  const json = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as ServiceAccount;
      return admin.credential.cert(parsed);
    } catch (e) {
      console.error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON parse error:', e);
    }
  }
  // fallback to application default (rare on Vercel)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.credential.applicationDefault();
  }
  return null;
}

export function getAdminApp(): admin.app.App {
  if (app) return app;
  const existing = admin.apps?.[0];
  if (existing) { app = existing; return app; }
  const cred = getCredFromEnv();
  if (cred) {
    app = admin.initializeApp({ credential: cred });
  } else {
    // initialize without explicit credentials – will work for Firestore emulator or public access
    app = admin.initializeApp();
  }
  return app;
}

export function getAdminDB(): FirebaseFirestore.Firestore {
  return getAdminApp().firestore();
}

export { admin };
