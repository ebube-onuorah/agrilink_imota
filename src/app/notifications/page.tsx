import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getUnreadNotifications } from "@/server/db/messaging";
import { markAllNotificationsRead } from "@/server/actions/notifications";
import { PageHeader } from "@/components/layout/page-header";
import { timeAgo } from "@/server/lib/format";

function notifHref(type: string, relatedEntityId: number | null): string | null {
  if (!relatedEntityId) return null;
  if (type === "transaction") return `/transactions/${relatedEntityId}`;
  if (type === "message" || type === "interest") return `/messages/${relatedEntityId}`;
  return null;
}

export const dynamic = "force-dynamic";

const ICON: Record<string, string> = {
  message: "💬",
  interest: "🤝",
  rating: "⭐",
  transaction: "🧾",
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getUnreadNotifications(Number(user.id));
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="container-page" style={{ padding: "2rem 1rem", maxWidth: "44rem" }}>
      <PageHeader
        title="Notifications"
        subtitle="Alerts about your listings, messages, and transactions."
        action={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <button type="submit" className="btn btn-outline btn-sm">Mark all read</button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          You have no notifications.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {notifications.map((n) => {
            const href = notifHref(n.notificationType, n.relatedEntityId);
            const inner = (
              <>
                <span style={{ fontSize: "1.3rem" }} aria-hidden>{ICON[n.notificationType] ?? "🔔"}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0 }}>{n.notificationMessage}</p>
                  <span style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>{timeAgo(n.createdAt)}</span>
                </div>
                {!n.isRead && <span className="badge badge-amber" style={{ height: "fit-content" }}>New</span>}
                {href && <span style={{ fontSize: "0.8rem", color: "var(--color-brand-700)", alignSelf: "center", whiteSpace: "nowrap" }}>View →</span>}
              </>
            );
            const rowStyle: React.CSSProperties = {
              display: "flex",
              gap: "0.85rem",
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--color-line)",
              background: n.isRead ? "transparent" : "var(--color-brand-50)",
              textDecoration: "none",
              color: "inherit",
            };
            return href ? (
              <Link key={n.id} href={href} style={rowStyle}>{inner}</Link>
            ) : (
              <div key={n.id} style={rowStyle}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
