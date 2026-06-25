import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="card">
      <h1 style={{ fontSize: "1.4rem", margin: "0 0 0.25rem" }}>Welcome back</h1>
      <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
        Sign in to your FarmLink account.
      </p>

      <LoginForm />

      <div style={{ marginTop: "1rem", fontSize: "0.85rem", textAlign: "center" }}>
        <Link href="/forgot-password" className="btn btn-ghost btn-sm">Forgot password?</Link>
      </div>

      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.9rem", color: "var(--color-muted)" }}>
        New here? <Link href="/register" style={{ color: "var(--color-brand-700)", fontWeight: 600 }}>Create an account</Link>
      </p>

      <div className="alert alert-info" style={{ marginTop: "1.25rem", fontSize: "0.8rem" }}>
        <strong>Demo accounts</strong> (password <code>Password123!</code>):<br />
        admin@farmlink.ng · adaeze@imota.ng (farmer) · buyer@mile12.ng (buyer)
      </div>
    </div>
  );
}
