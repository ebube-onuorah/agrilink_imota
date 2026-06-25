"use client";

import { useState } from "react";
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

const COLORS = ["#15803d", "#d97706", "#2563eb"];

export function PriceTrendChart({
  commodities,
  markets,
  trend,
}: {
  commodities: string[];
  markets: string[];
  trend: Record<string, Array<Record<string, string | number>>>;
}) {
  const [commodity, setCommodity] = useState(commodities[0] ?? "");
  const data = trend[commodity] ?? [];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>30-day price trend</h2>
        <select
          className="select"
          style={{ width: "auto" }}
          value={commodity}
          onChange={(e) => setCommodity(e.target.value)}
          aria-label="Choose commodity"
        >
          {commodities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v) => `₦${v}`} />
            <Tooltip formatter={(v) => [`₦${Number(v)}/kg`, ""]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {markets.map((m, i) => (
              <Line
                key={m}
                type="monotone"
                dataKey={m}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
