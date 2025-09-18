import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;
if (!admin.apps.length) {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is not set');
  const cfg = JSON.parse(raw);
  app = admin.initializeApp({
    credential: admin.credential.cert(cfg as admin.ServiceAccount),
    projectId: cfg.project_id,
  });
} else {
  app = admin.app();
}

// Firestore
export const adminDb = admin.firestore();

// Backward compatible export for routes that import { getAdminDB }
export const getAdminDB = () => adminDb;

export { admin };
