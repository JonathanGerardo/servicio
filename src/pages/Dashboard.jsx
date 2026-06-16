import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import KpiCard from "../components/KpiCard";
import DeviceCard from "../components/DeviceCard";
import EditDeviceModal from "../components/EditDeviceModal";

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [latestReadings, setLatestReadings] = useState({});
  const [loading, setLoading] = useState(true);

  const [editingDevice, setEditingDevice] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/devices");
      const deviceList = res.data || [];
      setDevices(deviceList);

      const readingsMap = {};

      for (const device of deviceList) {
        try {
          const readingsRes = await api.get(`/readings/device/${device.id}`);
          const readings = readingsRes.data || [];

          if (readings.length > 0) {
            readingsMap[device.id] = readings[0];
          }
        } catch {
          
        }
      }

      setLatestReadings(readingsMap);
    } finally {
      setLoading(false);
    }
  };

  const deleteDevice = async (id) => {
    await api.delete(`/devices/${id}`);
    await loadDevices();
  };

  const openEditModal = (device) => {
    setEditingDevice(device);
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditingDevice(null);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const metrics = useMemo(() => {
    const latest = Object.values(latestReadings);

    const totalPower = latest.reduce((acc, item) => acc + (item?.powerAvg || 0), 0);
    const totalEnergy = latest.reduce((acc, item) => acc + (item?.energyKwh || 0), 0);
    const avgVoltage = latest.length
      ? latest.reduce((acc, item) => acc + (item?.voltageAvg || 0), 0) / latest.length
      : 0;

    return {
      totalDevices: devices.length,
      activeDevices: devices.filter((d) => d.activo).length,
      totalPower: totalPower.toFixed(2),
      totalEnergy: totalEnergy.toFixed(4),
      avgVoltage: avgVoltage.toFixed(2),
    };
  }, [devices, latestReadings]);

  return (
  <div className="app-page">
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard energético</h1>
        <p className="page-subtitle">
          Aquí ves el resumen general de tus equipos y el último estado disponible de cada uno.
        </p>
      </div>

      <div className="grid-kpis">
        <KpiCard
          title="Equipos registrados"
          value={metrics.totalDevices}
          subtitle="Total de dispositivos en tu cuenta"
        />
        <KpiCard
          title="Equipos activos"
          value={metrics.activeDevices}
          subtitle="Dispositivos marcados como activos"
        />
        <KpiCard
          title="Potencia acumulada"
          value={`${metrics.totalPower} W`}
          subtitle="Suma del último valor por equipo"
        />
        <KpiCard
          title="Energía acumulada"
          value={`${metrics.totalEnergy} kWh`}
          subtitle="Suma del último valor registrado"
        />
      </div>

      <div style={{ marginBottom: 28 }}>
        <KpiCard
          title="Voltaje promedio"
          value={`${metrics.avgVoltage} V`}
          subtitle="Promedio de la última lectura disponible"
        />
      </div>

      <h2 className="section-title">Tus dispositivos</h2>

      {loading ? (
        <div className="empty-card">Cargando dispositivos...</div>
      ) : devices.length === 0 ? (
        <div className="empty-card">
          No tienes dispositivos registrados todavía. Ve al módulo de conexión para vincular uno.
        </div>
      ) : (
        <div className="grid-devices">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              latestReading={latestReadings[device.id]}
              onDelete={deleteDevice}
              onEdit={openEditModal}
            />
          ))}
        </div>
      )}

      <EditDeviceModal
        open={editOpen}
        device={editingDevice}
        onClose={closeEditModal}
        onSaved={loadDevices}
      />
    </div>
  </div>
);
}