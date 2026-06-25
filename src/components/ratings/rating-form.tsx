"use client";

import { useActionState } from "react";
import { submitRating } from "@/server/actions/ratings";
import type { FormState } from "@/server/actions/auth";
import { SubmitButton } from "@/components/ui/form";

export function RatingForm({ transactionId }: { transactionId: number }) {
  const [state, formAction] = useActionState<FormState, FormData>(submitRating, {});

  if (state.success) {
    return <div className="alert alert-success">{state.success}</div>;
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {state.error && <div className="alert alert-error">{state.error}</div>}
      <input type="hidden" name="transactionId" value={transactionId} />

      <div>
        <label className="label">Your rating</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
              <input type="radio" name="ratingScore" value={n} defaultChecked={n === 5} required />
              {n}★
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="reviewText">Review (optional)</label>
        <textarea className="textarea" id="reviewText" name="reviewText" placeholder="How was the quality and delivery?" />
      </div>

      <SubmitButton className="btn btn-primary">Submit rating</SubmitButton>
    </form>
  );
}
