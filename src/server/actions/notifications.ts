"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { systemNotifications } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  const db = await getDb();
  await db
    .update(systemNotifications)
    .set({ isRead: true })
    .where(
      and(
        eq(systemNotifications.userId, Number(user.id)),
        eq(systemNotifications.isRead, false),
      ),
    );
  revalidatePath("/notifications");
}
