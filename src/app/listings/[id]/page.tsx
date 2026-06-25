import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { produceListings, users, commodityCategories } from "@/server/db/schema";
import { getCredibility } from "@/server/db/queries";
import { expressInterest } from "@/server/actions/messages";
import { naira, formatDate } from "@/server/lib/format";
import { Stars, ListingStatusBadge } from "@/components/ui/badges";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingId = Number(id);
  const user = await requireUser();

  const db = await getDb();
  const [row] = await db
    .select({
      listing: produceListings,
      farmerName: users.fullName,
      category: commodityCategories.categoryName,
    })
    .from(produceListings)
    .leftJoin(users, eq(produceListings.farmerId, users.id))
    .leftJoin(commodityCategories, eq(produceListings.categoryId, commodityCategories.id))
    .where(eq(produceListings.id, listingId))
    .limit(1);

  if (!row) notFound();
  const { listing } = row;
  const credibility = await getCredibility(listing.farmerId);
  const isOwner = Number(user.id) === listing.farmerId;
  const isBuyer = user.userType === "buyer";

  return (
    <div className="container-page" style={{ padding: "2rem 1rem", maxWidth: "60rem" }}>
      <Link href={isBuyer ? "/search" : "/farmer/dashboard"} className="btn btn-ghost btn-sm" style={{ marginBottom: "1rem" }}>
        ← Back
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) 1fr", gap: "1.5rem", alignItems: "start" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: "16rem", background: "var(--color-brand-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {listing.imageUrls?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.imageUrls[0]} alt={listing.commodityName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "4rem" }} aria-hidden>🧺</span>
            )}
          </div>
          <div style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span className="badge badge-green">{row.category ?? "Produce"}</span>
              <ListingStatusBadge status={listing.listingStatus} />
            </div>
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.6rem" }}>{listing.commodityName}</h1>
            <p style={{ color: "var(--color-muted)", margin: "0 0 1rem", lineHeight: 1.6 }}>
              {listing.qualityDescription || "No additional description provided."}
            </p>
            <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", margin: 0 }}>
              <Detail label="Quantity available" value={`${Number(listing.quantityAvailableKg).toLocaleString()} kg`} />
              <Detail label="Harvest date" value={formatDate(listing.harvestDate)} />
              <Detail label="Available from" value={formatDate(listing.availableFrom)} />
              <Detail label="Status" value={listing.listingStatus} />
            </dl>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div className="stat-label">Asking price</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-brand-700)" }}>
              {naira(listing.askingPricePerKg)}<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--color-muted)" }}>/kg</span>
            </div>
          </div>

          <div className="card">
            <div className="stat-label" style={{ marginBottom: "0.4rem" }}>Sold by</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{row.farmerName}</div>
            <div style={{ marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {credibility.count > 0 ? (
                <>
                  <Stars score={credibility.avg} />
                  <span style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>
                    {credibility.avg.toFixed(1)} ({credibility.count})
                  </span>
                </>
              ) : (
                <span style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>No ratings yet</span>
              )}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--color-muted)", marginTop: "0.75rem", marginBottom: 0 }}>
              Contact details stay private until a transaction is confirmed.
            </p>
          </div>

          {isOwner ? (
            <Link href={`/farmer/listings/${listing.id}/edit`} className="btn btn-outline btn-block">Manage this listing</Link>
          ) : isBuyer && listing.listingStatus === "active" ? (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link href={`/messages/${listing.id}`} className="btn btn-outline btn-block">
                Message farmer
              </Link>
              <form action={expressInterest}>
                <input type="hidden" name="listingId" value={listing.id} />
                <button type="submit" className="btn btn-primary btn-block">Send first interest note</button>
              </form>
              <Link href={`/transactions/new?listing=${listing.id}`} className="btn btn-accent btn-block">
                Record a transaction
              </Link>
            </div>
          ) : (
            <div className="alert alert-info">This listing is not currently available for new enquiries.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</dt>
      <dd style={{ margin: "0.15rem 0 0", fontWeight: 600 }}>{value}</dd>
    </div>
  );
}
