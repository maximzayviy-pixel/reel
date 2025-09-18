import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const sa = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON) : undefined;
if (!getApps().length) {
  if (!sa) throw new Error('Missing FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON');
  initializeApp({ credential: cert(sa) });
}
export const adminDb = getFirestore();
