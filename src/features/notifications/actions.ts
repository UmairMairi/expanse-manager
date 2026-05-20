"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/auth.service";
import { markAllRead, markRead } from "@/services/notifications.service";

export async function markNotificationReadAction(id: string) {
  await requireUser();
  await markRead(id);
  revalidatePath("/dashboard");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await markAllRead(user.username);
  revalidatePath("/dashboard");
}
