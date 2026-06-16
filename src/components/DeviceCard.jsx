import { Link } from "react-router-dom";

export default function DeviceCard({
  device,
  latestReading,
  onDelete,
  onEdit,
}){
  return (
    <div className="device-card">
      <div className="device-card-header">
        <div>
          <h3 className="device-title">{device.deviceName}</h3>
          <div className="device-meta">UID: {device.deviceUid}</div>
          <div className="device-meta">BLE: {device.bleName || "-"}</div>
        </div>

        <div
          className={`device-status ${
            device.activo ? "device-status-active" : "device-status-inactive"
          }`}
        >
          {device.activo ? "Activo" : "Inactivo"}
        </div>
      </div>

      <div className="device-metrics">
        <Metric label="Ubicación" value={device.ubicacion || "-"} />
        <Metric label="Etiqueta" value={device.etiqueta || "-"} />
        <Metric label="Voltaje" value={latestReading ? `${latestReading.voltageAvg} V` : "-"} />
        <Metric label="Corriente" value={latestReading ? `${latestReading.currentAvg} A` : "-"} />
        <Metric label="Huella de carbono" value={latestReading ? `${latestReading.carbonKg.toFixed(4)} kg CO₂` : "-"} />
        <Metric label="Energía" value={latestReading ? `${latestReading.energyKwh} kWh` : "-"} />
      </div>

      <div className="card-actions">
        <Link to={`/devices/${device.id}`} className="app-button app-button-secondary">
          Ver detalle
        </Link>

        <button className="app-button app-button-primary" onClick={() => onEdit(device)}>
          Editar
        </button>

        <button className="app-button app-button-danger" onClick={() => onDelete(device.id)}>
          Eliminar
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-box">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}