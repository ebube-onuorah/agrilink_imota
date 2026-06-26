import { getAllPricesForAdmin, deleteMarketPrice } from "@/server/actions/prices";
import { PageHeader } from "@/components/layout/page-header";
import { PriceEntryForm } from "./price-form";

function formatMonth(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export const dynamic = "force-dynamic";

export default async function AdminPricesPage() {
  const entries = await getAllPricesForAdmin();

  return (
    <>
      <PageHeader
        title="Market Prices"
        subtitle="Add or update monthly reference prices. If an entry for the same commodity, market, and month already exists it will be overwritten."
      />

      <div className="card" style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>Add / update price entry</h2>
        <PriceEntryForm />
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <h2 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>
          All entries ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p style={{ color: "var(--color-muted)", margin: 0 }}>No price data saved yet.</p>
        ) : (
          <table className="table" style={{ minWidth: "42rem" }}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Commodity</th>
                <th>Market</th>
                <th>Low (₦/kg)</th>
                <th>High (₦/kg)</th>
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{formatMonth(e.recordedDate)}</td>
                  <td>{e.commodityName}</td>
                  <td>{e.marketName}</td>
                  <td>₦{Number(e.pricePerKgLow).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
                  <td>₦{Number(e.pricePerKgHigh).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>{e.dataSource ?? "—"}</td>
                  <td>
                    <form action={deleteMarketPrice}>
                      <input type="hidden" name="id" value={e.id} />
                      <button
                        type="submit"
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--color-danger)" }}
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
