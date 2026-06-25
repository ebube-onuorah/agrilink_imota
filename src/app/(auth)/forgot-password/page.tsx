"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type FormState } from "@/server/actions/auth";
import { SubmitButton } from "@/components/ui/form";

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<FormState, FormData>(requestPasswordReset, {});

  return (
    <div className="card">
      <h1 style={{ fontSize: "1.4rem", margin: "0 0 0.25rem" }}>Reset your password</h1>
      <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
        Enter your email and we&rsquo;ll send you a reset link.
      </p>

      {state.success ? (
        <div className="alert alert-success">{state.success}</div>
      ) : (
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input className="input" id="email" name="email" type="email" required />
          </div>
          <SubmitButton className="btn btn-primary btn-block">Send reset link</SubmitButton>
        </form>
      )}

      <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
        <Link href="/login" style={{ color: "var(--color-brand-700)", fontWeight: 600 }}>Back to sign in</Link>
      </p>
    </div>
  );
}
