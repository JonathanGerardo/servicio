import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import KpiCard from "../components/KpiCard";
import ReadingsChart from "../components/ReadingsChart";

export default function DeviceDetail() {
  const { id } = useParams();

  const [device, setDevice] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const devicesRes = await api.get("/devices");
      const deviceFound = (devicesRes.data || []).find((d) => String(d.id) === String(id));
      setDevice(deviceFound || null);

      const readingsRes = await api.get(`/readings/device/${id}`);
      const readingsData = (readingsRes.data || []).slice().reverse();
      setReadings(readingsData);
    } catch (error) {
      console.error("Error cargando detalle del dispositivo", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const metrics = useMemo(() => {
    if (!readings.length) {
      return {
        latestVoltage: "-",
        latestCurrent: "-",
        latestPower: "-",
        latestEnergy: "-",
      };
    }

    const last = readings[readings.length - 1];

    return {
      latestVoltage: `${last.voltageAvg} V`,
      latestCurrent: `${last.currentAvg} A`,
      latestPower: `${last.powerAvg} W`,
      latestEnergy: `${last.energyKwh} kWh`,
    };
  }, [readings]);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {loading ? (
          <div style={emptyCard}>Cargando detalle del dispositivo...</div>
        ) : !device ? (
          <div style={emptyCard}>No se encontró el dispositivo.</div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={titleStyle}>{device.deviceName}</h1>
              <p style={subtitleStyle}>
                UID: {device.deviceUid} · BLE: {device.bleName || "-"} · Ubicación:{" "}
                {device.ubicacion || "-"}
              </p>
            </div>

            <div style={kpiGrid}>
              <KpiCard
                title="Último voltaje"
                value={metrics.latestVoltage}
                subtitle="Promedio del último registro"
              />
              <KpiCard
                title="Última corriente"
                value={metrics.latestCurrent}
                subtitle="Promedio del último registro"
              />
              <KpiCard
                title="Última potencia"
                value={metrics.latestPower}
                subtitle="Promedio del último registro"
              />
              <KpiCard
                title="Última energía"
                value={metrics.latestEnergy}
                subtitle="Lectura más reciente"
              />
            </div>

            <div style={chartGrid}>
              <ReadingsChart
                title="Comportamiento de voltaje"
                data={readings}
                dataKey="voltageAvg"
                unit="V"
              />
              <ReadingsChart
                title="Comportamiento de corriente"
                data={readings}
                dataKey="currentAvg"
                unit="A"
                color="#16a34a"
              />
              <ReadingsChart
                title="Comportamiento de potencia"
                data={readings}
                dataKey="powerAvg"
                unit="W"
                color="#dc2626"
              />
              <ReadingsChart
                title="Comportamiento de energía"
                data={readings}
                dataKey="energyKwh"
                unit="kWh"
                color="#9333ea"
              />
            </div>
          </>
        )}
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

const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginBottom: 20,
};

const chartGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
  gap: 18,
};

const emptyCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 24,
  color: "#64748b",
};