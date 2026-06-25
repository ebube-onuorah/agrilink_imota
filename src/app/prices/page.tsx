import { getAllPrices, buildPriceBoard } from "@/server/db/prices";
import { PriceTrendChart } from "@/components/prices/price-trend-chart";
import { naira, formatDate } from "@/server/lib/format";

export const dynamic = "force-dynamic";

function ChangeIndicator({ change }: { change: number }) {
  if (Math.abs(change) < 1) return <span style={{ color: "var(--color-muted)" }}>→</span>;
  const up = change > 0;
  return (
    <span style={{ color: up ? "#dc2626" : "#16a34a", fontSize: "0.8rem", fontWeight: 600 }}>
      {up ? "▲" : "▼"} {naira(Math.abs(change))}
    </span>
  );
}

export default async function PricesPage() {
  const rows = await getAllPrices();
  const board = buildPriceBoard(rows);
  const latestRecordedDate =
    rows.length > 0
      ? rows.reduce((max, row) => (row.recordedDate > max ? row.recordedDate : max), rows[0].recordedDate)
      : null;

  return (
    <div className="container-page" style={{ padding: "2rem 1rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.7rem", margin: "0 0 0.25rem" }}>Lagos market prices</h1>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          Current wholesale prices (N/kg) across the major Lagos markets.
        </p>
        <div
          className="alert alert-info"
          style={{ marginTop: "0.9rem", padding: "0.9rem 1rem", maxWidth: "52rem" }}
        >
          <strong>Freshness note:</strong> this page is updated whenever an administrator adds a new
          survey record. It is not scraping live market data automatically.{" "}
          {latestRecordedDate ? <>Latest recorded date: {formatDate(latestRecordedDate)}.</> : null}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Commodity</th>
                {board.markets.map((m) => (
                  <th key={m}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.commodities.map((c) => (
                <tr key={c}>
                  <td style={{ fontWeight: 600 }}>{c}</td>
                  {board.markets.map((m) => {
                    const cell = board.latest[c][m];
                    return (
                      <td key={m}>
                        {cell ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                            <span style={{ fontWeight: 600 }}>
                              {naira(cell.low)} - {naira(cell.high)}
                            </span>
                            <ChangeIndicator change={cell.change} />
                          </div>
                        ) : (
                          <span style={{ color: "var(--color-muted)" }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PriceTrendChart commodities={board.commodities} markets={board.markets} trend={board.trend} />
    </div>
  );
}
