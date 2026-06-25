import { sql, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  users,
  produceListings,
  transactions,
  messages,
} from "@/server/db/schema";
import { PageHeader } from "@/components/layout/page-header";

async function adminStats() {
  const db = await getDb();
  const usersByRole = await db
    .select({ role: users.userType, n: sql<number>`count(*)` })
    .from(users)
    .groupBy(users.userType);
  const [activeListings] = await db
    .select({ n: sql<number>`count(*)` })
    .from(produceListings)
    .where(eq(produceListings.listingStatus, "active"));
  const txnByStatus = await db
    .select({ status: transactions.transactionStatus, n: sql<number>`count(*)` })
    .from(transactions)
    .groupBy(transactions.transactionStatus);
  const [msgCount] = await db.select({ n: sql<number>`count(*)` }).from(messages);

  const roleCount = (r: string) => Number(usersByRole.find((x) => x.role === r)?.n ?? 0);
  const txnTotal = txnByStatus.reduce((a, x) => a + Number(x.n), 0);

  return {
    farmers: roleCount("farmer"),
    buyers: roleCount("buyer"),
    admins: roleCount("admin"),
    activeListings: Number(activeListings?.n ?? 0),
    txnTotal,
    txnByStatus,
    messages: Number(msgCount?.n ?? 0),
  };
}

export default async function AdminDashboard() {
  const s = await adminStats();

  const cards = [
    { value: s.farmers, label: "Farmers" },
    { value: s.buyers, label: "Buyers" },
    { value: s.activeListings, label: "Active listings" },
    { value: s.txnTotal, label: "Transactions" },
    { value: s.messages, label: "Messages exchanged" },
  ];

  return (
    <>
      <PageHeader title="Platform overview" subtitle="Usage statistics and platform health at a glance." />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(9.5rem, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>Transactions by status</h2>
        {s.txnByStatus.length === 0 ? (
          <p style={{ color: "var(--color-muted)", margin: 0 }}>No transactions recorded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {s.txnByStatus.map((t) => (
                <tr key={t.status}>
                  <td style={{ textTransform: "capitalize" }}>{t.status}</td>
                  <td>{Number(t.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
