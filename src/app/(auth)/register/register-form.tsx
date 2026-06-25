"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerUser, type FormState } from "@/server/actions/auth";
import { SubmitButton, FieldError } from "@/components/ui/form";

export function RegisterForm({ defaultType }: { defaultType: "farmer" | "buyer" }) {
  const [state, formAction] = useActionState<FormState, FormData>(registerUser, {});
  const [userType, setUserType] = useState<"farmer" | "buyer">(defaultType);

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

  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label className="label">I am a…</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {(["farmer", "buyer"] as const).map((t) => (
            <label
              key={t}
              className="card"
              style={{
                padding: "0.6rem",
                textAlign: "center",
                cursor: "pointer",
                borderColor: userType === t ? "var(--color-brand-500)" : "var(--color-line)",
                background: userType === t ? "var(--color-brand-50)" : "#fff",
                textTransform: "capitalize",
                fontWeight: 600,
              }}
            >
              <input
                type="radio"
                name="userType"
                value={t}
                checked={userType === t}
                onChange={() => setUserType(t)}
                style={{ marginRight: "0.4rem" }}
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="fullName">Full name</label>
        <input className="input" id="fullName" name="fullName" required />
        <FieldError message={fe.fullName} />
      </div>

      <div>
        <label className="label" htmlFor="email">Email address</label>
        <input className="input" id="email" name="email" type="email" required />
        <FieldError message={fe.email} />
      </div>

      <div>
        <label className="label" htmlFor="phone">Phone number</label>
        <input className="input" id="phone" name="phone" inputMode="tel" required />
        <FieldError message={fe.phone} />
      </div>

      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" required />
        <p style={{ margin: "0.35rem 0 0", color: "var(--color-muted)", fontSize: "0.82rem" }}>
          Use at least 8 characters with uppercase, lowercase, a number, and a symbol.
        </p>
        <FieldError message={fe.password} />
      </div>

      <div>
        <label className="label" htmlFor="confirmPassword">Confirm password</label>
        <input className="input" id="confirmPassword" name="confirmPassword" type="password" required />
        <FieldError message={fe.confirmPassword} />
      </div>

      <SubmitButton className="btn btn-primary btn-block">Create account</SubmitButton>
    </form>
  );
}
