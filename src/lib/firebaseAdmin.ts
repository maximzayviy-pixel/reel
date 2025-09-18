// src/lib/firebaseAdmin.ts
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import * as admin from "firebase-admin";

const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON)
  : null;

if (serviceAccount && serviceAccount.private_key) {
  // фикс для PEM: заменяем \n на настоящие переводы строк
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

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

export function getAdminDB() {
  return adminDb;
}
export function getAdmin() {
  return admin;
}
