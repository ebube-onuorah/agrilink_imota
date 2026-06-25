// Dual-driver database layer.
//
//   PRODUCTION (Vercel)  → Neon serverless Postgres over HTTP
//                          (set DATABASE_URL to your Neon connection string)
//   LOCAL DEVELOPMENT    → PGlite, an embedded Postgres that runs in-process
//                          with no server or credentials (data under ./.pglite)
//
// The same Drizzle query API is used regardless of driver, so application code
// never needs to know which backend is active.

import * as schema from "./schema";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";

export type DB = PgliteDatabase<typeof schema>;

const PGLITE_DIR = process.env.PGLITE_DIR ?? "./.pglite";

function isRemotePostgres(url: string | undefined): url is string {
  return !!url && /^postgres(ql)?:\/\//.test(url);
}

async function createDb(): Promise<DB> {
  const url = process.env.DATABASE_URL;

  if (isRemotePostgres(url)) {
    // Neon serverless HTTP driver — edge/serverless friendly, no pooling needed.
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle: drizzleNeon } = await import("drizzle-orm/neon-http");
    const sql = neon(url);
    return drizzleNeon(sql, { schema }) as unknown as DB;
  }

  // Embedded PGlite for local dev / tests.
  const { PGlite } = await import("@electric-sql/pglite");
  const client = new PGlite(PGLITE_DIR);
  return drizzlePglite(client, { schema });
}

// Lazy singleton across HMR reloads in dev. The connection is created on first
// use (not at import time) so importing this module during the build or in the
// edge runtime never opens a database handle.
const globalForDb = globalThis as unknown as { __farmlinkDb?: Promise<DB> };

/** Await the shared database handle, creating it on first call. */
export async function getDb(): Promise<DB> {
  if (!globalForDb.__farmlinkDb) {
    globalForDb.__farmlinkDb = createDb();
  }
  return globalForDb.__farmlinkDb;
}

export { schema };
