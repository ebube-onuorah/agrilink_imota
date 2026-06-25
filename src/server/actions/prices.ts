"use server";

// Admin market-price entry (FR-05).

import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db";
import { marketPrices } from "@/server/db/schema";
import { requireRole } from "@/server/auth/session";
import { marketPriceSchema } from "@/server/validation/schemas";
import type { FormState } from "@/server/actions/auth";
import type { ZodError } from "zod";

function flatten(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function addMarketPrice(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const parsed = marketPriceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const d = parsed.data;
  if (d.pricePerKgHigh < d.pricePerKgLow) {
    return { fieldErrors: { pricePerKgHigh: "High price must be greater than or equal to the low price" } };
  }

  const db = await getDb();
  await db.insert(marketPrices).values({
    commodityName: d.commodityName,
    marketName: d.marketName,
    pricePerKgLow: String(d.pricePerKgLow),
    pricePerKgHigh: String(d.pricePerKgHigh),
    recordedDate: d.recordedDate,
    dataSource: d.dataSource || "Admin entry",
  });

  revalidatePath("/prices");
  revalidatePath("/admin/prices");
  return { success: "Price record added." };
}
