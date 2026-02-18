import { useState } from "react";
import api from "../api/api";

export default function DeviceForm({ refresh }) {
  const [form, setForm] = useState({
    nombre: "",
    voltaje: "",
    corriente: "",
    horasUsoDiario: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/devices", form);
    refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Nombre"
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
      />
      <input
        placeholder="Voltaje"
        type="number"
        onChange={(e) => setForm({ ...form, voltaje: e.target.value })}
      />
      <input
        placeholder="Corriente"
        type="number"
        onChange={(e) => setForm({ ...form, corriente: e.target.value })}
      />
      <input
        placeholder="Horas uso diario"
        type="number"
        onChange={(e) =>
          setForm({ ...form, horasUsoDiario: e.target.value })
        }
      />
      <button type="submit">Agregar</button>
    </form>
  );
}
