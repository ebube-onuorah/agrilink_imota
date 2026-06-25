"use client";

import { useActionState } from "react";
import { authenticate, type FormState } from "@/server/actions/auth";
import { SubmitButton } from "@/components/ui/form";

export function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(authenticate, {});

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {state.error && <div className="alert alert-error">{state.error}</div>}

      <div>
        <label className="label" htmlFor="email">Email address</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <SubmitButton className="btn btn-primary btn-block">Sign in</SubmitButton>
    </form>
  );
}
