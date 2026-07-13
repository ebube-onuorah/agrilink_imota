// Reactivate demo listings with fresh availability dates so the daily
// expiry cron doesn't hide them from search for another 14 days.
// Run:  pnpm tsx scripts/refresh-listings.ts
import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { eq } from "drizzle-orm";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//.test(url)) throw new Error("DATABASE_URL must be Postgres");
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const schema = await import("../src/server/db/schema");
  const db = drizzle(neon(url), { schema });

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const rows = await db
    .update(schema.produceListings)
    .set({ listingStatus: "active", availableFrom: today, harvestDate: yesterday, updatedAt: new Date() })
    .where(eq(schema.produceListings.listingStatus, "expired"))
    .returning({ id: schema.produceListings.id, name: schema.produceListings.commodityName });

  for (const r of rows) console.log(`✓ reactivated ${r.id}: ${r.name}`);
  console.log(`${rows.length} listings refreshed (available_from=${today})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
