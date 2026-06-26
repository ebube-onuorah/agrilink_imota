import { getLatestPrices, getPriceHistory, getPricedCommodities } from "@/server/actions/prices";
import { PageHeader } from "@/components/layout/page-header";
import { ChartWrapper } from "./chart-wrapper";

// Force dynamic because we read searchParams
export const dynamic = "force-dynamic";

function formatMonth(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

type SP = { commodity?: string };

export default async function PricesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  const [{ prices, recordedDate }, commodities] = await Promise.all([
    getLatestPrices(),
    getPricedCommodities(),
  ]);

  const selectedCommodity = sp.commodity ?? commodities[0] ?? "";
  const history = selectedCommodity ? await getPriceHistory(selectedCommodity) : [];

  // Group current month's prices by commodity for the table
  const grouped: Record<string, typeof prices> = {};
  for (const row of prices) {
    if (!grouped[row.commodityName]) grouped[row.commodityName] = [];
    grouped[row.commodityName].push(row);
  }

  return (
    <div className="container-page" style={{ padding: "2rem 1rem" }}>
      <PageHeader
        title="Market Prices"
        subtitle={
          recordedDate
            ? `Reference prices for ${formatMonth(recordedDate)} · Updated monthly · Source: Imota/Ikorodu markets survey`
            : "No price data published yet. Check back soon."
        }
      />

      {prices.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          No market price data has been published yet. The platform administrator updates prices monthly.
        </div>
      ) : (
        <>
          {/* Current month price table */}
          <div className="card" style={{ marginBottom: "1.75rem", overflowX: "auto" }}>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 1rem" }}>
              {formatMonth(recordedDate)} — Market Price Reference
            </h2>
            <table className="table" style={{ minWidth: "36rem" }}>
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Market</th>
                  <th>Low (₦/kg)</th>
                  <th>High (₦/kg)</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 600 }}>{row.commodityName}</td>
                    <td>{row.marketName}</td>
                    <td>₦{Number(row.pricePerKgLow).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
                    <td>₦{Number(row.pricePerKgHigh).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>{row.dataSource ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ margin: "0.75rem 0 0", fontSize: "0.82rem", color: "var(--color-muted)" }}>
              Prices are indicative wholesale ranges collected from Mile 12, Oshodi, and Badagry markets within the Lagos metropolitan area.
              Use these figures as a negotiation reference — actual farm-gate prices may vary by grade, volume, and transport.
            </p>
          </div>

          {/* Trend chart */}
          {commodities.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Price trend (last 12 months)</h2>
                <form method="get" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <label htmlFor="commodity" style={{ fontSize: "0.9rem", color: "var(--color-muted)" }}>
                    Commodity:
                  </label>
                  <select
                    id="commodity"
                    name="commodity"
                    className="select"
                    defaultValue={selectedCommodity}
                    style={{ width: "auto" }}
                    onChange={undefined}
                  >
                    {commodities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-outline btn-sm">View</button>
                </form>
              </div>

              <ChartWrapper history={history} commodity={selectedCommodity} />

              <p style={{ margin: "0.75rem 0 0", fontSize: "0.82rem", color: "var(--color-muted)" }}>
                Chart shows average of the low/high price range across markets. Each data point represents one monthly survey.
              </p>
            </div>
          )}
        </>
      )}

      <div className="card" style={{ marginTop: "1.25rem", background: "var(--color-brand-50)", borderColor: "var(--color-brand-200)" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.6 }}>
          <strong>Note:</strong> These prices are collected once per month from Imota, Ikorodu, and surrounding Lagos markets.
          They serve as a reference for negotiations between farmers and buyers on this platform.
          For the most current spot prices, visit your local market or contact a commodity broker.
        </p>
      </div>
    </div>
  );
}
