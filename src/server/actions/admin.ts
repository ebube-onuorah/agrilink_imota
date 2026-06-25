"use server";

// Admin user + listing moderation (FR-10).

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users, produceListings } from "@/server/db/schema";
import { requireRole } from "@/server/auth/session";

export async function setUserVerified(formData: FormData): Promise<void> {
  await requireRole("admin");
  const userId = Number(formData.get("userId"));
  const verified = formData.get("verified") === "true";
  const db = await getDb();
  await db.update(users).set({ isVerified: verified }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function setUserSuspended(formData: FormData): Promise<void> {
  await requireRole("admin");
  const userId = Number(formData.get("userId"));
  const suspended = formData.get("suspended") === "true";
  const db = await getDb();
  await db.update(users).set({ isSuspended: suspended }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function moderateListing(formData: FormData): Promise<void> {
  await requireRole("admin");
  const listingId = Number(formData.get("listingId"));
  const action = String(formData.get("action")); // "withdraw" | "reactivate"
  const db = await getDb();
  await db
    .update(produceListings)
    .set({ listingStatus: action === "withdraw" ? "withdrawn" : "active", updatedAt: new Date() })
    .where(eq(produceListings.id, listingId));
  revalidatePath("/admin/listings");
  revalidatePath("/search");
}
