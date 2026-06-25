"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createTransaction } from "@/server/actions/transactions";
import type { FormState } from "@/server/actions/auth";
import { SubmitButton, FieldError } from "@/components/ui/form";

export function NewTransactionForm({
  listingId,
  defaultPrice,
}: {
  listingId: number;
  defaultPrice: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(createTransaction, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {state.error && <div className="alert alert-error">{state.error}</div>}
      <input type="hidden" name="listingId" value={listingId} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="quantityAgreedKg">Quantity agreed (kg)</label>
          <input className="input" id="quantityAgreedKg" name="quantityAgreedKg" type="number" min="0" step="0.01" required />
          <FieldError message={fe.quantityAgreedKg} />
        </div>
        <div>
          <label className="label" htmlFor="agreedPricePerKg">Agreed price (₦/kg)</label>
          <input className="input" id="agreedPricePerKg" name="agreedPricePerKg" type="number" min="0" step="0.01" defaultValue={defaultPrice} required />
          <FieldError message={fe.agreedPricePerKg} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="paymentMethod">Payment method</label>
        <select className="select" id="paymentMethod" name="paymentMethod" defaultValue="Bank transfer">
          <option>Bank transfer</option>
          <option>Cash on delivery</option>
          <option>Mobile money</option>
          <option>Other</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <SubmitButton className="btn btn-primary">Propose transaction</SubmitButton>
        <Link href={`/listings/${listingId}`} className="btn btn-outline">Cancel</Link>
      </div>
    </form>
  );
}
