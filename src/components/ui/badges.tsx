import type { ListingStatus, TransactionStatus } from "@/server/lib/constants";

const LISTING_CLASS: Record<ListingStatus, string> = {
  active: "badge badge-green",
  sold: "badge badge-blue",
  expired: "badge badge-gray",
  withdrawn: "badge badge-gray",
};

const TXN_CLASS: Record<TransactionStatus, string> = {
  pending: "badge badge-amber",
  confirmed: "badge badge-blue",
  completed: "badge badge-green",
  cancelled: "badge badge-gray",
  disputed: "badge badge-red",
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return <span className={LISTING_CLASS[status]}>{status}</span>;
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return <span className={TXN_CLASS[status]}>{status}</span>;
}

export function Stars({ score }: { score: number }) {
  const full = Math.round(score);
  return (
    <span style={{ color: "var(--color-accent-500)", letterSpacing: "1px" }} aria-label={`${score} out of 5`}>
      {"★".repeat(full)}
      <span style={{ color: "var(--color-line)" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}
