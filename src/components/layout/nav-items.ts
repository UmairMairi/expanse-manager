import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Users,
  PiggyBank,
  FileText,
  Wallet,
  BarChart3,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  shortcut?: string;
  /** If true, route is wired in Phase 1 as a placeholder; full module ships in Phase 2+. */
  placeholder?: boolean;
};

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "g d" },
  { label: "Expenses", href: "/expenses", icon: Receipt, shortcut: "g e" },
  { label: "Income", href: "/income", icon: TrendingUp, shortcut: "g i" },
  { label: "Clients", href: "/clients", icon: Users, shortcut: "g c", placeholder: true },
  { label: "Savings", href: "/savings", icon: PiggyBank, shortcut: "g s", placeholder: true },
  { label: "Budgets", href: "/budgets", icon: Wallet, shortcut: "g b", placeholder: true },
  { label: "Invoices", href: "/invoices", icon: FileText, shortcut: "g v", placeholder: true },
  { label: "Reports", href: "/reports", icon: BarChart3, shortcut: "g r", placeholder: true },
  { label: "AI Assistant", href: "/ai", icon: Sparkles, shortcut: "g a", placeholder: true },
  { label: "Settings", href: "/settings", icon: Settings },
];
