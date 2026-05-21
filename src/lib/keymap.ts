/**
 * Keyboard shortcut registry. Used by the command palette + global key listener.
 * Sequences (e.g. "g d") are handled by tracking the previous key with a 1s reset.
 */
export type KeymapEntry = {
  /** Single key ("⌘k") or sequence ("g d"). Modifier prefix uses "$mod" for cmd/ctrl portability. */
  keys: string;
  label: string;
  group: "Navigation" | "Create" | "Actions" | "Help";
  /** Route to navigate to, or action identifier for the palette to dispatch. */
  target:
    | { type: "navigate"; href: string }
    | { type: "action"; id: string };
};

export const KEYMAP: ReadonlyArray<KeymapEntry> = [
  // Navigation (g + letter)
  {
    keys: "g d",
    label: "Go to Dashboard",
    group: "Navigation",
    target: { type: "navigate", href: "/dashboard" },
  },
  {
    keys: "g e",
    label: "Go to Expenses",
    group: "Navigation",
    target: { type: "navigate", href: "/expenses" },
  },
  {
    keys: "g i",
    label: "Go to Income",
    group: "Navigation",
    target: { type: "navigate", href: "/income" },
  },
  {
    keys: "g c",
    label: "Go to Clients",
    group: "Navigation",
    target: { type: "navigate", href: "/clients" },
  },
  {
    keys: "g p",
    label: "Go to Projects",
    group: "Navigation",
    target: { type: "navigate", href: "/projects" },
  },
  {
    keys: "g s",
    label: "Go to Savings",
    group: "Navigation",
    target: { type: "navigate", href: "/savings" },
  },
  {
    keys: "g b",
    label: "Go to Budgets",
    group: "Navigation",
    target: { type: "navigate", href: "/budgets" },
  },
  {
    keys: "g v",
    label: "Go to Invoices",
    group: "Navigation",
    target: { type: "navigate", href: "/invoices" },
  },
  {
    keys: "g r",
    label: "Go to Reports",
    group: "Navigation",
    target: { type: "navigate", href: "/reports" },
  },
  {
    keys: "g a",
    label: "Go to AI Assistant",
    group: "Navigation",
    target: { type: "navigate", href: "/ai" },
  },
  // Create (n + letter)
  {
    keys: "n e",
    label: "New expense",
    group: "Create",
    target: { type: "action", id: "new-expense" },
  },
  {
    keys: "n i",
    label: "New income",
    group: "Create",
    target: { type: "action", id: "new-income" },
  },
  {
    keys: "n c",
    label: "New client",
    group: "Create",
    target: { type: "action", id: "new-client" },
  },
  // Actions
  {
    keys: "$mod+k",
    label: "Open command palette",
    group: "Actions",
    target: { type: "action", id: "open-palette" },
  },
  {
    keys: "/",
    label: "Focus search",
    group: "Actions",
    target: { type: "action", id: "focus-search" },
  },
  {
    keys: "?",
    label: "Show keyboard shortcuts",
    group: "Help",
    target: { type: "action", id: "show-shortcuts" },
  },
];
