// Admin helper: delete a listing by id, including dependent rows and blob images.
// Run:  pnpm tsx scripts/delete-listing.ts <listingId>

import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { del } from "@vercel/blob";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const id = Number(process.argv[2]);
  if (!id) throw new Error("Usage: pnpm tsx scripts/delete-listing.ts <listingId>");

  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//.test(url)) throw new Error("DATABASE_URL must be Postgres");
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const schema = await import("../src/server/db/schema");
  const db = drizzle(neon(url), { schema });
  const { produceListings, messages, transactions, userRatings, systemNotifications } = schema;

  const [listing] = await db
    .select({ id: produceListings.id, name: produceListings.commodityName, imageUrls: produceListings.imageUrls })
    .from(produceListings)
    .where(eq(produceListings.id, id))
    .limit(1);
  if (!listing) {
    console.log(`Listing ${id} not found.`);
    return;
  }

  const txns = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.listingId, id));
  if (txns.length > 0) {
    await db.delete(userRatings).where(inArray(userRatings.transactionId, txns.map((t) => t.id)));
    await db.delete(transactions).where(eq(transactions.listingId, id));
  }
  await db.delete(messages).where(eq(messages.listingId, id));
  await db.delete(systemNotifications).where(eq(systemNotifications.relatedEntityId, id));
  await db.delete(produceListings).where(eq(produceListings.id, id));
  if (listing.imageUrls?.length) await del(listing.imageUrls).catch(() => {});

  console.log(`✓ Deleted listing ${id} ("${listing.name}") and its ${listing.imageUrls?.length ?? 0} image(s).`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
