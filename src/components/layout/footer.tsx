export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-line)",
        background: "var(--color-surface)",
        marginTop: "3rem",
      }}
    >
      <div
        className="container-page"
        style={{
          padding: "1.75rem 1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem 1.5rem",
          alignItems: "center",
          fontSize: "0.85rem",
          color: "var(--color-muted)",
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--color-brand-700)" }}>🌾 AgriLink Imota</span>
        <span>Web-based farmer-to-buyer market linkage for the Imota &amp; Ikorodu farming communities, Lagos State.</span>
        <span style={{ flex: 1 }} />
        <span>Caleb University · Final-Year Project</span>
      </div>
    </footer>
  );
}
