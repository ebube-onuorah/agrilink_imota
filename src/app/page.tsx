import Link from "next/link";
import { getDb } from "@/server/db";
import { produceListings, users, marketPrices } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function stats() {
  const db = await getDb();
  const [farmers] = await db
    .select({ n: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.userType, "farmer"));
  const [listings] = await db
    .select({ n: sql<number>`count(*)` })
    .from(produceListings)
    .where(eq(produceListings.listingStatus, "active"));
  const [prices] = await db.select({ n: sql<number>`count(*)` }).from(marketPrices);
  return {
    farmers: Number(farmers?.n ?? 0),
    listings: Number(listings?.n ?? 0),
    prices: Number(prices?.n ?? 0),
  };
}

const FEATURES = [
  {
    icon: "📈",
    title: "Live market prices",
    body: "See current wholesale prices at Mile 12, Oshodi and Badagry markets — so you always know what your produce is really worth.",
  },
  {
    icon: "🤝",
    title: "Sell direct to buyers",
    body: "List your harvest and connect straight to verified buyers, bypassing the chain of middlemen that erodes your margin.",
  },
  {
    icon: "🛡️",
    title: "Trusted transactions",
    body: "Build a credibility score from buyer ratings. Contact details stay private until a deal is confirmed.",
  },
];

export default async function LandingPage() {
  const s = await stats();

  return (
    <>
      <section
        style={{
          background: "linear-gradient(160deg, var(--color-brand-700), var(--color-brand-900))",
          color: "#fff",
        }}
      >
        <div className="container-page" style={{ padding: "4.5rem 1rem 4rem", textAlign: "center" }}>
          <span
            className="badge"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", marginBottom: "1.25rem" }}
          >
            Imota · Ikorodu Division · Lagos State
          </span>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              maxWidth: "48rem",
              margin: "0 auto 1rem",
            }}
          >
            Fair prices, direct from the farm.
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.92,
              maxWidth: "40rem",
              margin: "0 auto 2rem",
              lineHeight: 1.6,
            }}
          >
            FarmLink connects smallholder farmers directly with agricultural buyers, cutting out
            middlemen, reducing post-harvest loss, and putting real market information
            in farmers&rsquo; hands.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register?type=farmer" className="btn btn-accent">
              I&rsquo;m a farmer — sell produce
            </Link>
            <Link href="/register?type=buyer" className="btn btn-outline" style={{ background: "#fff" }}>
              I&rsquo;m a buyer — find produce
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page" style={{ marginTop: "-2rem" }}>
        <div
          className="card"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))",
            gap: "1rem",
            textAlign: "center",
          }}
        >
          <div>
            <div className="stat-value">{s.farmers}</div>
            <div className="stat-label">Registered farmers</div>
          </div>
          <div>
            <div className="stat-value">{s.listings}</div>
            <div className="stat-label">Active produce listings</div>
          </div>
          <div>
            <div className="stat-value">3</div>
            <div className="stat-label">Lagos markets tracked</div>
          </div>
          <div>
            <div className="stat-value">{s.prices}</div>
            <div className="stat-label">Price records</div>
          </div>
        </div>
      </section>

      <section className="container-page" style={{ padding: "3.5rem 1rem 1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
            gap: "1.25rem",
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div style={{ fontSize: "1.9rem", marginBottom: "0.6rem" }} aria-hidden>
                {f.icon}
              </div>
              <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.1rem" }}>{f.title}</h3>
              <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page" style={{ padding: "2.5rem 1rem 1rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.6rem", marginBottom: "1.75rem" }}>How it works</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
            gap: "1.25rem",
          }}
        >
          {[
            ["1", "Register", "Create a free farmer or buyer account in minutes."],
            ["2", "List or search", "Farmers post produce; buyers search and filter by commodity, price and location."],
            ["3", "Message & agree", "Negotiate directly through secure in-platform messaging."],
            ["4", "Transact & rate", "Record the deal and leave a rating to build trust."],
          ].map(([n, title, body]) => (
            <div key={n} style={{ textAlign: "center", padding: "0 0.5rem" }}>
              <div
                style={{
                  width: "2.75rem",
                  height: "2.75rem",
                  borderRadius: "999px",
                  background: "var(--color-brand-100)",
                  color: "var(--color-brand-800)",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 0.75rem",
                }}
              >
                {n}
              </div>
              <h3 style={{ fontSize: "1rem", margin: "0 0 0.35rem" }}>{title}</h3>
              <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.9rem", lineHeight: 1.55 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page" style={{ padding: "3rem 1rem 1rem" }}>
        <div
          className="card"
          style={{
            textAlign: "center",
            background: "var(--color-brand-50)",
            borderColor: "var(--color-brand-200)",
            padding: "2.5rem 1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", margin: "0 0 0.6rem" }}>
            Ready to get a fair price for your harvest?
          </h2>
          <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem" }}>
            Join farmers and buyers across the Ikorodu Division already using FarmLink.
          </p>
          <Link href="/register" className="btn btn-primary">Create your free account</Link>
        </div>
      </section>
    </>
  );
}
