import { requireRole } from "@/server/auth/session";

export default async function FarmerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("farmer");
  return <div className="container-page" style={{ padding: "2rem 1rem" }}>{children}</div>;
}
