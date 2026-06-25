"use client";

import { useActionState } from "react";
import { addMarketPrice } from "@/server/actions/prices";
import type { FormState } from "@/server/actions/auth";
import { SubmitButton, FieldError } from "@/components/ui/form";
import { LAGOS_MARKETS } from "@/server/lib/constants";

export function AddPriceForm() {
  const [state, formAction] = useActionState<FormState, FormData>(addMarketPrice, {});
  const fe = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {state.success && <div className="alert alert-success">{state.success}</div>}

      <div>
        <label className="label" htmlFor="commodityName">Commodity</label>
        <input className="input" id="commodityName" name="commodityName" placeholder="e.g. Tomatoes" required />
        <FieldError message={fe.commodityName} />
      </div>

      <div>
        <label className="label" htmlFor="marketName">Market</label>
        <select className="select" id="marketName" name="marketName" required defaultValue="">
          <option value="" disabled>Choose market…</option>
          {LAGOS_MARKETS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <FieldError message={fe.marketName} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
        <div>
          <label className="label" htmlFor="pricePerKgLow">Low price (₦/kg)</label>
          <input className="input" id="pricePerKgLow" name="pricePerKgLow" type="number" min="0" step="0.01" required />
          <FieldError message={fe.pricePerKgLow} />
        </div>
        <div>
          <label className="label" htmlFor="pricePerKgHigh">High price (₦/kg)</label>
          <input className="input" id="pricePerKgHigh" name="pricePerKgHigh" type="number" min="0" step="0.01" required />
          <FieldError message={fe.pricePerKgHigh} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="recordedDate">Date recorded</label>
        <input className="input" id="recordedDate" name="recordedDate" type="date" defaultValue={today} required />
        <FieldError message={fe.recordedDate} />
      </div>

      <div>
        <label className="label" htmlFor="dataSource">Data source</label>
        <input className="input" id="dataSource" name="dataSource" placeholder="LSADA market survey" />
      </div>

      <SubmitButton className="btn btn-primary">Add price record</SubmitButton>
    </form>
  );
}
