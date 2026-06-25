import Link from "next/link";
import { naira } from "@/server/lib/format";

export type ListingCardData = {
  id: number;
  commodityName: string;
  quantityAvailableKg: string | null;
  askingPricePerKg: string | null;
  imageUrls: string[] | null;
  category: string | null;
  farmerName: string | null;
  lga: string | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const img = listing.imageUrls?.[0];
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card"
      style={{ textDecoration: "none", color: "inherit", padding: 0, overflow: "hidden", display: "block" }}
    >
      <div
        style={{
          height: "9rem",
          background: img ? "#f1f5f9 center/cover no-repeat" : "var(--color-brand-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={listing.commodityName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "2.5rem" }} aria-hidden>🧺</span>
        )}
      </div>
      <div style={{ padding: "1rem" }}>
        <span className="badge badge-green" style={{ marginBottom: "0.5rem" }}>
          {listing.category ?? "Produce"}
        </span>
        <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.05rem" }}>{listing.commodityName}</h3>
        <p style={{ margin: "0 0 0.6rem", color: "var(--color-muted)", fontSize: "0.83rem" }}>
          {Number(listing.quantityAvailableKg ?? 0).toLocaleString()} kg available
          <br />
          {listing.farmerName}
          {listing.lga ? ` · ${listing.lga}` : ""}
        </p>
        <div style={{ fontWeight: 700, color: "var(--color-brand-700)", fontSize: "1.05rem" }}>
          {naira(listing.askingPricePerKg)}<span style={{ fontWeight: 400, color: "var(--color-muted)", fontSize: "0.8rem" }}>/kg</span>
        </div>
      </div>
    </Link>
  );
}
