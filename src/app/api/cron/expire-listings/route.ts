// Automated listing expiry (FR-11). Invoked daily by Vercel Cron (see
// vercel.json). Marks active listings whose availability date has passed as
// "expired", removing them from buyer search results.
//
// Protected by CRON_SECRET: Vercel sends it as a Bearer token automatically.

import { NextResponse } from "next/server";
import { and, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { produceListings } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = await getDb();
  // A listing is considered stale once its availability date is more than
  // STALE_DAYS old; perishable produce is no longer relevant by then.
  const STALE_DAYS = 14;
  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const expired = await db
    .update(produceListings)
    .set({ listingStatus: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(produceListings.listingStatus, "active"),
        sql`${produceListings.availableFrom} is not null`,
        lt(produceListings.availableFrom, cutoff),
      ),
    )
    .returning({ id: produceListings.id });

  return NextResponse.json({ ok: true, expiredCount: expired.length, ranAt: new Date().toISOString() });
}
