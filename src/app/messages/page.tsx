import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getInbox } from "@/server/db/messaging";
import { PageHeader } from "@/components/layout/page-header";
import { timeAgo } from "@/server/lib/format";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireUser();
  const threads = await getInbox(Number(user.id));

  return (
    <div className="container-page" style={{ padding: "2rem 1rem", maxWidth: "48rem" }}>
      <PageHeader title="Messages" subtitle="Your conversations with farmers and buyers." />

      {threads.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          No messages yet. Start a conversation from a produce listing.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {threads.map((t) => (
            <Link
              key={`${t.listingId}:${t.counterpartId}`}
              href={`/messages/${t.listingId}?with=${t.counterpartId}`}
              style={{
                display: "flex",
                gap: "0.85rem",
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--color-line)",
                textDecoration: "none",
                color: "inherit",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "999px",
                  background: "var(--color-brand-100)",
                  color: "var(--color-brand-800)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {t.counterpartName.slice(0, 1)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong>{t.counterpartName}</strong>
                  <span style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>{timeAgo(t.lastAt)}</span>
                </div>
                <div style={{ color: "var(--color-muted)", fontSize: "0.85rem", marginTop: "0.1rem" }}>
                  <span style={{ color: "var(--color-brand-700)" }}>{t.commodityName}</span> —{" "}
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", maxWidth: "20rem", verticalAlign: "bottom" }}>
                    {t.lastMessage}
                  </span>
                </div>
              </div>
              {t.unread > 0 && <span className="badge badge-amber">{t.unread}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
