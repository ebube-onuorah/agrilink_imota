import { describe, it, expect } from "vitest";
import {
  listingSchema,
  registerSchema,
  transactionSchema,
  ratingSchema,
} from "@/server/validation/schemas";

describe("listing validation (FR-03)", () => {
  it("accepts a valid listing", () => {
    const r = listingSchema.safeParse({
      commodityName: "Fresh Waterleaf",
      categoryId: "2",
      quantityAvailableKg: "120",
      askingPricePerKg: "650",
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-positive quantity and price", () => {
    const r = listingSchema.safeParse({
      commodityName: "X",
      categoryId: "1",
      quantityAvailableKg: "0",
      askingPricePerKg: "-5",
    });
    expect(r.success).toBe(false);
  });
});

describe("registration validation (FR-01)", () => {
  it("rejects weak passwords", () => {
    const r = registerSchema.safeParse({
      fullName: "Ada Okafor",
      email: "ada@example.com",
      phone: "08030000000",
      userType: "farmer",
      password: "123456890",
      confirmPassword: "123456890",
    });
    expect(r.success).toBe(false);
  });

  it("requires matching passwords", () => {
    const r = registerSchema.safeParse({
      fullName: "Ada Okafor",
      email: "ada@example.com",
      phone: "08030000000",
      userType: "farmer",
      password: "Password123!",
      confirmPassword: "Different1!",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = registerSchema.safeParse({
      fullName: "Ada",
      email: "not-an-email",
      phone: "08030000000",
      userType: "buyer",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(r.success).toBe(false);
  });
});

describe("transaction + rating validation", () => {
  it("computes-ready transaction parses numeric strings", () => {
    const r = transactionSchema.safeParse({
      listingId: "5",
      buyerId: "3",
      quantityAgreedKg: "100",
      agreedPricePerKg: "1150",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.quantityAgreedKg * r.data.agreedPricePerKg).toBe(115000);
  });

  it("bounds rating score to 1..5", () => {
    expect(ratingSchema.safeParse({ transactionId: "1", ratingScore: "6" }).success).toBe(false);
    expect(ratingSchema.safeParse({ transactionId: "1", ratingScore: "5" }).success).toBe(true);
  });
});
