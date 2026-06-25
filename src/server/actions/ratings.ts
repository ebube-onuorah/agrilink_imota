"use server";

// Post-transaction ratings + credibility (FR-09).

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { transactions, userRatings, systemNotifications } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ratingSchema } from "@/server/validation/schemas";
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

export async function submitRating(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const userId = Number(user.id);

  const parsed = ratingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const { transactionId, ratingScore, reviewText } = parsed.data;

  const db = await getDb();
  const [txn] = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
  if (!txn) return { error: "Transaction not found." };
  if (txn.buyerId !== userId) return { error: "Only the buyer can rate this transaction." };
  if (txn.transactionStatus !== "completed") return { error: "You can only rate completed transactions." };

  const existing = await db
    .select({ id: userRatings.id })
    .from(userRatings)
    .where(eq(userRatings.transactionId, transactionId))
    .limit(1);
  if (existing.length) return { error: "You have already rated this transaction." };

  await db.insert(userRatings).values({
    transactionId,
    raterId: userId,
    rateeId: txn.farmerId,
    ratingScore,
    reviewText: reviewText || null,
  });

  await db.insert(systemNotifications).values({
    userId: txn.farmerId,
    notificationType: "rating",
    notificationMessage: `You received a ${ratingScore}-star rating from ${user.name}.`,
    relatedEntityId: transactionId,
  });

  revalidatePath(`/transactions/${transactionId}`);
  revalidatePath("/farmer/dashboard");
  return { success: "Thank you — your rating has been submitted." };
}
