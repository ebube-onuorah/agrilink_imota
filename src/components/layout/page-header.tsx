export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        marginBottom: "1.5rem",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.6rem", margin: "0 0 0.25rem" }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--color-muted)", margin: 0 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
