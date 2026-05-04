import BluetoothSyncPanel from "../components/BluetoothSyncPanel";

export default function ConnectDevice() {
  return (
    <div className="app-page">
      <div className="app-container-wide">
        <div className="page-header">
          <h1 className="page-title">Conectar y sincronizar equipo</h1>
          <p className="page-subtitle">
            Aquí conectas el sensor por Bluetooth, revisas pendientes en SD y sincronizas
            lecturas históricas sin repetir RID.
          </p>
        </div>

        <BluetoothSyncPanel />
      </div>
    </div>
  );
}