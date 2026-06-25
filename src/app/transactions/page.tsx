import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { listTransactionsForUser } from "@/server/db/txn";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionStatusBadge } from "@/components/ui/badges";
import { naira, formatDate } from "@/server/lib/format";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const user = await requireUser();
  const userId = Number(user.id);
  const rows = await listTransactionsForUser(userId);

  return (
    <div className="container-page" style={{ padding: "2rem 1rem", maxWidth: "56rem" }}>
      <PageHeader title="Transactions" subtitle="Track proposed, confirmed, and completed deals." />

      {rows.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
          No transactions yet.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>{/* counterpart */}With</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const asBuyer = t.buyerId === userId;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.commodityName}</td>
                      <td>
                        {asBuyer ? t.farmerName : t.buyerName}
                        <span className="badge badge-gray" style={{ marginLeft: "0.4rem" }}>
                          {asBuyer ? "buying" : "selling"}
                        </span>
                      </td>
                      <td>{Number(t.quantity).toLocaleString()} kg</td>
                      <td>{naira(t.totalValue)}</td>
                      <td><TransactionStatusBadge status={t.status} /></td>
                      <td>{formatDate(t.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        <Link href={`/transactions/${t.id}`} className="btn btn-ghost btn-sm">View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
