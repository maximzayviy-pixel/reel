import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

function getServiceAccount() {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is missing');

  const json = raw.trim().startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf8');

  const sa = JSON.parse(json);
  if (sa.private_key && sa.private_key.includes('\\n')) {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  }
  return sa as admin.ServiceAccount;
}

export function getAdminDB() {
  if (!app) {
    app = admin.initializeApp({ credential: admin.credential.cert(getServiceAccount()) });
  }
  return admin.firestore();
}

// нужно для FieldValue/типов транзакций
export { admin };
