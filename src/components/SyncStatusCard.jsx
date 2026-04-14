export default function SyncStatusCard({ syncInfo }) {
  const {
    connected = false,
    statusText = "Desconectado",
    pendingCount = 0,
    lastSyncedRecordId = 0,
    currentDownloadRid = 0,
    syncing = false,
    deviceName = "-",
  } = syncInfo || {};

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 14, color: "#0f172a" }}>
        Estado de sincronización
      </h3>

      <div style={{ display: "grid", gap: 12 }}>
        <Row label="Estado BLE" value={statusText} />
        <Row label="Equipo" value={deviceName} />
        <Row label="Pendientes en SD" value={pendingCount} />
        <Row label="Último RID sincronizado" value={lastSyncedRecordId} />
        <Row label="RID actual descargado" value={currentDownloadRid} />
        <Row label="Conexión" value={connected ? "Activa" : "No activa"} />
        <Row label="Proceso" value={syncing ? "Sincronizando" : "En espera"} />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ color: "#64748b", fontSize: 14 }}>{label}</span>
      <strong style={{ color: "#0f172a", fontSize: 14 }}>{value}</strong>
    </div>
  );
}