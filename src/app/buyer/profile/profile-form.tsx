"use client";

import { useActionState } from "react";
import { updateBuyerProfile } from "@/server/actions/profile";
import type { FormState } from "@/server/actions/auth";
import { SubmitButton, FieldError } from "@/components/ui/form";
import { BUSINESS_TYPES } from "@/server/lib/constants";

type Defaults = {
  fullName: string;
  phone: string;
  businessName?: string | null;
  businessType?: string | null;
  deliveryAddress?: string | null;
  preferredCommodities?: string | null;
};

export function BuyerProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction] = useActionState<FormState, FormData>(updateBuyerProfile, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {state.success && <div className="alert alert-success">{state.success}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="fullName">Contact name</label>
          <input className="input" id="fullName" name="fullName" defaultValue={defaults.fullName} required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input className="input" id="phone" name="phone" defaultValue={defaults.phone} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="businessName">Business name</label>
          <input className="input" id="businessName" name="businessName" defaultValue={defaults.businessName ?? ""} required />
          <FieldError message={fe.businessName} />
        </div>
        <div>
          <label className="label" htmlFor="businessType">Business type</label>
          <select className="select" id="businessType" name="businessType" defaultValue={defaults.businessType ?? ""} required>
            <option value="" disabled>Choose…</option>
            {BUSINESS_TYPES.map((b) => <option key={b} value={b} style={{ textTransform: "capitalize" }}>{b}</option>)}
          </select>
          <FieldError message={fe.businessType} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="deliveryAddress">Delivery address</label>
        <textarea className="textarea" id="deliveryAddress" name="deliveryAddress" defaultValue={defaults.deliveryAddress ?? ""} />
      </div>

      <div>
        <label className="label" htmlFor="preferredCommodities">Preferred commodities</label>
        <input className="input" id="preferredCommodities" name="preferredCommodities" defaultValue={defaults.preferredCommodities ?? ""} placeholder="Tomatoes, Vegetables, Catfish" />
      </div>

      <SubmitButton className="btn btn-primary">Save profile</SubmitButton>
    </form>
  );
}
