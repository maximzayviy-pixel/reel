import { getApps, initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccount(): ServiceAccount {
  let raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is missing");

  let obj: any = null;
  try {
    obj = JSON.parse(raw);
  } catch {
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf8");
      obj = JSON.parse(decoded);
    } catch {
      throw new Error("Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON");
    }
  }
  if (typeof obj.private_key === "string") {
    obj.private_key = obj.private_key.replace(/\\n/g, "\n");
  }
  return obj as ServiceAccount;
}

export function getAdminDB() {
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert(parseServiceAccount()) });
  return getFirestore(app);
}
