#!/usr/bin/env tsx
/**
 * One-off admin seeding script.
 *
 *   tsx scripts/seed-admin.ts \
 *     --username Chamption.studio \
 *     --password '<your-password>' \
 *     --name 'Umair Asim' \
 *     --email union.dev10@gmail.com
 *
 * Refuses to overwrite an existing user unless --force is passed.
 */
import { parseArgs } from "node:util";
import { config as loadEnv } from "dotenv";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "../src/firebase/admin";
import { COLLECTIONS } from "../src/firebase/schema";
import { hashPassword } from "../src/lib/password";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const DEFAULTS = {
  username: "Chamption.studio",
  email: "union.dev10@gmail.com",
  name: "Umair Asim",
};

async function main() {
  const { values } = parseArgs({
    options: {
      username: { type: "string", default: DEFAULTS.username },
      password: { type: "string" },
      name: { type: "string", default: DEFAULTS.name },
      email: { type: "string", default: DEFAULTS.email },
      force: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (!values.password) {
    console.error("Error: --password is required.");
    console.error(
      "  tsx scripts/seed-admin.ts --username <u> --password '<p>' --name '<n>' --email <e>",
    );
    process.exit(1);
  }
  if (values.password.length < 8) {
    console.error("Error: password must be at least 8 characters.");
    process.exit(1);
  }

  const db = getDb();
  const ref = db.collection(COLLECTIONS.USERS).doc(values.username!);
  const existing = await ref.get();
  if (existing.exists && !values.force) {
    console.error(
      `User "${values.username}" already exists. Re-run with --force to overwrite.`,
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(values.password);

  await ref.set({
    username: values.username,
    passwordHash,
    name: values.name,
    email: values.email,
    role: "admin",
    createdAt: existing.exists
      ? (existing.data()?.["createdAt"] ?? Timestamp.now())
      : Timestamp.now(),
  });

  console.log(
    `${existing.exists ? "Updated" : "Created"} admin user "${values.username}" (email: ${values.email}).`,
  );
  console.log("You can now log in at /login.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
