import Link from "next/link";
import { getSessionUser } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { systemNotifications } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { SignOutButton } from "./sign-out-button";

async function unreadCount(userId: number): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({ id: systemNotifications.id })
    .from(systemNotifications)
    .where(and(eq(systemNotifications.userId, userId), eq(systemNotifications.isRead, false)));
  return rows.length;
}

export default async function Navbar() {
  const user = await getSessionUser();
  const unread = user ? await unreadCount(Number(user.id)) : 0;

  const homeHref = user
    ? user.userType === "admin"
      ? "/admin/dashboard"
      : `/${user.userType}/dashboard`
    : "/";

  return (
    <header
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-line)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <nav
        className="container-page"
        style={{ display: "flex", alignItems: "center", gap: "1rem", height: "3.75rem" }}
      >
        <Link
          href={homeHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 800,
            fontSize: "1.1rem",
            color: "var(--color-brand-700)",
            textDecoration: "none",
          }}
        >
          <span aria-hidden style={{ fontSize: "1.4rem" }}>🌾</span>
          FarmLink
        </Link>

        <div style={{ flex: 1 }} />

        <Link href="/prices" className="btn btn-ghost btn-sm">Market Prices</Link>

        {!user && (
          <>
            <Link href="/login" className="btn btn-outline btn-sm">Sign in</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
          </>
        )}

        {user && (
          <>
            {user.userType !== "admin" && (
              <Link href="/search" className="btn btn-ghost btn-sm">
                {user.userType === "buyer" ? "Find produce" : "Browse"}
              </Link>
            )}
            <Link href="/messages" className="btn btn-ghost btn-sm">Messages</Link>
            <Link href="/notifications" className="btn btn-ghost btn-sm" style={{ position: "relative" }}>
              Alerts
              {unread > 0 && (
                <span
                  className="badge badge-amber"
                  style={{ position: "absolute", top: "-6px", right: "-6px", padding: "0 0.4rem" }}
                >
                  {unread}
                </span>
              )}
            </Link>
            {user.userType !== "admin" && (
              <Link href={`/${user.userType}/profile`} className="btn btn-ghost btn-sm">Profile</Link>
            )}
            <Link href={homeHref} className="btn btn-outline btn-sm">Dashboard</Link>
            <SignOutButton />
          </>
        )}
      </nav>
    </header>
  );
}
