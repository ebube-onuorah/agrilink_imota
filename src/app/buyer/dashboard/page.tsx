import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/server/auth/session";
import { getBuyerStats } from "@/server/db/queries";
import { getDb } from "@/server/db";
import { produceListings, commodityCategories, users } from "@/server/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { naira } from "@/server/lib/format";

export default async function BuyerDashboard() {
  const user = await requireRole("buyer");
  const stats = await getBuyerStats(Number(user.id));

  const db = await getDb();
  const recent = await db
    .select({
      id: produceListings.id,
      commodityName: produceListings.commodityName,
      askingPricePerKg: produceListings.askingPricePerKg,
      quantityAvailableKg: produceListings.quantityAvailableKg,
      category: commodityCategories.categoryName,
      farmer: users.fullName,
    })
    .from(produceListings)
    .leftJoin(commodityCategories, eq(produceListings.categoryId, commodityCategories.id))
    .leftJoin(users, eq(produceListings.farmerId, users.id))
    .where(eq(produceListings.listingStatus, "active"))
    .orderBy(desc(produceListings.createdAt))
    .limit(6);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="Source fresh produce directly from local farmers."
        action={<Link href="/search" className="btn btn-primary">Find produce</Link>}
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
          <div className="stat-value">{stats.pendingTransactions}</div>
          <div className="stat-label">Pending transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completedTransactions}</div>
          <div className="stat-label">Completed purchases</div>
        </div>
      </div>

      <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Latest produce near you</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))",
          gap: "1rem",
        }}
      >
        {recent.map((l) => (
          <Link key={l.id} href={`/listings/${l.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="badge badge-green" style={{ marginBottom: "0.5rem" }}>{l.category ?? "Produce"}</span>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.05rem" }}>{l.commodityName}</h3>
            <p style={{ margin: "0 0 0.5rem", color: "var(--color-muted)", fontSize: "0.85rem" }}>
              {Number(l.quantityAvailableKg).toLocaleString()} kg available
              <br />
              {l.farmer}
            </p>
            <div style={{ fontWeight: 700, color: "var(--color-brand-700)" }}>{naira(l.askingPricePerKg)}/kg</div>
          </Link>
        ))}
      </div>
    </>
  );
}
