import Link from "next/link";
import { verifyEmailToken } from "@/server/actions/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await verifyEmailToken(token) : false;

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }} aria-hidden>
        {ok ? "✅" : "⚠️"}
      </div>
      <h1 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem" }}>
        {ok ? "Email verified" : "Verification failed"}
      </h1>
      <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem" }}>
        {ok
          ? "Your account is now verified. You can sign in and start using FarmLink."
          : "This verification link is invalid or has already been used."}
      </p>
      <Link href="/login" className="btn btn-primary">Go to sign in</Link>
    </div>
  );
}
