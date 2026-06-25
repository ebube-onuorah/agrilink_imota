import { requireRole } from "@/server/auth/session";

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("buyer");
  return <div className="container-page" style={{ padding: "2rem 1rem" }}>{children}</div>;
}
