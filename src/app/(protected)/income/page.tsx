import type { Metadata } from "next";
import { requireUser } from "@/services/auth.service";
import { listIncome } from "@/services/income.service";
import { IncomePageClient } from "@/features/income/components/income-page-client";

export const metadata: Metadata = {
  title: "Income",
};

export default async function IncomePage() {
  const user = await requireUser();
  const income = await listIncome(user.username, { limit: 500 });
  return <IncomePageClient initialIncome={income} />;
}
