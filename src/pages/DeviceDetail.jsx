import { getFriendlyApiMessage } from "../utils/errorMessages";
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

  const [reportEmail, setReportEmail] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportError, setReportError] = useState("");

  const loadData = async () => {
    setLoading(true);

    try {
      const devicesRes = await api.get("/devices");
      const deviceFound = (devicesRes.data || []).find(
        (d) => String(d.id) === String(id)
      );

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

  const sendReport = async () => {
    setReportMessage("");
    setReportError("");

    const email = reportEmail.trim().toLowerCase();

    if (!email) {
      setReportError("Ingresa un correo destino.");
      return;
    }

    if (!email.includes("@")) {
      setReportError("Ingresa un correo válido.");
      return;
    }

    if (!device) {
      setReportError("No hay un dispositivo válido para generar el reporte.");
      return;
    }

    setSendingReport(true);

    try {
      const res = await api.post(`/reports/device/${id}/email`, {
        to: email,
      });

      setReportMessage(
        res.data?.message || "Reporte enviado correctamente."
      );

      setReportEmail("");
    } catch (error) {
      console.error("Error técnico al enviar reporte PDF:", error);

      setReportError(
        getFriendlyApiMessage(
          error,
          "No fue posible generar o enviar el reporte. Inténtalo nuevamente."
        )
      );
    } finally {
      setSendingReport(false);
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
    <div className="app-page">
      <div className="app-container-wide">
        {loading ? (
          <div className="empty-card">Cargando detalle del dispositivo...</div>
        ) : !device ? (
          <div className="empty-card">No se encontró el dispositivo.</div>
        ) : (
          <>
            <div className="page-header">
              <h1 className="page-title">{device.deviceName}</h1>

              <p className="page-subtitle">
                UID: {device.deviceUid} · BLE: {device.bleName || "-"} ·
                Ubicación: {device.ubicacion || "-"}
              </p>
            </div>

            <div className="grid-kpis">
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

            <div className="report-card">
              <h3 className="report-title">Enviar reporte PDF</h3>

              <p className="report-description">
                Se generará un reporte con las gráficas de voltaje, corriente,
                potencia y energía del dispositivo seleccionado.
              </p>

              <div className="report-form">
                <input
                  className="app-input"
                  type="email"
                  placeholder="Correo destino"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  disabled={sendingReport}
                />

                <button
                  className="app-button app-button-primary"
                  type="button"
                  onClick={sendReport}
                  disabled={sendingReport}
                >
                  {sendingReport ? "Enviando..." : "Enviar reporte"}
                </button>
              </div>

              {reportMessage ? (
                <div className="success-message">{reportMessage}</div>
              ) : null}

              {reportError ? (
                <div className="error-message">{reportError}</div>
              ) : null}
            </div>

            <div className="grid-charts">
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
              />

              <ReadingsChart
                title="Comportamiento de potencia"
                data={readings}
                dataKey="powerAvg"
                unit="W"
              />

              <ReadingsChart
                title="Comportamiento de energía"
                data={readings}
                dataKey="energyKwh"
                unit="kWh"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}