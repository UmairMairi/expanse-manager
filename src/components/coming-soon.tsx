import { type LucideIcon, Construction } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

type Props = {
  title: string;
  description: string;
  icon?: LucideIcon;
  phase: "Phase 2" | "Phase 3" | "Phase 4";
  features?: ReadonlyArray<string>;
};

export function ComingSoon({ title, description, icon, phase, features }: Props) {
  const Icon = icon ?? Construction;
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Icon}
        title={`Coming in ${phase}`}
        description={
          features && features.length > 0
            ? `Planned: ${features.join(" · ")}`
            : "This module is part of a later phase. The route is wired in so navigation stays stable."
        }
      />
    </div>
  );
}
