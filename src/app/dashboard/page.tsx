import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";

// Neutral post-login landing that forwards each user to their role dashboard.
export default async function DashboardRouter() {
  const user = await requireUser();
  if (user.userType === "admin") redirect("/admin/dashboard");
  redirect(`/${user.userType}/dashboard`);
}
