"use server";

// Transaction recording + status state machine (FR-07).

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { transactions, produceListings, systemNotifications } from "@/server/db/schema";
import { requireUser, requireRole } from "@/server/auth/session";
import { transactionSchema } from "@/server/validation/schemas";
import { canTransition, type TransactionStatus } from "@/server/lib/constants";
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

async function notify(userId: number, type: string, message: string, relatedEntityId?: number) {
  const db = await getDb();
  await db.insert(systemNotifications).values({
    userId,
    notificationType: type,
    notificationMessage: message,
    relatedEntityId: relatedEntityId ?? null,
  });
}

export async function createTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("buyer");
  const buyerId = Number(user.id);

  const parsed = transactionSchema.safeParse({
    listingId: formData.get("listingId"),
    buyerId,
    quantityAgreedKg: formData.get("quantityAgreedKg"),
    agreedPricePerKg: formData.get("agreedPricePerKg"),
    paymentMethod: formData.get("paymentMethod"),
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const d = parsed.data;
  const db = await getDb();
  const [listing] = await db
    .select()
    .from(produceListings)
    .where(eq(produceListings.id, d.listingId))
    .limit(1);
  if (!listing) return { error: "Listing not found." };

  const totalValue = (d.quantityAgreedKg * d.agreedPricePerKg).toFixed(2);

  const [created] = await db
    .insert(transactions)
    .values({
      listingId: d.listingId,
      buyerId,
      farmerId: listing.farmerId,
      quantityAgreedKg: String(d.quantityAgreedKg),
      agreedPricePerKg: String(d.agreedPricePerKg),
      totalValue,
      paymentMethod: d.paymentMethod || null,
      transactionStatus: "pending",
    })
    .returning();

  await notify(
    listing.farmerId,
    "transaction",
    `${user.name} proposed a transaction for ${listing.commodityName} (₦${totalValue}).`,
    created.id,
  );

  revalidatePath("/transactions");
  redirect(`/transactions/${created.id}`);
}

export async function updateTransactionStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const userId = Number(user.id);
  const transactionId = Number(formData.get("transactionId"));
  const newStatus = String(formData.get("newStatus")) as TransactionStatus;

  const db = await getDb();
  const [txn] = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
  if (!txn) return;
  if (txn.buyerId !== userId && txn.farmerId !== userId) return; // participants only
  if (!canTransition(txn.transactionStatus, newStatus)) return;

  const updates: Record<string, unknown> = { transactionStatus: newStatus };
  if (newStatus === "confirmed") updates.confirmedAt = new Date();
  if (newStatus === "completed") updates.completedAt = new Date();

  await db.update(transactions).set(updates).where(eq(transactions.id, transactionId));

  const other = userId === txn.buyerId ? txn.farmerId : txn.buyerId;
  await notify(other, "transaction", `Transaction #${transactionId} was marked "${newStatus}".`, transactionId);

  revalidatePath(`/transactions/${transactionId}`);
  revalidatePath("/transactions");
}
