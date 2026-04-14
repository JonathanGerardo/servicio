import { Link } from "react-router-dom";

export default function DeviceCard({
  device,
  latestReading,
  onDelete,
  onEdit,
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
            {device.deviceName}
          </div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            UID: {device.deviceUid}
          </div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            BLE: {device.bleName || "-"}
          </div>
        </div>

        <div
          style={{
            alignSelf: "flex-start",
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 10px",
            borderRadius: 999,
            background: device.activo ? "#dcfce7" : "#fee2e2",
            color: device.activo ? "#166534" : "#991b1b",
          }}
        >
          {device.activo ? "Activo" : "Inactivo"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <Metric label="Ubicación" value={device.ubicacion || "-"} />
        <Metric label="Etiqueta" value={device.etiqueta || "-"} />
        <Metric
          label="Voltaje"
          value={latestReading ? `${latestReading.voltageAvg} V` : "-"}
        />
        <Metric
          label="Corriente"
          value={latestReading ? `${latestReading.currentAvg} A` : "-"}
        />
        <Metric
          label="Potencia"
          value={latestReading ? `${latestReading.powerAvg} W` : "-"}
        />
        <Metric
          label="Energía"
          value={latestReading ? `${latestReading.energyKwh} kWh` : "-"}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link
          to={`/devices/${device.id}`}
          style={{
            textDecoration: "none",
            background: "#2563eb",
            color: "white",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
          }}
        >
          Ver detalle
        </Link>

        <button
          onClick={() => onEdit(device)}
          style={{
            border: "none",
            background: "#0f766e",
            color: "white",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Editar
        </button>

        <button
          onClick={() => onDelete(device.id)}
          style={{
            border: "none",
            background: "#ef4444",
            color: "white",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{value}</div>
    </div>
  );
}