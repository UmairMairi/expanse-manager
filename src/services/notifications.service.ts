import "server-only";
import { ulid } from "ulid";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { logger } from "@/lib/logger";

export type NotificationType =
  | "budget_warning"
  | "budget_exceeded"
  | "milestone_due"
  | "invoice_overdue"
  | "system";

export interface NotificationDoc {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

interface Stored {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: Timestamp;
}

function toDoc(s: Stored): NotificationDoc {
  return {
    ...s,
    createdAt: s.createdAt.toDate().toISOString(),
  };
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationDoc> {
  const id = ulid();
  const now = Timestamp.now();
  const stored: Stored = {
    id,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    read: false,
    createdAt: now,
  };
  await getDb().collection(COLLECTIONS.NOTIFICATIONS).doc(id).set(stored);
  logger.info({ id, type: input.type }, "notification_created");
  return toDoc(stored);
}

export async function listNotifications(
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {},
): Promise<NotificationDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.NOTIFICATIONS)
    .where("userId", "==", userId)
    .get();
  let docs = snap.docs.map((d) => toDoc(d.data() as Stored));
  if (options.unreadOnly) docs = docs.filter((d) => !d.read);
  docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (options.limit) docs = docs.slice(0, options.limit);
  return docs;
}

export async function unreadCount(userId: string): Promise<number> {
  const snap = await getDb()
    .collection(COLLECTIONS.NOTIFICATIONS)
    .where("userId", "==", userId)
    .where("read", "==", false)
    .get();
  return snap.size;
}

export async function markRead(id: string): Promise<void> {
  await getDb().collection(COLLECTIONS.NOTIFICATIONS).doc(id).update({ read: true });
}

export async function markAllRead(userId: string): Promise<void> {
  const snap = await getDb()
    .collection(COLLECTIONS.NOTIFICATIONS)
    .where("userId", "==", userId)
    .where("read", "==", false)
    .get();
  if (snap.empty) return;
  const batch = getDb().batch();
  for (const doc of snap.docs) batch.update(doc.ref, { read: true });
  await batch.commit();
}
