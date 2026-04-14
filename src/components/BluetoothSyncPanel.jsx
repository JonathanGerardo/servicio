import React, { useMemo, useCallback, useRef, useState } from "react";
import api from "../api/api";

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const IDENTITY_UUID = "11111111-1fb5-459e-8fcc-c5c9c331914b";
const STATUS_UUID = "22222222-1fb5-459e-8fcc-c5c9c331914b";
const COMMAND_UUID = "33333333-1fb5-459e-8fcc-c5c9c331914b";
const RESPONSE_UUID = "44444444-1fb5-459e-8fcc-c5c9c331914b";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function BluetoothSyncPanel() {
  const [status, setStatus] = useState("Desconectado");
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [readings, setReadings] = useState([]);
  const [syncMessage, setSyncMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const deviceRef = useRef(null);
  const identityCharRef = useRef(null);
  const statusCharRef = useRef(null);
  const commandCharRef = useRef(null);
  const responseCharRef = useRef(null);

  const gattBusyRef = useRef(false);
  const isDownloadingRef = useRef(false);
  const lastRidRef = useRef(0);
  const responseListenerAttachedRef = useRef(false);

  const batchContextRef = useRef(null);
  const batchReadingsRef = useRef([]);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const acquireGattLock = async () => {
    while (gattBusyRef.current) {
      await wait(80);
    }
    gattBusyRef.current = true;
  };

  const releaseGattLock = () => {
    gattBusyRef.current = false;
  };

  const registerDeviceInBackend = async (identity) => {
    const body = {
      deviceUid: identity.deviceUid,
      deviceName: identity.deviceName || "Nuevo dispositivo",
      bleName: identity.bleName || "",
    };

    const res = await api.post("/devices/register", body);
    return res.data;
  };

  const buildBackendReading = (reading, batchContext = null) => {
    const syncEpoch = Math.floor(Date.now() / 1000);
    let estimatedEpoch = syncEpoch;

    if (
      batchContext &&
      typeof batchContext.nowMs === "number" &&
      typeof batchContext.bootId === "number" &&
      typeof reading.t === "number" &&
      typeof reading.bootId === "number" &&
      batchContext.bootId === reading.bootId
    ) {
      const deltaMs = Math.max(0, batchContext.nowMs - reading.t);
      estimatedEpoch = syncEpoch - Math.floor(deltaMs / 1000);
    }

    // evita fechas absurdas por cualquier inconsistencia
    const minEpoch = 1704067200; // 2024-01-01T00:00:00Z
    const maxEpoch = Math.floor(Date.now() / 1000) + 300; // 5 min en el futuro

    if (estimatedEpoch < minEpoch || estimatedEpoch > maxEpoch) {
      estimatedEpoch = syncEpoch;
    }

    return {
      deviceUid: reading.duid,
      epoch: estimatedEpoch,
      isoTime: new Date(estimatedEpoch * 1000).toISOString(),
      samples: reading.s,
      voltageAvg: reading.v,
      currentAvg: reading.i,
      powerAvg: reading.p,
      frequencyAvg: reading.f,
      pfAvg: reading.pf,
      energyKwh: reading.e,
    };
  };

  const sendCommandSafe = useCallback(async (payload) => {
    const char = commandCharRef.current;
    if (!char) {
      setSyncMessage("Primero conecta el equipo.");
      return;
    }

    await acquireGattLock();
    try {
      const cmdStr = JSON.stringify(payload);
      await char.writeValue(encoder.encode(cmdStr));
      await wait(120);
    } finally {
      releaseGattLock();
    }
  }, []);

  const readIdentitySafe = async () => {
    const char = identityCharRef.current;
    if (!char) return null;

    await acquireGattLock();
    try {
      const value = await char.readValue();
      const text = decoder.decode(value);
      const json = safeJsonParse(text);

      if (!json) return null;

      setDeviceInfo(json);
      return json;
    } finally {
      releaseGattLock();
    }
  };

  const readStatusSafe = useCallback(async () => {
    const char = statusCharRef.current;
    if (!char) return null;

    await acquireGattLock();
    try {
      const value = await char.readValue();
      const text = decoder.decode(value);
      const json = safeJsonParse(text);

      if (!json) return null;

      setDeviceStatus(json);

      if (typeof json.lastSyncedRecordId === "number") {
        lastRidRef.current = json.lastSyncedRecordId;
      }

      return json;
    } finally {
      releaseGattLock();
    }
  }, []);

  const requestNextBatch = useCallback(async () => {
    const nextRid = lastRidRef.current + 1;
    await sendCommandSafe({
      cmd: "get_batch",
      fromRecordId: nextRid,
      limit: 5,
    });
  }, [sendCommandSafe]);

  const flushBatchToBackend = useCallback(async () => {
    const batchReadings = batchReadingsRef.current || [];
    if (!batchReadings.length) return;

    for (const reading of batchReadings) {
      const body = buildBackendReading(reading, batchContextRef.current);
      await api.post("/readings", body);
    }
  }, []);

  const handleResponse = useCallback(
    async (event) => {
      const rawData = event.target.value;
      const decodedString = decoder.decode(rawData).trim();
      const msg = safeJsonParse(decodedString);

      if (!msg) {
        setSyncMessage("Se recibió un mensaje inválido del dispositivo.");
        isDownloadingRef.current = false;
        setBusy(false);
        return;
      }

      if (msg.type === "pending_count") {
        setDeviceStatus((prev) => ({
          ...(prev || {}),
          pendingCount: msg.pendingCount,
        }));
        return;
      }

      if (msg.type === "batch_start") {
        batchContextRef.current = {
          nowMs: msg.nowMs,
          bootId: msg.bootId,
          fromRecordId: msg.fromRecordId,
          limit: msg.limit,
          syncEpoch: Math.floor(Date.now() / 1000),
        };
        batchReadingsRef.current = [];
        return;
      }

      if (msg.type === "reading" && msg.reading) {
        const reading = msg.reading;

        batchReadingsRef.current.push(reading);

        setReadings((prev) => {
          const exists = prev.some((r) => r.rid === reading.rid);
          if (exists) return prev;
          return [...prev, reading];
        });

        if (typeof reading.rid === "number" && reading.rid > lastRidRef.current) {
          lastRidRef.current = reading.rid;
        }

        return;
      }

      if (msg.type === "batch_end") {
        if (!isDownloadingRef.current) return;

        if (
          typeof msg.upToRecordId === "number" &&
          msg.upToRecordId > lastRidRef.current
        ) {
          lastRidRef.current = msg.upToRecordId;
        }

        try {
          if ((msg.count || 0) > 0) {
            await flushBatchToBackend();

            if (lastRidRef.current > 0) {
              await wait(200);
              await sendCommandSafe({
                cmd: "mark_synced",
                upToRecordId: lastRidRef.current,
              });
            }
          }

          if (msg.count === 5) {
            setSyncMessage(
              `Sincronizando… último RID procesado: ${lastRidRef.current}`
            );
            await wait(250);
            await requestNextBatch();
          } else {
            isDownloadingRef.current = false;
            setBusy(false);
            await wait(150);
            await readStatusSafe();
            setSyncMessage(
              `Sincronización completada hasta RID ${lastRidRef.current}.`
            );
          }
        } catch {
          isDownloadingRef.current = false;
          setBusy(false);
          setSyncMessage("Ocurrió un error al guardar lecturas en el backend.");
        }

        return;
      }

      if (msg.type === "mark_synced_ok") {
        if (
          typeof msg.lastSyncedRecordId === "number" &&
          msg.lastSyncedRecordId > 0
        ) {
          lastRidRef.current = msg.lastSyncedRecordId;
        }

        setDeviceStatus((prev) => ({
          ...(prev || {}),
          lastSyncedRecordId: msg.lastSyncedRecordId,
        }));

        return;
      }

      if (msg.deviceUid && msg.deviceName && msg.bleName && !msg.type) {
        setDeviceInfo({
          deviceUid: msg.deviceUid,
          deviceName: msg.deviceName,
          bleName: msg.bleName,
        });
        return;
      }

      if (
        typeof msg.sdReady === "boolean" &&
        typeof msg.pendingCount === "number" &&
        typeof msg.lastSyncedRecordId === "number"
      ) {
        setDeviceStatus(msg);

        if (typeof msg.lastSyncedRecordId === "number") {
          lastRidRef.current = msg.lastSyncedRecordId;
        }

        return;
      }

      if (msg.type === "reset_ok") {
        isDownloadingRef.current = false;
        setBusy(false);
        setReadings([]);
        batchReadingsRef.current = [];
        batchContextRef.current = null;
        lastRidRef.current = 0;

        setDeviceStatus((prev) => ({
          ...(prev || {}),
          pendingCount: 0,
          lastSyncedRecordId: 0,
        }));

        setSyncMessage(
          "Lecturas reiniciadas correctamente. El próximo registro comenzará desde RID 1."
        );

        return;
      }

      if (msg.type === "error") {
        isDownloadingRef.current = false;
        setBusy(false);
        setSyncMessage(`Error del dispositivo: ${msg.message}`);
      }
    },
    [flushBatchToBackend, readStatusSafe, requestNextBatch, sendCommandSafe]
  );

  const connectBLE = async () => {
    try {
      setBusy(true);
      setSyncMessage("Buscando dispositivo...");
      setStatus("Buscando dispositivo...");

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID],
      });

      deviceRef.current = device;

      device.addEventListener("gattserverdisconnected", () => {
        setStatus("Desconectado");
        setSyncMessage("Conexión finalizada.");
        isDownloadingRef.current = false;
        setBusy(false);
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      identityCharRef.current = await service.getCharacteristic(IDENTITY_UUID);
      statusCharRef.current = await service.getCharacteristic(STATUS_UUID);
      commandCharRef.current = await service.getCharacteristic(COMMAND_UUID);
      responseCharRef.current = await service.getCharacteristic(RESPONSE_UUID);

      await acquireGattLock();
      try {
        await responseCharRef.current.startNotifications();
      } finally {
        releaseGattLock();
      }

      if (!responseListenerAttachedRef.current) {
        responseCharRef.current.addEventListener(
          "characteristicvaluechanged",
          handleResponse
        );
        responseListenerAttachedRef.current = true;
      }

      setStatus("Conectado");

      const identity = await readIdentitySafe();

      if (identity) {
        await registerDeviceInBackend(identity);
      }

      const initialStatus = await readStatusSafe();

      setSyncMessage(
        `Equipo conectado correctamente. Último RID sincronizado: ${
          initialStatus?.lastSyncedRecordId || 0
        }.`
      );

      await sendCommandSafe({ cmd: "get_pending_count" });
    } catch {
      setStatus("Error al conectar");
      setSyncMessage("No fue posible conectar con el equipo.");
    } finally {
      setBusy(false);
    }
  };

  const syncPending = async () => {
    try {
      if (isDownloadingRef.current) {
        setSyncMessage("Ya hay una sincronización en progreso.");
        return;
      }

      setBusy(true);
      const currentStatus = await readStatusSafe();
      const startRid = (currentStatus?.lastSyncedRecordId || 0) + 1;

      setReadings([]);
      lastRidRef.current = startRid - 1;
      isDownloadingRef.current = true;
      batchReadingsRef.current = [];

      setSyncMessage(`Sincronizando lecturas desde RID ${startRid}...`);

      await sendCommandSafe({
        cmd: "get_batch",
        fromRecordId: startRid,
        limit: 5,
      });
    } catch {
      isDownloadingRef.current = false;
      setBusy(false);
      setSyncMessage("No fue posible iniciar la sincronización.");
    }
  };

  const resetDeviceReadings = async () => {
    try {
      if (status !== "Conectado") {
        setSyncMessage("Primero conecta el equipo.");
        return;
      }

      if (isDownloadingRef.current) {
        setSyncMessage("No puedes reiniciar mientras hay una sincronización en progreso.");
        return;
      }

      const confirmReset = window.confirm(
        "Esto borrará las lecturas guardadas en la SD y reiniciará el RID. ¿Deseas continuar?"
      );

      if (!confirmReset) return;

      setBusy(true);
      setSyncMessage("Reiniciando lecturas del dispositivo...");

      await sendCommandSafe({ cmd: "reset" });
    } catch {
      setBusy(false);
      setSyncMessage("No fue posible reiniciar las lecturas del dispositivo.");
    }
  };

  const disconnectBLE = () => {
    isDownloadingRef.current = false;
    setBusy(false);

    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    } else {
      setStatus("Desconectado");
      setSyncMessage("Conexión finalizada.");
    }
  };

  const metrics = useMemo(() => {
    const last = readings.length ? readings[readings.length - 1] : null;

    return {
      totalReadings: readings.length,
      lastRid: last?.rid ?? 0,
      pendingCount: deviceStatus?.pendingCount ?? 0,
      lastSynced: deviceStatus?.lastSyncedRecordId ?? 0,
    };
  }, [readings, deviceStatus]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Conexión con equipo</h2>
        <p style={{ color: "#64748b", marginTop: 0 }}>
          Este módulo permite conectar el ESP32, revisar su estado y descargar sólo los
          registros pendientes desde el último RID sincronizado.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button style={primaryBtn} onClick={connectBLE} disabled={busy}>
            Conectar sensor
          </button>
          <button
            style={secondaryBtn}
            onClick={syncPending}
            disabled={status !== "Conectado" || busy}
          >
            Sincronizar pendientes
          </button>
          <button
            style={warningBtn}
            onClick={resetDeviceReadings}
            disabled={status !== "Conectado" || busy}
          >
            Reiniciar lecturas
          </button>
          <button style={dangerBtn} onClick={disconnectBLE}>
            Desconectar
          </button>
        </div>

        {syncMessage ? (
          <div
            style={{
              marginTop: 16,
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: "12px 14px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {syncMessage}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <Box label="Estado" value={status} />
          <Box label="Pendientes en SD" value={metrics.pendingCount} />
          <Box label="Último RID sincronizado" value={metrics.lastSynced} />
          <Box label="Último RID descargado" value={metrics.lastRid} />
          <Box label="Registros descargados" value={metrics.totalReadings} />
          <Box label="Dispositivo" value={deviceInfo?.deviceName || "-"} />
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#0f172a" }}>Lecturas descargadas</h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <Th>RID</Th>
                <Th>Voltaje</Th>
                <Th>Corriente</Th>
                <Th>Potencia</Th>
                <Th>Frecuencia</Th>
                <Th>Energía</Th>
              </tr>
            </thead>
            <tbody>
              {readings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 20,
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No hay lecturas descargadas todavía
                  </td>
                </tr>
              ) : (
                readings.map((r) => (
                  <tr key={r.rid} style={{ borderBottom: "1px solid #eef2f7" }}>
                    <Td>{r.rid}</Td>
                    <Td>{r.v}</Td>
                    <Td>{r.i}</Td>
                    <Td>{r.p}</Td>
                    <Td>{r.f}</Td>
                    <Td>{r.e}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Box({ label, value }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: "left",
        fontSize: 12,
        color: "#334155",
        padding: 12,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td
      style={{
        padding: 12,
        fontSize: 14,
        color: "#0f172a",
      }}
    >
      {children}
    </td>
  );
}

const primaryBtn = {
  border: "none",
  background: "#2563eb",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  border: "none",
  background: "#0f766e",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const dangerBtn = {
  border: "none",
  background: "#dc2626",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const warningBtn = {
  border: "none",
  background: "#d97706",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};