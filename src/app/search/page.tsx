import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { searchListings } from "@/server/db/search";
import { getCategories } from "@/server/db/queries";
import { ListingCard } from "@/components/listings/listing-card";
import { STUDY_AREA_LGAS } from "@/server/lib/constants";

type SP = Record<string, string | undefined>;

function buildQuery(sp: SP, overrides: SP): string {
  const params = new URLSearchParams();
  const merged = { ...sp, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  return params.toString();
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const sp = await searchParams;
  const categories = await getCategories();

  const result = await searchListings({
    q: sp.q || undefined,
    categoryId: sp.categoryId ? Number(sp.categoryId) : undefined,
    minQuantity: sp.minQuantity ? Number(sp.minQuantity) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    lga: sp.lga || undefined,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="container-page" style={{ padding: "2rem 1rem", display: "grid", gridTemplateColumns: "minmax(0, 16rem) 1fr", gap: "1.5rem", alignItems: "start" }}>
      {/* Filter panel */}
      <aside className="card" style={{ position: "sticky", top: "4.5rem" }}>
        <h2 style={{ fontSize: "1rem", margin: "0 0 1rem" }}>Filter produce</h2>
        <form method="get" style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div>
            <label className="label" htmlFor="q">Search</label>
            <input className="input" id="q" name="q" defaultValue={sp.q ?? ""} placeholder="Tomatoes, pepper…" />
          </div>
          <div>
            <label className="label" htmlFor="categoryId">Category</label>
            <select className="select" id="categoryId" name="categoryId" defaultValue={sp.categoryId ?? ""}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.categoryName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lga">Farmer location (LGA)</label>
            <select className="select" id="lga" name="lga" defaultValue={sp.lga ?? ""}>
              <option value="">Anywhere</option>
              {STUDY_AREA_LGAS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="minQuantity">Min. quantity (kg)</label>
            <input className="input" id="minQuantity" name="minQuantity" type="number" min="0" defaultValue={sp.minQuantity ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="maxPrice">Max. price (₦/kg)</label>
            <input className="input" id="maxPrice" name="maxPrice" type="number" min="0" defaultValue={sp.maxPrice ?? ""} />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Apply filters</button>
          <Link href="/search" className="btn btn-ghost btn-sm btn-block">Clear</Link>
        </form>
      </aside>

      {/* Results */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Available produce</h1>
          <span style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>{result.total} listing{result.total === 1 ? "" : "s"}</span>
        </div>

        {result.rows.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-muted)" }}>
            No produce matches your filters. Try widening your search.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))", gap: "1.25rem" }}>
            {result.rows.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        {result.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.75rem", alignItems: "center" }}>
            {result.page > 1 && (
              <Link href={`/search?${buildQuery(sp, { page: String(result.page - 1) })}`} className="btn btn-outline btn-sm">← Prev</Link>
            )}
            <span style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
              Page {result.page} of {result.totalPages}
            </span>
            {result.page < result.totalPages && (
              <Link href={`/search?${buildQuery(sp, { page: String(result.page + 1) })}`} className="btn btn-outline btn-sm">Next →</Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
