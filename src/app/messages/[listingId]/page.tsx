import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { produceListings, users } from "@/server/db/schema";
import { getThread } from "@/server/db/messaging";
import { markThreadRead, sendMessage } from "@/server/actions/messages";
import { SubmitButton } from "@/components/ui/form";
import { naira, timeAgo } from "@/server/lib/format";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<{ with?: string }>;
}) {
  const { listingId: lid } = await params;
  const { with: withParam } = await searchParams;
  const listingId = Number(lid);
  const user = await requireUser();
  const userId = Number(user.id);

  const db = await getDb();
  const [listing] = await db.select().from(produceListings).where(eq(produceListings.id, listingId)).limit(1);
  if (!listing) notFound();

  const counterpartId = withParam ? Number(withParam) : listing.farmerId;
  if (counterpartId === userId) redirect("/messages");

  const [counterpart] = await db.select().from(users).where(eq(users.id, counterpartId)).limit(1);
  if (!counterpart) notFound();

  await markThreadRead(listingId, counterpartId);
  const thread = await getThread(userId, listingId, counterpartId);

  return (
    <div className="container-page" style={{ padding: "2rem 1rem", maxWidth: "44rem" }}>
      <Link href="/messages" className="btn btn-ghost btn-sm" style={{ marginBottom: "1rem" }}>← All messages</Link>

      <div className="card" style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <strong style={{ fontSize: "1.1rem" }}>{counterpart.fullName}</strong>
          <div style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>
            Re: <Link href={`/listings/${listingId}`} style={{ color: "var(--color-brand-700)" }}>{listing.commodityName}</Link>
            {" · "}{naira(listing.askingPricePerKg)}/kg
          </div>
        </div>
        {user.userType === "buyer" && (
          <Link href={`/transactions/new?listing=${listingId}`} className="btn btn-accent btn-sm">Record transaction</Link>
        )}
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem", minHeight: "12rem" }}>
        {thread.length === 0 ? (
          <p style={{ color: "var(--color-muted)", textAlign: "center", margin: "auto" }}>
            No messages yet. Say hello below.
          </p>
        ) : (
          thread.map((m) => {
            const mine = m.senderId === userId;
            return (
              <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                <div
                  style={{
                    background: mine ? "var(--color-brand-700)" : "var(--color-canvas)",
                    color: mine ? "#fff" : "var(--color-ink)",
                    border: mine ? "none" : "1px solid var(--color-line)",
                    borderRadius: "0.85rem",
                    padding: "0.6rem 0.85rem",
                    fontSize: "0.92rem",
                    lineHeight: 1.45,
                  }}
                >
                  {m.messageBody}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--color-muted)", marginTop: "0.2rem", textAlign: mine ? "right" : "left" }}>
                  {timeAgo(m.sentAt)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form action={sendMessage} className="card" style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end" }}>
        <input type="hidden" name="listingId" value={listingId} />
        <input type="hidden" name="recipientId" value={counterpartId} />
        <textarea
          name="messageBody"
          className="textarea"
          required
          placeholder="Type your message…"
          style={{ minHeight: "3rem", flex: 1 }}
        />
        <SubmitButton className="btn btn-primary">Send</SubmitButton>
      </form>
    </div>
  );
}
