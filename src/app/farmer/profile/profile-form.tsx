"use client";

import { useActionState } from "react";
import { updateFarmerProfile } from "@/server/actions/profile";
import type { FormState } from "@/server/actions/auth";
import { SubmitButton, FieldError } from "@/components/ui/form";
import { STUDY_AREA_LGAS } from "@/server/lib/constants";

type Defaults = {
  fullName: string;
  phone: string;
  lga?: string | null;
  ward?: string | null;
  farmSizeHectares?: string | null;
  primaryCommodities?: string | null;
  yearsExperience?: number | null;
};

export function FarmerProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction] = useActionState<FormState, FormData>(updateFarmerProfile, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {state.success && <div className="alert alert-success">{state.success}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <input className="input" id="fullName" name="fullName" defaultValue={defaults.fullName} required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input className="input" id="phone" name="phone" defaultValue={defaults.phone} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="lga">Local Government Area</label>
          <select className="select" id="lga" name="lga" defaultValue={defaults.lga ?? ""} required>
            <option value="" disabled>Choose...</option>
            {STUDY_AREA_LGAS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <FieldError message={fe.lga} />
        </div>
        <div>
          <label className="label" htmlFor="ward">Ward</label>
          <input className="input" id="ward" name="ward" defaultValue={defaults.ward ?? ""} />
        </div>
      </div>
      <p style={{ margin: "-0.45rem 0 0", color: "var(--color-muted)", fontSize: "0.82rem" }}>
        LGA and ward help buyers search nearby farms. Farm size helps them gauge your likely supply capacity.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="farmSizeHectares">Farm size (hectares)</label>
          <input className="input" id="farmSizeHectares" name="farmSizeHectares" type="number" step="0.01" min="0" defaultValue={defaults.farmSizeHectares ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="yearsExperience">Years farming</label>
          <input className="input" id="yearsExperience" name="yearsExperience" type="number" min="0" defaultValue={defaults.yearsExperience ?? ""} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="primaryCommodities">Primary commodities</label>
        <input className="input" id="primaryCommodities" name="primaryCommodities" defaultValue={defaults.primaryCommodities ?? ""} placeholder="Waterleaf, Tomatoes, Pepper" />
      </div>

      <SubmitButton className="btn btn-primary">Save profile</SubmitButton>
    </form>
  );
}
