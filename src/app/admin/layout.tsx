import Link from "next/link";
import { requireRole } from "@/server/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return (
    <div className="container-page" style={{ padding: "2rem 1rem" }}>
      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/admin/dashboard" className="btn btn-outline btn-sm">Overview</Link>
        <Link href="/admin/users" className="btn btn-outline btn-sm">Users</Link>
        <Link href="/admin/listings" className="btn btn-outline btn-sm">Listings</Link>
        <Link href="/admin/prices" className="btn btn-outline btn-sm">Market prices</Link>
      </nav>
      {children}
    </div>
  );
}
