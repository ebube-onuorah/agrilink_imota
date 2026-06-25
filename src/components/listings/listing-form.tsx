"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SubmitButton, FieldError } from "@/components/ui/form";
import type { FormState } from "@/server/actions/auth";

type Category = { id: number; categoryName: string };
type Defaults = {
  commodityName?: string;
  categoryId?: number | null;
  quantityAvailableKg?: string;
  askingPricePerKg?: string;
  qualityDescription?: string | null;
  harvestDate?: string | null;
  availableFrom?: string | null;
};

export function ListingForm({
  action,
  categories,
  defaults = {},
  submitLabel = "Publish listing",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  categories: Category[];
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      {state.error && <div className="alert alert-error">{state.error}</div>}

      <div>
        <label className="label" htmlFor="commodityName">Commodity name *</label>
        <input
          className="input"
          id="commodityName"
          name="commodityName"
          defaultValue={defaults.commodityName ?? ""}
          placeholder="e.g. Fresh Waterleaf"
          required
        />
        <FieldError message={fe.commodityName} />
      </div>

      <div>
        <label className="label" htmlFor="categoryId">Category *</label>
        <select
          className="select"
          id="categoryId"
          name="categoryId"
          defaultValue={defaults.categoryId ?? ""}
          required
        >
          <option value="" disabled>Choose...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.categoryName}</option>
          ))}
        </select>
        <FieldError message={fe.categoryId} />
      </div>

      <div className="alert alert-info" style={{ padding: "0.8rem 1rem" }}>
        Fill in what you have. Commodity, category, quantity and price are enough to go live.
        Add a description or harvest date to help buyers make a faster decision.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="quantityAvailableKg">Quantity available (kg) *</label>
          <input
            className="input"
            id="quantityAvailableKg"
            name="quantityAvailableKg"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaults.quantityAvailableKg ?? ""}
            required
          />
          <FieldError message={fe.quantityAvailableKg} />
        </div>
        <div>
          <label className="label" htmlFor="askingPricePerKg">Asking price (N/kg) *</label>
          <input
            className="input"
            id="askingPricePerKg"
            name="askingPricePerKg"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaults.askingPricePerKg ?? ""}
            required
          />
          <FieldError message={fe.askingPricePerKg} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="harvestDate">Harvest date</label>
          <input
            className="input"
            id="harvestDate"
            name="harvestDate"
            type="date"
            defaultValue={defaults.harvestDate ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor="availableFrom">Available from</label>
          <input
            className="input"
            id="availableFrom"
            name="availableFrom"
            type="date"
            defaultValue={defaults.availableFrom ?? ""}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="qualityDescription">Description</label>
        <textarea
          className="textarea"
          id="qualityDescription"
          name="qualityDescription"
          defaultValue={defaults.qualityDescription ?? ""}
          placeholder="Freshness, packaging, variety, minimum order..."
        />
      </div>

      <div>
        <label className="label" htmlFor="images">Produce photos (up to 3, max 2 MB each)</label>
        <input className="input" id="images" name="images" type="file" accept="image/*" multiple />
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <SubmitButton className="btn btn-primary">{submitLabel}</SubmitButton>
        <Link href="/farmer/dashboard" className="btn btn-outline">Cancel</Link>
      </div>
    </form>
  );
}
