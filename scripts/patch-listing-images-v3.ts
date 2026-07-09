/**
 * One-time script (v3) — fix wrong/broken listing images:
 *  1. Rodo Pepper: replace potato/bell-pepper photos with verified scotch bonnet photos.
 *  2. Live Catfish: DB points at a 404 blob (v2 uploaded then deleted the same path).
 *     Re-upload under a NEW filename so the CDN cache cannot serve stale content.
 *  3. Fresh Waterleaf: drop the second image (lettuce, not waterleaf).
 *  4. Delete the user-created "Bitter Tomatoes" test listing.
 *
 * IMPORTANT lesson encoded here: never upload to a blob path that previously
 * existed — always use a fresh filename, and only del() URLs that differ from
 * the ones just uploaded.
 *
 * Run:  pnpm tsx scripts/patch-listing-images-v3.ts <image-folder>
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
  });
  return blob.url;
}

// Delete only blob URLs that are NOT in keep — prevents deleting a fresh upload.
async function safeDel(oldUrls: string[] | null, keep: string[]) {
  const targets = (oldUrls ?? []).filter((u) => !keep.includes(u));
  if (targets.length > 0) await del(targets).catch(() => {});
}

async function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error("Usage: pnpm tsx scripts/patch-listing-images-v3.ts <image-folder>");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN missing");

  const { db, schema } = await buildDb();
  const { produceListings, messages, transactions, userRatings, systemNotifications } = schema;

  // ── 1. Rodo Pepper: verified scotch bonnet photos ──────────────────────────
  const [pepper] = await db
    .select({ id: produceListings.id, imageUrls: produceListings.imageUrls })
    .from(produceListings)
    .where(eq(produceListings.commodityName, "Rodo Pepper"))
    .limit(1);
  if (pepper) {
    const u1 = await upload(dir, "rodo-pepper-3.jpg");
    const u2 = await upload(dir, "rodo-pepper-4.jpg");
    await db.update(produceListings).set({ imageUrls: [u1, u2] }).where(eq(produceListings.id, pepper.id));
    await safeDel(pepper.imageUrls, [u1, u2]);
    console.log(`✓ Rodo Pepper → ${u1}, ${u2}`);
  }

  // ── 2. Live Catfish: fresh filename, verified photo ────────────────────────
  const [catfish] = await db
    .select({ id: produceListings.id, imageUrls: produceListings.imageUrls })
    .from(produceListings)
    .where(eq(produceListings.commodityName, "Live Catfish"))
    .limit(1);
  if (catfish) {
    const u = await upload(dir, "catfish-market-1.jpg");
    await db.update(produceListings).set({ imageUrls: [u] }).where(eq(produceListings.id, catfish.id));
    await safeDel(catfish.imageUrls, [u]);
    console.log(`✓ Live Catfish → ${u}`);
  }

  // ── 3. Waterleaf: keep only the first (correct) image ──────────────────────
  const [waterleaf] = await db
    .select({ id: produceListings.id, imageUrls: produceListings.imageUrls })
    .from(produceListings)
    .where(eq(produceListings.commodityName, "Fresh Waterleaf"))
    .limit(1);
  if (waterleaf && (waterleaf.imageUrls?.length ?? 0) > 1) {
    const keep = [waterleaf.imageUrls![0]];
    await db.update(produceListings).set({ imageUrls: keep }).where(eq(produceListings.id, waterleaf.id));
    await safeDel(waterleaf.imageUrls, keep);
    console.log(`✓ Waterleaf trimmed to 1 verified image`);
  }

  // ── 4. Delete "Bitter Tomatoes" test listing ───────────────────────────────
  const [bitter] = await db
    .select({ id: produceListings.id, imageUrls: produceListings.imageUrls })
    .from(produceListings)
    .where(eq(produceListings.commodityName, "Bitter Tomatoes"))
    .limit(1);
  if (bitter) {
    const txns = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.listingId, bitter.id));
    if (txns.length > 0) {
      await db.delete(userRatings).where(inArray(userRatings.transactionId, txns.map((t) => t.id)));
      await db.delete(transactions).where(eq(transactions.listingId, bitter.id));
    }
    await db.delete(messages).where(eq(messages.listingId, bitter.id));
    await db.delete(systemNotifications).where(eq(systemNotifications.relatedEntityId, bitter.id));
    await db.delete(produceListings).where(eq(produceListings.id, bitter.id));
    await safeDel(bitter.imageUrls, []);
    console.log(`✓ Deleted "Bitter Tomatoes" listing (id ${bitter.id})`);
  } else {
    console.log("• Bitter Tomatoes not found — already removed");
  }

  console.log("\n✓ Done.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
