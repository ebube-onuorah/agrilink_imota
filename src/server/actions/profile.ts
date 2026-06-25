"use server";

// Profile management (FR-02).

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users, farmerProfiles, buyerProfiles } from "@/server/db/schema";
import { requireRole } from "@/server/auth/session";
import { farmerProfileSchema, buyerProfileSchema } from "@/server/validation/schemas";
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

async function updateBasics(userId: number, formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const db = await getDb();
  await db
    .update(users)
    .set({ fullName: fullName || undefined, phone: phone || null, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function updateFarmerProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("farmer");
  const userId = Number(user.id);

  const parsed = farmerProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const d = parsed.data;

  await updateBasics(userId, formData);
  const db = await getDb();
  const values = {
    userId,
    lga: d.lga,
    ward: d.ward || null,
    farmSizeHectares: d.farmSizeHectares != null ? String(d.farmSizeHectares) : null,
    primaryCommodities: d.primaryCommodities || null,
    yearsExperience: d.yearsExperience ?? null,
  };

  const existing = await db
    .select({ id: farmerProfiles.id })
    .from(farmerProfiles)
    .where(eq(farmerProfiles.userId, userId))
    .limit(1);
  if (existing.length) {
    await db.update(farmerProfiles).set(values).where(eq(farmerProfiles.userId, userId));
  } else {
    await db.insert(farmerProfiles).values(values);
  }

  revalidatePath("/farmer/profile");
  return { success: "Profile updated." };
}

export async function updateBuyerProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("buyer");
  const userId = Number(user.id);

  const parsed = buyerProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const d = parsed.data;

  await updateBasics(userId, formData);
  const db = await getDb();
  const values = {
    userId,
    businessName: d.businessName,
    businessType: d.businessType,
    deliveryAddress: d.deliveryAddress || null,
    preferredCommodities: d.preferredCommodities || null,
  };

  const existing = await db
    .select({ id: buyerProfiles.id })
    .from(buyerProfiles)
    .where(eq(buyerProfiles.userId, userId))
    .limit(1);
  if (existing.length) {
    await db.update(buyerProfiles).set(values).where(eq(buyerProfiles.userId, userId));
  } else {
    await db.insert(buyerProfiles).values(values);
  }

  revalidatePath("/buyer/profile");
  return { success: "Profile updated." };
}
