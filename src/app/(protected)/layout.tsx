import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth.service";
import { AppShell } from "@/components/layout/app-shell";
import { listNotifications, unreadCount } from "@/services/notifications.service";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [notifications, unread] = await Promise.all([
    listNotifications(user.username, { limit: 20 }),
    unreadCount(user.username),
  ]);
  return (
    <AppShell user={user} notifications={notifications} unreadCount={unread}>
      {children}
    </AppShell>
  );
}
