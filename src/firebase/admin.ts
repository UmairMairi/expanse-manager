import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

function loadServiceAccount(): Record<string, unknown> {
  const inlineBase64 = process.env.FIREBASE_ADMIN_SA_KEY;
  if (inlineBase64) {
    const json = Buffer.from(inlineBase64, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  }
  const path = process.env.FIREBASE_ADMIN_SA_PATH;
  if (path) {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  }
  throw new Error(
    "Firebase Admin credentials not configured. Set FIREBASE_ADMIN_SA_KEY (base64) for production or FIREBASE_ADMIN_SA_PATH (file path) for local dev.",
  );
}

let _app: App | null = null;
let _db: Firestore | null = null;

function getApp(): App {
  if (_app) return _app;
  const existing = getApps()[0];
  if (existing) {
    _app = existing;
    return _app;
  }
  const sa = loadServiceAccount();
  _app = initializeApp({
    credential: cert(sa as Parameters<typeof cert>[0]),
    projectId:
      process.env.FIREBASE_PROJECT_ID ??
      (sa["project_id"] as string | undefined),
  });
  return _app;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getApp());
  _db.settings({ ignoreUndefinedProperties: true });
  return _db;
}
