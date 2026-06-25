import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { produceListings, users } from "@/server/db/schema";
import { moderateListing } from "@/server/actions/admin";
import { PageHeader } from "@/components/layout/page-header";
import { ListingStatusBadge } from "@/components/ui/badges";
import { naira, formatDate } from "@/server/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const db = await getDb();
  const all = await db
    .select({
      id: produceListings.id,
      commodityName: produceListings.commodityName,
      price: produceListings.askingPricePerKg,
      status: produceListings.listingStatus,
      createdAt: produceListings.createdAt,
      farmer: users.fullName,
    })
    .from(produceListings)
    .leftJoin(users, eq(produceListings.farmerId, users.id))
    .orderBy(desc(produceListings.createdAt));

  return (
    <>
      <PageHeader title="Listing moderation" subtitle="Review and remove produce listings." />
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Commodity</th>
                <th>Farmer</th>
                <th>Price/kg</th>
                <th>Status</th>
                <th>Listed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {all.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/listings/${l.id}`} style={{ color: "var(--color-brand-700)" }}>{l.commodityName}</Link>
                  </td>
                  <td>{l.farmer}</td>
                  <td>{naira(l.price)}</td>
                  <td><ListingStatusBadge status={l.status} /></td>
                  <td>{formatDate(l.createdAt)}</td>
                  <td>
                    <form action={moderateListing}>
                      <input type="hidden" name="listingId" value={l.id} />
                      <input type="hidden" name="action" value={l.status === "withdrawn" ? "reactivate" : "withdraw"} />
                      <button className={`btn btn-sm ${l.status === "withdrawn" ? "btn-outline" : "btn-danger"}`} type="submit">
                        {l.status === "withdrawn" ? "Reactivate" : "Remove"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
