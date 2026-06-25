import { PageHeader } from "@/components/layout/page-header";
import { AddPriceForm } from "./add-price-form";
import { getRecentPriceEntries } from "@/server/db/prices";
import { naira, formatDate } from "@/server/lib/format";

export default async function AdminPricesPage() {
  const recent = await getRecentPriceEntries(15);

  return (
    <>
      <PageHeader title="Market prices" subtitle="Maintain the wholesale price data shown to farmers and buyers." />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 22rem) 1fr", gap: "1.5rem", alignItems: "start" }}>
        <div className="card">
          <h2 style={{ fontSize: "1.1rem", margin: "0 0 1rem" }}>Add price record</h2>
          <AddPriceForm />
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-line)" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Recent entries</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Market</th>
                  <th>Range (₦/kg)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.commodityName}</td>
                    <td>{r.marketName}</td>
                    <td>{naira(r.pricePerKgLow)} – {naira(r.pricePerKgHigh)}</td>
                    <td>{formatDate(r.recordedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
