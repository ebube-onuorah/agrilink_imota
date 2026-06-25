import Link from "next/link";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="card">
      <h1 style={{ fontSize: "1.4rem", margin: "0 0 0.25rem" }}>Choose a new password</h1>
      <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
        Enter and confirm your new password below.
      </p>

      {token ? (
        <ResetForm token={token} />
      ) : (
        <div className="alert alert-error">
          Missing or invalid reset token. Please request a new link from the{" "}
          <Link href="/forgot-password" style={{ fontWeight: 600 }}>forgot password</Link> page.
        </div>
      )}
    </div>
  );
}
