import BluetoothSyncPanel from "../components/BluetoothSyncPanel";

export default function ConnectDevice() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={titleStyle}>Conectar y sincronizar equipo</h1>
          <p style={subtitleStyle}>
            Aquí conectas el sensor por Bluetooth, revisas pendientes en SD y sincronizas
            lecturas históricas sin repetir RID.
          </p>
        </div>

        <BluetoothSyncPanel />
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "24px 16px 40px",
};

const containerStyle = {
  maxWidth: 1250,
  margin: "0 auto",
};

const titleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: 34,
  fontWeight: 800,
};

const subtitleStyle = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 15,
};