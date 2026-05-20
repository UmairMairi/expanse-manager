import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "AI Assistant" };

export default function AiPage() {
  return (
    <ComingSoon
      title="AI Assistant"
      description="Ask questions about your finances in natural language."
      icon={Sparkles}
      phase="Phase 3"
      features={[
        "Gemini-powered chat",
        "Smart expense categorization",
        "Daily insights + forecasting",
      ]}
    />
  );
}
