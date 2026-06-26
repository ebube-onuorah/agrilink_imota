"use client";

import { useActionState, useEffect, useRef } from "react";
import { upsertMarketPrice } from "@/server/actions/prices";

const MARKETS = ["Mile 12 Market", "Oshodi Market", "Badagry Market"];

const COMMODITIES = [
  "Tomatoes",
  "Pepper (Tatashe)",
  "Scotch Bonnet (Rodo)",
  "Onions",
  "Yam",
  "Cassava",
  "Plantain",
  "Waterleaf",
  "Ugu (Pumpkin Leaf)",
  "Okra",
  "Maize",
  "Rice (Paddy)",
  "Beans (Oloyin)",
  "Palm Oil",
  "Groundnut",
];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function PriceEntryForm() {
  const [state, action, pending] = useActionState(upsertMarketPrice, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={action} style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="commodityName">Commodity *</label>
          <select className="select" id="commodityName" name="commodityName" required>
            <option value="">Select commodity…</option>
            {COMMODITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__other__">Other (type below)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="marketName">Market *</label>
          <select className="select" id="marketName" name="marketName" required>
            <option value="">Select market…</option>
            {MARKETS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="commodityNameOther">If &quot;Other&quot; — enter commodity name</label>
        <input
          className="input"
          id="commodityNameOther"
          name="commodityNameOther"
          placeholder="e.g. Garden Egg"
        />
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--color-muted)" }}>
          Only used if you selected &ldquo;Other&rdquo; above. Override by pasting the name here and setting the dropdown to &ldquo;Other&rdquo;.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="label" htmlFor="recordedMonth">Month (YYYY-MM) *</label>
          <input
            className="input"
            id="recordedMonth"
            name="recordedMonth"
            type="month"
            defaultValue={currentMonth()}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="pricePerKgLow">Low price (₦/kg) *</label>
          <input
            className="input"
            id="pricePerKgLow"
            name="pricePerKgLow"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 450"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="pricePerKgHigh">High price (₦/kg) *</label>
          <input
            className="input"
            id="pricePerKgHigh"
            name="pricePerKgHigh"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 600"
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="dataSource">Data source (optional)</label>
        <input
          className="input"
          id="dataSource"
          name="dataSource"
          placeholder="e.g. Lagos State MAFRD monthly bulletin, field survey"
        />
      </div>

      {state.error && (
        <p style={{ color: "var(--color-danger)", margin: 0, fontSize: "0.9rem" }}>{state.error}</p>
      )}
      {state.success && (
        <p style={{ color: "var(--color-success, #2d6a4f)", margin: 0, fontSize: "0.9rem" }}>{state.success}</p>
      )}

      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save price entry"}
        </button>
      </div>
    </form>
  );
}
