import { describe, it, expect } from "vitest";
import { canTransition, TRANSACTION_TRANSITIONS } from "@/server/lib/constants";

describe("transaction state machine (FR-07)", () => {
  it("allows valid forward transitions", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "completed")).toBe(true);
    expect(canTransition("confirmed", "disputed")).toBe(true);
    expect(canTransition("disputed", "completed")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("pending", "completed")).toBe(false);
    expect(canTransition("completed", "pending")).toBe(false);
    expect(canTransition("completed", "confirmed")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
  });

  it("treats completed and cancelled as terminal", () => {
    expect(TRANSACTION_TRANSITIONS.completed).toEqual([]);
    expect(TRANSACTION_TRANSITIONS.cancelled).toEqual([]);
  });
});
