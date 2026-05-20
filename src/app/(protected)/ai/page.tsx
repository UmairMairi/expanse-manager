import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/services/auth.service";
import { AiChat } from "@/features/ai/components/chat.client";

export const metadata: Metadata = { title: "AI Assistant" };

export default async function AiPage() {
  await requireUser();
  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Assistant"
        description="Ask anything about your expenses, income, savings, budgets, clients, and milestones."
      />
      <AiChat />
    </div>
  );
}
