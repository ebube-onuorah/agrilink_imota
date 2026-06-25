// Server-side session helpers used by layouts, pages, and Server Actions for
// authoritative authorization (defence-in-depth beyond the edge proxy).

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/server/db";
import { users, farmerProfiles, buyerProfiles } from "@/server/db/schema";
import type { UserType } from "@/server/lib/constants";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  userType: UserType;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: UserType): Promise<SessionUser> {
  const user = await requireUser();
  if (user.userType !== role) redirect("/dashboard");
  return user;
}

/** Full DB user record + role-specific profile. */
export async function getFullUser(userId: number) {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  let profile: unknown = null;
  if (user.userType === "farmer") {
    [profile] = await db
      .select()
      .from(farmerProfiles)
      .where(eq(farmerProfiles.userId, userId))
      .limit(1);
  } else if (user.userType === "buyer") {
    [profile] = await db
      .select()
      .from(buyerProfiles)
      .where(eq(buyerProfiles.userId, userId))
      .limit(1);
  }
  return { user, profile };
}
