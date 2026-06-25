"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type FormState } from "@/server/actions/auth";
import { SubmitButton, FieldError } from "@/components/ui/form";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(resetPassword, {});
  const fe = state.fieldErrors ?? {};

  if (state.success) {
    return (
      <div className="alert alert-success">
        {state.success}
        <div style={{ marginTop: "0.75rem" }}>
          <Link href="/login" className="btn btn-primary btn-sm">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {state.error && <div className="alert alert-error">{state.error}</div>}
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="label" htmlFor="password">New password</label>
        <input className="input" id="password" name="password" type="password" required />
        <p style={{ margin: "0.35rem 0 0", color: "var(--color-muted)", fontSize: "0.82rem" }}>
          Use at least 8 characters with uppercase, lowercase, a number, and a symbol.
        </p>
        <FieldError message={fe.password} />
      </div>

      <div>
        <label className="label" htmlFor="confirmPassword">Confirm new password</label>
        <input className="input" id="confirmPassword" name="confirmPassword" type="password" required />
        <FieldError message={fe.confirmPassword} />
      </div>

      <SubmitButton className="btn btn-primary btn-block">Reset password</SubmitButton>
    </form>
  );
}
