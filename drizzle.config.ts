import type { Config } from "drizzle-kit";

// Used by `drizzle-kit generate` to emit SQL migrations from the schema.
// Migrations are applied by scripts/migrate.ts (driver-aware: Neon or PGlite).
export default {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Only used if you run `drizzle-kit push/studio` directly against Neon.
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/placeholder",
  },
  verbose: true,
  strict: false,
} satisfies Config;
