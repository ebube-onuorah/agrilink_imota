import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { getTransactionDetail } from "@/server/db/txn";
import { updateTransactionStatus } from "@/server/actions/transactions";
import { TRANSACTION_TRANSITIONS, type TransactionStatus } from "@/server/lib/constants";
import { TransactionStatusBadge, Stars } from "@/components/ui/badges";
import { RatingForm } from "@/components/ratings/rating-form";
import { naira, formatDate } from "@/server/lib/format";

const ACTION_LABEL: Record<string, string> = {
  confirmed: "Confirm",
  completed: "Mark completed",
  cancelled: "Cancel",
  disputed: "Raise dispute",
};

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transactionId = Number(id);
  const user = await requireUser();
  const userId = Number(user.id);

  const detail = await getTransactionDetail(transactionId);
  if (!detail) notFound();
  const { txn } = detail;
  if (txn.buyerId !== userId && txn.farmerId !== userId) notFound();

  const isBuyer = txn.buyerId === userId;
  const nextStates = TRANSACTION_TRANSITIONS[txn.transactionStatus as TransactionStatus] ?? [];
  const canRate = txn.transactionStatus === "completed" && isBuyer && !detail.rating;

  return (
    <div className="container-page" style={{ padding: "2rem 1rem", maxWidth: "44rem" }}>
      <Link href="/transactions" className="btn btn-ghost btn-sm" style={{ marginBottom: "1rem" }}>← All transactions</Link>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{detail.commodityName}</h1>
          <TransactionStatusBadge status={txn.transactionStatus} />
        </div>

        <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", margin: 0 }}>
          <Detail label="Buyer" value={detail.buyerName ?? "—"} />
          <Detail label="Farmer" value={detail.farmerName ?? "—"} />
          <Detail label="Quantity" value={`${Number(txn.quantityAgreedKg).toLocaleString()} kg`} />
          <Detail label="Price" value={`${naira(txn.agreedPricePerKg)}/kg`} />
          <Detail label="Total value" value={naira(txn.totalValue)} />
          <Detail label="Payment" value={txn.paymentMethod ?? "—"} />
          <Detail label="Created" value={formatDate(txn.createdAt)} />
          <Detail label="Completed" value={formatDate(txn.completedAt)} />
        </dl>
      </div>

      {nextStates.length > 0 && (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.75rem" }}>Update status</h2>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {nextStates.map((s) => (
              <form key={s} action={updateTransactionStatus}>
                <input type="hidden" name="transactionId" value={txn.id} />
                <input type="hidden" name="newStatus" value={s} />
                <button
                  type="submit"
                  className={`btn btn-sm ${s === "cancelled" || s === "disputed" ? "btn-outline" : "btn-primary"}`}
                >
                  {ACTION_LABEL[s] ?? s}
                </button>
              </form>
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--color-muted)", margin: "0.75rem 0 0" }}>
            🔒 Once confirmed, both parties&rsquo; contact details become visible to coordinate delivery.
          </p>
        </div>
      )}

      {detail.rating && (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.5rem" }}>Buyer rating</h2>
          <Stars score={detail.rating.ratingScore} />
          {detail.rating.reviewText && (
            <p style={{ margin: "0.5rem 0 0", color: "var(--color-muted)" }}>&ldquo;{detail.rating.reviewText}&rdquo;</p>
          )}
        </div>
      )}

      {canRate && (
        <div className="card">
          <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.75rem" }}>Rate this transaction</h2>
          <RatingForm transactionId={txn.id} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={{ fontSize: "0.72rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</dt>
      <dd style={{ margin: "0.15rem 0 0", fontWeight: 600 }}>{value}</dd>
    </div>
  );
}
