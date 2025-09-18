import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function parseServiceAccount() {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj.private_key && typeof obj.private_key === 'string') {
      // convert escaped \n to real newlines
      obj.private_key = obj.private_key.replace(/\\n/g, '\n');
    }
    return obj;
  } catch {
    return null;
  }
}

let _db: ReturnType<typeof getFirestore> | null = null;

/** Lazy initializer for Firestore Admin */
export function getAdminDB() {
  if (_db) return _db;
  const sa = parseServiceAccount();
  if (!getApps().length) {
    if (!sa) {
      throw new Error('Firebase Admin is not configured: set FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON');
    }
    initializeApp({ credential: cert(sa as any) });
  }
  _db = getFirestore();
  return _db;
}
