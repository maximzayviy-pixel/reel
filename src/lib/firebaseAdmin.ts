import * as admin from 'firebase-admin';

let _initialized = false;

function loadServiceAccount(): admin.ServiceAccount {
  // Prefer base64 to avoid PEM newline issues in Vercel UI
  const b64 = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_B64;
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

  let obj: any;
  if (b64) {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    obj = JSON.parse(json);
  } else if (raw) {
    obj = JSON.parse(raw);
  } else {
    throw new Error('Missing FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_SERVICE_ACCOUNT_B64');
  }

  // Normalize PEM newlines
  if (obj.private_key && typeof obj.private_key === 'string') {
    obj.private_key = obj.private_key.replace(/\\n/g, '\n');
  }
  return obj as admin.ServiceAccount;
}

export function ensureAdmin() {
  if (_initialized) return;
  if (!admin.apps.length) {
    const sa = loadServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: (sa as any).project_id,
    });
  }
  _initialized = true;
}

export function getAdminDB() {
  ensureAdmin();
  return admin.firestore();
}

export const adminDb = getAdminDB();
export { admin };
