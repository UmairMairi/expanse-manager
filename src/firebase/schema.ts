/**
 * Centralized Firestore collection names. Importing constants from here
 * (rather than spelling collection paths inline) prevents typos and gives
 * one place to rename a collection if needed.
 */
export const COLLECTIONS = {
  USERS: "users",
  EXPENSES: "expenses",
  INCOME: "income",
  SAVINGS: "savings",
  BUDGETS: "budgets",
  CLIENTS: "clients",
  PROJECTS: "projects",
  MILESTONES: "milestones",
  INVOICES: "invoices",
  NOTIFICATIONS: "notifications",
  LOGIN_ATTEMPTS: "loginAttempts",
  AI_CONVERSATIONS: "aiConversations",
  AI_USAGE: "aiUsage",
  INSIGHTS: "insights",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Subcollection paths */
export const SUBCOLLECTIONS = {
  USER_SETTINGS: (username: string) => `${COLLECTIONS.USERS}/${username}/settings`,
} as const;
