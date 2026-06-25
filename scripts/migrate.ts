// Driver-aware migration runner.
// Applies the SQL migrations in ./drizzle to the active database:
//   - Neon Postgres  when DATABASE_URL is a postgres:// URL
//   - PGlite (local) otherwise
//
// Run with:  pnpm db:migrate   (after pnpm db:generate)

import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

const MIGRATIONS_FOLDER = "./drizzle";

function isRemotePostgres(url: string | undefined): url is string {
  return !!url && /^postgres(ql)?:\/\//.test(url);
}

async function main() {
  const url = process.env.DATABASE_URL;

  if (isRemotePostgres(url)) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    const db = drizzle(neon(url));
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log("✓ Migrations applied to Neon Postgres.");
    return;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(process.env.PGLITE_DIR ?? "./.pglite");
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  await client.close();
  console.log("✓ Migrations applied to local PGlite database (./.pglite).");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
