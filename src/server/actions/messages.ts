"use server";

// Messaging (FR-06) + interest notifications (FR-08).

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/server/db";
import { messages, produceListings, systemNotifications, users } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { messageSchema } from "@/server/validation/schemas";
import { sendEmail, appUrl } from "@/server/email/resend";

async function notify(userId: number, type: string, message: string, relatedEntityId?: number) {
  const db = await getDb();
  await db.insert(systemNotifications).values({
    userId,
    notificationType: type,
    notificationMessage: message,
    relatedEntityId: relatedEntityId ?? null,
  });
}

export async function sendMessage(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { listingId, recipientId, messageBody } = parsed.data;
  const senderId = Number(user.id);
  if (recipientId === senderId) return;

  const db = await getDb();
  await db.insert(messages).values({ listingId, senderId, recipientId, messageBody });

  // In-platform notification + email alert to the recipient (FR-08).
  await notify(recipientId, "message", `${user.name} sent you a message about a listing.`, listingId);
  const [recipient] = await db.select().from(users).where(eq(users.id, recipientId)).limit(1);
  if (recipient) {
    await sendEmail({
      to: recipient.email,
      subject: "New message on FarmLink",
      html: `<p>${user.name} sent you a message:</p><blockquote>${messageBody}</blockquote><p><a href="${appUrl(`/messages/${listingId}?with=${senderId}`)}">Reply on FarmLink</a></p>`,
    });
  }

  revalidatePath(`/messages/${listingId}`);
  revalidatePath("/messages");
  redirect(`/messages/${listingId}?with=${recipientId}`);
}

export async function expressInterest(formData: FormData): Promise<void> {
  const user = await requireUser();
  const listingId = Number(formData.get("listingId"));
  const db = await getDb();

  const [listing] = await db
    .select()
    .from(produceListings)
    .where(eq(produceListings.id, listingId))
    .limit(1);
  if (!listing) return;

  const senderId = Number(user.id);
  const farmerId = listing.farmerId;
  if (farmerId === senderId) return;

  const body = `Hello, I am interested in your "${listing.commodityName}" listing. Is it still available?`;
  await db.insert(messages).values({ listingId, senderId, recipientId: farmerId, messageBody: body });
  await notify(farmerId, "interest", `${user.name} expressed interest in your ${listing.commodityName} listing.`, listingId);

  const [farmer] = await db.select().from(users).where(eq(users.id, farmerId)).limit(1);
  if (farmer) {
    await sendEmail({
      to: farmer.email,
      subject: "A buyer is interested in your produce",
      html: `<p>${user.name} is interested in your "${listing.commodityName}" listing.</p><p><a href="${appUrl(`/messages/${listingId}?with=${senderId}`)}">Respond on FarmLink</a></p>`,
    });
  }

  revalidatePath(`/messages/${listingId}`);
  redirect(`/messages/${listingId}?with=${farmerId}`);
}

/** Mark messages in a thread (addressed to the current user) as read. */
export async function markThreadRead(listingId: number, counterpartId: number): Promise<void> {
  const user = await requireUser();
  const db = await getDb();
  await db
    .update(messages)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(messages.listingId, listingId),
        eq(messages.recipientId, Number(user.id)),
        eq(messages.senderId, counterpartId),
        ne(messages.isRead, true),
      ),
    );
}
