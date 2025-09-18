// Auto-fixed firebaseAdmin.ts with robust key handling
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

function parseServiceAccount(): any | null {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  let obj: any = null;
  try {
    // raw can be JSON or base64-encoded JSON
    const txt = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf-8');
    obj = JSON.parse(txt);
  } catch {
    return null;
  }

  // Normalize private key in common formats
  const k = obj.private_key || obj.privateKey || obj['private-key'];
  if (typeof k === 'string') {
    let normalized = k;
    // Convert escaped \n to real newlines
    normalized = normalized.replace(/\\n/g, '\n');
    // Ensure proper header/footer line breaks
    normalized = normalized.replace(/-----BEGIN PRIVATE KEY-----\s*/g, '-----BEGIN PRIVATE KEY-----\n');
    normalized = normalized.replace(/\s*-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');
    obj.private_key = normalized;
  }
  return obj;
}

let app: App;
const svc = parseServiceAccount();
if (!getApps().length && svc) {
  app = initializeApp({
    credential: cert(svc),
    storageBucket: svc.storageBucket,
  });
} else {
  app = getApps()[0]!;
}

const adminDb = getFirestore(app);
const adminAuth = getAuth(app);
const adminStorage = getStorage(app);

export { app, admin, adminDb, adminAuth, adminStorage };


/** Backwards-compatible helper for legacy imports */
export function getAdminDB() {
  return adminDb;
}
