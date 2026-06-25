import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireRole } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { produceListings } from "@/server/db/schema";
import { getCategories } from "@/server/db/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ListingForm } from "@/components/listings/listing-form";
import { ListingStatusBadge } from "@/components/ui/badges";
import { updateListing, withdrawListing, reactivateListing } from "@/server/actions/listings";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingId = Number(id);
  const user = await requireRole("farmer");

  const db = await getDb();
  const [listing] = await db
    .select()
    .from(produceListings)
    .where(and(eq(produceListings.id, listingId), eq(produceListings.farmerId, Number(user.id))))
    .limit(1);

  if (!listing) notFound();

  const categories = await getCategories();
  const boundUpdate = updateListing.bind(null, listingId);

  return (
    <div style={{ maxWidth: "44rem" }}>
      <PageHeader
        title="Manage listing"
        subtitle={listing.commodityName}
        action={<ListingStatusBadge status={listing.listingStatus} />}
      />

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <ListingForm
          action={boundUpdate}
          categories={categories}
          submitLabel="Save changes"
          defaults={{
            commodityName: listing.commodityName,
            categoryId: listing.categoryId,
            quantityAvailableKg: listing.quantityAvailableKg ?? "",
            askingPricePerKg: listing.askingPricePerKg ?? "",
            qualityDescription: listing.qualityDescription,
            harvestDate: listing.harvestDate,
            availableFrom: listing.availableFrom,
          }}
        />
      </div>

      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <strong>Listing status</strong>
          <p style={{ margin: "0.25rem 0 0", color: "var(--color-muted)", fontSize: "0.9rem" }}>
            Withdrawn listings are hidden from buyer search results.
          </p>
        </div>
        {listing.listingStatus === "active" ? (
          <form action={withdrawListing}>
            <input type="hidden" name="listingId" value={listing.id} />
            <button type="submit" className="btn btn-danger btn-sm">Withdraw listing</button>
          </form>
        ) : (
          <form action={reactivateListing}>
            <input type="hidden" name="listingId" value={listing.id} />
            <button type="submit" className="btn btn-outline btn-sm">Reactivate listing</button>
          </form>
        )}
      </div>
    </div>
  );
}
