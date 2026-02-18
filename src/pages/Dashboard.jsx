import { useEffect, useState } from "react";
import api from "../api/api";
import DeviceForm from "../components/DeviceForm";

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState(null);

  const loadData = async () => {
    const devicesRes = await api.get("/devices");
    const summaryRes = await api.get("/devices/summary");
    setDevices(devicesRes.data);
    setSummary(summaryRes.data);
  };

  const deleteDevice = async (id) => {
    await api.delete(`/devices/${id}`);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      <DeviceForm refresh={loadData} />

      <h2>Mis Dispositivos</h2>
      {devices.map((device) => (
        <div key={device.id}>
          <p>{device.nombre}</p>
          <p>Watts: {device.watts}</p>
          <p>Consumo kWh: {device.consumoKwh}</p>
          <p>Huella CO2: {device.huellaCarbono}</p>
          <button onClick={() => deleteDevice(device.id)}>
            Eliminar
          </button>
        </div>
      ))}

      {summary && (
        <>
          <h2>Resumen Total</h2>
          <p>Total Watts: {summary.totalWatts}</p>
          <p>Total kWh: {summary.totalConsumoKwh}</p>
          <p>Total CO2: {summary.totalHuellaCarbono}</p>
        </>
      )}
    </div>
  );
}
