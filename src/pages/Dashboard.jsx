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
          // aquí no hace falta reventar toda la vista por una lectura fallida
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
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={titleStyle}>Dashboard energético</h1>
          <p style={subtitleStyle}>
            Aquí ves el resumen general de tus equipos y el último estado disponible de cada uno.
          </p>
        </div>

        <div style={kpiGrid}>
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

        <div style={{ marginTop: 18, marginBottom: 28 }}>
          <KpiCard
            title="Voltaje promedio"
            value={`${metrics.avgVoltage} V`}
            subtitle="Promedio de la última lectura disponible"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <h2 style={sectionTitle}>Tus dispositivos</h2>
        </div>

        {loading ? (
          <div style={emptyCard}>Cargando dispositivos...</div>
        ) : devices.length === 0 ? (
          <div style={emptyCard}>
            No tienes dispositivos registrados todavía. Ve al módulo de conexión para vincular uno.
          </div>
        ) : (
          <div style={deviceGrid}>
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

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "24px 16px 40px",
};

const containerStyle = {
  maxWidth: 1200,
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

const sectionTitle = {
  margin: 0,
  color: "#0f172a",
  fontSize: 24,
  fontWeight: 800,
};

const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const deviceGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
};

const emptyCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 24,
  color: "#64748b",
};