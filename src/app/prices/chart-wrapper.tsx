"use client";

import dynamic from "next/dynamic";

type HistoryRow = {
  recordedDate: string;
  marketName: string;
  pricePerKgLow: string;
  pricePerKgHigh: string;
};

const PriceChart = dynamic(() => import("./price-chart").then((m) => m.PriceChart), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 280,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-muted)",
      }}
    >
      Loading chart…
    </div>
  ),
});

export function ChartWrapper({ history, commodity }: { history: HistoryRow[]; commodity: string }) {
  return <PriceChart history={history} commodity={commodity} />;
}
