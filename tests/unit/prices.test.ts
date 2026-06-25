import { describe, it, expect } from "vitest";
import { buildPriceBoard, type PriceRow } from "@/server/db/prices";

function row(partial: Partial<PriceRow> & { recordedDate: string; pricePerKgLow: string; pricePerKgHigh: string }): PriceRow {
  return {
    id: Math.floor(Math.random() * 1e6),
    commodityName: "Tomatoes",
    marketName: "Mile 12 Market",
    dataSource: "test",
    ...partial,
  } as PriceRow;
}

describe("price board aggregation (FR-05)", () => {
  const rows: PriceRow[] = [
    row({ recordedDate: "2026-06-01", pricePerKgLow: "1000", pricePerKgHigh: "1200" }),
    row({ recordedDate: "2026-06-02", pricePerKgLow: "1100", pricePerKgHigh: "1300" }),
  ];

  it("computes the latest mid price and day-on-day change", () => {
    const board = buildPriceBoard(rows);
    const cell = board.latest["Tomatoes"]["Mile 12 Market"];
    expect(cell).not.toBeNull();
    // latest mid = (1100+1300)/2 = 1200; previous mid = (1000+1200)/2 = 1100
    expect(cell!.mid).toBe(1200);
    expect(cell!.change).toBe(100);
  });

  it("builds a trend series with one point per date", () => {
    const board = buildPriceBoard(rows);
    expect(board.trend["Tomatoes"]).toHaveLength(2);
    expect(board.commodities).toContain("Tomatoes");
  });

  it("returns null cells for markets with no data", () => {
    const board = buildPriceBoard(rows);
    expect(board.latest["Tomatoes"]["Oshodi Market"]).toBeNull();
  });
});
