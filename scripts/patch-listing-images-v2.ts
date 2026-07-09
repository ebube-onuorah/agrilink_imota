/**
 * One-time script (v2) — listing content polish:
 *  1. Remove the "Pumpkin Leaves (Ugwu)" listing (and dependent rows).
 *  2. Replace the Live Catfish photos with a real catfish-for-sale photo.
 *  3. Convert "Fresh Cassava Tubers" to "Yam Tubers" with real yam photos.
 *
 * Expects pre-processed images in the folder passed as argv[2].
 * Run:  pnpm tsx scripts/patch-listing-images-v2.ts <image-folder>
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { put, del } from "@vercel/blob";
import { eq, inArray } from "drizzle-orm";

async function buildDb() {
  const url = process.env.DATABASE_URL;
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const schema = await import("../src/server/db/schema");
    return { db: drizzle(neon(url), { schema }), schema };
  }
  throw new Error("DATABASE_URL must be a Postgres connection string.");
}

async function upload(dir: string, file: string): Promise<string> {
  const buf = await readFile(join(dir, file));
  const blob = await put(`listings/${file}`, buf, {
    access: "public",
    contentType: "image/jpeg",
    allowOverwrite: true,
  });
  return blob.url;
}

async function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error("Usage: pnpm tsx scripts/patch-listing-images-v2.ts <image-folder>");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN missing");

  const { db, schema } = await buildDb();
  const { produceListings, messages, transactions, userRatings, systemNotifications } = schema;

  // ── 1. Remove Pumpkin Leaves listing ──────────────────────────────────────
  const [pumpkin] = await db
    .select({ id: produceListings.id, imageUrls: produceListings.imageUrls })
    .from(produceListings)
    .where(eq(produceListings.commodityName, "Pumpkin Leaves (Ugwu)"))
    .limit(1);

  if (pumpkin) {
    // Remove dependent rows first (no cascade on these FKs)
    const txns = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.listingId, pumpkin.id));
    if (txns.length > 0) {
      await db.delete(userRatings).where(inArray(userRatings.transactionId, txns.map((t) => t.id)));
      await db.delete(transactions).where(eq(transactions.listingId, pumpkin.id));
    }
    await db.delete(messages).where(eq(messages.listingId, pumpkin.id));
    await db.delete(systemNotifications).where(eq(systemNotifications.relatedEntityId, pumpkin.id));
    await db.delete(produceListings).where(eq(produceListings.id, pumpkin.id));
    if (pumpkin.imageUrls?.length) await del(pumpkin.imageUrls).catch(() => {});
    console.log(`✓ Removed Pumpkin Leaves listing (id ${pumpkin.id})`);
  } else {
    console.log("• Pumpkin Leaves listing not found — already removed");
  }

  // ── 2. Live Catfish: replace with real catfish photo ──────────────────────
  const [catfish] = await db
    .select({ id: produceListings.id, imageUrls: produceListings.imageUrls })
    .from(produceListings)
    .where(eq(produceListings.commodityName, "Live Catfish"))
    .limit(1);

  if (catfish) {
    const url = await upload(dir, "live-catfish-1.jpg");
    if (catfish.imageUrls?.length) await del(catfish.imageUrls).catch(() => {});
    await db.update(produceListings).set({ imageUrls: [url] }).where(eq(produceListings.id, catfish.id));
    console.log(`✓ Live Catfish image replaced → ${url}`);
  }

  // ── 3. Cassava → Yam Tubers with real yam photos ──────────────────────────
  const [cassava] = await db
    .select({ id: produceListings.id, imageUrls: produceListings.imageUrls })
    .from(produceListings)
    .where(eq(produceListings.commodityName, "Fresh Cassava Tubers"))
    .limit(1);

  if (cassava) {
    const yam1 = await upload(dir, "yam-tubers-1.jpg");
    const yam2 = await upload(dir, "yam-tubers-2.jpg");
    if (cassava.imageUrls?.length) await del(cassava.imageUrls).catch(() => {});
    await db
      .update(produceListings)
      .set({
        commodityName: "Yam Tubers",
        qualityGrade: "Grade A",
        qualityDescription: "Freshly harvested Puna yam tubers, firm and well-cured. Sold per kg or by the tuber.",
        askingPricePerKg: "850.00",
        imageUrls: [yam1, yam2],
      })
      .where(eq(produceListings.id, cassava.id));
    console.log(`✓ Cassava converted to Yam Tubers → ${yam1}, ${yam2}`);
  } else {
    console.log("• Cassava listing not found (maybe already converted)");
  }

  console.log("\n✓ Done.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
