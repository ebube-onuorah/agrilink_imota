import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireRole } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { produceListings } from "@/server/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { NewTransactionForm } from "./new-transaction-form";
import { naira } from "@/server/lib/format";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  await requireRole("buyer");
  const { listing: listingParam } = await searchParams;
  if (!listingParam) redirect("/search");

  const db = await getDb();
  const [listing] = await db
    .select()
    .from(produceListings)
    .where(eq(produceListings.id, Number(listingParam)))
    .limit(1);
  if (!listing) notFound();

  return (
    <div className="container-page" style={{ padding: "2rem 1rem", maxWidth: "40rem" }}>
      <PageHeader title="Record a transaction" subtitle={`For: ${listing.commodityName} · ${naira(listing.askingPricePerKg)}/kg`} />
      <div className="card">
        <NewTransactionForm listingId={listing.id} defaultPrice={listing.askingPricePerKg ?? ""} />
        <p style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginTop: "1rem", marginBottom: 0 }}>
          The farmer will be notified and can confirm the transaction. Both parties track its status here.
        </p>
      </div>
    </div>
  );
}
