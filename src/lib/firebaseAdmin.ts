import * as admin from 'firebase-admin';
let _app: admin.app.App | null = null;
if (!admin.apps.length) {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is not set');
  const cfg = JSON.parse(raw);
  _app = admin.initializeApp({ credential: admin.credential.cert(cfg as admin.ServiceAccount) });
} else {
  _app = admin.app();
}
export const adminDb = admin.firestore();
export { admin };
