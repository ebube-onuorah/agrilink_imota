import { desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { setUserVerified, setUserSuspended } from "@/server/actions/admin";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate } from "@/server/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const db = await getDb();
  const all = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <>
      <PageHeader title="User management" subtitle="Verify or suspend platform accounts." />
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {all.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-gray">{u.userType}</span></td>
                  <td>
                    {u.isSuspended ? (
                      <span className="badge badge-red">Suspended</span>
                    ) : u.isVerified ? (
                      <span className="badge badge-green">Verified</span>
                    ) : (
                      <span className="badge badge-amber">Unverified</span>
                    )}
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    {u.userType !== "admin" && (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {!u.isVerified && (
                          <form action={setUserVerified}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="verified" value="true" />
                            <button className="btn btn-outline btn-sm" type="submit">Verify</button>
                          </form>
                        )}
                        <form action={setUserSuspended}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="suspended" value={(!u.isSuspended).toString()} />
                          <button className={`btn btn-sm ${u.isSuspended ? "btn-outline" : "btn-danger"}`} type="submit">
                            {u.isSuspended ? "Unsuspend" : "Suspend"}
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
