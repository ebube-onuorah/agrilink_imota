"use client";

// Recharts is client-only — this component is imported via dynamic() with ssr:false
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type HistoryRow = {
  recordedDate: string;
  marketName: string;
  pricePerKgLow: string;
  pricePerKgHigh: string;
};

type Props = { history: HistoryRow[]; commodity: string };

function formatMonth(dateStr: string) {
  // dateStr is YYYY-MM-DD; show "Jan 2025"
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

const LINE_COLORS = ["#2d6a4f", "#74c69d", "#f4a261", "#e76f51", "#457b9d", "#a8dadc"];

export function PriceChart({ history, commodity }: Props) {
  if (history.length === 0) {
    return (
      <p style={{ color: "var(--color-muted)", textAlign: "center", padding: "2rem 0" }}>
        No historical data available for {commodity}.
      </p>
    );
  }

  // Pivot: one row per recorded month, one series per market
  const months = [...new Set(history.map((r) => r.recordedDate))].sort();
  const markets = [...new Set(history.map((r) => r.marketName))];

  const chartData = months.map((month) => {
    const entry: Record<string, string | number> = { month: formatMonth(month) };
    for (const market of markets) {
      const row = history.find((r) => r.recordedDate === month && r.marketName === market);
      if (row) {
        // Use midpoint of the range as the chart value
        entry[market] = (Number(row.pricePerKgLow) + Number(row.pricePerKgHigh)) / 2;
      }
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `₦${v}`}
          label={{ value: "₦/kg", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
        />
        <Tooltip formatter={(v) => (typeof v === "number" ? [`₦${v.toFixed(2)}/kg`, ""] : [String(v), ""])} />
        <Legend />
        {markets.map((market, i) => (
          <Line
            key={market}
            type="monotone"
            dataKey={market}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
