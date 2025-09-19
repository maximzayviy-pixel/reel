// Robust firebase-admin init: handles JSON env, split envs, and \n in private_key.
// Also avoids build-time prerender crashes by lazy init.
import type { ServiceAccount } from 'firebase-admin';
import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

function getServiceAccountFromEnv(): ServiceAccount | null {
  // 1) Single JSON blob
  const blob = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (blob) {
    try {
      const parsed = JSON.parse(blob) as any;
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        // Fix \n -> real newlines (Vercel ENV stores in one line)
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return parsed as ServiceAccount;
    } catch (e) {
      console.error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON parse error:', e);
    }
  }
  // 2) Split variables fallback
  const pid = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const client_email = process.env.FIREBASE_CLIENT_EMAIL;
  let private_key = process.env.FIREBASE_PRIVATE_KEY;
  if (private_key && private_key.includes('\n') === false) {
    // sometimes it comes with literal \n
    private_key = private_key.replace(/\\n/g, '\n');
  }
  if (pid && client_email && private_key) {
    return {
      projectId: pid,
      clientEmail: client_email,
      privateKey: private_key,
    } as unknown as ServiceAccount;
  }
  return null;
}

function ensureProjectId(sa: ServiceAccount | null) {
  const pid = (sa as any)?.projectId || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (pid && !process.env.GOOGLE_CLOUD_PROJECT) {
    process.env.GOOGLE_CLOUD_PROJECT = String(pid);
  }
}

export function getAdminApp(): admin.app.App {
  if (app) return app;
  const existing = admin.apps?.[0];
  if (existing) { app = existing; return app; }

  const sa = getServiceAccountFromEnv();
  ensureProjectId(sa);
  const cred = sa ? admin.credential.cert(sa) : admin.credential.applicationDefault();
  app = admin.initializeApp({ credential: cred });
  return app;
}

export function getAdminDB(): FirebaseFirestore.Firestore {
  return getAdminApp().firestore();
}

// Legacy named export expected by some files
export const adminDb = getAdminDB();
export { admin };
