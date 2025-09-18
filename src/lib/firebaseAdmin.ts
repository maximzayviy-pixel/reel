// Auto-fixed version using FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON)
  : null;

let app: App;
if (!getApps().length && serviceAccount) {
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: serviceAccount.storageBucket,
  });
} else {
  app = getApps()[0]!;
}

const adminDb = getFirestore(app);
const adminAuth = getAuth(app);
const adminStorage = getStorage(app);

export { app, admin, adminDb, adminAuth, adminStorage };

export function getAdminDB(){ return adminDb; }
export function getAdmin(){ return admin; }
