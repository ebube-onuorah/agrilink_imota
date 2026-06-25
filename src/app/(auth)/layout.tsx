import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "3rem 1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "26rem" }}>{children}</div>
    </div>
  );
}
