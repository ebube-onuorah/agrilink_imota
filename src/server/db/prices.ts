// Pure data-transformation helpers for the market price board (FR-05).
// No DB access here — these operate on already-fetched rows so they can be
// unit-tested without a database connection.

export type PriceRow = {
  id: number;
  commodityName: string;
  marketName: string;
  pricePerKgLow: string;
  pricePerKgHigh: string;
  recordedDate: string;   // YYYY-MM-DD
  dataSource: string | null;
};

type CellValue = { mid: number; change: number | null } | null;

export type PriceBoard = {
  commodities: string[];
  markets: string[];
  /** latest[commodity][market] = { mid, change } or null if no data */
  latest: Record<string, Record<string, CellValue>>;
  /** trend[commodity] = [{date, [market]: mid, ...}] sorted ascending */
  trend: Record<string, Record<string, number | string>[]>;
};

function mid(row: PriceRow): number {
  return (Number(row.pricePerKgLow) + Number(row.pricePerKgHigh)) / 2;
}

export function buildPriceBoard(rows: PriceRow[]): PriceBoard {
  const commodities = [...new Set(rows.map((r) => r.commodityName))].sort();
  const markets = [...new Set(rows.map((r) => r.marketName))].sort();
  const dates = [...new Set(rows.map((r) => r.recordedDate))].sort();

  // Build trend series: one entry per date, keyed by market name
  const trend: PriceBoard["trend"] = {};
  for (const commodity of commodities) {
    trend[commodity] = dates.map((date) => {
      const entry: Record<string, number | string> = { date };
      for (const market of markets) {
        const row = rows.find(
          (r) => r.commodityName === commodity && r.marketName === market && r.recordedDate === date,
        );
        if (row) entry[market] = mid(row);
      }
      return entry;
    });
  }

  // Build latest board: latest date's mid + change vs previous date
  const latestDate = dates[dates.length - 1];
  const prevDate = dates[dates.length - 2] ?? null;

  const latest: PriceBoard["latest"] = {};
  for (const commodity of commodities) {
    latest[commodity] = {};
    for (const market of markets) {
      const latestRow = rows.find(
        (r) => r.commodityName === commodity && r.marketName === market && r.recordedDate === latestDate,
      );
      if (!latestRow) {
        latest[commodity][market] = null;
        continue;
      }
      const latestMid = mid(latestRow);
      let change: number | null = null;
      if (prevDate) {
        const prevRow = rows.find(
          (r) => r.commodityName === commodity && r.marketName === market && r.recordedDate === prevDate,
        );
        if (prevRow) change = latestMid - mid(prevRow);
      }
      latest[commodity][market] = { mid: latestMid, change };
    }
  }

  return { commodities, markets, latest, trend };
}
