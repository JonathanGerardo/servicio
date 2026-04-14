import { useEffect, useState } from "react";
import api from "../api/api";

export default function EditDeviceModal({ device, open, onClose, onSaved }) {
  const [form, setForm] = useState({
    deviceName: "",
    ubicacion: "",
    etiqueta: "",
    activo: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!device) return;

    setForm({
      deviceName: device.deviceName || "",
      ubicacion: device.ubicacion || "",
      etiqueta: device.etiqueta || "",
      activo: device.activo ?? true,
    });

    setError("");
  }, [device]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!device?.id) {
      setError("No hay dispositivo seleccionado.");
      return;
    }

    if (!form.deviceName.trim()) {
      setError("El nombre del dispositivo no puede quedar vacío.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.put(`/devices/${device.id}`, {
        deviceName: form.deviceName.trim(),
        ubicacion: form.ubicacion.trim(),
        etiqueta: form.etiqueta.trim(),
        activo: form.activo,
      });

      onSaved?.();
      onClose?.();
    } catch {
      setError("No fue posible actualizar el dispositivo.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !device) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, color: "#0f172a" }}>Editar dispositivo</h2>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
              UID: {device.deviceUid}
            </p>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              BLE: {device.bleName || "-"}
            </p>
          </div>

          <button type="button" onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Nombre visible</label>
            <input
              name="deviceName"
              value={form.deviceName}
              onChange={handleChange}
              placeholder="Ej. Televisión sala"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Ubicación</label>
            <input
              name="ubicacion"
              value={form.ubicacion}
              onChange={handleChange}
              placeholder="Ej. Sala"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Etiqueta</label>
            <input
              name="etiqueta"
              value={form.etiqueta}
              onChange={handleChange}
              placeholder="Ej. Entretenimiento"
              style={inputStyle}
            />
          </div>

          <label style={checkboxRow}>
            <input
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
            />
            <span>Dispositivo activo</span>
          </label>

          {error ? (
            <div style={errorStyle}>{error}</div>
          ) : null}

          <div style={actionsStyle}>
            <button type="button" onClick={onClose} style={cancelBtn}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={saveBtn}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 2000,
};

const modalStyle = {
  width: "100%",
  maxWidth: 560,
  background: "#ffffff",
  borderRadius: 18,
  padding: 22,
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.2)",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18,
};

const closeBtn = {
  border: "none",
  background: "#f1f5f9",
  color: "#0f172a",
  width: 36,
  height: 36,
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const fieldGroup = {
  display: "grid",
  gap: 8,
};

const labelStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#334155",
};

const inputStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
};

const checkboxRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#334155",
  fontWeight: 600,
};

const errorStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "12px 14px",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 6,
};

const cancelBtn = {
  border: "none",
  background: "#e2e8f0",
  color: "#0f172a",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const saveBtn = {
  border: "none",
  background: "#2563eb",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};