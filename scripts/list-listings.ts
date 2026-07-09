// Debug helper: print current listings and their image URLs.
import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT listing_id, commodity_name, image_urls FROM produce_listings ORDER BY listing_id`;
  for (const r of rows) console.log(r.listing_id, "|", r.commodity_name, "|", JSON.stringify(r.image_urls));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
