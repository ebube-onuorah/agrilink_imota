import Link from "next/link";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const defaultType = type === "buyer" ? "buyer" : "farmer";

  return (
    <div className="card">
      <h1 style={{ fontSize: "1.4rem", margin: "0 0 0.25rem" }}>Create your account</h1>
      <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
        Free to join — start connecting with the local agricultural market today.
      </p>

      <RegisterForm defaultType={defaultType} />

      <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem", color: "var(--color-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--color-brand-700)", fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}
