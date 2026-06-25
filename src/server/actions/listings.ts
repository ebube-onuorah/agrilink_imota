"use server";

// Produce listing management (FR-03) — create, update, withdraw.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { produceListings } from "@/server/db/schema";
import { requireRole } from "@/server/auth/session";
import { listingSchema } from "@/server/validation/schemas";
import { uploadProduceImages } from "@/server/blob/upload";
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

function parseForm(formData: FormData) {
  return listingSchema.safeParse({
    commodityName: formData.get("commodityName"),
    categoryId: formData.get("categoryId"),
    quantityAvailableKg: formData.get("quantityAvailableKg"),
    askingPricePerKg: formData.get("askingPricePerKg"),
    qualityDescription: formData.get("qualityDescription"),
    harvestDate: formData.get("harvestDate"),
    availableFrom: formData.get("availableFrom"),
  });
}

export async function createListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("farmer");
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const d = parsed.data;
  const images = await uploadProduceImages(formData.getAll("images") as File[]);

  const db = await getDb();
  await db.insert(produceListings).values({
    farmerId: Number(user.id),
    categoryId: d.categoryId,
    commodityName: d.commodityName,
    quantityAvailableKg: String(d.quantityAvailableKg),
    askingPricePerKg: String(d.askingPricePerKg),
    qualityDescription: d.qualityDescription || null,
    harvestDate: d.harvestDate || null,
    availableFrom: d.availableFrom || null,
    imageUrls: images.length ? images : null,
  });

  revalidatePath("/farmer/dashboard");
  revalidatePath("/search");
  redirect("/farmer/dashboard");
}

export async function updateListing(
  listingId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("farmer");
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const d = parsed.data;
  const newImages = await uploadProduceImages(formData.getAll("images") as File[]);

  const db = await getDb();
  const updates: Record<string, unknown> = {
    categoryId: d.categoryId,
    commodityName: d.commodityName,
    quantityAvailableKg: String(d.quantityAvailableKg),
    askingPricePerKg: String(d.askingPricePerKg),
    qualityDescription: d.qualityDescription || null,
    harvestDate: d.harvestDate || null,
    availableFrom: d.availableFrom || null,
    updatedAt: new Date(),
  };
  if (newImages.length) updates.imageUrls = newImages;

  await db
    .update(produceListings)
    .set(updates)
    .where(and(eq(produceListings.id, listingId), eq(produceListings.farmerId, Number(user.id))));

  revalidatePath("/farmer/dashboard");
  revalidatePath("/search");
  redirect("/farmer/dashboard");
}

export async function withdrawListing(formData: FormData): Promise<void> {
  const user = await requireRole("farmer");
  const listingId = Number(formData.get("listingId"));
  const db = await getDb();
  await db
    .update(produceListings)
    .set({ listingStatus: "withdrawn", updatedAt: new Date() })
    .where(and(eq(produceListings.id, listingId), eq(produceListings.farmerId, Number(user.id))));
  revalidatePath("/farmer/dashboard");
  revalidatePath("/search");
  redirect("/farmer/dashboard");
}

export async function reactivateListing(formData: FormData): Promise<void> {
  const user = await requireRole("farmer");
  const listingId = Number(formData.get("listingId"));
  const db = await getDb();
  await db
    .update(produceListings)
    .set({ listingStatus: "active", updatedAt: new Date() })
    .where(and(eq(produceListings.id, listingId), eq(produceListings.farmerId, Number(user.id))));
  revalidatePath("/farmer/dashboard");
  redirect("/farmer/dashboard");
}
