export default function KpiCard({ title, value, subtitle }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>{subtitle}</div>
    </div>
  );
}