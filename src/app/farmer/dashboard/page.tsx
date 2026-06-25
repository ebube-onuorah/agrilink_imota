import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { getFarmerListings, getFarmerStats } from "@/server/db/queries";
import { PageHeader } from "@/components/layout/page-header";
import { ListingStatusBadge, Stars } from "@/components/ui/badges";
import { naira, formatDate } from "@/server/lib/format";

export default async function FarmerDashboard() {
  const user = await requireRole("farmer");
  const farmerId = Number(user.id);
  const [stats, listings] = await Promise.all([
    getFarmerStats(farmerId),
    getFarmerListings(farmerId),
  ]);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="Manage your produce listings and track your sales."
        action={
          <Link href="/farmer/listings/new" className="btn btn-primary">+ New listing</Link>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div className="stat-card">
          <div className="stat-value">{stats.activeListings}</div>
          <div className="stat-label">Active listings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completedTransactions}</div>
          <div className="stat-label">Completed sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {stats.credibility.avg ? stats.credibility.avg.toFixed(1) : "—"}
            {stats.credibility.count > 0 && <Stars score={stats.credibility.avg} />}
          </div>
          <div className="stat-label">
            Credibility ({stats.credibility.count} rating{stats.credibility.count === 1 ? "" : "s"})
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-line)" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Your produce listings</h2>
        </div>

        {listings.length === 0 ? (
          <div style={{ padding: "2.5rem 1.25rem", textAlign: "center", color: "var(--color-muted)" }}>
            You have no listings yet.{" "}
            <Link href="/farmer/listings/new" style={{ color: "var(--color-brand-700)", fontWeight: 600 }}>
              Create your first listing
            </Link>
            .
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price/kg</th>
                  <th>Status</th>
                  <th>Listed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.commodityName}</td>
                    <td>{l.category ?? "—"}</td>
                    <td>{Number(l.quantityAvailableKg).toLocaleString()} kg</td>
                    <td>{naira(l.askingPricePerKg)}</td>
                    <td><ListingStatusBadge status={l.listingStatus} /></td>
                    <td>{formatDate(l.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/farmer/listings/${l.id}/edit`} className="btn btn-ghost btn-sm">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
