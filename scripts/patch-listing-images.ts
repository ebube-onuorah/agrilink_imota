/**
 * One-time script: adds representative produce images to the seeded listings.
 * Downloads free Unsplash photos, uploads them to Vercel Blob, then writes
 * the resulting URLs back to the produce_listings rows.
 *
 * Run once:  pnpm tsx scripts/patch-listing-images.ts
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";

// ── Produce → source image map (Unsplash CDN, no API key needed) ─────────────
// Each entry may include a second URL as a backup angle.
const PRODUCE_IMAGES: Record<string, string[]> = {
  "Fresh Waterleaf": [
    "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=900&q=85",
    "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=900&q=85",
  ],
  "Pumpkin Leaves (Ugwu)": [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=85",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&q=85",
  ],
  "Rodo Pepper": [
    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900&q=85",
    "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=900&q=85",
  ],
  "Fresh Cassava Tubers": [
    "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=900&q=85",
    "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=900&q=85",
  ],
  "Live Catfish": [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&q=85",
    "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=900&q=85",
  ],
  "Roma Tomatoes": [
    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=900&q=85",
    "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=900&q=85",
  ],
};

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function uploadImage(buf: Buffer, filename: string): Promise<string> {
  const blob = await put(`listings/${filename}`, buf, {
    access: "public",
    contentType: "image/jpeg",
  });
  return blob.url;
}

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

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set in .env.local");
  }

  const { db, schema } = await buildDb();

  for (const [commodityName, sourceUrls] of Object.entries(PRODUCE_IMAGES)) {
    console.log(`\nProcessing: ${commodityName}`);

    const [listing] = await db
      .select({ id: schema.produceListings.id, imageUrls: schema.produceListings.imageUrls })
      .from(schema.produceListings)
      .where(eq(schema.produceListings.commodityName, commodityName))
      .limit(1);

    if (!listing) {
      console.log(`  ⚠  No listing found — skipping`);
      continue;
    }

    if (listing.imageUrls && listing.imageUrls.length > 0) {
      console.log(`  ✓  Already has ${listing.imageUrls.length} image(s) — skipping`);
      continue;
    }

    const blobUrls: string[] = [];
    for (let i = 0; i < sourceUrls.length; i++) {
      const src = sourceUrls[i];
      process.stdout.write(`  Fetching image ${i + 1}/${sourceUrls.length}…`);
      const buf = await fetchImageBuffer(src);
      if (!buf) {
        console.log(" fetch failed, skipping");
        continue;
      }
      const slug = commodityName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const url = await uploadImage(buf, `${slug}-${i + 1}.jpg`);
      blobUrls.push(url);
      console.log(` uploaded → ${url}`);
    }

    if (blobUrls.length === 0) {
      console.log(`  ✗  No images uploaded for ${commodityName}`);
      continue;
    }

    await db
      .update(schema.produceListings)
      .set({ imageUrls: blobUrls })
      .where(eq(schema.produceListings.id, listing.id));

    console.log(`  ✓  Updated listing ${listing.id} with ${blobUrls.length} image(s)`);
  }

  console.log("\n✓ Done. Copy the Blob URLs above into seed.ts imageUrls arrays for future reseeds.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
