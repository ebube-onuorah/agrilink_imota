import { describe, it, expect } from "vitest";
import { naira } from "@/server/lib/format";

describe("currency formatting", () => {
  it("formats Naira without decimals", () => {
    const out = naira(115000);
    expect(out).toContain("115,000");
  });

  it("handles string and nullish input", () => {
    expect(naira("650")).toContain("650");
    expect(naira(null)).toContain("0");
  });
});
